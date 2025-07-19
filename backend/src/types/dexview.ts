export interface DexViewToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface DexViewTransactions {
  h24: {
    buys: number;
    sells: number;
  };
  h6: {
    buys: number;
    sells: number;
  };
  h1: {
    buys: number;
    sells: number;
  };
  m5: {
    buys: number;
    sells: number;
  };
}

export interface DexViewVolume {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

export interface DexViewPriceChange {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

export interface DexViewLiquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface DexViewPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[];
  baseToken: DexViewToken;
  quoteToken: DexViewToken;
  priceNative: number;
  priceUsd: number;
  txns: DexViewTransactions;
  volume: DexViewVolume;
  priceChange: DexViewPriceChange;
  liquidity: DexViewLiquidity;
  fdv: number;
  pairCreatedAt: number;
}

export interface DexViewResponse {
  schemaVersion: string;
  pairs: DexViewPair[];
  pair: DexViewPair | null;
}

export interface DexViewServiceConfig {
  baseUrl?: string;
  timeout?: number;
}
