import { PoolService } from '@/services/poolService';
import { SmartContractService } from '@/services/smartContractService';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import cron from 'node-cron';
import { Address } from 'viem';

type Message = string

export class SniperBotService {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastPoolCheck = new Date();

  /**
   * Initialize the bot
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🤖 Initializing KunAI Sniper Bot...');

      // Connect to database
      await connectDatabase();
      logger.info('✅ Database connected');

      // Initialize smart contract service
      SmartContractService.initialize();  
      logger.info('✅ Smart contract service initialized');

      // Start monitoring
      await this.startMonitoring();
      logger.info('✅ Pool monitoring started');

      // Setup cron jobs
      this.setupCronJobs();
      logger.info('✅ Cron jobs scheduled');

      this.isRunning = true;
      logger.info('🚀 Sniper bot is now running!');

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to initialize bot:', error);
      process.exit(1);
    }
  }

  /**
   * Create proxy wallet for user
   */
  public static async createProxyWallet(userAddress: Address, telegramUserId: string, config: any): Promise<string> {
    try {
      // Check if user already has a proxy wallet
      const existingProxy = await prisma.proxyWallet.findUnique({
        where: { userAddress: userAddress.toLowerCase(), telegramUserId: telegramUserId }
      });

      if (existingProxy) {
        logger.warn(`User ${userAddress} already has a proxy wallet: ${existingProxy.proxyAddress}`);
        return existingProxy.proxyAddress;
      }

      // Deploy proxy wallet
      const proxyAddress = await SmartContractService.deployProxyWallet(userAddress, {
        maxTradeAmount: config.maxTradeAmount || '0.1',
        maxSlippage: config.maxSlippage || 500,
        dailyTradeLimit: config.dailyTradeLimit || '1.0',
        gasLimit: config.gasLimit || 2000000,
        gasPrice: config.gasPrice || '20'
      });

      logger.info(`✅ Proxy wallet deployed: ${proxyAddress}`);

      return proxyAddress;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute trade through proxy wallet
   */
  public static async executeTrade(userAddress: Address, telegramUserId: string, tradeRequest: any): Promise<string> {
    try {
      // Get user's proxy wallet
      const proxyWallet = await prisma.proxyWallet.findUnique({
        where: { userAddress: userAddress.toLowerCase(), telegramUserId: telegramUserId }
      });

      if (!proxyWallet) {
        throw new Error('No proxy wallet found for user');
      }

      // Execute trade
      const tradeId = await SmartContractService.executeTrade(userAddress, telegramUserId, tradeRequest);

      logger.info(`✅ Trade executed successfully: ${tradeId}`);

      // Send notification to user
      const tradeMessage = `
✅ Trade Executed Successfully!

🆔 Trade ID: \`${tradeId}\`
💰 Amount: ${tradeRequest.amountIn} ${tradeRequest.tokenIn}
🔄 Token: ${tradeRequest.tokenIn} → ${tradeRequest.tokenOut}
📊 Status: Executed
⏰ Time: ${new Date().toLocaleString()}

Check your wallet for the tokens!
      `;

      return tradeMessage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update token approval for user
   */
  public static async updateTokenApproval(userAddress: Address, telegramUserId: string, tokenAddress: Address, amount: string): Promise<string> {
    try {

      await SmartContractService.updateApproval(userAddress, telegramUserId, tokenAddress, amount);

      logger.info(`✅ Token approval updated successfully`);

      // Send notification to user
      const approvalMessage = `
✅ Token Approval Updated!

💰 Token: ${tokenAddress}
📊 Amount: ${amount}
👤 User: ${userAddress}
⏰ Time: ${new Date().toLocaleString()}

You can now trade with this token!
      `;

      return approvalMessage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's proxy wallet status
   */
  public static async getProxyWalletStatus(userAddress: Address, telegramUserId: string): Promise<any> {
    try {
      const proxyWallet = await prisma.proxyWallet.findUnique({
        where: { userAddress: userAddress.toLowerCase(), telegramUserId: telegramUserId },
        include: {
          approvals: true,
          trades: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      return proxyWallet;
    } catch (error) {
      logger.error(`Error getting proxy wallet status for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Start pool monitoring
   */
  private async startMonitoring(): Promise<void> {
    // Monitor pools every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkNewPools();
      } catch (error) {
        logger.error('Error checking new pools:', error);
      }
    }, 30000); // 30 seconds

    // Initial check
    await this.checkNewPools();
  }

  /**
   * Check for new pools and send alerts
   */
  private async checkNewPools(): Promise<void> {
    try {
      logger.debug('🔍 Checking for new pools...');

      const pools = await PoolService.getNewPairsByRank({
        timeframe: '5m', // Check pools created in last 5 minutes
        limit: 10,
        sortBy: 'market_cap',
        sortOrder: 'desc'
      });

      if (pools.pools.length === 0) {
        logger.debug('No new pools found');
        return;
      }

      logger.info(`📊 Found ${pools.pools.length} new pools`);

      // Get active users with monitoring enabled
      const activeUsers = await prisma.telegramUser.findMany({
        where: { isActive: true },
        include: {
          sniperConfigs: {
            where: { isActive: true }
          }
        }
      });

      for (const pool of pools.pools) {
        // Check if pool meets user criteria
        for (const user of activeUsers) {
          if (user.sniperConfigs.length === 0) continue;

          const config = user.sniperConfigs[0]; // Use first active config
          
          if (await this.poolMeetsCriteria(pool, config)) {
            await this.sendPoolAlert(user.id, pool, config);
          }
        }
      }

      this.lastPoolCheck = new Date();
    } catch (error) {
      logger.error('Error checking new pools:', error);
    }
  }

  /**
   * Check if pool meets user's criteria
   */
  private async poolMeetsCriteria(pool: any, config: any): Promise<boolean> {
    try {
      // Check chain
      if (!config.targetChains.includes(pool.chain)) {
        return false;
      }

      // Check DEX
      if (!config.targetDexs.includes(pool.exchange)) {
        return false;
      }

      // Check liquidity
      const liquidity = parseFloat(pool.base_token_info.liquidity || '0');
      if (liquidity < config.minLiquidity) {
        return false;
      }

      // Check market cap
      const marketCap = parseFloat(pool.base_token_info.market_cap || '0');
      if (marketCap < config.minMarketCap || marketCap > config.maxMarketCap) {
        return false;
      }

      // Check buy tax
      const buyTax = parseFloat(pool.base_token_info.buy_tax || '0');
      if (buyTax > config.maxBuyTax) {
        return false;
      }

      // Check sell tax
      const sellTax = parseFloat(pool.base_token_info.sell_tax || '0');
      if (sellTax > config.maxSellTax) {
        return false;
      }

      // Check honeypot
      if (config.honeypotCheck && pool.base_token_info.is_honeypot) {
        return false;
      }

      // Check lock
      if (config.lockCheck && !pool.base_token_info.lockInfo.isLock) {
        return false;
      }

      // Check blacklist
      if (config.blacklistTokens.includes(pool.base_token_info.address)) {
        return false;
      }

      // Check whitelist (if not empty, must be in whitelist)
      if (config.whitelistTokens.length > 0 && 
          !config.whitelistTokens.includes(pool.base_token_info.address)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking pool criteria:', error);
      return false;
    }
  }

  /**
   * Send pool alert to user
   */
  private async sendPoolAlert(telegramId: string, pool: any, config: any): Promise<Message> {
    try {
      const alertMessage = `
🚨 New Pool Alert!

💰 ${pool.base_token_info.symbol} (${pool.base_token_info.name})
🏪 DEX: ${pool.exchange}
🌐 Chain: ${pool.chain}
💵 Market Cap: $${parseFloat(pool.base_token_info.market_cap).toLocaleString()}
📊 Volume: $${pool.base_token_info.volume.toLocaleString()}
💧 Liquidity: $${parseFloat(pool.base_token_info.liquidity).toLocaleString()}
⏰ Created: ${new Date(pool.open_timestamp * 1000).toLocaleString()}

🔍 Quick Analysis:
• Buy Tax: ${pool.base_token_info.buy_tax}%
• Sell Tax: ${pool.base_token_info.sell_tax}%
• Honeypot: ${pool.base_token_info.is_honeypot ? '❌ Yes' : '✅ No'}
• Locked: ${pool.base_token_info.lockInfo.isLock ? '✅ Yes' : '❌ No'}

⚙️ Your Settings:
• Max Buy: ${config.maxBuyAmount} ETH
• Max Slippage: ${config.maxSlippage}%
• Auto Sell: ${config.autoSell ? '✅' : '❌'}

Use /trade ${pool.base_token_info.address} <amount> to buy
Use /config to adjust settings
      `;

      // Save alert to database
      await prisma.telegramAlert.create({
        data: {
          type: 'pool_alert',
          title: `New Pool: ${pool.base_token_info.symbol}`,
          message: alertMessage,
          priority: 'high',
          telegramUserId: (await prisma.telegramUser.findUnique({
            where: { id: telegramId }
          }))!.id,
          metadata: {
            pool,
            config: {
              maxBuyAmount: config.maxBuyAmount,
              maxSlippage: config.maxSlippage,
              autoSell: config.autoSell
            }
          }
        }
      });

      return alertMessage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup cron jobs
   */
  private setupCronJobs(): void {
    // Update pool data every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.debug('🔄 Updating pool data...');
        // This could trigger a pool data refresh
      } catch (error) {
        logger.error('Error updating pool data:', error);
      }
    });

    // Clean up old alerts every hour
    cron.schedule('0 * * * *', async () => {
      try {
        logger.debug('🧹 Cleaning up old alerts...');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        await prisma.telegramAlert.deleteMany({
          where: {
            createdAt: {
              lt: oneWeekAgo
            },
            isRead: true
          }
        });
      } catch (error) {
        logger.error('Error cleaning up alerts:', error);
      }
    });

    // Update user activity status every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        logger.debug('👥 Updating user activity...');
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

        await prisma.telegramUser.updateMany({
          where: {
            lastActive: {
              lt: thirtyMinutesAgo
            },
            isActive: true
          },
          data: {
            isActive: false
          }
        });
      } catch (error) {
        logger.error('Error updating user activity:', error);
      }
    });
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      this.isRunning = false;

      // Stop monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        logger.info('Monitoring stopped');
      }
      
      // Disconnect database
      await disconnectDatabase();
      logger.info('Database disconnected');

      logger.info('Bot shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get bot status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      lastPoolCheck: this.lastPoolCheck,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeUsers: prisma.telegramUser.count({ where: { isActive: true } })
    };
  }
}
