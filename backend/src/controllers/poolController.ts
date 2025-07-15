import { Request, Response } from 'express';
import { PoolService } from '@/services/poolService';
import { logger } from '@/utils/logger';
import axios from 'axios';

export class PoolController {
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
        sortOrder = 'desc'
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string),
        page: parseInt(page as string),
        chain: chain as string,
        exchange: exchange as string,
        sortBy: sortBy as 'market_cap' | 'volume' | 'holder_count' | 'open_timestamp',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await PoolService.getNewPairsByRank(params);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getNewPairsByRank:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch new pairs'
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
        dexscreener_spent
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string)
      };

      // Parse filter parameters
      const newPoolFilters = new_pool ? JSON.parse(new_pool as string) : { filters: [] };
      const burntFilters = burnt ? JSON.parse(burnt as string) : { filters: [] };
      const dexscreenerSpentFilters = dexscreener_spent ? JSON.parse(dexscreener_spent as string) : { filters: [] };

      // Get pools for each type
      const [newPools, burntPools, dexscreenerSpentPools] = await Promise.all([
        PoolService.getPoolsByType('new', params),
        PoolService.getPoolsByType('burnt', params),
        PoolService.getPoolsByType('dexscreener', params)
      ]);

      res.json({
        success: true,
        data: {
          newPools: newPools.pools,
          burntPools: burntPools.pools,
          dexscreenerSpentPools: dexscreenerSpentPools.pools,
          timeframe,
          limit
        }
      });
    } catch (error) {
      logger.error('Error in getAllPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pools'
      });
    }
  }

  /**
   * Get new pools
   */
  static async getNewPools(req: Request, res: Response) {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        filters
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string)
      };

      const response = await axios.get('https://gmgn.ai/defi/quotation/v1/pairs/eth/new_pairs/1m?limit=100&orderby=open_timestamp&direction=desc&period=1m');
      // const result = await PoolService.getPoolsByType('new', params);
      
      res.json(response.data);
    } catch (error) {
      // logger.error('Error in getNewPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch new pools'
      });
    }
  }

  /**
   * Get burnt/locked pools
   */
  static async getBurntPools(req: Request, res: Response) {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        filters
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string)
      };

      const result = await PoolService.getPoolsByType('burnt', params);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getBurntPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch burnt pools'
      });
    }
  }

  /**
   * Get dexscreener spent pools
   */
  static async getDexscreenerSpentPools(req: Request, res: Response) {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        filters
      } = req.query;

      const params = {
        timeframe: timeframe as '1m' | '5m' | '1h' | '6h' | '24h',
        limit: parseInt(limit as string)
      };

      const result = await PoolService.getPoolsByType('dexscreener', params);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getDexscreenerSpentPools:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dexscreener spent pools'
      });
    }
  }
} 