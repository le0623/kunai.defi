import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { TelegramBotService } from '@/services/telegramBotService';
import { Address } from 'viem';
import { SniperBotService } from '@/services/sniperBotService';

export class TgWebAppController {
  /**
   * Get user data for WebApp
   */
  static async getUserData(req: Request, res: Response) {
    const telegramUser = req.telegramUser;
    const telegramId = telegramUser?.id.toString()!;

    try {
      let user = await prisma.telegramUser.findUnique({
        where: { id: telegramId },
        include: {
          proxyWallet: {
            include: {
              approvals: true,
              trades: {
                orderBy: { createdAt: 'desc' },
                take: 50,
              },
            },
          },
          sniperConfigs: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (!user) {
        user = await prisma.telegramUser.create({
          data: {
            id: telegramUser?.id.toString() || '',
            username: telegramUser?.username || null,
            firstName: telegramUser?.first_name || null,
            lastName: telegramUser?.last_name || null,
            lastActive: new Date(),
          },
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error getting user data for WebApp:', error);

      await TelegramBotService.sendWebAppErrorNotification(
        telegramId,
        'Failed to load user data',
        'Loading user profile'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to fetch user data',
      });
    }
  }

  /**
   * Deploy proxy wallet
   */
  static async deployProxyWallet(req: Request, res: Response) {
    const telegramId = req.telegramUser?.id.toString()!;
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json({ error: 'Wallet address is required' });
        return;
      }

      // Check if proxy wallet already exists
      const existingWallet = await prisma.proxyWallet.findFirst({
        where: { telegramUserId: telegramId },
      });

      if (existingWallet) {
        res.status(400).json({
          success: false,
          error: 'Proxy wallet already exists',
        });
        return;
      }

      await prisma.telegramUser.update({
        where: { id: telegramId },
        data: {
          walletAddress: walletAddress,
        },
      });

      // Create proxy wallet
      const proxyConfig = {
        maxTradeAmount: '0.1',
        maxSlippage: 500, // 5%
        dailyTradeLimit: '1.0',
        gasLimit: 2000000,
        gasPrice: '20',
      };

      logger.info(
        `Creating proxy wallet for user ${telegramId} with address ${walletAddress}`
      );

      const proxyAddress = await SniperBotService.createProxyWallet(
        walletAddress as Address,
        telegramId,
        proxyConfig
      );

      // Save to database
      const proxyWallet = await prisma.proxyWallet.create({
        data: {
          userAddress: walletAddress.toLowerCase(),
          proxyAddress: proxyAddress.toLowerCase(),
          maxTradeAmount: proxyConfig.maxTradeAmount,
          maxSlippage: proxyConfig.maxSlippage,
          dailyTradeLimit: proxyConfig.dailyTradeLimit,
          telegramUserId: telegramId,
        },
      });

      res.json({
        success: true,
        data: { proxyWallet },
      });
    } catch (error) {
      logger.error('Error deploying proxy wallet:', error);

      await TelegramBotService.sendWebAppErrorNotification(
        telegramId,
        'Failed to deploy proxy wallet',
        'Wallet deployment'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to deploy proxy wallet',
      });
    }
  }

  /**
   * Monitor pool
   */
  static async monitorPool(req: Request, res: Response) {
    const telegramId = req.telegramUser?.id.toString()!;
    const { isMonitoring } = req.body;

    try {
      await prisma.telegramUser.update({
        where: { id: telegramId },
        data: { isMonitoring },
      });

      res.json({
        success: true,
        data: { isMonitoring },
      });
    } catch (error) {
      logger.error('Error monitoring pool:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to monitor pool',
      });
    }
  }

  /**
   * Get pools data
   */
  static async getPools(req: Request, res: Response) {
    try {
      // Mock pools data
      const pools = [
        {
          id: 1,
          name: 'Uniswap V2',
          address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
          type: 'DEX',
          isActive: true,
        },
        {
          id: 2,
          name: 'PancakeSwap',
          address: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
          type: 'DEX',
          isActive: true,
        },
      ];

      res.json({
        success: true,
        data: { pools },
      });
    } catch (error) {
      logger.error('Error getting pools:', error);

      // Send error notification to user
      const telegramId = req.telegramUser?.id.toString();
      if (telegramId) {
        await TelegramBotService.sendWebAppErrorNotification(
          telegramId,
          'Failed to load pools data',
          'Loading pools'
        );
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch pools',
      });
    }
  }

  /**
   * Execute trade
   */
  static async executeTrade(req: Request, res: Response) {
    try {
      const telegramId = req.telegramUser?.id.toString();
      const { poolAddress, tokenAddress, amount, isBuy } = req.body;

      if (!telegramId) {
        res.status(400).json({ error: 'Telegram ID is required' });
        return;
      }

      // Mock trade execution
      const trade = {
        id: Math.random().toString(36).substr(2, 9),
        poolAddress,
        tokenAddress,
        amount,
        isBuy,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: { trade },
      });
    } catch (error) {
      logger.error('Error executing trade:', error);

      // Send error notification to user
      const telegramId = req.telegramUser?.id.toString();
      if (telegramId) {
        await TelegramBotService.sendWebAppErrorNotification(
          telegramId,
          'Failed to execute trade',
          'Trade execution'
        );
      }

      res.status(500).json({
        success: false,
        error: 'Failed to execute trade',
      });
    }
  }

  /**
   * Update sniper configuration
   */
  static async updateConfig(req: Request, res: Response) {
    try {
      const telegramId = req.telegramUser?.id.toString();
      const configData = req.body;

      if (!telegramId) {
        res.status(400).json({ error: 'Telegram ID is required' });
        return;
      }

      // Find existing config or create new one
      let existingConfig = await prisma.sniperConfig.findFirst({
        where: {
          telegramUserId: telegramId,
          isActive: true,
        },
      });

      let config;
      if (existingConfig) {
        config = await prisma.sniperConfig.update({
          where: { id: existingConfig.id },
          data: configData,
        });
      } else {
        config = await prisma.sniperConfig.create({
          data: {
            ...configData,
            telegramUserId: telegramId,
            isActive: true,
          },
        });
      }

      res.json({
        success: true,
        data: { config },
      });
    } catch (error) {
      logger.error('Error updating config:', error);

      // Send error notification to user
      const telegramId = req.telegramUser?.id.toString();
      if (telegramId) {
        await TelegramBotService.sendWebAppErrorNotification(
          telegramId,
          'Failed to update configuration',
          'Config update'
        );
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  }
}
