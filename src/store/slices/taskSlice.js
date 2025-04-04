import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from '../../utils/axiosConfig';
import { formatDateForApi, mapTaskFromBackend } from "../../utils/dataMappers";

// Sort tasks by date (newer on top)
const sortTasksByDate = (tasks) => {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.deadline || a.completionDate || 0);
    const dateB = new Date(b.deadline || b.completionDate || 0);
    return dateB - dateA;
  });
};

// Organize tasks by date for calendar
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
      
      // Build the URL with appropriate date parameters
      let url = '/api/tasks/calendar';
      
      if (fromDate && toDate) {
        url += `?startDate=${fromDate}&endDate=${toDate}`;
      } else {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        url += `?startDate=${todayStr}&endDate=${todayStr}`;
      }
      
      console.log("Fetching tasks from:", url);
      const response = await axios.get(url);
      console.log("Fetched tasks response:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch tasks"
      );
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue, dispatch }) => {
    try {
      // Validate title length before sending to server
      if (!taskData.name || taskData.name.length < 10) {
        return rejectWithValue("Task name must be at least 10 characters long");
      }
      
      if (taskData.name.length > 30) {
        return rejectWithValue("Task name cannot exceed 30 characters");
      }
      
      // Format the date properly
      let formattedDate = null;
      if (taskData.deadline) {
        formattedDate = formatDateForApi(taskData.deadline);
      } else {
        return rejectWithValue("Due date is required");
      }
      
      // Create the request object to match TaskRequest on backend
      const taskRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate,
        status: "IN_PROGRESS",
        priority: taskData.priority || 3
      };
      
      console.log("Sending task request:", taskRequest);
      
      const response = await axios.post('/api/tasks', taskRequest);
      console.log("Task creation response:", response.data);
      
      // Important: After successful creation, fetch all tasks to get the proper UUID
      // This solves the issue of tasks not appearing after creation
      await dispatch(fetchTasks()).unwrap();
      
      // Return success info but we won't use it to update the store
      // since we've already fetched the latest tasks
      return {
        success: true,
        message: response.data
      };
    } catch (error) {
      console.error("Task creation error:", {
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorMessages = error.response.data?.message || {};
        if (typeof errorMessages === 'object') {
          const formattedErrors = Object.entries(errorMessages)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          return rejectWithValue(formattedErrors);
        }
      }
      
      return rejectWithValue(
        error.response?.data?.message || 
        "Failed to create task. Please check the form and try again."
      );
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, taskData, email }, { rejectWithValue, dispatch }) => {
    try {
      // Similar validation as createTask
      if (!taskData.name || taskData.name.length < 10) {
        return rejectWithValue("Task name must be at least 10 characters long");
      }
      
      if (taskData.name.length > 30) {
        return rejectWithValue("Task name cannot exceed 30 characters");
      }
      
      // Format date if needed
      const formattedDate = taskData.deadline ? formatDateForApi(taskData.deadline) : null;
      
      const updateRequest = {
        title: taskData.name,
        description: taskData.description || "",
        dueDate: formattedDate
      };
      
      console.log("Updating task:", taskId, updateRequest);
      
      const response = await axios.put(`/api/tasks?taskId=${taskId}&email=${email}`, updateRequest);
      console.log("Task update response:", response.data);
      
      // After update, fetch tasks to ensure data consistency
      await dispatch(fetchTasks()).unwrap();
      
      return response.data;
    } catch (error) {
      console.error("Task update error:", error);
      return rejectWithValue(error.response?.data || "Failed to update task");
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      console.log(`Updating task ${id} status to ${status}`);
      const response = await axios.patch(`/api/tasks/${id}/status?status=${status}`);
      console.log("Task status update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Task status update error:", error);
      return rejectWithValue(
        typeof error.response?.data === 'object'
          ? error.response.data.message || JSON.stringify(error.response.data)
          : error.message || "Failed to update task status"
      );
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      console.log("Deleting task:", taskId);
      await axios.delete(`/api/tasks?id=${taskId}`);
      console.log("Task deleted successfully");
      return taskId;
    } catch (error) {
      console.error("Task deletion error:", error);
      return rejectWithValue(error.response?.data || "Failed to delete task");
    }
  }
);

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
        const mappedTasks = (action.payload || [])
          .filter(task => task) // Filter out any null/undefined tasks
          .map(task => mapTaskFromBackend(task));
        
        console.log("Processed tasks for Redux store:", mappedTasks);
        
        state.tasks = sortTasksByDate(mappedTasks);
        state.totalElements = action.payload.totalElements || mappedTasks.length;
        state.totalPages = action.payload.totalPages || 1;
        state.page = action.payload.number || 0;
        
        // Update tasksByDate for calendar
        state.tasksByDate = organizeTasksByDate(state.tasks);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tasks";
      })
            
      // Handle createTask - we don't add the task directly
      // since we fetch all tasks after creation
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // eslint-disable-next-line no-unused-vars
      .addCase(createTask.fulfilled, (state, _action) => {
        state.loading = false;
        state.error = null;
        // Task list will be updated by the fetchTasks action
        // that we dispatch inside createTask
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
      // eslint-disable-next-line no-unused-vars
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Tasks will be updated by the fetchTasks we dispatch in updateTask
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
        state.error = null;
        // Remove the deleted task from state
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        // Update tasksByDate
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
            // Update existing task
            state.tasks[taskIndex] = mappedTask;
          } else {
            // Add new task if not found
            state.tasks.push(mappedTask);
          }
          
          // Re-sort and organize tasks
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