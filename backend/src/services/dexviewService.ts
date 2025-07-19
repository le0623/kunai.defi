import axios from 'axios';
import { logger } from '../utils/logger';
import {
  DexViewResponse,
  DexViewPair,
  DexViewServiceConfig,
} from '../types/dexview';
import { Address } from 'viem';

export class DexViewService {
  private baseUrl: string = 'https://openapi.dexview.com/latest';
  private timeout: number = 10000; // 10 second timeout

  constructor(config: DexViewServiceConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://openapi.dexview.com/latest';
    this.timeout = config.timeout || 10000; // 10 second timeout
  }

  /**
   * Get pair information by chain and pair address
   */
  async getPairs(
    chainId: string,
    pairAddresses: Address[]
  ): Promise<DexViewPair[]> {
    try {
      const response = await axios.get<DexViewResponse>(
        `${this.baseUrl}/dex/pairs/${chainId}/${pairAddresses.join(',')}`,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      return response.data.pairs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn(`DexView API: Pairs not found - on chain ${chainId}`);
        } else if (error.response?.status === 429) {
          logger.error('DexView API: Rate limit exceeded');
        } else {
          logger.error(`DexView API error: ${error.message}`, {
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      } else {
        logger.error('DexView API: Unexpected error', error);
      }
      return [];
    }
  }
}
