// Constants used across the platform

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114
} as const

// Chain names
export const CHAIN_NAMES = {
  [CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [CHAIN_IDS.BSC]: 'Binance Smart Chain',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum One',
  [CHAIN_IDS.OPTIMISM]: 'Optimism',
  [CHAIN_IDS.AVALANCHE]: 'Avalanche C-Chain'
} as const

// Chain symbols
export const CHAIN_SYMBOLS = {
  [CHAIN_IDS.ETHEREUM]: 'ETH',
  [CHAIN_IDS.BSC]: 'BNB',
  [CHAIN_IDS.POLYGON]: 'MATIC',
  [CHAIN_IDS.ARBITRUM]: 'ETH',
  [CHAIN_IDS.OPTIMISM]: 'ETH',
  [CHAIN_IDS.AVALANCHE]: 'AVAX'
} as const

// DEX names
export const DEX_NAMES = {
  UNISWAP_V2: 'Uniswap V2',
  UNISWAP_V3: 'Uniswap V3',
  PANCAKESWAP: 'PancakeSwap',
  SUSHISWAP: 'SushiSwap',
  BALANCER: 'Balancer',
  CURVE: 'Curve'
} as const

// Risk levels
export const RISK_LEVELS = {
  LOW: { label: 'Low', color: 'green', score: 0 },
  MEDIUM: { label: 'Medium', color: 'yellow', score: 25 },
  HIGH: { label: 'High', color: 'orange', score: 50 },
  CRITICAL: { label: 'Critical', color: 'red', score: 75 }
} as const

// Alert types
export const ALERT_TYPES = {
  POOL_CREATED: 'pool_created',
  PRICE_UPDATE: 'price_update',
  TRADE_EXECUTED: 'trade_executed',
  WALLET_ACTIVITY: 'wallet_activity',
  HONEYPOT_DETECTED: 'honeypot_detected',
  RUG_PULL_SUSPECTED: 'rug_pull_suspected'
} as const

// Alert severities
export const ALERT_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

// Trade types
export const TRADE_TYPES = {
  BUY: 'buy',
  SELL: 'sell'
} as const

// Trade statuses
export const TRADE_STATUSES = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const

// API endpoints
export const API_ENDPOINTS = {
  POOLS: '/api/pools',
  TRADING: '/api/trading',
  WALLET: '/api/wallet',
  AUTH: '/api/auth',
  TOKEN_SECURITY: '/api/token-security'
} as const

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 300000 // 5 minutes
} as const

// Error codes
export const ERROR_CODES = {
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const 