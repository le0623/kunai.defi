import axios from 'axios';
import { logger } from '@/utils/logger';
import type { GeckoTerminalPool, GeckoTerminalToken } from '@kunai/shared';

class GeckoTerminalService {
  private readonly BASE_URL = 'https://api.geckoterminal.com/api/v2';
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  /**
   * Get token information from GeckoTerminal API
   * @param network - Network identifier (e.g., 'eth', 'bsc', 'polygon')
   * @param tokenAddress - Token contract address
   * @returns Promise<GeckoTerminalToken>
   * @throws Error if the request fails
   */
  async getTokenInfo(
    network: string,
    tokenAddress: string
  ): Promise<GeckoTerminalToken> {
    try {
      const url = `${this.BASE_URL}/networks/${network}/tokens/${tokenAddress}`;

      const response = await axios.get<{
        data: GeckoTerminalToken
      }>(url, {
        timeout: this.DEFAULT_TIMEOUT,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'KunAI-DeFi-Platform/1.0',
        },
      });

      const { data } = response.data;

      return data;
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
   * @param network - Network identifier
   * @param addresses - Array of token addresses
   * @returns Promise<GeckoTerminalToken[]>
   * @throws Error if the request fails
   */
  async getMultipleTokensInfo(
    network: string,
    addresses: string[]
  ): Promise<GeckoTerminalToken[]> {
    const url = `${this.BASE_URL}/networks/${network}/tokens/multi/${addresses.join(',')}`;
    const response = await axios.get<{
      data: GeckoTerminalToken[]
    }>(url, {
      timeout: this.DEFAULT_TIMEOUT,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KunAI-DeFi-Platform/1.0',
      },
    });

    const { data } = response.data;
    return data;
  }

  /**
   * Get new pools on specific network
   * @param network - Network identifier
   * @returns Promise<GeckoTerminalPool[]>
   * @throws Error if the request fails
   */
  async getNewPools(network: string): Promise<GeckoTerminalPool[]> {
    try {
      const url = `${this.BASE_URL}/networks/${network}/new_pools`;
      const response = await axios.get(url);
      const { data }: { data: GeckoTerminalPool[] } = response.data;
      return data;
    } catch (error) {
      logger.error(`Geckoterminal API error: Error fetching new pools: ${error}`);
      return [];
    }
  }

  /**
   * Get trending pools on specific network
   * @param network - Network identifier
   * @returns Promise<GeckoTerminalPool[]>
   * @throws Error if the request fails
   */
  async getTrendingPools(network: string): Promise<GeckoTerminalPool[]> {
    try {
      const url = `${this.BASE_URL}/networks/${network}/trending_pools`;
      const response = await axios.get(url);
      const { data }: { data: GeckoTerminalPool[] } = response.data;
      return data;
    } catch (error) {
      logger.error(`Geckoterminal API error: Error fetching trending pools: ${error}`);
      return [];
    }
  }
}

export const geckoTerminalService = new GeckoTerminalService();
