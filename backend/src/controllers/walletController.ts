import { Request, Response } from 'express';
import { WalletMonitorService } from '@/services/walletMonitorService';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

export class WalletController {
  /**
   * Get monitored wallets for authenticated user
   */
  static async getMonitoredWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const wallets = await prisma.monitoredWallet.findMany({
        where: { userId: req.user!.address },
        include: {
          portfolio: true,
          transactions: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      res.json({
        success: true,
        wallets: wallets.map(wallet => ({
          id: wallet.id,
          address: wallet.address,
          label: wallet.label,
          isSmart: wallet.isSmart,
          riskScore: wallet.riskScore,
          portfolio: wallet.portfolio,
          recentTransactions: wallet.transactions
        }))
      });
    } catch (error) {
      logger.error('Error getting monitored wallets:', error);
      res.status(500).json({ success: false, message: 'Failed to get monitored wallets' });
    }
  }

  /**
   * Add wallet to monitoring list
   */
  static async addWalletToMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { address, label } = req.body;
      
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const monitoredWallet = await WalletMonitorService.addWalletToMonitoring(
        user.id,
        address,
        label
      );

      res.json({
        success: true,
        message: 'Wallet added to monitoring',
        wallet: monitoredWallet
      });
    } catch (error) {
      logger.error('Error adding wallet to monitoring:', error);
      res.status(500).json({ success: false, message: 'Failed to add wallet to monitoring' });
    }
  }

  /**
   * Remove wallet from monitoring
   */
  static async removeWalletFromMonitoring(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const deletedWallet = await prisma.monitoredWallet.deleteMany({
        where: {
          userId: user.id,
          address: address.toLowerCase()
        }
      });

      if (deletedWallet.count === 0) {
        res.status(404).json({ success: false, message: 'Wallet not found in monitoring list' });
        return;
      }

      res.json({
        success: true,
        message: 'Wallet removed from monitoring'
      });
    } catch (error) {
      logger.error('Error removing wallet from monitoring:', error);
      res.status(500).json({ success: false, message: 'Failed to remove wallet from monitoring' });
    }
  }

  /**
   * Get wallet activity
   */
  static async getWalletActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Verify user is monitoring this wallet
      const monitoredWallet = await prisma.monitoredWallet.findFirst({
        where: {
          userId: user.id,
          address: address.toLowerCase()
        }
      });

      if (!monitoredWallet) {
        res.status(403).json({ success: false, message: 'Not monitoring this wallet' });
        return;
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { from: address.toLowerCase() },
            { to: address.toLowerCase() }
          ]
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      res.json({
        success: true,
        activity: transactions
      });
    } catch (error) {
      logger.error('Error getting wallet activity:', error);
      res.status(500).json({ success: false, message: 'Failed to get wallet activity' });
    }
  }

  /**
   * Get wallet portfolio
   */
  static async getWalletPortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Verify user is monitoring this wallet
      const monitoredWallet = await prisma.monitoredWallet.findFirst({
        where: {
          userId: user.id,
          address: address.toLowerCase()
        }
      });

      if (!monitoredWallet) {
        res.status(403).json({ success: false, message: 'Not monitoring this wallet' });
        return;
      }

      const portfolio = await prisma.portfolio.findMany({
        where: { monitoredWalletId: monitoredWallet.id },
        orderBy: { updatedAt: 'desc' }
      });

      res.json({
        success: true,
        portfolio
      });
    } catch (error) {
      logger.error('Error getting wallet portfolio:', error);
      res.status(500).json({ success: false, message: 'Failed to get wallet portfolio' });
    }
  }

  /**
   * Get smart wallet labels
   */
  static async getSmartWalletLabel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      
      const label = await prisma.smartWalletLabel.findUnique({
        where: { address: address.toLowerCase() }
      });

      res.json({
        success: true,
        label: label || null
      });
    } catch (error) {
      logger.error('Error getting wallet label:', error);
      res.status(500).json({ success: false, message: 'Failed to get wallet label' });
    }
  }

  /**
   * Get alerts for user
   */
  static async getUserAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const alerts = await prisma.alert.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json({
        success: true,
        alerts
      });
    } catch (error) {
      logger.error('Error getting alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to get alerts' });
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get user ID from address
      const user = await prisma.user.findUnique({
        where: { address: req.user!.address }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const alert = await prisma.alert.updateMany({
        where: {
          id,
          userId: user.id
        },
        data: { isRead: true }
      });

      if (alert.count === 0) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      logger.error('Error marking alert as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark alert as read' });
    }
  }
} 