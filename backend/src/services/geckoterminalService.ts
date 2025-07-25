import axios from 'axios';
import { logger } from '@/utils/logger';
import type { GeckoTerminalTrendingPool } from '@kunai/shared';

// Types based on GeckoTerminal API response
export interface GeckoTerminalTokenAttributes {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string | null;
  coingecko_coin_id: string | null;
  total_supply: string;
  normalized_total_supply: string;
  price_usd: string;
  fdv_usd: string;
  total_reserve_in_usd: string;
  volume_usd: {
    h24: string;
  };
  market_cap_usd: string | null;
}

export interface GeckoTerminalPool {
  id: string;
  type: string;
}

export interface GeckoTerminalTokenData {
  id: string;
  type: string;
  attributes: GeckoTerminalTokenAttributes;
  relationships: {
    top_pools: {
      data: GeckoTerminalPool[];
    };
  };
}

export interface GeckoTerminalResponse {
  data: GeckoTerminalTokenData;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl: string | null;
  coingeckoCoinId: string | null;
  totalSupply: string;
  normalizedTotalSupply: string;
  priceUsd: number;
  fdvUsd: number;
  totalReserveInUsd: number;
  volume24h: number;
  marketCapUsd: number | null;
  topPools: string[];
}

class GeckoTerminalService {
  private readonly BASE_URL = 'https://api.geckoterminal.com/api/v2';
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  /**
   * Get token information from GeckoTerminal API
   * @param network - Network identifier (e.g., 'eth', 'bsc', 'polygon')
   * @param tokenAddress - Token contract address
   * @returns Promise<TokenInfo>
   */
  async getTokenInfo(
    network: string,
    tokenAddress: string
  ): Promise<TokenInfo> {
    try {
      const url = `${this.BASE_URL}/networks/${network}/tokens/${tokenAddress}`;

      logger.info(`Fetching token info from GeckoTerminal: ${url}`);

      const response = await axios.get<GeckoTerminalResponse>(url, {
        timeout: this.DEFAULT_TIMEOUT,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'KunAI-DeFi-Platform/1.0',
        },
      });

      const { data } = response.data;
      const { attributes, relationships } = data;

      // Transform the response to our internal format
      const tokenInfo: TokenInfo = {
        address: attributes.address,
        name: attributes.name,
        symbol: attributes.symbol,
        decimals: attributes.decimals,
        imageUrl: attributes.image_url,
        coingeckoCoinId: attributes.coingecko_coin_id,
        totalSupply: attributes.total_supply,
        normalizedTotalSupply: attributes.normalized_total_supply,
        priceUsd: parseFloat(attributes.price_usd) || 0,
        fdvUsd: parseFloat(attributes.fdv_usd) || 0,
        totalReserveInUsd: parseFloat(attributes.total_reserve_in_usd) || 0,
        volume24h: parseFloat(attributes.volume_usd.h24) || 0,
        marketCapUsd: attributes.market_cap_usd
          ? parseFloat(attributes.market_cap_usd)
          : null,
        topPools: relationships.top_pools.data.map(pool => pool.id),
      };

      logger.info(
        `Successfully fetched token info for ${attributes.symbol} (${attributes.address})`
      );
      return tokenInfo;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn(
            `Token not found on GeckoTerminal: ${network}/${tokenAddress}`
          );
          throw new Error(`Token not found: ${tokenAddress}`);
        }

        logger.error(
          `GeckoTerminal API error: ${error.response?.status} - ${error.response?.statusText}`
        );
        throw new Error(`GeckoTerminal API error: ${error.response?.status}`);
      }

      logger.error(`Error fetching token info from GeckoTerminal: ${error}`);
      throw new Error('Failed to fetch token information');
    }
  }

  /**
   * Get multiple tokens information
   * @param tokens - Array of {network, address} objects
   * @returns Promise<TokenInfo[]>
   */
  async getMultipleTokensInfo(
    tokens: Array<{ network: string; address: string }>
  ): Promise<TokenInfo[]> {
    const promises = tokens.map(({ network, address }) =>
      this.getTokenInfo(network, address).catch(error => {
        logger.warn(
          `Failed to fetch token ${network}/${address}: ${error.message}`
        );
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((result): result is TokenInfo => result !== null);
  }

  /**
   * Get token price in USD
   * @param network - Network identifier
   * @param tokenAddress - Token contract address
   * @returns Promise<number>
   */
  async getTokenPrice(network: string, tokenAddress: string): Promise<number> {
    try {
      const tokenInfo = await this.getTokenInfo(network, tokenAddress);
      return tokenInfo.priceUsd;
    } catch (error) {
      logger.error(`Error fetching token price: ${error}`);
      throw error;
    }
  }

  /**
   * Get token market data (price, volume, market cap)
   * @param network - Network identifier
   * @param tokenAddress - Token contract address
   * @returns Promise<{price: number, volume24h: number, marketCap: number | null}>
   */
  async getTokenMarketData(
    network: string,
    tokenAddress: string
  ): Promise<{
    price: number;
    volume24h: number;
    marketCap: number | null;
    fdv: number;
  }> {
    try {
      const tokenInfo = await this.getTokenInfo(network, tokenAddress);
      return {
        price: tokenInfo.priceUsd,
        volume24h: tokenInfo.volume24h,
        marketCap: tokenInfo.marketCapUsd,
        fdv: tokenInfo.fdvUsd,
      };
    } catch (error) {
      logger.error(`Error fetching token market data: ${error}`);
      throw error;
    }
  }

  /**
   * Check if token exists on GeckoTerminal
   * @param network - Network identifier
   * @param tokenAddress - Token contract address
   * @returns Promise<boolean>
   */
  async tokenExists(network: string, tokenAddress: string): Promise<boolean> {
    try {
      await this.getTokenInfo(network, tokenAddress);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Token not found')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get token basic info (name, symbol, decimals)
   * @param network - Network identifier
   * @param tokenAddress - Token contract address
   * @returns Promise<{name: string, symbol: string, decimals: number}>
   */
  async getTokenBasicInfo(
    network: string,
    tokenAddress: string
  ): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    imageUrl: string | null;
  }> {
    try {
      const tokenInfo = await this.getTokenInfo(network, tokenAddress);
      return {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        imageUrl: tokenInfo.imageUrl,
      };
    } catch (error) {
      logger.error(`Error fetching token basic info: ${error}`);
      throw error;
    }
  }

  /**
   * Validate token address format
   * @param address - Token address to validate
   * @returns boolean
   */
  isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate network identifier
   * @param network - Network identifier to validate
   * @returns boolean
   */
  isValidNetwork(network: string): boolean {
    const validNetworks = [
      'eth',
      'bsc',
      'polygon',
      'arbitrum',
      'optimism',
      'avalanche',
      'solana',
    ];
    return validNetworks.includes(network.toLowerCase());
  }

  /**
   * Get trending pools
   * @returns Promise<any>
   */
  async getTrendingPools(network: string): Promise<GeckoTerminalTrendingPool[]> {
    try {
      const url = `${this.BASE_URL}/networks/${network}/trending_pools`;
      const response = await axios.get(url);
      const { data }: { data: GeckoTerminalTrendingPool[] } = response.data;
      return data;
    } catch (error) {
      logger.error(`Error fetching trending pools: ${error}`);
      return [];
    }
  }
}

export const geckoTerminalService = new GeckoTerminalService();
