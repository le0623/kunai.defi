import axios from 'axios';
import { logger } from '../utils/logger';
import { TokenSecurityInfo } from '@kunai/shared';

interface GoPlusTokenSecurityResponse {
  code: number;
  message: string;
  result: Record<string, TokenSecurityInfo>;
}

class GoPlusService {
  private baseUrl = 'https://api.gopluslabs.io/api/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env['GOPLUS_API_KEY'] || '';
    if (!this.apiKey) {
      logger.warn(
        'GoPlus API key not found. Token security features will be limited.'
      );
    }
  }

  /**
   * Get token security information from GoPlus Labs
   */
  async getTokenSecurity(
    chainId: string,
    tokenAddress: string
  ): Promise<TokenSecurityInfo | null> {
    try {
      // if (!this.apiKey) {
      //   logger.warn('GoPlus API key not configured');
      //   return null;
      // }

      const response = await axios.get<GoPlusTokenSecurityResponse>(
        `${this.baseUrl}/token_security/${chainId}`,
        {
          params: {
            contract_addresses: tokenAddress,
          },
          headers: {
            // 'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.code !== 1) {
        logger.error(`GoPlus API error: ${response.data.message}`);
        return null;
      }

      if (!response.data.result || Object.keys(response.data.result).length === 0) {
        logger.warn(
          `No security data found for token ${tokenAddress} on chain ${chainId}`
        );
        return null;
      }

      const result = response.data.result[tokenAddress];
      if (!result) {
        logger.warn(
          `No result data for token ${tokenAddress} on chain ${chainId}`
        );
        return null;
      }

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logger.error('GoPlus API: Unauthorized - Check API key');
        } else if (error.response?.status === 403) {
          logger.error('GoPlus API: Forbidden - Check API permissions');
        } else if (error.response?.status === 404) {
          logger.warn(
            `GoPlus API: Token not found - ${tokenAddress} on chain ${chainId}`
          );
        } else {
          logger.error(`GoPlus API error: ${error.message}`, {
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      } else {
        logger.error('GoPlus API: Unexpected error', error);
      }
      return null;
    }
  }
}

export const goplusService = new GoPlusService();
