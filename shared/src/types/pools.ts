// Pool-related types

import { PaginatedResponse, PaginationParams } from "."

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  image_url?: string
  coingecko_coin_id?: string
  total_supply?: string
  normalized_total_supply?: string
  price_usd?: string
  fdv_usd?: string
  total_reserve_in_usd?: string
  volume_usd?: {
    h24: string
  }
  market_cap_usd?: string
}

export interface TokenLinks {
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  github?: string
  medium?: string
  reddit?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  tiktok?: string
  youtube?: string
}

export interface PoolMetrics {
  liquidity: string
  volume24h: string
  priceUSD: string
  priceChange24h: number
  marketCap: string
  fdv?: string
  priceNative?: number
}

export interface TransactionMetrics {
  buys: number
  sells: number
  total: number
}

export interface VolumeMetrics {
  h24: number
  h6: number
  h1: number
  m5: number
}

export interface PriceChangeMetrics {
  h24: number
  h6: number
  h1: number
  m5: number
}

export interface LiquidityMetrics {
  usd: number
  base: number
  quote: number
}

export interface DexViewData {
  priceNative: number
  priceUsd: number
  fdv: number
  pairCreatedAt: number
  labels: string[]
  url: string
  transactions: {
    h24: TransactionMetrics
    h6: TransactionMetrics
    h1: TransactionMetrics
    m5: TransactionMetrics
  }
  volume: VolumeMetrics
  priceChange: PriceChangeMetrics
  liquidity: LiquidityMetrics
}

export interface Pool {
  id: string
  address: string
  chain: string
  chainId: number
  exchange: string
  dexVersion: string
  token0: TokenInfo
  token1: TokenInfo
  metrics?: PoolMetrics
  dexViewData?: DexViewData
  createdAt: Date
  updatedAt: Date
  lastTradedAt?: Date
  age: number // in seconds
}

export interface PoolFilters {
  chain?: string
  exchange?: string
  tokenAddress?: string
  isActive?: boolean
  isVerified?: boolean
  isHoneypot?: boolean
  minMarketCap?: number
  maxMarketCap?: number
  minLiquidity?: number
  maxLiquidity?: number
  minVolume24h?: number
  maxVolume24h?: number
  minPriceChange24h?: number
  maxPriceChange24h?: number
}

export interface PoolQueryParams extends PaginationParams {
  timeframe?: '1m' | '5m' | '1h' | '6h' | '24h'
  filters?: PoolFilters
  sortBy?: 'market_cap' | 'volume' | 'holder_count' | 'open_timestamp' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface PoolRequest {
  limit?: number
  page?: number
  chain?: string
  tokenAddress?: string
}

export interface PoolResponse extends PaginatedResponse<Pool> {
  timeframe?: string
  enrichedData?: {
    dexViewPairsCount: number
    moralisPairsCount: number
    enrichmentRate: {
      dexView: string
      moralis: string
    }
  }
}

export interface Chain {
  id: string
  name: string
  chainId: number
  symbol: string
  rpcUrl: string
  explorerUrl: string
  isActive: boolean
}

export interface Dex {
  id: string
  name: string
  version: string
  factoryAddress: string
  routerAddress: string
  isActive: boolean
  chainId: number
} 