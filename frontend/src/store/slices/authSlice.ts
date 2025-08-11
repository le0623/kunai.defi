import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authAPI } from '@/services/api'
import { storageService } from '@/services/localstorage'

export interface User {
  id: string
  email: string | null
  address: string | null
  inAppWalletId: string | null
  inAppWallet: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAuthDlgOpen: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: storageService.getItem('authToken'),
  isAuthenticated: false,
  isAuthDlgOpen: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = storageService.getItem('authToken')
      if (!token) {
        return { isAuthenticated: false, token: null, user: null }
      }
      
      // Verify token and get user data
      try {
        const user = await authAPI.getCurrentUser()
        return { isAuthenticated: true, token, user }
      } catch (error) {
        // Token is invalid, clear it
        storageService.removeItem('authToken')
        return { isAuthenticated: false, token: null, user: null }
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auth check failed')
    }
  }
)

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginWithEmail(email, password)
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
      const response = await authAPI.verifyEmailCode({ email, code })
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

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      clearToken()
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
      storageService.setItem('authToken', action.payload)
    },
    clearToken: (state) => {
      state.token = null
      state.isAuthenticated = false
      state.user = null
      storageService.removeItem('authToken')
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearError: (state) => {
      state.error = null
    },
    showAuthDlg: (state, action: PayloadAction<boolean>) => {
      state.isAuthDlgOpen = action.payload
    },
    login: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      state.isAuthDlgOpen = false
      storageService.setItem('authToken', action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = action.payload.isAuthenticated
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.token = null
        state.error = action.payload as string
        storageService.removeItem('authToken')
      })
      // Login with email
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false
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
        storageService.setItem('authToken', action.payload.token)
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        storageService.removeItem('authToken')
      })
  },
})

export const { 
  setToken, 
  clearToken, 
  setUser, 
  clearError, 
  showAuthDlg, 
  login,
} = authSlice.actions
export default authSlice.reducer 