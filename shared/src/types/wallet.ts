// Wallet-related types
import { BaseEntity } from './common'

export interface WalletInfo {
  address: string
  label?: string
  isSmart: boolean
  riskScore: number
  balance: string
  nonce: number
}

export interface MonitoredWallet extends BaseEntity {
  address: string
  label?: string
  isSmart: boolean
  riskScore: number
  userId: string
  transactions: Transaction[]
  portfolio: Portfolio[]
  alerts: Alert[]
}

export interface Transaction {
  id: string
  hash: string
  blockNumber: bigint
  timestamp: Date
  from: string
  to: string
  value: string
  gasPrice: string
  gasUsed: string
  method?: string
  status: 'pending' | 'confirmed' | 'failed'
  tokenAddress?: string
  tokenSymbol?: string
  tokenAmount?: string
  tokenDecimals?: number
  monitoredWalletId?: string
}

export interface Portfolio {
  id: string
  walletAddress: string
  tokenAddress: string
  tokenSymbol?: string
  tokenName?: string
  balance: string
  valueUSD?: string
  priceUSD?: string
  monitoredWalletId: string
  updatedAt: Date
}

export interface Alert {
  id: string
  type: 'buy' | 'sell' | 'rug_pull' | 'honeypot' | 'large_transfer'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metadata?: any
  isRead: boolean
  createdAt: Date
  userId: string
  monitoredWalletId?: string
}

export interface SmartWalletLabel {
  id: string
  address: string
  label: string
  category: 'whale' | 'influencer' | 'bot' | 'exchange' | 'other'
  confidence: number
  source?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProxyWallet {
  id: string
  userAddress: string
  proxyAddress: string
  telegramUserId: string
  maxTradeAmount: string
  maxSlippage: number
  dailyTradeLimit: string
  isActive: boolean
  deployedAt: Date
  updatedAt: Date
  approvals: ProxyApproval[]
  trades: ProxyTrade[]
}

export interface ProxyApproval {
  id: string
  userAddress: string
  proxyAddress: string
  tokenAddress: string
  amount: string
  createdAt: Date
  updatedAt: Date
}

export interface ProxyTrade {
  id: string
  userAddress: string
  proxyAddress: string
  tradeId: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  deadline: Date
  dexData: string
  status: 'pending' | 'executed' | 'failed' | 'cancelled'
  txHash?: string
  executedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WalletBalance {
  address: string
  ethBalance: string
  tokenBalances: TokenBalance[]
  totalValueUSD: number
  lastUpdated: Date
}

export interface TokenBalance {
  tokenAddress: string
  symbol: string
  name: string
  balance: string
  decimals: number
  priceUSD?: number
  valueUSD?: number
} 