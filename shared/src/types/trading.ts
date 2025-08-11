// Trading-related types

export interface TradeRequest {
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  deadline: number
  dexData: string
  slippage: number
}

export interface TradeResponse {
  success: boolean
  txHash?: string
  amountOut?: string
  gasUsed?: string
  gasPrice?: string
  error?: string
}

export interface TradeHistory {
  id: string
  type: 'buy' | 'sell'
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  tokenAddress: string
  tokenSymbol?: string
  tokenName?: string
  amount: number
  tokenAmount?: string
  priceUSD?: number
  gasUsed?: string
  gasPrice?: string
  txHash?: string
  slippage?: number
  profit?: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface SniperConfig {
  id: string
  name: string
  isActive: boolean
  maxBuyAmount: number
  maxSlippage: number
  autoSell: boolean
  sellPercentage: number
  targetChains: string[]
  targetDexs: string[]
  minLiquidity: number
  maxBuyTax: number
  maxSellTax: number
  minMarketCap: number
  maxMarketCap: number
  honeypotCheck: boolean
  lockCheck: boolean
  blacklistTokens: string[]
  whitelistTokens: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CopyTradeConfig {
  id: string
  targetAddress: string
  allocation: number // Percentage to copy (0-100)
  maxSlippage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TradingBot {
  id: string
  name: string
  isActive: boolean
  config: any
  status: 'running' | 'stopped' | 'error'
  lastRun?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PriceAlert {
  id: string
  tokenAddress: string
  tokenSymbol: string
  targetPrice: number
  condition: 'above' | 'below'
  isTriggered: boolean
  createdAt: Date
}

export interface MarketData {
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  liquidity: number
  holders: number
  timestamp: Date
}

export interface MoralisTokenSwap {
  transactionHash: string
  transactionIndex: number
  transactionType: string
  baseQuotePrice: string
  entity: string
  entityLogo: string
  blockTimestamp: string
  blockNumber: string
  subCategory: string
  walletAddress: string
  walletAddressLabel: string
  pairAddress: string
  pairLabel: string
  exchangeName: string
  exchangeAddress: string
  exchangeLogo: string
  baseToken: string
  quoteToken: string
  bought: {
    address: string
    amount: string
    usdPrice: number
    usdAmount: number
    symbol: string
    logo: string
    name: string
    tokenType: string
  },
  sold: {
    address: string
    amount: string
    usdPrice: number
    usdAmount: number
    symbol: string
    logo: string
    name: string
    tokenType: string
  },
  totalValueUsd: number
}