import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Сортировка задач по дате (более свежие сверху)
const sortTasksByDate = (tasks) => {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.deadline || a.completionDate || 0);
    const dateB = new Date(b.deadline || b.completionDate || 0);
    return dateB - dateA;
  });
};

// Организация задач по датам для календаря
const organizeTasksByDate = (tasks) => {
  return tasks.reduce((acc, task) => {
    // Используем deadline для активных задач и completionDate для завершенных
    const dateKey = task.deadline ? task.deadline.split('T')[0] : 
                   (task.completionDate ? task.completionDate.split('T')[0] : null);
    
    if (dateKey) {
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(task);
    }
    return acc;
  }, {});
};

// Перехватчики axios
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

// Async thunks
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      // Получаем задачи из обоих хранилищ
      const activeTasks = JSON.parse(localStorage.getItem('tasks')) || [];
      const completedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
      
      // Объединяем активные и завершенные задачи
      const allTasks = [...activeTasks, ...completedTasks];
      
      // Фильтруем по датам если указаны параметры
      let filteredTasks = allTasks;
      
      if (params?.fromDate && params?.toDate) {
        const fromDate = new Date(params.fromDate);
        const toDate = new Date(params.toDate);
        
        filteredTasks = allTasks.filter(task => {
          // Проверяем по deadline для активных задач и по completionDate для завершенных
          let taskDate;
          
          if (task.completionDate && task.completed) {
            taskDate = new Date(task.completionDate);
          } else {
            taskDate = new Date(task.deadline);
          }
          
          return taskDate >= fromDate && taskDate <= toDate;
        });
      }
      
      return {
        content: filteredTasks,
        totalElements: filteredTasks.length,
        totalPages: 1,
        number: 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch tasks");
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      // Если статус "COMPLETED", перемещаем задачу из tasks в calendarTasks
      if (status === 'COMPLETED') {
        const activeTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskIndex = activeTasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
          // Возможно задача уже в calendarTasks, проверяем там
          const completedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
          const completedIndex = completedTasks.findIndex(task => task.id === id);
          
          if (completedIndex === -1) {
            throw new Error("Task not found");
          }
          
          // Задача уже в calendarTasks, просто обновляем статус
          completedTasks[completedIndex] = {
            ...completedTasks[completedIndex], 
            status, 
            completed: true
          };
          
          localStorage.setItem('calendarTasks', JSON.stringify(completedTasks));
          return completedTasks[completedIndex];
        }
        
        // Задача в активных, перемещаем в завершенные
        const taskToMove = activeTasks[taskIndex];
        const updatedTask = {
          ...taskToMove,
          status,
          completed: true,
          completionDate: new Date().toISOString().split('T')[0]
        };
        
        // Удаляем из активных
        activeTasks.splice(taskIndex, 1);
        localStorage.setItem('tasks', JSON.stringify(activeTasks));
        
        // Добавляем в завершенные
        const completedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
        localStorage.setItem('calendarTasks', JSON.stringify([...completedTasks, updatedTask]));
        
        return updatedTask;
      } 
      else if (status === 'IN_PROGRESS') {
        // Если статус "IN_PROGRESS", перемещаем задачу из calendarTasks в tasks
        const completedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
        const completedIndex = completedTasks.findIndex(task => task.id === id);
        
        if (completedIndex === -1) {
          // Возможно задача уже в tasks, проверяем там
          const activeTasks = JSON.parse(localStorage.getItem('tasks')) || [];
          const activeIndex = activeTasks.findIndex(task => task.id === id);
          
          if (activeIndex === -1) {
            throw new Error("Task not found");
          }
          
          // Задача уже в tasks, просто обновляем статус
          activeTasks[activeIndex] = {
            ...activeTasks[activeIndex], 
            status, 
            completed: false
          };
          
          localStorage.setItem('tasks', JSON.stringify(activeTasks));
          return activeTasks[activeIndex];
        }
        
        // Задача в завершенных, перемещаем в активные
        const taskToMove = completedTasks[completedIndex];
        const updatedTask = {
          ...taskToMove,
          status,
          completed: false,
          completionDate: null
        };
        
        // Удаляем из завершенных
        completedTasks.splice(completedIndex, 1);
        localStorage.setItem('calendarTasks', JSON.stringify(completedTasks));
        
        // Добавляем в активные
        const activeTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        localStorage.setItem('tasks', JSON.stringify([...activeTasks, updatedTask]));
        
        return updatedTask;
      }
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update task status");
    }
  }
);

// Initial state
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

// Create slice
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
      // Handle fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = sortTasksByDate(action.payload.content || []);
        state.totalElements = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 0;
        state.page = action.payload.number || 0;
        
        // Обновляем tasksByDate
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
      
      // Handle updateTaskStatus
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // Обновляем состояние только если задача найдена
        if (action.payload) {
          // Находим задачу для обновления
          const taskIndex = state.tasks.findIndex(task => task.id === action.payload.id);
          
          if (taskIndex !== -1) {
            // Обновляем задачу в массиве
            state.tasks[taskIndex] = action.payload;
          } else {
            // Добавляем задачу, если ее нет в массиве (возможно, она была перемещена из другой категории)
            state.tasks.push(action.payload);
          }
          
          // Сортируем задачи
          state.tasks = sortTasksByDate(state.tasks);
          
          // Обновляем tasksByDate
          state.tasksByDate = organizeTasksByDate(state.tasks);
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