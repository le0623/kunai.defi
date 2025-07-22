import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authAPI } from '@/services/api'

export interface User {
  id: string
  email: string | null
  address: string | null
  inAppWalletId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isEmailVerified: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isEmailVerified: false,
}

// Async thunks
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginWithEmail(email)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Login failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(email, code)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Verification failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Verification failed')
    }
  }
)

export const loginWithWallet = createAsyncThunk(
  'auth/loginWithWallet',
  async (signature: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginWithWallet(signature)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Wallet login failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Wallet login failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
      return null
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      localStorage.setItem('authToken', action.payload)
    },
    clearToken: (state) => {
      state.token = null
      state.isAuthenticated = false
      state.user = null
      localStorage.removeItem('authToken')
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.isEmailVerified = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login with email
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false
        state.isEmailVerified = false
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Verify email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.isEmailVerified = true
        localStorage.setItem('authToken', action.payload.token)
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Login with wallet
      .addCase(loginWithWallet.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithWallet.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.isEmailVerified = true
        localStorage.setItem('authToken', action.payload.token)
      })
      .addCase(loginWithWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.isEmailVerified = false
        localStorage.removeItem('authToken')
      })
  },
})

export const { setToken, clearToken, setUser, setEmailVerified, clearError } = authSlice.actions
export default authSlice.reducer 