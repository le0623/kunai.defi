import { Request, Response } from 'express';
import { PoolService } from '@/services/poolService';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { dexViewService, moralisService } from '@/services';
import { Address } from '@/types';
import type { PoolRequest } from '@kunai/shared';

export class PoolController {
  /**
   * Get pools from database with enriched data from external APIs
   */
  static async getPools(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 30,
        chain = 1, // eth
        tokenAddress,
      } = req.query as PoolRequest;

      // Build where clause for database query
      const where: any = {};

      if (chain) where.chainId = parseInt(chain as string);
      if (tokenAddress)
        where.OR = [
          {
            token0Address: {
              contains: tokenAddress as string,
              mode: 'insensitive',
            },
          },
          {
            token1Address: {
              contains: tokenAddress as string,
              mode: 'insensitive',
            },
          },
        ];

      const skip = (page - 1) * limit;

      // Get pools from database
      const [pools, total] = await Promise.all([
        prisma.pool.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            chain: true,
            dex: true,
          },
        }),
        prisma.pool.count({ where }),
      ]);

      // Get enriched data from external APIs
      const dexViewPairs = await dexViewService.getPairs(
        'eth',
        pools.map((pool: any) => pool.address as Address)
      );
      const moralisPairs = await moralisService.getTokensMetadata(
        'eth',
        pools.map((pool: any) => pool.token0Address as Address)
      );

      // Create a map for quick lookup
      const dexViewMap = new Map(
        dexViewPairs.map((pair: any) => [pair.pairAddress.toLowerCase(), pair])
      );
      const moralisMap = new Map(
        moralisPairs.map((token: any) => [token.address.toLowerCase(), token])
      );

      // Transform pools with enriched data
      const transformedPools = pools.map((pool: any) => {
        const dexViewData = dexViewMap.get(pool.address.toLowerCase());
        const moralisData = moralisMap.get(pool.token0Address.toLowerCase());

        return {
          id: pool.id,
          address: pool.address,
          chain: pool.chain.name,
          chainId: pool.chain.chainId,
          exchange: pool.dex.name,
          dexVersion: pool.dex.version,

          // Token information
          token0: {
            address: pool.token0Address,
            symbol: pool.token0Symbol,
            name: pool.token0Name,
            decimals: pool.token0Decimals,
            // Enriched from Moralis
            logo: moralisData?.logo,
            thumbnail: moralisData?.thumbnail,
            totalSupply: moralisData?.totalSupply,
            totalSupplyFormatted: moralisData?.totalSupplyFormatted,
            isVerified: moralisData?.isVerifiedContract || false,
            isPossibleSpam: moralisData?.isPossibleSpam || false,
            categories: moralisData?.categories || [],
            links: moralisData?.links || {},
          },
          token1: {
            address: pool.token1Address,
            symbol: pool.token1Symbol,
            name: pool.token1Name,
            decimals: pool.token1Decimals,
          },

          // Enriched metrics from DexView
          dexViewData: dexViewData
            ? {
                priceNative: dexViewData.priceNative,
                priceUsd: dexViewData.priceUsd,
                fdv: dexViewData.fdv,
                pairCreatedAt: dexViewData.pairCreatedAt,
                labels: dexViewData.labels,
                url: dexViewData.url,

                // Transaction data
                transactions: dexViewData.txns,

                // Volume data
                volume: dexViewData.volume,

                // Price change data
                priceChange: dexViewData.priceChange,

                // Liquidity data
                liquidity: dexViewData.liquidity,
              }
            : null,

          // Timestamps
          createdAt: pool.createdAt,
          updatedAt: pool.updatedAt,
          lastTradedAt: pool.lastTradedAt,

          // Age calculation
          age: Math.floor((Date.now() - pool.createdAt.getTime()) / 1000),
        };
      });

      res.json({
        success: true,
        data: {
          pools: transformedPools,
          total,
          page,
          limit,
          hasMore: skip + limit < total,
          timestamp: new Date().toISOString(),
        },
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
