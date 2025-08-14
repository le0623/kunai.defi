import { Request, Response } from 'express';
import { PoolService } from '@/services/poolService';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { dexViewService, moralisService } from '@/services';
import { geckoTerminalService } from '@/services/geckoterminalService';
import { Address } from '@/types';
import type { GeckoTerminalPool, GeckoTerminalToken, MoralisTokenMetadata, DexViewPair } from '@kunai/shared';

export class PoolController {
  /**
   * Get pools from database with enriched data from external APIs
   */
  static async getPools(req: Request, res: Response) {
    try {
      const {
        chain = 'eth',
      } = req.query;

      const pools = await geckoTerminalService.getNewPools(chain as string);
      const tokenAddresses = pools.map((pool: GeckoTerminalPool) => pool.relationships.base_token.data.id.split('_')[1] as Address);
      const gtTokens = await geckoTerminalService.getMultipleTokensInfo(chain as string, tokenAddresses);
      const moralisTokens = await moralisService.getTokensMetadata(chain as string, tokenAddresses);
      const dexviewPairs = await dexViewService.getPairs(chain as string, tokenAddresses);
      const aggregatedPools = pools.map((pool: GeckoTerminalPool) => ({
        ...pool,
        dexviewPair: dexviewPairs.find((dexviewPair: DexViewPair) => dexviewPair.pairAddress === pool.attributes.address),
        gtToken: gtTokens.find((token: GeckoTerminalToken) => token.attributes.address === pool.relationships.base_token.data.id.split('_')[1]),
        moralisToken: moralisTokens.find((token: MoralisTokenMetadata) => token.address === pool.relationships.base_token.data.id.split('_')[1]),
      }));

      res.json({
        success: true,
        data: aggregatedPools,
      });
    } catch (error) {
      logger.error('Error getting pools from database:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pools',
      });
    }
  }

  /**
   * Get pool by token address
   */
  static async getPoolByTokenAddress(req: Request, res: Response) {
    try {
      const { tokenAddress } = req.params;
      const pool = await prisma.pool.findFirst({
        where: {
          token0Address: tokenAddress as string,
        },
      });

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      logger.error('Error getting pool by token address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pool',
      });
    }
  }

  /**
   * Get specific token pool 
   */
  static async getSpecificTokenPool(req: Request, res: Response) {
    const { token0Address, token1Address, exchange } = req.query;
    const pool = await moralisService.getSpecificTokenPool({
      chain: 'eth',
      token0Address: token0Address as string,
      token1Address: token1Address as string,
      exchange: exchange as 'uniswapv2' | 'uniswapv3' | 'sushiswapv2' | 'pancakeswapv2' | 'pancakeswapv1' | 'quickswap',
    });

    res.json({
      success: true,
      data: pool.raw,
    });
  }

  /**
   * Get trending pools
   */
  static async getTrendingPools(req: Request, res: Response) {
    try {
      const { chain } = req.query;

      const trendingPools = await geckoTerminalService.getTrendingPools(chain as string);
      const tokenAddresses = trendingPools.map((pool: GeckoTerminalPool) => pool.relationships.base_token.data.id.split('_')[1] as Address);
      const gtTokens = await geckoTerminalService.getMultipleTokensInfo(chain as string, tokenAddresses);
      const moralisTokens = await moralisService.getTokensMetadata(chain as string, tokenAddresses);
      const dexviewPairs = await dexViewService.getPairs(chain as string, tokenAddresses);
      const enrichedPools = trendingPools.map((pool: GeckoTerminalPool) => ({
        ...pool,
        gtToken: gtTokens.find((token: GeckoTerminalToken) => token.attributes.address === pool.relationships.base_token.data.id.split('_')[1]),
        moralisToken: moralisTokens.find((token: MoralisTokenMetadata) => token.address === pool.relationships.base_token.data.id.split('_')[1]),
        dexviewPair: dexviewPairs.find((dexviewPair: DexViewPair) => dexviewPair.pairAddress === pool.attributes.address),
      }));
      res.json({
        success: true,
        data: enrichedPools,
      });
    } catch (error) {
      logger.error('Error getting trending pools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending pools',
      });
    }
  }

  /**
   * Get available filters and their options
   */
  static async getAvailableFilters(req: Request, res: Response) {
    try {
      const availableFilters = {
        timeframes: ['1m', '5m', '1h', '6h', '24h'],
        poolTypes: ['new', 'burnt', 'all'],
      };

      res.json({
        success: true,
        data: availableFilters,
      });
    } catch (error) {
      logger.error('Error getting available filters:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available filters',
      });
    }
  }

  /**
   * Get new pairs by rank
   */
  static async getNewPairsByRank(req: Request, res: Response) {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        page = 1,
        chain,
        exchange,
        sortBy = 'market_cap',
        sortOrder = 'desc',
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
        page: parseInt(page as string),
        chain: chain as string,
        exchange: exchange as string,
        sortBy: sortBy as
          | 'market_cap'
          | 'volume'
          | 'holder_count'
          | 'open_timestamp',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await PoolService.getNewPairsByRank(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in getNewPairsByRank:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch new pairs',
      });
    }
  }

  /**
   * Get all pools (unified endpoint)
   */
  static async getAllPools(req: Request, res: Response) {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        new_pool,
        burnt,
        dexscreener_spent,
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
      };

      // Parse filter parameters
      const newPoolFilters = new_pool
        ? JSON.parse(new_pool as string)
        : { filters: [] };
      const burntFilters = burnt
        ? JSON.parse(burnt as string)
        : { filters: [] };
      const dexscreenerSpentFilters = dexscreener_spent
        ? JSON.parse(dexscreener_spent as string)
        : { filters: [] };

      // Get pools for each type
      const [newPools, burntPools, dexscreenerSpentPools] = await Promise.all([
        PoolService.getPoolsByType('new', params),
        PoolService.getPoolsByType('burnt', params),
        PoolService.getPoolsByType('dexscreener', params),
      ]);

      res.json({
        success: true,
        data: {
          newPools: newPools.pools,
          burntPools: burntPools.pools,
          dexscreenerSpentPools: dexscreenerSpentPools.pools,
          timeframe,
          limit,
        },
      });
    } catch (error) {
      logger.error('Error in getAllPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pools',
      });
    }
  }

  /**
   * Get new pools
   */
  static async getNewPools(req: Request, res: Response) {
    try {
      const { timeframe = '1h', limit = 50, filters } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
      };

      const result = await PoolService.getPoolsByType('new', params);

      res.json(result);
    } catch (error) {
      // logger.error('Error in getNewPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch new pools',
      });
    }
  }

  /**
   * Get burnt/locked pools
   */
  static async getBurntPools(req: Request, res: Response) {
    try {
      const { timeframe = '1h', limit = 50, filters } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
      };

      const result = await PoolService.getPoolsByType('burnt', params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in getBurntPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch burnt pools',
      });
    }
  }

  /**
   * Get dexscreener spent pools
   */
  static async getDexscreenerSpentPools(req: Request, res: Response) {
    try {
      const { timeframe = '1h', limit = 50, filters } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
      };

      const result = await PoolService.getPoolsByType('dexscreener', params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in getDexscreenerSpentPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dexscreener spent pools',
      });
    }
  }
}
