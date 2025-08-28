import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { TraderService } from '@/services/traderService';
import { TraderRankingFilters } from '@/types/trader';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export class TraderController {
  /**
   * Get traders ranked by various metrics
   */
  static async getTradersByRank(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const {
        category,
        minBalance,
        maxBalance,
        minWinRate,
        maxWinRate,
        minTransactions,
        maxTransactions,
        sortBy,
        sortOrder,
        limit,
        offset
      } = req.query;

      const filters: TraderRankingFilters = {
        ...(category && { category: category as any }),
        ...(minBalance && { minBalance: minBalance as string }),
        ...(maxBalance && { maxBalance: maxBalance as string }),
        ...(minWinRate && { minWinRate: parseFloat(minWinRate as string) }),
        ...(maxWinRate && { maxWinRate: parseFloat(maxWinRate as string) }),
        ...(minTransactions && { minTransactions: parseInt(minTransactions as string) }),
        ...(maxTransactions && { maxTransactions: parseInt(maxTransactions as string) }),
        ...(sortBy && { sortBy: sortBy as any }),
        ...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' }),
        ...(limit && { limit: parseInt(limit as string) }),
        ...(offset && { offset: parseInt(offset as string) })
      };

      const traders = await TraderService.getTradersByRank(filters);

      res.json({
        success: true,
        data: traders,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          total: traders.length
        }
      });
    } catch (error) {
      logger.error('Error getting traders by rank:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get traders by rank'
      });
    }
  }

  /**
   * Get trader statistics
   */
  static async getTraderStats(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const stats = await TraderService.getTraderStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting trader stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trader stats'
      });
    }
  }

  /**
   * Track a trader (create copy trade setting)
   */
  static async trackTrader(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { targetAddress, settings } = req.body;

      if (!targetAddress) {
        res.status(400).json({
          success: false,
          message: 'Target address is required'
        });
        return;
      }

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      await TraderService.trackTrader(user.id, targetAddress, settings || {});

      res.json({
        success: true,
        message: 'Trader tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking trader:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track trader'
      });
    }
  }

  /**
   * Untrack a trader (delete copy trade setting)
   */
  static async untrackTrader(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { copyTradeId } = req.body;

      if (!copyTradeId) {
        res.status(400).json({
          success: false,
          message: 'Copy trade ID is required'
        });
        return;
      }

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      await TraderService.untrackTrader(user.id, copyTradeId);

      res.json({
        success: true,
        message: 'Trader untracked successfully'
      });
    } catch (error) {
      logger.error('Error untracking trader:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to untrack trader'
      });
    }
  }

  /**
   * Get user's copy trade settings
   */
  static async getUserCopyTrades(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const copyTrades = await TraderService.getUserCopyTrades(user.id);

      res.json({
        success: true,
        data: copyTrades
      });
    } catch (error) {
      logger.error('Error getting user copy trades:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user copy trades'
      });
    }
  }

  /**
   * Get trader details by address
   */
  static async getTraderDetails(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          message: 'Address is required'
        });
        return;
      }

      const user = await (prisma as any).user.findFirst({
        where: {
          inAppWallet: {
            address: address
          }
        },
        include: {
          inAppWallet: true,
          trades: {
            orderBy: { timestamp: 'desc' },
            take: 50 // Last 50 trades
          }
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Trader not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error getting trader details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trader details'
      });
    }
  }

  /**
   * Add trade record
   */
  static async addTrade(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const tradeData = req.body;

      await TraderService.addTrade(tradeData);

      res.json({
        success: true,
        message: 'Trade added successfully'
      });
    } catch (error) {
      logger.error('Error adding trade:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add trade'
      });
    }
  }

  /**
   * Update trade profit
   */
  static async updateTradeProfit(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { tradeId } = req.params;
      const { profit, duration } = req.body;

      if (!tradeId) {
        res.status(400).json({
          success: false,
          message: 'Trade ID is required'
        });
        return;
      }

      await TraderService.updateTradeProfit(tradeId, profit, duration);

      res.json({
        success: true,
        message: 'Trade profit updated successfully'
      });
    } catch (error) {
      logger.error('Error updating trade profit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update trade profit'
      });
    }
  }

  /**
   * Create a new copy trade
   */
  static async createCopyTrade(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const copyTradeData = req.body;
      const userId = req.user!.id;

      const copyTrade = await TraderService.createCopyTrade(userId, copyTradeData);

      res.json({
        success: true,
        message: 'Copy trade created successfully',
        data: copyTrade
      });
    } catch (error) {
      logger.error('Error creating copy trade:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create copy trade'
      });
    }
  }

  /**
   * Update a copy trade
   */
  static async updateCopyTrade(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user!.id;

      const copyTrade = await TraderService.updateCopyTrade(id, userId, updateData);

      res.json({
        success: true,
        message: 'Copy trade updated successfully',
        data: copyTrade
      });
    } catch (error) {
      logger.error('Error updating copy trade:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update copy trade'
      });
    }
  }

  /**
   * Delete a copy trade
   */
  static async deleteCopyTrade(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await TraderService.deleteCopyTrade(id, userId);

      res.json({
        success: true,
        message: 'Copy trade deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting copy trade:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete copy trade'
      });
    }
  }
} 