import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

export interface PriceState {
  marketPrice: string | null
  selectedChain: 'eth' | 'sol'
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastUpdate: number | null
}

const initialState: PriceState = {
  marketPrice: null,
  selectedChain: 'eth',
  isLoading: false,
  error: null,
  isConnected: false,
  lastUpdate: null,
}

// WebSocket connection management
let currentWebSocket: WebSocket | null = null

// Async thunk to initialize WebSocket connection based on selected chain
export const initializePriceFeed = createAsyncThunk(
  'price/initializePriceFeed',
  async (chain: 'eth' | 'sol', { dispatch, getState }) => {
    try {
      // Close existing connection if any
      if (currentWebSocket) {
        currentWebSocket.close()
        currentWebSocket = null
      }

      // Set the selected chain
      dispatch(setSelectedChain(chain))

      // Initialize price feed based on selected chain
      const streamName = chain === 'eth' ? 'ethusdt@markPrice@1s' : 'solusdt@markPrice@1s'
      currentWebSocket = new WebSocket(`wss://fstream.binance.com/stream?streams=${streamName}`)
      
      currentWebSocket.onopen = () => {
        dispatch(setConnectionStatus({ isConnected: true, error: null }))
      }
      
      currentWebSocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        dispatch(updateMarketPrice(data.data.p))
      }
      
      currentWebSocket.onerror = (error) => {
        dispatch(setConnectionStatus({ isConnected: false, error: `${chain.toUpperCase()} WebSocket error` }))
      }
      
      currentWebSocket.onclose = () => {
        dispatch(setConnectionStatus({ isConnected: false, error: `${chain.toUpperCase()} WebSocket closed` }))
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
)

// Async thunk to disconnect WebSocket connection
export const disconnectPriceFeed = createAsyncThunk(
  'price/disconnectPriceFeed',
  async (_, { dispatch }) => {
    try {
      if (currentWebSocket) {
        currentWebSocket.close()
        currentWebSocket = null
      }
      
      dispatch(setConnectionStatus({ isConnected: false, error: null }))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
)

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    updateMarketPrice: (state, action: PayloadAction<string>) => {
      state.marketPrice = action.payload
      state.lastUpdate = Date.now()
      state.error = null
    },
    setSelectedChain: (state, action: PayloadAction<'eth' | 'sol'>) => {
      state.selectedChain = action.payload
    },
    setConnectionStatus: (state, action: PayloadAction<{ isConnected: boolean; error: string | null }>) => {
      state.isConnected = action.payload.isConnected
      state.error = action.payload.error
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetPrices: (state) => {
      state.marketPrice = null
      state.lastUpdate = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePriceFeed.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(initializePriceFeed.fulfilled, (state, action) => {
        state.isLoading = false
        if (!action.payload.success) {
          state.error = action.payload.error || 'Failed to initialize price feed'
        }
      })
      .addCase(initializePriceFeed.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to initialize price feed'
      })
      .addCase(disconnectPriceFeed.fulfilled, (state) => {
        state.isConnected = false
        state.isLoading = false
      })
  }
})

export const {
  updateMarketPrice,
  setSelectedChain,
  setConnectionStatus,
  setLoading,
  clearError,
  resetPrices
} = priceSlice.actions

export default priceSlice.reducer 