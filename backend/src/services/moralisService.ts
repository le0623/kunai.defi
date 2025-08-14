import axios from 'axios';
import { logger } from '../utils/logger';
import { type MoralisTokenMetadata, type TokenMetadataInfo, type MoralisTokenDetail, type MoralisTokenAnalytics } from '@kunai/shared';
import Moralis from 'moralis';

const axiosMoralis = axios.create({
  baseURL: 'https://deep-index.moralis.io/api/v2.2',
  headers: {
    accept: 'application/json',
    'X-API-Key': process.env['MORALIS_API_KEY'] || '',
  },
});

export class MoralisService {
  /**
   * Get token metadata for multiple tokens
   */
  async getTokensMetadata(
    chain: string,
    addresses: string[]
  ): Promise<MoralisTokenMetadata[]> {
    try {
      if (addresses.length === 0) {
        return [];
      }

      const response = await axiosMoralis.get<MoralisTokenMetadata[]>(
        `/erc20/metadata`,
        {
          params: {
            chain,
            addresses,
          },
        }
      );

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data;
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
   * Get token detail
   */
  async getTokenDetail(
    chain: string,
    address: string
  ): Promise<MoralisTokenDetail> {
    console.log('getTokenDetail', chain, address);
    const response = await axiosMoralis.get<MoralisTokenDetail>(
      `/discovery/token?chain=${chain}&token_address=${address}`
    );

    return response.data;
  }

  /**
   * Get token analytics
   */
  async getTokenAnalytics(
    chain: string,
    address: string
  ): Promise<MoralisTokenAnalytics> {
    const response = await axiosMoralis.get<MoralisTokenAnalytics>(
      `/tokens/${address}/analytics?chain=${chain}`,
    );

    return response.data;
  }

  /**
   * Get specific token pool
   */
  async getSpecificTokenPool(
    params: Parameters<typeof Moralis.EvmApi.defi.getPairAddress>[0]
  ): ReturnType<typeof Moralis.EvmApi.defi.getPairAddress> {
    return await Moralis.EvmApi.defi.getPairAddress(params);
  }

  /**
   * Get swaps by token address
   */
  async getSwapsByTokenAddress(
    params: {
      chain: string;
      address: string;
    }
  ): Promise<any> {
    const response = await axiosMoralis.get(`/erc20/${params.address}/swaps?chain=${params.chain}&order=DESC`)
    return response.data;
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
