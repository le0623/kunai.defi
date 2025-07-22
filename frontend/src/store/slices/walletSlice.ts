import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { walletAPI } from '@/services/api'

export interface InAppWallet {
  address: string
  balance: {
    eth: string
    tokens: Array<{
      address: string
      symbol: string
      balance: string
      valueUSD: string
    }>
  }
  config: {
    maxTradeAmount: string
    maxSlippage: number
    dailyTradeLimit: string
  }
}

export interface WalletState {
  inAppWallet: InAppWallet | null
  isLoading: boolean
  error: string | null
  transactions: Array<{
    hash: string
    timestamp: number
    type: 'trade' | 'transfer' | 'approval'
    details: any
  }>
}

const initialState: WalletState = {
  inAppWallet: null,
  isLoading: false,
  error: null,
  transactions: [],
}

// Async thunks
export const createInAppWallet = createAsyncThunk(
  'wallet/createInAppWallet',
  async (config: any, { rejectWithValue }) => {
    try {
      const response = await walletAPI.createInAppWallet(config)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to create wallet')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create wallet')
    }
  }
)

export const getInAppWallet = createAsyncThunk(
  'wallet/getInAppWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletAPI.getInAppWallet()
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to get wallet')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get wallet')
    }
  }
)

export const getWalletBalance = createAsyncThunk(
  'wallet/getWalletBalance',
  async (address: string, { rejectWithValue }) => {
    try {
      const response = await walletAPI.getWalletBalance(address)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to get balance')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get balance')
    }
  }
)

export const executeTrade = createAsyncThunk(
  'wallet/executeTrade',
  async (tradeData: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    minAmountOut: string
  }, { rejectWithValue }) => {
    try {
      const response = await walletAPI.executeTrade(tradeData)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Trade failed')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Trade failed')
    }
  }
)

export const getTransactionHistory = createAsyncThunk(
  'wallet/getTransactionHistory',
  async (address: string, { rejectWithValue }) => {
    try {
      const response = await walletAPI.getTransactionHistory(address)
      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || 'Failed to get transaction history')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get transaction history')
    }
  }
)

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateWalletBalance: (state, action: PayloadAction<InAppWallet['balance']>) => {
      if (state.inAppWallet) {
        state.inAppWallet.balance = action.payload
      }
    },
    addTransaction: (state, action: PayloadAction<WalletState['transactions'][0]>) => {
      state.transactions.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Create in-app wallet
      .addCase(createInAppWallet.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createInAppWallet.fulfilled, (state, action) => {
        state.isLoading = false
        state.inAppWallet = action.payload
      })
      .addCase(createInAppWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Get in-app wallet
      .addCase(getInAppWallet.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getInAppWallet.fulfilled, (state, action) => {
        state.isLoading = false
        state.inAppWallet = action.payload
      })
      .addCase(getInAppWallet.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Get wallet balance
      .addCase(getWalletBalance.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getWalletBalance.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.inAppWallet) {
          state.inAppWallet.balance = action.payload
        }
      })
      .addCase(getWalletBalance.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Execute trade
      .addCase(executeTrade.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.isLoading = false
        // Add the new transaction to the list
        state.transactions.unshift({
          hash: action.payload.txHash,
          timestamp: Date.now(),
          type: 'trade',
          details: action.payload,
        })
      })
      .addCase(executeTrade.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Get transaction history
      .addCase(getTransactionHistory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false
        state.transactions = action.payload
      })
      .addCase(getTransactionHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, updateWalletBalance, addTransaction } = walletSlice.actions
export default walletSlice.reducer 