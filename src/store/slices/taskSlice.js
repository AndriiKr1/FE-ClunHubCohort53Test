
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosConfig";
import { formatDateForApi } from "../../utils/dataMappers";

// Утиліти для сортування та організації завдань
const sortTasksByDate = (tasks) => {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.deadline || a.completionDate || 0);
    const dateB = new Date(b.deadline || b.completionDate || 0);
    return dateB - dateA;
  });
};

const organizeTasksByDate = (tasks) => {
  return tasks.reduce((acc, task) => {
    let dateKey;

    // Для виконаних завдань пріоритетним є completionDate
    if (task.status === 'COMPLETED' || task.completed) {
      dateKey = (task.completionDate || task.deadline || new Date().toISOString()).split('T')[0];
    } 
    // Для активних завдань використовуємо deadline
    else if (task.deadline) {
      dateKey = task.deadline.split('T')[0];
    }

    if (dateKey) {
      // Якщо такої дати ще немає в акумуляторі, створюємо порожній масив
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      // Додаємо завдання до масиву для цієї дати
      acc[dateKey].push(task);
    }
    
    return acc;
  }, {});
};

// Створення завдання
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue, dispatch }) => {
    try {
      // Валідація даних
      if (!taskData.name || taskData.name.length < 1) {
        return rejectWithValue(
          "The task name must be at least 1вч characters long."
        );
      }

      if (taskData.name.length > 30) {
        return rejectWithValue("The task name cannot exceed 30 characters.");
      }

      // Перевірка дати
      const formattedDate = taskData.deadline
        ? formatDateForApi(taskData.deadline)
        : null;

      if (!formattedDate) {
        return rejectWithValue("Необхідно вказати дату дедлайну");
      }

      // Підготовка даних для запиту
      const taskRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate,
        status: "IN_PROGRESS",
        priority: taskData.priority || 3,
      };

      // Надсилання запиту
      const response = await axios.post("/api/tasks", taskRequest);

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create task"
      );
    }
  }
);

// Оновлення завдання
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, taskData, email }, { rejectWithValue, dispatch }) => {
    try {
      // Валідація даних
      if (!taskData.name || taskData.name.length < 10) {
        return rejectWithValue(
          "The task name must be at least 10 characters long"
        );
      }

      if (taskData.name.length > 30) {
        return rejectWithValue("The task name cannot exceed 30 characters");
      }

      // Форматування дати
      const formattedDate = taskData.deadline
        ? formatDateForApi(taskData.deadline)
        : null;

      const updateRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate,
      };

      const response = await axios.put(
        `/api/tasks?taskId=${taskId}&email=${email}`,
        updateRequest
      );

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return response.data;
    } catch (error) {
      console.error("Task update error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update task"
      );
    }
  }
);

// Отримання завдань
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const { fromDate, toDate, includeCompleted = false } = params || {};
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = fromDate || formatDateForApi(firstDay);
      const endDate = toDate || formatDateForApi(lastDay);

      const url = `/api/tasks/calendar?startDate=${startDate}&endDate=${endDate}&includeCompleted=${includeCompleted}`;

      const response = await axios.get(url);
      
      // Повертаємо повний масив даних
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tasks"
      );
    }
  }
);

// Оновлення статусу завдання
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      // Create today's date in the correct format
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const response = await axios.patch(`/api/tasks/${id}/status?status=${status}`);
      
      // After successful API call, get all tasks including completed ones
      await dispatch(fetchTasks({ 
        includeCompleted: true 
      })).unwrap();
      
      return {
        ...response.data,
        id,
        status,
        completionDate: status === "COMPLETED" ? today : null
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update task status"
      );
    }
  }
);
// Видалення завдання
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue}) => {
    try {
      await axios.delete(`/api/tasks?id=${taskId}`);

      // Оновлення списку завдань
     // await dispatch(fetchTasks()).unwrap();

      return taskId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete task"
      );
    }
  }
);

