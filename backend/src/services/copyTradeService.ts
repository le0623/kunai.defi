import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { TradingService } from './tradingService';
import { WalletService } from './walletService';
import { WETH_ADDRESS } from '@/config/abi';

export class CopyTradeService {
  /**
   * Execute copy trades for users who are tracking this trader
   */
  static async executeCopyTrades(
    traderAddress: string,
    tokenAddress: string,
    originalAmount: bigint,
    isBuy: boolean,
    slippageTolerance: number
  ): Promise<void> {
    try {
      // Find all copy trade settings that target this trader
      const copyTradeSettings = await (prisma as any).copyTrade.findMany({
        where: {
          targetAddress: traderAddress,
          isActive: true
        },
        include: {
          user: {
            include: {
              inAppWallet: true
            }
          }
        }
      });

      for (const copySetting of copyTradeSettings) {
        try {
          // Check if the trade meets the copy criteria
          if (!this.meetsCopyTradeCriteria(copySetting, tokenAddress, originalAmount)) {
            continue;
          }

          // Check daily loss limit
          if (!(await this.checkDailyLossLimit(copySetting))) {
            logger.warn(`Daily loss limit reached for copy trade ${copySetting.id}`);
            continue;
          }

          const copyUser = copySetting.user;
          if (!copyUser.inAppWallet) {
            logger.warn(`User ${copyUser.id} has no in-app wallet for copy trading`);
            continue;
          }

          // Calculate copy trade amount based on allocation
          const copyAmount = this.calculateCopyTradeAmount(copySetting, originalAmount);

          // Execute the copy trade
          const copyTxHash = await this.executeCopyTrade(
            copyUser.inAppWallet,
            tokenAddress,
            copyAmount,
            isBuy,
            copySetting,
            slippageTolerance
          );

          if (copyTxHash) {
            // Store the copy trade
            await prisma.trade.create({
              data: {
                hash: copyTxHash,
                userAddress: copyUser.inAppWallet.address,
                tokenAddress,
                type: isBuy ? 'buy' : 'sell',
                amount: copyAmount.toString(),
                tokenAmount: '0', // Will be updated after transaction confirmation
                priceETH: '0', // Will be updated after transaction confirmation
                gasUsed: '0', // Will be updated after transaction confirmation
                gasPrice: '0', // Will be updated after transaction confirmation
                gasCost: '0', // Will be updated after transaction confirmation
                timestamp: new Date(),
                blockNumber: BigInt(0), // Will be updated after transaction confirmation
                status: 'pending',
                isCopyTrade: true,
                copiedFrom: traderAddress,
                copyTradeId: copySetting.id,
                userId: copyUser.id
              }
            });

            // Update copy trade statistics
            await prisma.copyTrade.update({
              where: { id: copySetting.id },
              data: {
                totalTrades: {
                  increment: 1
                }
              }
            });

            logger.info(`Copy trade executed for user ${copyUser.id}, txHash: ${copyTxHash}`);
          }
        } catch (error) {
          logger.error(`Error executing copy trade for setting ${copySetting.id}:`, error);
          // Continue with other copy trades even if one fails
        }
      }
    } catch (error) {
      logger.error('Error in executeCopyTrades:', error);
    }
  }

  /**
   * Check if trade meets copy trade criteria
   */
  private static meetsCopyTradeCriteria(
    copySetting: any,
    tokenAddress: string,
    amount: bigint
  ): boolean {
    // Check token whitelist/blacklist
    if (copySetting.tokenBlacklist.includes(tokenAddress)) {
      return false;
    }

    if (copySetting.tokenWhitelist.length > 0 && !copySetting.tokenWhitelist.includes(tokenAddress)) {
      return false;
    }

    // Check amount limits
    const amountInEth = parseFloat(amount.toString()) / 1e18; // Convert from wei to ETH
    const minAmount = parseFloat(copySetting.minTradeAmount);
    const maxAmount = parseFloat(copySetting.maxTradeAmount);

    if (amountInEth < minAmount || amountInEth > maxAmount) {
      return false;
    }

    return true;
  }

  /**
   * Check daily loss limit
   */
  private static async checkDailyLossLimit(copySetting: any): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrades = await (prisma as any).trade.findMany({
      where: {
        copyTradeId: copySetting.id,
        timestamp: {
          gte: today
        }
      }
    });

    const totalLoss = todayTrades.reduce((sum: number, trade: any) => {
      const profit = parseFloat(trade.profit || '0');
      return sum + (profit < 0 ? Math.abs(profit) : 0);
    }, 0);

    const maxDailyLoss = parseFloat(copySetting.maxDailyLoss);
    return totalLoss < maxDailyLoss;
  }

  /**
   * Calculate copy trade amount based on allocation
   */
  private static calculateCopyTradeAmount(
    copySetting: any,
    originalAmount: bigint
  ): bigint {
    const allocation = copySetting.allocation / 100; // Convert percentage to decimal
    const allocationBps = Math.floor(allocation * 100); // Convert to basis points
    return (originalAmount * BigInt(allocationBps)) / BigInt(100);
  }

  /**
   * Execute a copy trade
   */
  private static async executeCopyTrade(
    inAppWallet: any,
    tokenAddress: string,
    amount: bigint,
    isBuy: boolean,
    copySetting: any,
    slippageTolerance: number
  ): Promise<string | null> {
    try {
      // Check balance
      const balance = await WalletService.getBalance(inAppWallet.address, tokenAddress);
      const slippageBps = Math.min(copySetting.maxSlippage * 100, slippageTolerance);

      if (isBuy && balance.eth < amount || !isBuy && (balance.token ?? 0n) < amount) {
        logger.warn(`Insufficient balance for copy trade: ${inAppWallet.address}`);
        return null;
      }

      let txHash: string | null = null;
      if (isBuy) {
        txHash = await TradingService.swapTokenInUniswapV3(
          WalletService.decryptPrivateKey(inAppWallet.encryptedPrivateKey),
          {
            tokenIn: WETH_ADDRESS,
            tokenOut: tokenAddress,
            amountIn: amount.toString(),
            fee: 500,
            slippageBps: Math.floor(slippageBps)
          }
        );
      } else {
        txHash = await TradingService.swapTokenInUniswapV3(
          WalletService.decryptPrivateKey(inAppWallet.encryptedPrivateKey),
          {
            tokenIn: tokenAddress,
            tokenOut: WETH_ADDRESS,
            amountIn: amount.toString(),
            fee: 500,
            slippageBps: Math.floor(slippageBps)
          }
        );
      }

      return txHash;
    } catch (error) {
      logger.error(`Error executing copy trade for wallet ${inAppWallet.address}:`, error);
      return null;
    }
  }
} 