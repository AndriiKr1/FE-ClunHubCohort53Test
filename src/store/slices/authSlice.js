import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";



export const registerUser = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    console.log("Sending registration data:", userData);
    try {
      const response = await axios.post(`/api/auth/sign-up`, {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        age: parseInt(userData.age),        
        avatarId: userData.avatar 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Registration error"
      );
    }
  }
);


export const loginUser = createAsyncThunk(
  "auth/signin",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/auth/sign-in`, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server returned an error response
        if (error.response.status === 404) {
          return rejectWithValue("user_not_found");
        } else if (error.response.status === 401) {
          return rejectWithValue("invalid_credentials");
        } else {
          return rejectWithValue(error.response.data?.message || "server_error");
        }
      } else if (error.request) {
        // Request made but no response received
        return rejectWithValue("server_unreachable");
      } else {
        // Something else happened while setting up the request
        return rejectWithValue("network_error");
      }
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
