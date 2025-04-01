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

export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Failed to request password reset");
      } else {
        return rejectWithValue("Network error. Please try again later.");
      }
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data, { rejectWithValue }) => {
    try {
      console.log("Sending reset password request:", data);
      const response = await axios.post(`/api/auth/reset-password`, {
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      console.log("Reset password response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Failed to reset password");
    }
  }
);
const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  passwordReset: {
    isLinkSent: false,
    isCodeVerified: false,
    isLoading: false,
    error: null,
    message: null
  }
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
    clearPasswordResetState: (state) => {
      state.passwordReset = {
        isLinkSent: false,
        isCodeVerified: false,
        isLoading: false,
        error: null,
        message: null
      };
    }
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
      })

       // Запит на скидання паролю
       .addCase(requestPasswordReset.pending, (state) => {
        state.passwordReset.isLoading = true;
        state.passwordReset.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.passwordReset.isLoading = false;
        state.passwordReset.isLinkSent = true;
        state.passwordReset.message = "If your email is registered, a password reset code has been sent.";
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.passwordReset.isLoading = false;
        state.passwordReset.error = action.payload;
      })

      // Скидання паролю
      .addCase(resetPassword.pending, (state) => {
        state.passwordReset.isLoading = true;
        state.passwordReset.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordReset.isLoading = false;
        state.passwordReset.isCodeVerified = true;
        state.passwordReset.message = "Your password has been reset successfully";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordReset.isLoading = false;
        
        // Handle ErrorResponseDto format
        if (action.payload && action.payload.error) {
          state.passwordReset.error = action.payload.error;
        } else {
          state.passwordReset.error = action.payload || "Failed to reset password";
        }
      });
  },
});
export const { logout, clearError, clearPasswordResetState } = authSlice.actions;
export default authSlice.reducer;
