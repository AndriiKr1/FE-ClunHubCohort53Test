import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from '../../utils/axiosConfig'; // Adjust the import path as necessary
import { mapTaskFromBackend } from "../../utils/dataMappers";


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
   
    const dateKey = task.deadline ? task.deadline.split('T')[0] : 
                   (task.completionDate ? task.completionDate.split('T')[0] : null);
    
    if (dateKey) {
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(task);
    }
    return acc;
  }, {});
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (params, { rejectWithValue }) => {
    try {
      const { fromDate, toDate } = params || {};
      
      // If dates are provided, use calendar endpoint
      if (fromDate && toDate) {
        const response = await axios.get(
          `/api/tasks/calendar?startDate=${fromDate}&endDate=${toDate}`
        );
        return response.data;
      } 
      
      // For dashboard, fetch today's tasks by default
      else {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const response = await axios.get(
          `/api/tasks/calendar?startDate=${todayStr}&endDate=${todayStr}`
        );
        return response.data;
      }
    } catch (error) {
      // Properly format the error for Redux
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch tasks"
      );
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/api/tasks/${id}/status?status=${status}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        typeof error.response?.data === 'object'
          ? error.response.data.message || JSON.stringify(error.response.data)
          : error.message || "Failed to update task status"
      );
    }
  }
);

// Create new task
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/tasks', {
        title: taskData.name,
        description: taskData.description,
        dueDate: taskData.deadline
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to create task");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, taskData, email }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/tasks?taskId=${taskId}&email=${email}`, {
        title: taskData.name,
        description: taskData.description,
        dueDate: taskData.deadline
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update task");
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/tasks?id=${taskId}`);
      return taskId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete task");
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
        // Map data from backend format to frontend format
        const mappedTasks = (action.payload.content || []).map(mapTaskFromBackend);
        state.tasks = sortTasksByDate(mappedTasks);
        state.totalElements = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 0;
        state.page = action.payload.number || 0;
        
        // Update tasksByDate
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
            
      // Handle createTask
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        const mappedTask = mapTaskFromBackend(action.payload);
        state.tasks = [mappedTask, ...state.tasks];
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create task";
      })
          
      // Handle updateTask
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const mappedTask = mapTaskFromBackend(action.payload);
        const index = state.tasks.findIndex(task => task.id === mappedTask.id);
        if (index !== -1) {
          state.tasks[index] = mappedTask;
        }
        state.tasks = sortTasksByDate(state.tasks);
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update task";
      })
          
      // Handle deleteTask
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete task";
      })
      
      // Handle updateTaskStatus
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload) {
          const mappedTask = mapTaskFromBackend(action.payload);
          const taskIndex = state.tasks.findIndex(task => task.id === mappedTask.id);
          
          if (taskIndex !== -1) {
            state.tasks[taskIndex] = mappedTask;
          } else {
            state.tasks.push(mappedTask);
          }
          
          state.tasks = sortTasksByDate(state.tasks);
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