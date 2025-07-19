import { Request, Response } from 'express';
import { WalletService } from '@/services/walletService';
import { logger } from '@/utils/logger';

export class WalletController {
  /**
   * Get user's in-app wallet
   */
  static async getUserWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const wallet = await WalletService.getUserWallet(userId);

      if (!wallet) {
        res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
        return;
      }

      res.json({
        success: true,
        wallet: {
          address: wallet.address,
          config: wallet.config,
          // Don't send private key to frontend
        },
      });
    } catch (error) {
      logger.error('Error getting user wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get wallet',
      });
    }
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          message: 'Wallet address is required',
        });
        return;
      }

      const balance = await WalletService.getWalletBalance(address);

      res.json({
        success: true,
        balance,
      });
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get balance',
      });
    }
  }

  /**
   * Execute a trade
   */
  static async executeTrade(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { tokenIn, tokenOut, amountIn, minAmountOut } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!tokenIn || !tokenOut || !amountIn || !minAmountOut) {
        res.status(400).json({
          success: false,
          message: 'Missing required trade parameters',
        });
        return;
      }

      const result = await WalletService.executeTrade(
        userId,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut
      );

      if (result.success) {
        res.json({
          success: true,
          txHash: result.txHash,
          message: 'Trade executed successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Trade failed',
        });
      }
    } catch (error) {
      logger.error('Error executing trade:', error);
      res.status(500).json({
        success: false,
        message: 'Trade execution failed',
      });
    }
  }

  /**
   * Fund wallet (for testing/demo)
   */
  static async fundWallet(req: Request, res: Response): Promise<void> {
    try {
      const { address, amount } = req.body;

      if (!address || !amount) {
        res.status(400).json({
          success: false,
          message: 'Address and amount are required',
        });
        return;
      }

      const success = await WalletService.fundWallet(address, amount);

      if (success) {
        res.json({
          success: true,
          message: 'Wallet funded successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fund wallet',
        });
      }
    } catch (error) {
      logger.error('Error funding wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fund wallet',
      });
    }
  }

  /**
   * Update wallet configuration
   */
  static async updateWalletConfig(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { maxTradeAmount, maxSlippage, dailyTradeLimit } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const success = await WalletService.updateWalletConfig(userId, {
        maxTradeAmount,
        maxSlippage,
        dailyTradeLimit,
      });

      if (success) {
        res.json({
          success: true,
          message: 'Wallet configuration updated',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update configuration',
        });
      }
    } catch (error) {
      logger.error('Error updating wallet config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update configuration',
      });
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          message: 'Wallet address is required',
        });
        return;
      }

      const transactions = await WalletService.getTransactionHistory(address);

      res.json({
        success: true,
        transactions,
      });
    } catch (error) {
      logger.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction history',
      });
    }
  }
}
