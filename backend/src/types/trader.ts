export interface TraderRanking {
  id: string
  wallet: string
  ethBalance: string
  oneDayPnl: string
  sevenDayPnl: string
  thirtyDayPnl: string
  sevenDayWinRate: number
  sevenDayTransactions: number
  trackedBy: number
  sevenDayTokenDistribution: string[]
  sevenDayProfit: number[]
  sevenDayAvgDuration: number
  sevenDayAvgCost: string
  lastTime: string
  rank: number
  user: {
    id: string
    email?: string
    telegramUserId?: string
  }
  inAppWallet?: {
    address: string
    isActive: boolean
  }
}

export interface TraderRankingFilters {
  category?: 'all' | 'smart-money' | 'kol-vc' | 'fresh-wallet' | 'sniper'
  minBalance?: string
  maxBalance?: string
  minWinRate?: number
  maxWinRate?: number
  minTransactions?: number
  maxTransactions?: number
  sortBy?: 'ethBalance' | 'oneDayPnl' | 'sevenDayPnl' | 'thirtyDayPnl' | 'sevenDayWinRate' | 'sevenDayTransactions' | 'trackedBy' | 'lastTime'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface TraderStats {
  totalTraders: number
  averageWinRate: number
  averagePnl: string
  topPerformers: TraderRanking[]
}

export interface Trade {
  id: string
  hash: string
  userAddress: string
  tokenAddress: string
  tokenSymbol?: string
  tokenName?: string
  type: 'buy' | 'sell'
  amount: string
  tokenAmount: string
  priceUSD?: number
  priceETH: string
  gasUsed: string
  gasPrice: string
  gasCost: string
  timestamp: string
  blockNumber: string
  status: 'pending' | 'confirmed' | 'failed'
  profit?: string
  duration?: number
  entryPrice?: string
  exitPrice?: string
  isCopyTrade: boolean
  copiedFrom?: string
  copyTradeId?: string
  dexName?: string
  dexVersion?: string
  slippage?: number
  riskScore: number
  isHoneypot: boolean
  isRugPull: boolean
  createdAt: string
  updatedAt: string
}

export interface CopyTrade {
  id: string
  name: string
  isActive: boolean
  targetAddress: string
  targetLabel?: string
  allocation: number
  maxSlippage: number
  gasLimit: number
  gasPrice: number
  minTradeAmount: string
  maxTradeAmount: string
  tokenWhitelist: string[]
  tokenBlacklist: string[]
  maxDailyLoss: string
  stopLoss: number
  takeProfit: number
  totalTrades: number
  totalProfit: string
  winRate: number
  createdAt: string
  updatedAt: string
} 