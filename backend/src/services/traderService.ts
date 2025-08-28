import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { TraderRanking, TraderRankingFilters, TraderStats } from '@/types/trader';
import { formatEther, parseEther } from 'viem';

export class TraderService {
  /**
   * Get traders ranked by various metrics
   */
  static async getTradersByRank(filters: TraderRankingFilters = {}): Promise<TraderRanking[]> {
    try {
      const {
        category = 'all',
        minBalance,
        maxBalance,
        minWinRate,
        maxWinRate,
        minTransactions,
        maxTransactions,
        sortBy = 'sevenDayPnl',
        sortOrder = 'desc',
        limit = 50,
        offset = 0
      } = filters;

      // Get users with in-app wallets and their trades
      const users = await prisma.user.findMany({
        where: {
          inAppWallet: {
            isActive: true
          }
        },
        include: {
          inAppWallet: true,
          trades: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        },
        take: limit,
        skip: offset
      });

      // Calculate metrics for each user
      const rankings: TraderRanking[] = await Promise.all(
        users.map(async (user, index) => {
          const trades = user.trades || [];
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          // Filter trades by time periods
          const oneDayTrades = trades.filter(t => new Date(t.timestamp) >= oneDayAgo);
          const sevenDayTrades = trades.filter(t => new Date(t.timestamp) >= sevenDaysAgo);
          const thirtyDayTrades = trades.filter(t => new Date(t.timestamp) >= thirtyDaysAgo);

          // Calculate PnL
          const oneDayPnl = oneDayTrades.reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);
          const sevenDayPnl = sevenDayTrades.reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);
          const thirtyDayPnl = thirtyDayTrades.reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);

          // Calculate win rate
          const sevenDayWins = sevenDayTrades.filter(t => parseFloat(t.profit || '0') > 0).length;
          const sevenDayWinRate = sevenDayTrades.length > 0 ? (sevenDayWins / sevenDayTrades.length) * 100 : 0;

          // Calculate average duration and cost
          const sevenDayAvgDuration = sevenDayTrades.length > 0 
            ? sevenDayTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / sevenDayTrades.length 
            : 0;
          
          const sevenDayAvgCost = sevenDayTrades.length > 0
            ? sevenDayTrades.reduce((sum, t) => sum + parseFloat(t.gasCost || '0'), 0) / sevenDayTrades.length
            : 0;

          // Get token distribution
          const tokenCounts = new Map<string, number>();
          sevenDayTrades.forEach(trade => {
            const symbol = trade.tokenSymbol || trade.tokenAddress;
            tokenCounts.set(symbol, (tokenCounts.get(symbol) || 0) + 1);
          });
          const sevenDayTokenDistribution = Array.from(tokenCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([symbol]) => symbol);

          // Calculate 7-day profit chart (daily values)
          const sevenDayProfit = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const dayTrades = sevenDayTrades.filter(t => {
              const tradeDate = new Date(t.timestamp);
              return tradeDate >= dayStart && tradeDate < dayEnd;
            });
            
            const dayProfit = dayTrades.reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);
            sevenDayProfit.push(dayProfit);
          }

          // Get ETH balance from in-app wallet (you might need to fetch this from blockchain)
          const ethBalance = user.inAppWallet ? '0' : '0'; // Placeholder - should fetch from blockchain

          // Count tracked by (users who have copy trades targeting this user)
          const trackedBy = await prisma.copyTrade.count({
            where: {
              targetAddress: user.inAppWallet?.address || '',
              isActive: true
            }
          });

