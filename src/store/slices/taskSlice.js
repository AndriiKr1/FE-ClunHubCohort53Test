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
    
    if (task.status === 'COMPLETED' && task.completionDate) {
      // Для выполненных задач используем дату выполнения
      dateKey = task.completionDate.split("T")[0];
    } else {
      // Для остальных задач используем дедлайн
      dateKey = task.deadline ? task.deadline.split("T")[0] : null;
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
      const params = { status };
      
      if (status === "COMPLETED") {
        const now = new Date();
        params.completionDate = formatDateForApi(now);
      }
      
      const response = await axios.patch(`/api/tasks/${id}/status`, null, {
        params: params
      });
      console.log("Server response:", response.data);
      // Перезагружаем список всех задач после обновления
      await dispatch(fetchTasks({includeCompleted: true})).unwrap();
      
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
          .map((task) => ({
            id: task.id,
            name: task.title || task.name,
            description: task.description,
            deadline: task.dueDate,
            status: task.status,
            completionDate: task.completionDate,
            completed: task.completed || task.status === "COMPLETED",
            createdAt: task.createdAt,
          }));

        state.tasks = sortTasksByDate(mappedTasks);
        state.tasksByDate = organizeTasksByDate(state.tasks);

        state.totalElements =
          action.payload.totalElements || mappedTasks.length;
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

        // Знаходимо індекс завдання
        const taskId = action.meta.arg.id;
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);

        if (taskIndex !== -1) {
          // Оновлюємо статус завдання
          state.tasks[taskIndex].status = action.meta.arg.status;
          state.tasks[taskIndex].completed =
            action.meta.arg.status === "COMPLETED";

            if (action.meta.arg.status === "COMPLETED") {
              const now = new Date();
              state.tasks[taskIndex].completionDate = formatDateForApi(now);
            }

          // Також оновлюємо в об'єкті tasksByDate
          Object.keys(state.tasksByDate).forEach((dateKey) => {
            const dateTaskIndex = state.tasksByDate[dateKey]?.findIndex(
              (t) => t.id === taskId
            );
            if (dateTaskIndex !== -1) {
              state.tasksByDate[dateKey][dateTaskIndex].status =
                action.meta.arg.status;
              state.tasksByDate[dateKey][dateTaskIndex].completed =
                action.meta.arg.status === "COMPLETED";
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
