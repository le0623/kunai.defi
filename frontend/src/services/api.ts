import api from '@/lib/axios'
import { storageService } from '@/services/localstorage'
import type { PoolRequest } from '@kunai/shared'

// Authentication API calls
export const authAPI = {
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data.user
  },

  // Get nonce for SIWE authentication
  getNonce: async (): Promise<string> => {
    const response = await api.get('/api/auth/nonce')
    return response.data.nonce
  },

  // Verify SIWE signature
  verifySignature: async (message: string, signature: string): Promise<boolean> => {
    const response = await api.post('/api/auth/verify', {
      message,
      signature,
    })
    if (response.data.success) {
      storageService.setItem('authToken', response.data.token)
      return true
    }
    return false
  },

  // Check authentication status
  checkAuth: async (): Promise<boolean> => {
    try {
      const response = await api.get('/api/auth/me')
      return response.status === 200
    } catch (error) {
      return false
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  // Send verification code to email
  sendVerificationCode: async (email: string) => {
    const response = await api.post('/api/auth/send-verification', { email })
    return response.data
  },

  // Verify email code
  verifyEmailCode: async (data: {
    email: string
    code: string
    inviteCode?: string
  }) => {
    const response = await api.post('/api/auth/verify-email', data)
    return response.data
  },
}

// Wallet monitoring API calls
export const walletAPI = {
  // Get monitored wallets
  getMonitoredWallets: async () => {
    const response = await api.get('/api/wallet/monitored')
    return response.data
  },

  // Add wallet to monitoring
  addMonitoredWallet: async (address: string, label?: string) => {
    const response = await api.post('/api/wallet/monitor', {
      address,
      label,
    })
    return response.data
  },

  // Remove wallet from monitoring
  removeMonitoredWallet: async (address: string) => {
    const response = await api.delete(`/api/wallet/monitor/${address}`)
    return response.data
  },

  // Get wallet transactions
  getWalletTransactions: async (address: string, limit = 50) => {
    const response = await api.get(`/api/wallet/transactions/${address}`, {
      params: { limit },
    })
    return response.data
  },

  // Get wallet portfolio
  getWalletPortfolio: async (address: string) => {
    const response = await api.get(`/api/wallet/portfolio/${address}`)
    return response.data
  },
}

// Trading bot API calls
export const tradingAPI = {
  // Get bot status
  getBotStatus: async () => {
    const response = await api.get('/api/trading/bot/status')
    return response.data
  },

  // Start trading bot
  startBot: async (config: any) => {
    const response = await api.post('/api/trading/bot/start', config)
    return response.data
  },

  // Stop trading bot
  stopBot: async () => {
    const response = await api.post('/api/trading/bot/stop')
    return response.data
  },

  // Get bot configuration
  getBotConfig: async () => {
    const response = await api.get('/api/trading/bot/config')
    return response.data
  },

  // Update bot configuration
  updateBotConfig: async (config: any) => {
    const response = await api.put('/api/trading/bot/config', config)
    return response.data
  },
}

// Copy trading API calls
export const copyTradingAPI = {
  // Get available traders
  getTraders: async () => {
    const response = await api.get('/api/trading/copy/traders')
    return response.data
  },

  // Start copy trading
  startCopyTrading: async (traderId: string, config: any) => {
    const response = await api.post('/api/trading/copy/start', {
      traderId,
      ...config,
    })
    return response.data
  },

  // Stop copy trading
  stopCopyTrading: async (copyTradeId: string) => {
    const response = await api.post(`/api/trading/copy/stop/${copyTradeId}`)
    return response.data
  },

  // Get copy trading history
  getCopyTradingHistory: async () => {
    const response = await api.get('/api/trading/copy/history')
    return response.data
  },
}

// Contract analysis API calls
export const contractAPI = {
  // Analyze contract
  analyzeContract: async (address: string) => {
    const response = await api.post('/api/contract/analyze', { address })
    return response.data
  },

  // Get contract risk score
  getRiskScore: async (address: string) => {
    const response = await api.get(`/api/contract/risk/${address}`)
    return response.data
  },

  // Get flagged contracts
  getFlaggedContracts: async () => {
    const response = await api.get('/api/contract/flagged')
    return response.data
  },
}

// Pools API calls
export const poolsAPI = {
  // New unified pools API with comprehensive filtering
  getPools: async (params: PoolRequest = {}) => {
    const response = await api.get('/api/pools', { params })
    return response.data
  },

  // Get available filters
  getAvailableFilters: async () => {
    const response = await api.get('/api/pools/filters')
    return response.data
  },

  // Get new pairs by rank (legacy)
  getNewPairsByRank: async (params: {
    timeframe?: '1m' | '5m' | '1h' | '6h' | '24h';
    limit?: number;
    page?: number;
    chain?: string;
    exchange?: string;
    sortBy?: 'market_cap' | 'volume' | 'holder_count' | 'open_timestamp';
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const response = await api.get('/api/pools/rank', { params })
    return response.data
  },

  // Get all pools with unified parameters
  getAllPools: async (
    timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h',
    limit: number = 50,
    newPoolFilters: any[] = [],
    burntFilters: any[] = [],
    dexscreenerSpentFilters: any[] = []
  ) => {
    const response = await api.get('/api/pools/all', {
      params: {
        timeframe,
        limit,
        new_pool: JSON.stringify({ filters: newPoolFilters }),
        burnt: JSON.stringify({ filters: burntFilters }),
        dexscreener_spent: JSON.stringify({ filters: dexscreenerSpentFilters })
      }
    })
    return response.data
  },

  // Legacy methods for backward compatibility
  getNewPools: async (timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h', limit: number = 50, filters: any[] = []) => {
    const response = await api.get('/api/pools/new', {
      params: { timeframe, limit, filters: JSON.stringify(filters) }
    })
    return response.data
  },

  getBurntPools: async (timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h', limit: number = 50, filters: any[] = []) => {
    const response = await api.get('/api/pools/burnt', {
      params: { timeframe, limit, filters: JSON.stringify(filters) }
    })
    return response.data
  },

  getDexscreenerSpentPools: async (timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h', limit: number = 50, filters: any[] = []) => {
    const response = await api.get('/api/pools/dexscreener-spent', {
      params: { timeframe, limit, filters: JSON.stringify(filters) }
    })
    return response.data
  },
}

// Token API calls
export const tokenAPI = {
  // Get complete token information by chain and address
  getTokenInfo: async (chain: string, address: string) => {
    const response = await api.get(`/api/token/${chain}/${address}`)
    return response.data
  },

  // Get token price only
  getTokenPrice: async (chain: string, address: string) => {
    const response = await api.get(`/api/token/${chain}/${address}/price`)
    return response.data
  },

  // Get token market data (price, volume, market cap, FDV)
  getTokenMarketData: async (chain: string, address: string) => {
    const response = await api.get(`/api/token/${chain}/${address}/market`)
    return response.data
  },

  // Check if token exists on the specified network
  checkTokenExists: async (chain: string, address: string) => {
    const response = await api.get(`/api/token/${chain}/${address}/exists`)
    return response.data
  },

  // Get multiple tokens information in a single request
  getMultipleTokens: async (tokens: Array<{network: string, address: string}>) => {
    const response = await api.post('/api/token/batch', { tokens })
    return response.data
  },
}