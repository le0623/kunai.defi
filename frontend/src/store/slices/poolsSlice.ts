import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { poolsAPI } from '@/services/api'
import type { Pool } from '@kunai/shared'

export interface PoolsState {
  pools: Pool[]
  isLoading: boolean
  error: string | null
  selectedDuration: string
  filters: {
    chain?: string
    dex?: string
    minLiquidity?: number
    maxLiquidity?: number
    minHolders?: number
    maxHolders?: number
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const initialState: PoolsState = {
  pools: [],
  isLoading: false,
  error: null,
  selectedDuration: '1h',
  filters: {},
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
}

// Async thunks
export const fetchPools = createAsyncThunk(
  'pools/fetchPools',
  async (params?: {
    duration?: string
    filters?: PoolsState['filters']
    page?: number
    limit?: number
  }, { rejectWithValue }) => {
    try {
      const response = await poolsAPI.getPools(params)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to fetch pools')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pools')
    }
  }
)

export const refreshPools = createAsyncThunk(
  'pools/refreshPools',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any
      const { selectedDuration, filters, pagination } = state.pools
      
      const response = await poolsAPI.getPools({
        duration: selectedDuration,
        filters,
        page: pagination.page,
        limit: pagination.limit,
      })
      
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to refresh pools')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh pools')
    }
  }
)

const poolsSlice = createSlice({
  name: 'pools',
  initialState,
  reducers: {
    setSelectedDuration: (state, action: PayloadAction<string>) => {
      state.selectedDuration = action.payload
    },
    setFilters: (state, action: PayloadAction<PoolsState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {}
      state.pagination.page = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload
      state.pagination.page = 1 // Reset to first page when limit changes
    },
    clearError: (state) => {
      state.error = null
    },
    updatePool: (state, action: PayloadAction<Pool>) => {
      const index = state.pools.findIndex(pool => pool.id === action.payload.id)
      if (index !== -1) {
        state.pools[index] = action.payload
      }
    },
    addPool: (state, action: PayloadAction<Pool>) => {
      // Add new pool to the beginning of the list
      state.pools.unshift(action.payload)
      // Remove the last pool if we exceed the limit
      if (state.pools.length > state.pagination.limit) {
        state.pools.pop()
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch pools
      .addCase(fetchPools.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPools.fulfilled, (state, action) => {
        state.isLoading = false
        state.pools = action.payload.pools
        state.pagination.total = action.payload.total || action.payload.pools.length
      })
      .addCase(fetchPools.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Refresh pools
      .addCase(refreshPools.pending, (state) => {
        // Don't set loading to true for refresh to avoid UI flicker
        state.error = null
      })
      .addCase(refreshPools.fulfilled, (state, action) => {
        state.pools = action.payload.pools
        state.pagination.total = action.payload.total || action.payload.pools.length
      })
      .addCase(refreshPools.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const {
  setSelectedDuration,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearError,
  updatePool,
  addPool,
} = poolsSlice.actions

export default poolsSlice.reducer 