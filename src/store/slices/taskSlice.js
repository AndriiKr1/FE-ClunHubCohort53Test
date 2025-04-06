
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

    if (task.status === 'COMPLETED') {
      // Використовуємо completionDate для виконаних задач
      dateKey = (task.completionDate || new Date().toISOString()).split('T')[0];
    } else if (task.deadline) {
      // Для активних задач - дедлайн
      dateKey = task.deadline.split('T')[0];
    }

    if (dateKey) {
      acc[dateKey] = acc[dateKey] || [];
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
      console.log(response.data);
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
      const now = new Date();
      const params = { 
        status,
        completionDate: status === "COMPLETED" ? now.toISOString() : null
      };
      
      const response = await axios.patch(`/api/tasks/${id}/status`, null, {
        params: {
          status: params.status,
          completionDate: params.completionDate
        }
      });
      
      // Важливо: викликати fetchTasks з параметром включення виконаних задач
      await dispatch(fetchTasks({ includeCompleted: true })).unwrap();
      
      return response.data;
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
              completionDate: task.completionDate,
              completed: task.completed || task.status === "COMPLETED",
              createdAt: task.createdAt,
            };
      
            // ВАЖЛИВО: Явно встановлюємо completionDate для виконаних задач
            if (mappedTask.status === "COMPLETED" && !mappedTask.completionDate) {
              mappedTask.completionDate = new Date().toISOString();
            }
      
            return mappedTask;
          });
      
        state.tasks = sortTasksByDate(mappedTasks);
        state.tasksByDate = organizeTasksByDate(state.tasks);
      
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
      
        const taskId = action.meta.arg.id;
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
      
        if (taskIndex !== -1) {
          // Оновлюємо статус і дату виконання
          state.tasks[taskIndex].status = action.meta.arg.status;
          state.tasks[taskIndex].completed = action.meta.arg.status === "COMPLETED";
          
          if (action.meta.arg.status === "COMPLETED") {
            state.tasks[taskIndex].completionDate = new Date().toISOString();
          }
      
          // Оновлення в tasksByDate
          Object.keys(state.tasksByDate).forEach((dateKey) => {
            const dateTaskIndex = state.tasksByDate[dateKey]?.findIndex(
              (t) => t.id === taskId
            );
            if (dateTaskIndex !== -1) {
              state.tasksByDate[dateKey][dateTaskIndex].status = action.meta.arg.status;
              state.tasksByDate[dateKey][dateTaskIndex].completed = action.meta.arg.status === "COMPLETED";
              
              if (action.meta.arg.status === "COMPLETED") {
                state.tasksByDate[dateKey][dateTaskIndex].completionDate = new Date().toISOString();
              }
            }
          });
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;