          return {
            id: user.id,
            wallet: user.inAppWallet?.address || '',
            ethBalance: formatEther(BigInt(ethBalance)),
            oneDayPnl: formatEther(BigInt(parseEther(oneDayPnl.toString()))),
            sevenDayPnl: formatEther(BigInt(parseEther(sevenDayPnl.toString()))),
            thirtyDayPnl: formatEther(BigInt(parseEther(thirtyDayPnl.toString()))),
            sevenDayWinRate,
            sevenDayTransactions: sevenDayTrades.length,
            trackedBy,
            sevenDayTokenDistribution,
            sevenDayProfit,
            sevenDayAvgDuration,
            sevenDayAvgCost: formatEther(BigInt(parseEther(sevenDayAvgCost.toString()))),
            lastTime: trades.length > 0 ? trades[0].timestamp.toISOString() : now.toISOString(),
            rank: offset + index + 1,
            user: {
              id: user.id,
              email: user.email || undefined,
              telegramUserId: user.telegramUserId || undefined
            },
            inAppWallet: user.inAppWallet ? {
              address: user.inAppWallet.address,
              isActive: user.inAppWallet.isActive
            } : undefined
          };
        })
      );

      // Apply filters
      let filteredRankings = rankings;

      if (minBalance) {
        filteredRankings = filteredRankings.filter(t => parseFloat(t.ethBalance) >= parseFloat(minBalance));
      }
      if (maxBalance) {
        filteredRankings = filteredRankings.filter(t => parseFloat(t.ethBalance) <= parseFloat(maxBalance));
      }
      if (minWinRate !== undefined) {
        filteredRankings = filteredRankings.filter(t => t.sevenDayWinRate >= minWinRate);
      }
      if (maxWinRate !== undefined) {
        filteredRankings = filteredRankings.filter(t => t.sevenDayWinRate <= maxWinRate);
      }
      if (minTransactions !== undefined) {
        filteredRankings = filteredRankings.filter(t => t.sevenDayTransactions >= minTransactions);
      }
      if (maxTransactions !== undefined) {
        filteredRankings = filteredRankings.filter(t => t.sevenDayTransactions <= maxTransactions);
      }

      // Sort results
      filteredRankings.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'ethBalance':
            aValue = parseFloat(a.ethBalance);
            bValue = parseFloat(b.ethBalance);
            break;
          case 'oneDayPnl':
            aValue = parseFloat(a.oneDayPnl);
            bValue = parseFloat(b.oneDayPnl);
            break;
          case 'sevenDayPnl':
            aValue = parseFloat(a.sevenDayPnl);
            bValue = parseFloat(b.sevenDayPnl);
            break;
          case 'thirtyDayPnl':
            aValue = parseFloat(a.thirtyDayPnl);
            bValue = parseFloat(b.thirtyDayPnl);
            break;
          case 'sevenDayWinRate':
            aValue = a.sevenDayWinRate;
            bValue = b.sevenDayWinRate;
            break;
          case 'sevenDayTransactions':
            aValue = a.sevenDayTransactions;
            bValue = b.sevenDayTransactions;
            break;
          case 'trackedBy':
            aValue = a.trackedBy;
            bValue = b.trackedBy;
            break;
          case 'lastTime':
            aValue = new Date(a.lastTime);
            bValue = new Date(b.lastTime);
            break;
          default:
            aValue = parseFloat(a.sevenDayPnl);
            bValue = parseFloat(b.sevenDayPnl);
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return filteredRankings;
    } catch (error) {
      logger.error('Error getting traders by rank:', error);
      throw error;
    }
  }

  /**
   * Get trader statistics
   */
  static async getTraderStats(): Promise<TraderStats> {
    try {
      const totalTraders = await prisma.user.count({
        where: {
          inAppWallet: {
            isActive: true
          }
        }
      });

      const traders = await this.getTradersByRank({ limit: 100 });
      
      const averageWinRate = traders.length > 0 
        ? traders.reduce((sum, t) => sum + t.sevenDayWinRate, 0) / traders.length 
        : 0;

      const averagePnl = traders.length > 0
        ? formatEther(BigInt(parseEther(
            (traders.reduce((sum, t) => sum + parseFloat(t.sevenDayPnl), 0) / traders.length).toString()
          )))
        : '0';

      const topPerformers = traders.slice(0, 5);

      return {
        totalTraders,
        averageWinRate,
        averagePnl,
        topPerformers
      };
    } catch (error) {
      logger.error('Error getting trader stats:', error);
      throw error;
    }
  }

  /**
   * Track a trader (create copy trade setting)
   */
  static async trackTrader(userId: string, targetAddress: string, settings: any): Promise<void> {
    try {
      await prisma.copyTrade.create({
        data: {
          userId,
          targetAddress,
          name: settings.name || `Copy ${targetAddress.slice(0, 6)}...`,
          allocation: settings.allocation || 10,
          maxSlippage: settings.maxSlippage || 2.0,
          gasLimit: settings.gasLimit || 500000,
          gasPrice: settings.gasPrice || 20,
          minTradeAmount: settings.minTradeAmount || '0.01',
          maxTradeAmount: settings.maxTradeAmount || '1.0',
          tokenWhitelist: settings.tokenWhitelist || [],
          tokenBlacklist: settings.tokenBlacklist || [],
          maxDailyLoss: settings.maxDailyLoss || '0.1',
          stopLoss: settings.stopLoss || 10.0,
          takeProfit: settings.takeProfit || 20.0
        }
      });
    } catch (error) {
      logger.error('Error tracking trader:', error);
      throw error;
    }
  }

  /**
   * Untrack a trader (delete copy trade setting)
   */
  static async untrackTrader(userId: string, copyTradeId: string): Promise<void> {
    try {
      await prisma.copyTrade.delete({
        where: {
          id: copyTradeId,
          userId
        }
      });
    } catch (error) {
      logger.error('Error untracking trader:', error);
      throw error;
    }
  }

  /**
   * Get user's copy trade settings
   */
  static async getUserCopyTrades(userId: string): Promise<any[]> {
    try {
      const copyTrades = await prisma.copyTrade.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          trades: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      return copyTrades;
    } catch (error) {
      logger.error('Error getting user copy trades:', error);
      throw error;
    }
  }

  /**
   * Add a trade record
   */
  static async addTrade(tradeData: {
    hash: string;
    userAddress: string;
    tokenAddress: string;
    tokenSymbol?: string;
    tokenName?: string;
    type: 'buy' | 'sell';
    amount: string;
    tokenAmount: string;
    priceUSD?: number;
    priceETH: string;
    gasUsed: string;
    gasPrice: string;
    gasCost: string;
    timestamp: Date;
    blockNumber: string;
    status?: string;
    isCopyTrade?: boolean;
    copiedFrom?: string;
    copyTradeId?: string;
    dexName?: string;
    dexVersion?: string;
    slippage?: number;
    riskScore?: number;
    isHoneypot?: boolean;
    isRugPull?: boolean;
  }): Promise<void> {
    try {
      // Find user by wallet address
      const user = await prisma.user.findFirst({
        where: {
          inAppWallet: {
            address: tradeData.userAddress
          }
        }
      });

      if (!user) {
        throw new Error(`User not found for address: ${tradeData.userAddress}`);
      }

      await prisma.trade.create({
        data: {
          ...tradeData,
          userId: user.id,
          blockNumber: BigInt(tradeData.blockNumber),
          status: tradeData.status || 'pending',
          isCopyTrade: tradeData.isCopyTrade || false,
          riskScore: tradeData.riskScore || 0,
          isHoneypot: tradeData.isHoneypot || false,
          isRugPull: tradeData.isRugPull || false
        }
      });
    } catch (error) {
      logger.error('Error adding trade:', error);
      throw error;
    }
  }

  /**
   * Update trade profit (called after trade completion)
   */
  static async updateTradeProfit(tradeId: string, profit: string, duration?: number): Promise<void> {
    try {
      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          profit,
          ...(duration !== undefined && { duration }),
          status: 'confirmed'
        }
      });
    } catch (error) {
      logger.error('Error updating trade profit:', error);
      throw error;
    }
  }

  /**
   * Create a new copy trade
   */
  static async createCopyTrade(userId: string, copyTradeData: any): Promise<any> {
    try {
      const copyTrade = await prisma.copyTrade.create({
        data: {
          ...copyTradeData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return copyTrade;
    } catch (error) {
      logger.error('Error creating copy trade:', error);
      throw error;
    }
  }

  /**
   * Update a copy trade
   */
  static async updateCopyTrade(id: string, userId: string, updateData: any): Promise<any> {
    try {
      const copyTrade = await prisma.copyTrade.update({
        where: { 
          id,
          userId // Ensure user owns this copy trade
        },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
      return copyTrade;
    } catch (error) {
      logger.error('Error updating copy trade:', error);
      throw error;
    }
  }

  /**
   * Delete a copy trade
   */
  static async deleteCopyTrade(id: string, userId: string): Promise<void> {
    try {
      await prisma.copyTrade.delete({
        where: { 
          id,
          userId // Ensure user owns this copy trade
        }
      });
    } catch (error) {
      logger.error('Error deleting copy trade:', error);
      throw error;
    }
  }
} 