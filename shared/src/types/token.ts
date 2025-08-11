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
  links?: MoralisTokenLinks;
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