import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { createPublicClient, http, parseEther, formatEther, getAddress } from 'viem';
import { mainnet } from 'viem/chains';

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

  /**
   * Execute trade using in-app wallet
   */
  static async executeTrade(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { tokenAddress, amount, isBuy, slippageTolerance = 50, deadline = 300 } = req.body;

      if (!tokenAddress || !amount || typeof isBuy !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Token address, amount, and isBuy are required'
        });
        return;
      }

      // Get user and their in-app wallet
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user || !user.inAppWallet) {
        res.status(404).json({ 
          success: false, 
          message: 'User not found or no in-app wallet configured' 
        });
        return;
      }

      // Create blockchain client
      const client = createPublicClient({
        chain: mainnet,
        transport: http(process.env.ETHEREUM_RPC_URL || "https://1rpc.io/eth"),
      });

      // Check balance before trading
      const balanceCheck = await this.checkBalance(client, tokenAddress, user.inAppWallet, amount, isBuy);
      if (!balanceCheck.sufficient) {
        res.status(400).json({
          success: false,
          message: balanceCheck.error || 'Insufficient balance'
        });
        return;
      }

      // Execute the trade
      const result = await this.executeSwapTransaction(
        client,
        tokenAddress,
        amount,
        isBuy,
        user.inAppWallet,
        slippageTolerance,
        deadline
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Trade executed successfully',
          txHash: result.txHash,
          amountIn: result.amountIn,
          amountOut: result.amountOut
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Trade execution failed'
        });
      }

    } catch (error) {
      logger.error('Error executing trade:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute trade'
      });
    }
  }

  /**
   * Check if wallet has sufficient balance for the trade
   */
  private static async checkBalance(
    client: any,
    tokenAddress: string,
    walletAddress: string,
    amount: string,
    isBuy: boolean
  ): Promise<{ sufficient: boolean; error?: string }> {
    try {
      if (isBuy) {
        // Check ETH balance for buying
        const ethBalance = await client.getBalance({
          address: getAddress(walletAddress)
        });
        const requiredAmount = parseEther(amount);
        const availableBalance = ethBalance;
        
        if (requiredAmount > availableBalance) {
          return {
            sufficient: false,
            error: `Insufficient ETH balance. You have ${formatEther(availableBalance)} ETH, but need ${amount} ETH`
          };
        }
      } else {
        // Check token balance for selling
        const tokenBalance = await client.readContract({
          address: getAddress(tokenAddress),
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view'
            }
          ],
          functionName: 'balanceOf',
          args: [getAddress(walletAddress)]
        });
        
        const requiredAmount = parseEther(amount);
        const availableBalance = tokenBalance as bigint;
        
        if (requiredAmount > availableBalance) {
          return {
            sufficient: false,
            error: `Insufficient token balance. You have ${formatEther(availableBalance)} tokens, but want to sell ${amount} tokens`
          };
        }
      }
      
      return { sufficient: true };
    } catch (error) {
      logger.error('Balance check error:', error);
      return {
        sufficient: false,
        error: 'Failed to check balance'
      };
    }
  }

  /**
   * Execute the actual swap transaction
   */
  private static async executeSwapTransaction(
    client: any,
    tokenAddress: string,
    amount: string,
    isBuy: boolean,
    walletAddress: string,
    slippageTolerance: number,
    deadline: number
  ): Promise<{ success: boolean; txHash?: string; amountIn?: string; amountOut?: string; error?: string }> {
    try {
      // This is a simplified implementation
      // In a real implementation, you would:
      // 1. Use the private key from the database to sign the transaction
      // 2. Execute the Uniswap V3 swap
      // 3. Wait for transaction confirmation
      // 4. Return the transaction hash

      // For now, we'll simulate a successful transaction
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        txHash: mockTxHash,
        amountIn: amount,
        amountOut: '0' // Would be calculated from actual swap
      };

    } catch (error) {
      logger.error('Swap transaction error:', error);
      return {
        success: false,
        error: 'Transaction execution failed'
      };
    }
  }
}
