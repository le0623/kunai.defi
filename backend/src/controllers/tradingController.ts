import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

export class TradingController {
  /**
   * Get trading bots for authenticated user
   */
  static async getTradingBots(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const bots = await prisma.tradingBot.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        bots,
      });
    } catch (error) {
      logger.error('Error getting trading bots:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to get trading bots' });
    }
  }

  /**
   * Create new trading bot
   */
  static async createTradingBot(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { name, config } = req.body;

      if (!name || !config) {
        res
          .status(400)
          .json({ success: false, message: 'Name and config are required' });
        return;
      }

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const bot = await prisma.tradingBot.create({
        data: {
          name,
          config,
          userId: user.id,
        },
      });

      res.json({
        success: true,
        message: 'Trading bot created successfully',
        bot,
      });
    } catch (error) {
      logger.error('Error creating trading bot:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to create trading bot' });
    }
  }

  /**
   * Update trading bot
   */
  static async updateTradingBot(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, config, isActive } = req.body;

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const bot = await prisma.tradingBot.updateMany({
        where: {
          id,
          userId: user.id,
        },
        data: {
          name,
          config,
          isActive,
          updatedAt: new Date(),
        },
      });

      if (bot.count === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Trading bot not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Trading bot updated successfully',
      });
    } catch (error) {
      logger.error('Error updating trading bot:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to update trading bot' });
    }
  }

  /**
   * Delete trading bot
   */
  static async deleteTradingBot(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const bot = await prisma.tradingBot.deleteMany({
        where: {
          id,
          userId: user.id,
        },
      });

      if (bot.count === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Trading bot not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Trading bot deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting trading bot:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to delete trading bot' });
    }
  }

  /**
   * Get copy trading settings
   */
  static async getCopyTrades(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const copyTrades = await prisma.copyTrade.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        copyTrades,
      });
    } catch (error) {
      logger.error('Error getting copy trades:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to get copy trades' });
    }
  }

  /**
   * Set up copy trading
   */
  static async setupCopyTrading(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { targetAddress, allocation, maxSlippage } = req.body;

      if (!targetAddress || !allocation) {
        res.status(400).json({
          success: false,
          message: 'Target address and allocation are required',
        });
        return;
      }

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const copyTrade = await prisma.copyTrade.create({
        data: {
          targetAddress: targetAddress.toLowerCase(),
          allocation: parseFloat(allocation),
          maxSlippage: maxSlippage || 2.0,
          userId: user.id,
        },
      });

      res.json({
        success: true,
        message: 'Copy trading set up successfully',
        copyTrade,
      });
    } catch (error) {
      logger.error('Error setting up copy trading:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to set up copy trading' });
    }
  }

  /**
   * Update copy trading settings
   */
  static async updateCopyTrading(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { allocation, maxSlippage, isActive } = req.body;

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const copyTrade = await prisma.copyTrade.updateMany({
        where: {
          id,
          userId: user.id,
        },
        data: {
          allocation: allocation ? parseFloat(allocation) : undefined,
          maxSlippage: maxSlippage ? parseFloat(maxSlippage) : undefined,
          isActive,
          updatedAt: new Date(),
        },
      });

      if (copyTrade.count === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Copy trading setting not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Copy trading updated successfully',
      });
    } catch (error) {
      logger.error('Error updating copy trading:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to update copy trading' });
    }
  }

  /**
   * Delete copy trading setting
   */
  static async deleteCopyTrading(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const copyTrade = await prisma.copyTrade.deleteMany({
        where: {
          id,
          userId: user.id,
        },
      });

      if (copyTrade.count === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Copy trading setting not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Copy trading deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting copy trading:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to delete copy trading' });
    }
  }
}
