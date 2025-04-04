import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from '../../utils/axiosConfig';
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
    const dateKey = task.deadline ? task.deadline.split('T')[0] : 
                    (task.completionDate ? task.completionDate.split('T')[0] : null);
    
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
        return rejectWithValue("Назва завдання має бути не менше 10 символів");
      }

      if (taskData.name.length > 30) {
        return rejectWithValue("Назва завдання не може перевищувати 30 символів");
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
        priority: taskData.priority || 3
      };

      console.log("Надсилання запиту на створення завдання:", taskRequest);

      // Надсилання запиту
      const response = await axios.post('/api/tasks', taskRequest);
      
      console.log("Відповідь від створення завдання:", response.data);

      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();

      return response.data;
    } catch (error) {
      console.error("Повна помилка створення завдання:", {
        response: error.response,
        message: error.message
      });

      return rejectWithValue(
        error.response?.data?.message || 
        "Не вдалося створити завдання"
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
        return rejectWithValue("Назва завдання має бути не менше 10 символів");
      }
      
      if (taskData.name.length > 30) {
        return rejectWithValue("Назва завдання не може перевищувати 30 символів");
      }
      
      // Форматування дати
      const formattedDate = taskData.deadline 
        ? formatDateForApi(taskData.deadline) 
        : null;
      
      const updateRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate
      };
      
      console.log("Оновлення завдання:", taskId, updateRequest);
      
      const response = await axios.put(`/api/tasks?taskId=${taskId}&email=${email}`, updateRequest);
      
      console.log("Відповідь оновлення завдання:", response.data);
      
      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();
      
      return response.data;
    } catch (error) {
      console.error("Помилка оновлення завдання:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        "Не вдалося оновити завдання"
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

      // Додаємо параметр includeCompleted в URL
      const url = `/api/tasks/calendar?startDate=${startDate}&endDate=${endDate}&includeCompleted=${includeCompleted}`;
      
      console.log("Fetching tasks URL:", url);
      const response = await axios.get(url);
      console.log("Fetched tasks response:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch tasks");
    }
  }
);


// Оновлення статусу завдання
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Updating task status: ID=${id}, status=${status}`);
      
      const response = await axios.patch(`/api/tasks/${id}/status`, null, {
        params: { status }
      });

      console.log("Status update response:", response.data);
      
      // Refresh tasks after status update
      await dispatch(fetchTasks()).unwrap();
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update task status");
    }
  }
);

// Видалення завдання
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue, dispatch }) => {
    try {
      console.log("Видалення завдання:", taskId);
      
      await axios.delete(`/api/tasks?id=${taskId}`);
      
      console.log("Завдання успішно видалено");
      
      // Оновлення списку завдань
      await dispatch(fetchTasks()).unwrap();
      
      return taskId;
    } catch (error) {
      console.error("Помилка видалення завдання:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        "Не вдалося видалити завдання"
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
    page: 0
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    }
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
          .filter(task => task)
          .map(task => ({
            id: task.id,
            name: task.title || task.name,
            description: task.description,
            deadline: task.dueDate,
            status: task.status,
            completed: task.status === 'COMPLETED',
            createdAt: task.createdAt
          }));
        
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
      .addCase(updateTaskStatus.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;