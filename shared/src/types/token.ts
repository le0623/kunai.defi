import { GeckoTerminalToken } from "./pools"

interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  image_url?: string
  coingecko_coin_id?: string
  total_supply?: string
  normalized_total_supply?: string
  price_usd?: string
}

export interface MoralisTokenLinks {
  discord?: string;
  medium?: string;
  reddit?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
  github?: string;
  bitbucket?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

export interface MoralisTokenMetadata {
  address: string;
  address_label?: string;
  name: string;
  symbol: string;
  description?: string;
  decimals: string;
  logo?: string;
  logo_hash?: string;
  thumbnail?: string;
  total_supply: string;
  total_supply_formatted: string;
  fully_diluted_valuation?: string;
  block_number: string;
  validated: string;
  created_at?: string;
  possible_spam?: string;
  verified_contract?: string;
  categories?: string[];
  security_score?: number;
  circulating_supply: string;
  market_cap?: string;
  links?: MoralisTokenLinks;
}

export interface MoralisTokenDetail {
  chain_id: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_logo: string;
  price_usd: number;
  token_age_in_days: number;
  on_chain_strength_index: number;
  security_score: number;
  market_cap: number;
  fully_diluted_valuation: number;
  twitter_followers: number;
  holders_change: LongTimeSeries;
  liquidity_change_usd: LongTimeSeries;
  experienced_net_buyers_change: LongTimeSeries;
  volume_change_usd: LongTimeSeries;
  net_volume_change_usd: LongTimeSeries;
  price_percent_change_usd: LongTimeSeries;
}

export interface LongTimeSeries {
  "1h": number;
  "1d": number;
  "1w": number;
  "1M": number;
}

export interface ShortTimeSeries {
  "5m": number;
  "1h": number;
  "6h": number;
  "24h": number;
}

export interface MoralisTokenAnalytics {
  tokenAddress: string;
  totalBuyVolume: ShortTimeSeries;
  totalSellVolume: ShortTimeSeries;
  totalBuyers: ShortTimeSeries;
  totalSellers: ShortTimeSeries;
  totalBuys: ShortTimeSeries;
  totalSells: ShortTimeSeries;
  uniqueWallets: ShortTimeSeries;
  pricePercentChange: ShortTimeSeries;
  usdPrice: string;
  totalLiquidityUsd: string;
  totalFullyDilutedValuation: string;
}

export interface MoralisServiceConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface TokenMetadataInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  thumbnail?: string;
  totalSupply: string;
  totalSupplyFormatted: string;
  fullyDilutedValuation?: string;
  blockNumber: string;
  isValidated: boolean;
  isPossibleSpam?: boolean;
  isVerifiedContract?: boolean;
  categories?: string[];
  links?: MoralisTokenLinks;
  addressLabel?: string;
}

export interface KunaiTokenInfo {
  tokenInfo: GeckoTerminalToken;
  moralisToken: MoralisTokenMetadata;
  moralisTokenAnalytics: MoralisTokenAnalytics;
  chain: string;
  lastUpdated: string;
}