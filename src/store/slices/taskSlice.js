import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

// Додаємо обробку 401 статусу
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Асинхронні операції
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/tasks", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch tasks");
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  "tasks/fetchTaskById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/tasks/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch task");
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/tasks", taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to create task");
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/tasks/${id}/status?status=${status}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update task status");
    }
  }
);

// Початковий стан
const initialState = {
  tasks: [],
  tasksByDate: {},
  currentTask: null,
  loading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  page: 0
};

// Створюємо slice
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обробка fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.content || [];
        state.totalElements = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 0;
        state.page = action.payload.number || 0;
        // Оновлюємо tasksByDate автоматично
        state.tasksByDate = state.tasks.reduce((acc, task) => {
          if (task.dueDate) {
            const date = new Date(task.dueDate);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            acc[dateKey] = acc[dateKey] || [];
            acc[dateKey].push(task);
          }
          return acc;
        }, {});
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
      
      // Обробка fetchTaskById
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch task details";
      })
      
      // Обробка createTask
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
        // Оновлюємо tasksByDate при додаванні нової задачі
        if (action.payload.dueDate) {
          const date = new Date(action.payload.dueDate);
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          state.tasksByDate[dateKey] = state.tasksByDate[dateKey] || [];
          state.tasksByDate[dateKey].push(action.payload);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create task";
      })
      
      // Обробка updateTaskStatus
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
        if (state.currentTask && state.currentTask.id === updatedTask.id) {
          state.currentTask = updatedTask;
        }
        // Оновлюємо tasksByDate
        if (updatedTask.dueDate) {
          const date = new Date(updatedTask.dueDate);
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          state.tasksByDate[dateKey] = state.tasksByDate[dateKey] || [];
          const taskIndex = state.tasksByDate[dateKey].findIndex(t => t.id === updatedTask.id);
          if (taskIndex !== -1) {
            state.tasksByDate[dateKey][taskIndex] = updatedTask;
          }
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update task status";
      });
  }
});

export const { clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;