// Slice
const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    tasksByDate: {},
    loading: false,
    error: null,
    totalElements: 0,
    totalPages: 0,
    page: 0,
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
      
        // Map and filter tasks
        const mappedTasks = (action.payload || [])
          .filter((task) => task)
          .map((task) => {
            const mappedTask = {
              id: task.id,
              name: task.title || task.name,
              description: task.description,
              deadline: task.dueDate,
              status: task.status,
              completed: task.completed || task.status === "COMPLETED",
              createdAt: task.createdAt,
              completionDate: task.completionDate
            };
      
            // IMPORTANT: Set completionDate for completed tasks if missing
            if (mappedTask.status === "COMPLETED" && !mappedTask.completionDate) {
              mappedTask.completionDate = new Date().toISOString().split('T')[0];
            }
      
            return mappedTask;
          });
      
        state.tasks = sortTasksByDate(mappedTasks);
        
        // Create tasksByDate map with proper organization
        state.tasksByDate = mappedTasks.reduce((acc, task) => {
          // For completed tasks, use completionDate
          let dateKey;
          
          if (task.status === "COMPLETED") {
            dateKey = task.completionDate;
          } else {
            // For incomplete tasks, use deadline
            dateKey = task.deadline?.split('T')[0];
          }
          
          if (dateKey) {
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(task);
          }
          
          return acc;
        }, {});
        state.tasksByDate = organizeTasksByDate(mappedTasks);
        state.totalElements = action.payload.totalElements || mappedTasks.length;
        state.totalPages = action.payload.totalPages || 1;
        state.page = action.payload.number || 0;
      })
      
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
      
        // Find and update the task in the tasks array
        const taskId = action.payload.id;
        const newStatus = action.payload.status;
        const completionDate = action.payload.completionDate;
        
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        
        if (taskIndex !== -1) {
          // Update the task status and completion date
          state.tasks[taskIndex].status = newStatus;
          state.tasks[taskIndex].completed = newStatus === "COMPLETED";
          
          if (newStatus === "COMPLETED") {
            state.tasks[taskIndex].completionDate = completionDate;
            
            // Move task from deadline date to completion date in tasksByDate
            const deadlineDate = state.tasks[taskIndex].deadline?.split('T')[0];
            
            // Remove from deadline date if it exists there
            if (deadlineDate && state.tasksByDate[deadlineDate]) {
              state.tasksByDate[deadlineDate] = state.tasksByDate[deadlineDate].filter(
                t => t.id !== taskId
              );
            }
            
            // Add to completion date
            if (!state.tasksByDate[completionDate]) {
              state.tasksByDate[completionDate] = [];
            }
            
            state.tasksByDate[completionDate].push(state.tasks[taskIndex]);
          }
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        
        // Get the deleted task ID
        const taskId = action.payload;
        
        // Remove from tasks array
        state.tasks = state.tasks.filter(task => task.id !== taskId);
        
        // Remove from tasksByDate
        for (let dateKey in state.tasksByDate) {
          state.tasksByDate[dateKey] = state.tasksByDate[dateKey].filter(task => task.id !== taskId);
          
          // Clean up empty arrays
          if (state.tasksByDate[dateKey].length === 0) {
            delete state.tasksByDate[dateKey];
          }
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;
/*import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosConfig";
import { formatDateForApi } from "../../utils/dataMappers";

// Утиліти для сортування та організації завдань
const sortTasksByDate = (tasks) => {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.deadline || a.completionDate || 0);
    const dateB = new Date(b.deadline || b.completionDate || 0);
    return dateB - dateA;
  });
};

const organizeTasksByDate = (tasks) => {
  return tasks.reduce((acc, task) => {
    let dateKey;

    // Для виконаних завдань пріоритетним є completionDate
    if (task.status === 'COMPLETED' || task.completed) {
      dateKey = (task.completionDate || task.deadline || new Date().toISOString()).split('T')[0];
    } 
    // Для активних завдань використовуємо deadline
    else if (task.deadline) {
      dateKey = task.deadline.split('T')[0];
    }

    if (dateKey) {
      // Якщо такої дати ще немає в акумуляторі, створюємо порожній масив
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      // Додаємо завдання до масиву для цієї дати
      acc[dateKey].push(task);
    }
    
    return acc;
  }, {});
};

// Створення завдання
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue, dispatch }) => {
    try {
      // Валідація даних
      if (!taskData.name || taskData.name.length < 10) {
        return rejectWithValue(
          "The task name must be at least 10 characters long."
        );
      }

      if (taskData.name.length > 30) {
        return rejectWithValue("The task name cannot exceed 30 characters.");
      }

      // Перевірка дати
      const formattedDate = taskData.deadline
        ? formatDateForApi(taskData.deadline)
        : null;

      if (!formattedDate) {
        return rejectWithValue("Необхідно вказати дату дедлайну");
      }

      // Підготовка даних для запиту
      const taskRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate,
        status: "IN_PROGRESS",
        priority: taskData.priority || 3,
      };

      // Надсилання запиту
      const response = await axios.post("/api/tasks", taskRequest);

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create task"
      );
    }
  }
);

// Оновлення завдання
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, taskData, email }, { rejectWithValue, dispatch }) => {
    try {
      // Валідація даних
      if (!taskData.name || taskData.name.length < 10) {
        return rejectWithValue(
          "The task name must be at least 10 characters long"
        );
      }

      if (taskData.name.length > 30) {
        return rejectWithValue("The task name cannot exceed 30 characters");
      }

      // Форматування дати
      const formattedDate = taskData.deadline
        ? formatDateForApi(taskData.deadline)
        : null;

      const updateRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate,
      };

      const response = await axios.put(
        `/api/tasks?taskId=${taskId}&email=${email}`,
        updateRequest
      );

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return response.data;
    } catch (error) {
      console.error("Task update error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update task"
      );
    }
  }
);

// Отримання завдань
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const { fromDate, toDate, includeCompleted = false } = params || {};
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = fromDate || formatDateForApi(firstDay);
      const endDate = toDate || formatDateForApi(lastDay);

      const url = `/api/tasks/calendar?startDate=${startDate}&endDate=${endDate}&includeCompleted=${includeCompleted}`;

      const response = await axios.get(url);
      
      // Повертаємо повний масив даних
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tasks"
      );
    }
  }
);

// Оновлення статусу завдання
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      // Create today's date in the correct format
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const response = await axios.patch(`/api/tasks/${id}/status?status=${status}`);
      
      // After successful API call, get all tasks including completed ones
      await dispatch(fetchTasks({ 
        includeCompleted: true 
      })).unwrap();
      
      return {
        ...response.data,
        id,
        status,
        completionDate: status === "COMPLETED" ? today : null
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update task status"
      );
    }
  }
);
// Видалення завдання
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`/api/tasks?id=${taskId}`);

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return taskId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete task"
      );
    }
  }
);

// Slice
const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    tasksByDate: {},
    loading: false,
    error: null,
    totalElements: 0,
    totalPages: 0,
    page: 0,
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
      
        // Map and filter tasks
        const mappedTasks = (action.payload || [])
          .filter((task) => task)
          .map((task) => {
            const mappedTask = {
              id: task.id,
              name: task.title || task.name,
              description: task.description,
              deadline: task.dueDate,
              status: task.status,
              completed: task.completed || task.status === "COMPLETED",
              createdAt: task.createdAt,
              completionDate: task.completionDate
            };
      
            // IMPORTANT: Set completionDate for completed tasks if missing
            if (mappedTask.status === "COMPLETED" && !mappedTask.completionDate) {
              mappedTask.completionDate = new Date().toISOString().split('T')[0];
            }
      
            return mappedTask;
          });
      
        state.tasks = sortTasksByDate(mappedTasks);
        
        // Create tasksByDate map with proper organization
        state.tasksByDate = mappedTasks.reduce((acc, task) => {
          // For completed tasks, use completionDate
          let dateKey;
          
          if (task.status === "COMPLETED") {
            dateKey = task.completionDate;
          } else {
            // For incomplete tasks, use deadline
            dateKey = task.deadline?.split('T')[0];
          }
          
          if (dateKey) {
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(task);
          }
          
          return acc;
        }, {});
        state.tasksByDate = organizeTasksByDate(mappedTasks);
        state.totalElements = action.payload.totalElements || mappedTasks.length;
        state.totalPages = action.payload.totalPages || 1;
        state.page = action.payload.number || 0;
      })
      
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
      
        // Find and update the task in the tasks array
        const taskId = action.payload.id;
        const newStatus = action.payload.status;
        const completionDate = action.payload.completionDate;
        
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        
        if (taskIndex !== -1) {
          // Update the task status and completion date
          state.tasks[taskIndex].status = newStatus;
          state.tasks[taskIndex].completed = newStatus === "COMPLETED";
          
          if (newStatus === "COMPLETED") {
            state.tasks[taskIndex].completionDate = completionDate;
            
            // Move task from deadline date to completion date in tasksByDate
            const deadlineDate = state.tasks[taskIndex].deadline?.split('T')[0];
            
            // Remove from deadline date if it exists there
            if (deadlineDate && state.tasksByDate[deadlineDate]) {
              state.tasksByDate[deadlineDate] = state.tasksByDate[deadlineDate].filter(
                t => t.id !== taskId
              );
            }
            
            // Add to completion date
            if (!state.tasksByDate[completionDate]) {
              state.tasksByDate[completionDate] = [];
            }
            
            state.tasksByDate[completionDate].push(state.tasks[taskIndex]);
          }
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;*/