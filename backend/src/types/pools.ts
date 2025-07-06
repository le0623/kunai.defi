export interface LockDetail {
  percent: string;
  pool: string;
  isBlackHole: boolean;
}

export interface LockInfo {
  isLock: boolean;
  lockDetail: LockDetail[];
  lockTag: string[];
  lockPercent: number;
  leftLockPercent: number;
}

export interface SocialLinks {
  twitter_username?: string | undefined;
  website?: string | undefined;
  telegram?: string | undefined;
}

export interface BaseTokenInfo {
  symbol: string;
  name: string;
  logo: string;
  total_supply: number;
  price: string;
  holder_count: number;
  price_change_percent1m: string;
  price_change_percent5m: string;
  price_change_percent1h: string;
  is_show_alert: boolean;
  buy_tax: string;
  sell_tax: string;
  is_honeypot: number;
  is_open_source: number;
  renounced: number;
  lockInfo: LockInfo;
  liquidity: string;
  top_10_holder_rate: number;
  social_links: SocialLinks;
  dexscr_update_link: number;
  twitter_rename_count: number;
  twitter_del_post_token_count: number;
  twitter_create_token_count: number;
  rug_ratio: number | null;
  sniper_count: number;
  smart_degen_count: number;
  renowned_count: number;
  market_cap: string;
  creator: string;
  creator_created_inner_count: number;
  creator_created_open_count: number;
  creator_created_open_ratio: number;
  creator_balance_rate: number;
  rat_trader_amount_rate: number;
  bundler_trader_amount_rate: number;
  bluechip_owner_percentage: number;
  volume: number;
  swaps: number;
  buys: number;
  sells: number;
  dev_token_burn_amount: number | null;
  dev_token_burn_ratio: number | null;
  dexscr_ad: number;
  cto_flag: number;
  twitter_change_flag: number;
  address: string;
}

export interface Pool {
  id: number;
  chain: string;
  address: string;
  exchange: string;
  base_address: string;
  quote_address: string;
  quote_symbol: string;
  quote_reserve: string;
  initial_liquidity: number | null;
  initial_quote_reserve: number | null;
  base_token_info: BaseTokenInfo;
  open_timestamp: number;
  bot_degen_count: string;
}

export interface PoolsResponse {
  pools: Pool[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PoolsQueryParams {
  timeframe?: '1m' | '5m' | '1h' | '6h' | '24h';
  limit?: number;
  page?: number;
  chain?: string;
  exchange?: string;
  sortBy?: 'market_cap' | 'volume' | 'holder_count' | 'open_timestamp';
  sortOrder?: 'asc' | 'desc';
} 