import axios from 'axios';
import { logger } from '../utils/logger';
import {
  MoralisTokenMetadata,
  TokenMetadataInfo,
  MoralisServiceConfig,
} from '../types/moralis';
import { Address } from '@/types';

export class MoralisService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: MoralisServiceConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://deep-index.moralis.io/api/v2.2';
    this.apiKey = config.apiKey || process.env['MORALIS_API_KEY'] || '';
    this.timeout = config.timeout || 10000; // 10 second timeout

    if (!this.apiKey) {
      logger.warn(
        'Moralis API key not found. Token metadata features will be limited.'
      );
    }
  }

  /**
   * Get token metadata for multiple tokens
   */
  async getTokensMetadata(
    chain: string,
    addresses: Address[]
  ): Promise<TokenMetadataInfo[]> {
    try {
      if (!this.apiKey) {
        logger.warn('Moralis API key not configured');
        return [];
      }

      if (addresses.length === 0) {
        return [];
      }

      const response = await axios.get<MoralisTokenMetadata[]>(
        `${this.baseUrl}/erc20/metadata`,
        {
          params: {
            chain,
            addresses,
          },
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: this.timeout + 5000, // Extra timeout for multiple tokens
        }
      );

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map(metadata => this.transformMetadata(metadata));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logger.error('Moralis API: Unauthorized - Check API key');
        } else if (error.response?.status === 403) {
          logger.error('Moralis API: Forbidden - Check API permissions');
        } else if (error.response?.status === 429) {
          logger.error('Moralis API: Rate limit exceeded');
        } else {
          logger.error(
            `Moralis API error for multiple tokens: ${error.message}`,
            {
              status: error.response?.status,
              data: error.response?.data,
            }
          );
        }
      } else {
        logger.error('Moralis API: Unexpected error', error);
      }
      return [];
    }
  }

  /**
   * Transform Moralis API response to internal format
   */
  private transformMetadata(metadata: MoralisTokenMetadata): TokenMetadataInfo {
    return {
      address: metadata.address,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: parseInt(metadata.decimals, 10),
      ...(metadata.logo && { logo: metadata.logo }),
      ...(metadata.thumbnail && { thumbnail: metadata.thumbnail }),
      totalSupply: metadata.total_supply,
      totalSupplyFormatted: metadata.total_supply_formatted,
      ...(metadata.fully_diluted_valuation && {
        fullyDilutedValuation: metadata.fully_diluted_valuation,
      }),
      blockNumber: metadata.block_number,
      isValidated: metadata.validated === 'true',
      ...(metadata.possible_spam && {
        isPossibleSpam: metadata.possible_spam === 'true',
      }),
      ...(metadata.verified_contract && {
        isVerifiedContract: metadata.verified_contract === 'true',
      }),
      ...(metadata.categories && { categories: metadata.categories }),
      ...(metadata.links && { links: metadata.links }),
      ...(metadata.address_label && { addressLabel: metadata.address_label }),
    };
  }
}
