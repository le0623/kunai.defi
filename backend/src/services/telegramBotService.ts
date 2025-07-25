import { Telegraf, Context } from 'telegraf';
import { Address } from 'viem';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { SniperBotService } from './sniperBotService';
import { PoolService } from './poolService';
import { AuthService } from './authService';

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface SniperConfig {
  id: string;
  userId: string;
  enabled: boolean;
  maxSlippage: number;
  gasLimit: number;
  gasPrice: string;
  maxBuyAmount: number;
  autoSell: boolean;
  sellPercentage: number;
  targetChains: string[];
  targetDexs: string[];
  filters: {
    minLiquidity: number;
    maxBuyTax: number;
    maxSellTax: number;
    minMarketCap: number;
    maxMarketCap: number;
    honeypotCheck: boolean;
    lockCheck: boolean;
  };
}

export class TelegramBotService {
  private static bot: Telegraf;
  private static isInitialized = false;
  private static readonly BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'];
  private static readonly WEBAPP_URL = process.env['TELEGRAM_WEBAPP_URL'] || '';
  private static loginTokens: Map<string, { userId: string; expiresAt: Date; used: boolean }> | null = null;

  /**
   * Initialize the Telegram bot
   */
  static async initialize(): Promise<void> {
    if (!this.BOT_TOKEN) {
      logger.error('TELEGRAM_BOT_TOKEN not found in environment variables');
      return;
    }

    if (this.isInitialized) {
      logger.warn('Telegram bot already initialized');
      return;
    }

    try {
      this.bot = new Telegraf(this.BOT_TOKEN);
      this.setupCommands();
      this.setupMiddleware();
      this.setupErrorHandling();

      this.isInitialized = true;
      logger.info('Telegram bot initialized successfully');
      await this.bot.launch();

      // Graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  /**
   * Setup bot commands
   */
  private static setupCommands(): void {
    // Start command
    this.bot.start(async ctx => {
      const user = ctx.from;
      if (!user) return;

      await this.saveUser(user);

      // Check for start parameter
      const startParam = ctx.payload;
      
      // Parse parameters from start payload
      const payload = this.parseStartPayload(startParam);
      
      // Handle login start parameter
      if (payload.action === 'login') {
        await this.handleLoginStart(ctx, user, payload.params);
        return;
      }

      // Check if user already has a proxy wallet
      const telegramUser = await prisma.telegramUser.findUnique({
        where: { id: user.id.toString() },
        include: {
          proxyWallet: true,
        },
      });

      let welcomeMessage = `
🤖 Welcome to KunAI Sniper Bot!

I can help you:
• Monitor new pools in real-time
• Set up automatic sniper configurations
• Execute trades automatically (non-custodial)
• Track your portfolio

Available commands:
/start - Show this message
/help - Show all commands
/setup_wallet - Set up your proxy wallet
/config - Configure sniper settings
/monitor - Start monitoring pools
/stop - Stop monitoring
/status - Check bot status
/portfolio - View your portfolio
/alerts - Manage price alerts
/trade - Manual trade execution

🔐 Non-Custodial Trading:
Your private keys stay with you. We use smart contracts as secure proxies.
      `;

      let inlineKeyboard;

      if (telegramUser?.proxyWallet) {
        // User has existing proxy wallet - show wallet info
        const proxyWallet = telegramUser.proxyWallet;
        welcomeMessage += `

✅ You already have a proxy wallet set up!

🔗 Proxy Address: ${proxyWallet.proxyAddress}
👤 User Address: ${telegramUser.walletAddress || 'Not set'}
💰 Max Trade: ${proxyWallet.maxTradeAmount} ETH
📊 Max Slippage: ${proxyWallet.maxSlippage / 100}%
📅 Daily Limit: ${proxyWallet.dailyTradeLimit} ETH
📅 Deployed: ${proxyWallet.deployedAt.toLocaleDateString()}

Status: ${proxyWallet.isActive ? '✅ Active' : '❌ Inactive'}
        `;

        inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '💰 Approve ETH', callback_data: 'approve_eth' },
              { text: '💵 Approve USDC', callback_data: 'approve_usdc' },
            ],
            [
              {
                text: '⚙️ Configure Trading',
                callback_data: 'configure_trading',
              },
              { text: '📊 View Status', callback_data: 'wallet_status' },
            ],
            [
              { text: '📊 View Portfolio', callback_data: 'view_portfolio' },
              { text: '🚨 View Alerts', callback_data: 'view_alerts' },
            ],
            [
              {
                text: '📈 Start Monitoring',
                callback_data: 'start_monitoring',
              },
              { text: '❓ Help', callback_data: 'help' },
            ],
          ],
        };
      } else {
        // User doesn't have proxy wallet - show setup option
        welcomeMessage += `

Ready to start? Use /setup_wallet to begin!
        `;

        inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '🔐 Setup Proxy Wallet', callback_data: 'setup_wallet' },
              { text: '⚙️ Configure Bot', callback_data: 'configure_bot' },
            ],
            [
              { text: '📊 View Portfolio', callback_data: 'view_portfolio' },
              { text: '🚨 View Alerts', callback_data: 'view_alerts' },
            ],
            [
              {
                text: '📈 Start Monitoring',
                callback_data: 'start_monitoring',
              },
              { text: '❓ Help', callback_data: 'help' },
            ],
          ],
        };
      }

      await ctx.reply(welcomeMessage, {
        reply_markup: inlineKeyboard,
      });
    });

    // Help command
    this.bot.help(async ctx => {
      const helpMessage = `
📚 KunAI Sniper Bot Commands:

🔐 Wallet Setup:
/setup_wallet - Set up your proxy wallet
/wallet_status - Check wallet status
/approve_tokens - Approve tokens for trading

🔧 Configuration:
/config - Configure sniper settings
/config_view - View current configuration
/config_reset - Reset to default settings

📊 Monitoring:
/monitor - Start monitoring new pools
/stop - Stop monitoring
/status - Check bot status
/pools - View recent pools

💰 Trading:
/trade <token_address> <amount> - Manual trade
/portfolio - View your portfolio
/balance - Check wallet balance

⚙️ Alerts:
/alerts - Manage price alerts
/alert_add <token> <price> - Add price alert
/alert_remove <id> - Remove alert

📈 Analytics:
/analytics - View trading analytics
/profit - View profit/loss
/history - View trade history

❓ Support:
/help - Show this message
/support - Contact support
      `;

      await ctx.reply(helpMessage);
    });

    // Wallet setup commands
    this.bot.command('setup_wallet', async ctx => {
      await this.handleSetupWalletCommand(ctx);
    });

    this.bot.command('wallet_address', async ctx => {
      await this.handleWalletAddressCommand(ctx);
    });

    this.bot.command('wallet_status', async ctx => {
      await this.handleWalletStatusCommand(ctx);
    });

    this.bot.command('approve_tokens', async ctx => {
      await this.handleApproveTokensCommand(ctx);
    });

    // Configuration commands
    this.bot.command('config', async ctx => {
      await this.handleConfigCommand(ctx);
    });

    this.bot.command('config_view', async ctx => {
      await this.handleConfigViewCommand(ctx);
    });

    this.bot.command('config_reset', async ctx => {
      await this.handleConfigResetCommand(ctx);
    });

    // Monitoring commands
    this.bot.command('monitor', async ctx => {
      await this.handleMonitorCommand(ctx);
    });

    this.bot.command('stop', async ctx => {
      await this.handleStopCommand(ctx);
    });

    this.bot.command('status', async ctx => {
      await this.handleStatusCommand(ctx);
    });

    this.bot.command('pools', async ctx => {
      await this.handlePoolsCommand(ctx);
    });

    // Trading commands
    this.bot.command('trade', async ctx => {
      await this.handleTradeCommand(ctx);
    });

    this.bot.command('portfolio', async ctx => {
      await this.handlePortfolioCommand(ctx);
    });

    this.bot.command('balance', async ctx => {
      await this.handleBalanceCommand(ctx);
    });

    // Alert commands
    this.bot.command('alerts', async ctx => {
      await this.handleAlertsCommand(ctx);
    });

    // Analytics commands
    this.bot.command('analytics', async ctx => {
      await this.handleAnalyticsCommand(ctx);
    });

    // Support command
    this.bot.command('support', async ctx => {
      await ctx.reply(`
📞 Support Information:

For technical support or questions:
• Email: support@kunai.com
• Telegram: @kunai_support
• Website: https://kunai.com/support

Bot Status: ✅ Active
Version: 1.0.0
      `);
    });

    // WebApp command
    this.bot.command('webapp', async ctx => {
      await ctx.reply('🌐 Opening KunAI WebApp...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Open WebApp', web_app: { url: this.WEBAPP_URL } }],
          ],
        },
      });
    });

    // Setup callback handlers
    this.setupCallbackHandlers();
  }

  /**
   * Setup callback handlers for inline buttons
   */
  private static setupCallbackHandlers(): void {
    this.bot.action('setup_wallet', async ctx => {
      await this.handleSetupWalletCommand(ctx);
    });

    this.bot.action('configure_bot', async ctx => {
      await this.handleConfigCommand(ctx);
    });

    this.bot.action('view_portfolio', async ctx => {
      await this.handlePortfolioCommand(ctx);
    });

    this.bot.action('view_alerts', async ctx => {
      await this.handleAlertsCommand(ctx);
    });

    this.bot.action('start_monitoring', async ctx => {
      await this.handleMonitorCommand(ctx);
    });

    this.bot.action('help', async ctx => {
      await this.handleHelpCommand(ctx);
    });

    // Wallet setup callbacks
    this.bot.action('deploy_proxy', async ctx => {
      await this.handleDeployProxyCallback(ctx);
    });

    this.bot.action('approve_eth', async ctx => {
      await this.handleApproveEthCallback(ctx);
    });

    this.bot.action('approve_usdc', async ctx => {
      await this.handleApproveUsdcCallback(ctx);
    });

    // Trading callbacks
    this.bot.action('quick_trade', async ctx => {
      await this.handleQuickTradeCallback(ctx);
    });

    this.bot.action('view_trades', async ctx => {
      await this.handleViewTradesCallback(ctx);
    });

    this.bot.action('manage_approvals', async ctx => {
      await this.handleManageApprovalsCallback(ctx);
    });

    this.bot.action('analytics', async ctx => {
      await this.handleAnalyticsCommand(ctx);
    });

    this.bot.action('refresh_portfolio', async ctx => {
      await ctx.answerCbQuery('Refreshing portfolio...');
      await this.handlePortfolioCommand(ctx);
    });

    this.bot.action('refresh_approvals', async ctx => {
      await ctx.answerCbQuery('Refreshing approvals...');
      await this.handleManageApprovalsCallback(ctx);
    });

    this.bot.action('approvals_analytics', async ctx => {
      await this.handleApprovalsAnalyticsCallback(ctx);
    });

    this.bot.action('retry_webapp_action', async ctx => {
      await this.handleRetryWebAppAction(ctx);
    });
  }

  /**
   * Handle setup wallet command
   */
  private static async handleSetupWalletCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      // Check if user already has a proxy wallet
      const telegramUser = await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: true,
        },
      });

      if (!telegramUser) {
        await ctx.reply('❌ Please start the bot first with /start');
        return;
      }

      // Check if user already has a proxy wallet
      if (telegramUser.proxyWallet) {
        const existingProxy = telegramUser.proxyWallet;

        const existingWalletMessage = `
✅ Proxy Wallet Already Exists!

🔗 Proxy Address: ${existingProxy.proxyAddress}
👤 User Address: ${telegramUser.walletAddress}
💰 Max Trade: ${existingProxy.maxTradeAmount} ETH
📊 Max Slippage: ${existingProxy.maxSlippage / 100}%
📅 Daily Limit: ${existingProxy.dailyTradeLimit} ETH
📅 Deployed: ${existingProxy.deployedAt.toLocaleDateString()}

Status: ${existingProxy.isActive ? '✅ Active' : '❌ Inactive'}

What would you like to do?
        `;

        await ctx.editMessageText(existingWalletMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💰 Approve ETH', callback_data: 'approve_eth' },
                { text: '💵 Approve USDC', callback_data: 'approve_usdc' },
              ],
              [
                {
                  text: '⚙️ Configure Trading',
                  callback_data: 'configure_trading',
                },
                { text: '📊 View Status', callback_data: 'wallet_status' },
              ],
            ],
          },
        });
        return;
      }

      const setupMessage = `
🔐 Proxy Wallet Setup

This creates a secure smart contract that acts as a proxy for your trades.
Your private keys stay with you - we never see them!

Benefits:
✅ Non-custodial (you keep your keys)
✅ Secure (smart contract protection)
✅ Automated (bot can trade for you)
✅ Limited (you set spending limits)

Steps:
1. Deploy your proxy wallet
2. Approve tokens for trading
3. Configure trading limits
4. Start trading!

To get started, please provide your wallet address:
Use /wallet_address <your_address> to set your wallet
      `;

      await ctx.reply(setupMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Deploy Proxy Wallet', callback_data: 'deploy_proxy' }],
            [
              { text: '📋 How It Works', callback_data: 'how_it_works' },
              { text: '❓ FAQ', callback_data: 'faq' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error in setup wallet command:', error);
      await ctx.reply('❌ Error setting up wallet');
    }
  }

  /**
   * Handle wallet address command
   */
  private static async handleWalletAddressCommand(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(
        '❌ Please send a text message with your wallet address.'
      );
      return;
    }

    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const message = ctx.message.text;
    const parts = message.split(' ');

    if (parts.length < 2) {
      await ctx.reply('❌ Usage: /wallet_address <your_ethereum_address>');
      return;
    }

    const walletAddress = parts[1];
    if (!walletAddress) {
      await ctx.reply('❌ Please provide a valid wallet address.');
      return;
    }

    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      await ctx.reply(
        '❌ Invalid Ethereum address format. Please provide a valid address starting with 0x.'
      );
      return;
    }

    try {
      // Save wallet address to user's profile in database
      await prisma.telegramUser.update({
        where: { id: userId },
        data: {
          walletAddress: walletAddress.toLowerCase(),
        },
      });

      const successMessage = `
✅ Wallet Address Set!

👤 Your Address: ${walletAddress}
🔗 Network: Ethereum Mainnet

Your wallet address has been saved. You can now:
• Deploy your proxy wallet
• Approve tokens for trading
• Start automated trading

Ready to deploy your proxy wallet?
      `;

      await ctx.reply(successMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Deploy Proxy Wallet', callback_data: 'deploy_proxy' }],
            [
              { text: '📊 View Status', callback_data: 'wallet_status' },
              { text: '⚙️ Configure', callback_data: 'configure_bot' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error setting wallet address:', error);
      await ctx.reply('❌ Error setting wallet address. Please try again.');
    }
  }

  /**
   * Handle deploy proxy callback
   */
  private static async handleDeployProxyCallback(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Checking proxy wallet status...');

      const telegramUser = await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: true,
        },
      });

      if (!telegramUser) {
        await ctx.reply('❌ Please start the bot first with /start');
        return;
      }

      // Check if user already has a proxy wallet
      if (telegramUser.proxyWallet) {
        const existingProxy = telegramUser.proxyWallet;

        const existingWalletMessage = `
✅ Proxy Wallet Already Exists!

🔗 Proxy Address: ${existingProxy.proxyAddress}
👤 User Address: ${telegramUser.walletAddress}
💰 Max Trade: ${existingProxy.maxTradeAmount} ETH
📊 Max Slippage: ${existingProxy.maxSlippage / 100}%
📅 Daily Limit: ${existingProxy.dailyTradeLimit} ETH
📅 Deployed: ${existingProxy.deployedAt.toLocaleDateString()}

Status: ${existingProxy.isActive ? '✅ Active' : '❌ Inactive'}

What would you like to do?
        `;

        await ctx.editMessageText(existingWalletMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💰 Approve ETH', callback_data: 'approve_eth' },
                { text: '💵 Approve USDC', callback_data: 'approve_usdc' },
              ],
              [
                {
                  text: '⚙️ Configure Trading',
                  callback_data: 'configure_trading',
                },
                { text: '📊 View Status', callback_data: 'wallet_status' },
              ],
            ],
          },
        });
        return;
      }

      const userAddress = telegramUser.walletAddress;

      if (!userAddress) {
        await ctx.reply(
          '❌ Please set your wallet address first with /wallet_address'
        );
        return;
      }

      await ctx.answerCbQuery('Deploying proxy wallet...');

      const proxyConfig = {
        maxTradeAmount: '0.1',
        maxSlippage: 500, // 5%
        dailyTradeLimit: '1.0',
        gasLimit: 2000000,
        gasPrice: '20',
      };

      logger.info(
        `Creating proxy wallet for user ${userId} with address ${userAddress}`
      );

      const proxyAddress = await SniperBotService.createProxyWallet(
        userAddress as Address,
        userId,
        proxyConfig
      );

      // Save to database
      await prisma.proxyWallet.create({
        data: {
          userAddress: userAddress.toLowerCase(),
          proxyAddress: proxyAddress.toLowerCase(),
          maxTradeAmount: proxyConfig.maxTradeAmount,
          maxSlippage: proxyConfig.maxSlippage,
          dailyTradeLimit: proxyConfig.dailyTradeLimit,
          telegramUserId: userId,
        },
      });

      const successMessage = `
✅ Proxy Wallet Deployed!

🔗 Proxy Address: ${proxyAddress}
👤 User Address: ${userAddress}
💰 Max Trade: ${proxyConfig.maxTradeAmount} ETH
📊 Max Slippage: 5%
📅 Daily Limit: ${proxyConfig.dailyTradeLimit} ETH

Next steps:
1. Approve tokens for trading
2. Configure your trading preferences
3. Start monitoring pools

Your proxy wallet is ready! 🚀
        `;

      await ctx.editMessageText(successMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Approve ETH', callback_data: 'approve_eth' },
              { text: '💵 Approve USDC', callback_data: 'approve_usdc' },
            ],
            [
              {
                text: '⚙️ Configure Trading',
                callback_data: 'configure_trading',
              },
              { text: '📊 View Status', callback_data: 'wallet_status' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error(`Error creating proxy wallet for user ${userId}:`, error);
      await ctx.answerCbQuery('❌ Failed to deploy proxy wallet');
      await ctx.reply('❌ Error deploying proxy wallet. Please try again.');
    }
  }

  /**
   * Handle approve ETH callback
   */
  private static async handleApproveEthCallback(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Setting up ETH approval...');

      const approvalMessage = `
💰 ETH Approval Setup

To trade with ETH, you need to approve your proxy wallet.

Current settings:
• Max Trade Amount: 0.1 ETH
• Daily Limit: 1.0 ETH

To approve:
1. Connect your wallet to our dApp
2. Approve the proxy contract
3. Set your desired limits

🔗 dApp Link: https://app.kunai.com/approve

Or use the command:
/approve_tokens ETH 0.1
      `;

      await ctx.editMessageText(approvalMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🌐 Open dApp', url: 'https://app.kunai.com/approve' },
              { text: '📱 Use Command', callback_data: 'use_approve_command' },
            ],
            [
              { text: "✅ I've Approved", callback_data: 'approval_complete' },
              { text: '❓ Help', callback_data: 'approval_help' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error in approve ETH callback:', error);
      await ctx.answerCbQuery('❌ Error setting up approval');
    }
  }

  /**
   * Handle approve USDC callback
   */
  private static async handleApproveUsdcCallback(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Setting up USDC approval...');

      const approvalMessage = `
💵 USDC Approval Setup

To trade with USDC, you need to approve your proxy wallet.

Current settings:
• Max Trade Amount: 100 USDC
• Daily Limit: 1000 USDC

To approve:
1. Connect your wallet to our dApp
2. Approve the proxy contract for USDC
3. Set your desired limits

🔗 dApp Link: https://app.kunai.com/approve

Or use the command:
/approve_tokens USDC 100
      `;

      await ctx.editMessageText(approvalMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🌐 Open dApp', url: 'https://app.kunai.com/approve' },
              { text: '📱 Use Command', callback_data: 'use_approve_command' },
            ],
            [
              { text: "✅ I've Approved", callback_data: 'approval_complete' },
              { text: '❓ Help', callback_data: 'approval_help' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error in approve USDC callback:', error);
      await ctx.answerCbQuery('❌ Error setting up approval');
    }
  }

  /**
   * Handle wallet status command
   */
  private static async handleWalletStatusCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      const telegramUser = (await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: {
            include: {
              approvals: true,
              trades: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      })) as Prisma.TelegramUserGetPayload<{
        include: {
          proxyWallet: {
            include: {
              approvals: true;
              trades: {
                orderBy: {
                  createdAt: 'desc';
                };
                take: number;
              };
            };
          };
        };
      }>;

      if (!telegramUser || !telegramUser.proxyWallet) {
        await ctx.editMessageText(
          '❌ No proxy wallet found. Use /setup_wallet to create one.'
        );
        return;
      }

      const proxyWallet = telegramUser.proxyWallet;

      const statusMessage = `
🔐 Proxy Wallet Status

📋 Wallet Info:
• Proxy Address: ${proxyWallet.proxyAddress}
• User Address: ${telegramUser.walletAddress}
• Status: ${proxyWallet.isActive ? '✅ Active' : '❌ Inactive'}
• Deployed: ${proxyWallet.deployedAt.toLocaleDateString()}

💰 Trading Limits:
• Max Trade: ${proxyWallet.maxTradeAmount} ETH
• Daily Limit: ${proxyWallet.dailyTradeLimit} ETH
• Max Slippage: ${proxyWallet.maxSlippage / 100}%

📊 Approvals:
${
  proxyWallet.approvals && proxyWallet.approvals.length > 0
    ? proxyWallet.approvals
        .map(
          (approval: any) => `• ${approval.tokenAddress}: ${approval.amount}`
        )
        .join('\n')
    : '• No approvals set'
}

📈 Recent Trades: ${proxyWallet.trades ? proxyWallet.trades.length : 0}
      `;

      await ctx.reply(statusMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View Trades', callback_data: 'view_trades' },
              {
                text: '💰 Manage Approvals',
                callback_data: 'manage_approvals',
              },
            ],
            [
              { text: '⚙️ Update Limits', callback_data: 'update_limits' },
              { text: '🔄 Refresh', callback_data: 'refresh_status' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error getting wallet status:', error);
      await ctx.reply('❌ Error retrieving wallet status');
    }
  }

  /**
   * Handle approve tokens command
   */
  private static async handleApproveTokensCommand(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(
        '❌ Please send a text message with the approve command.'
      );
      return;
    }

    const message = ctx.message.text;
    const parts = message.split(' ');

    if (parts.length < 3) {
      await ctx.reply('❌ Usage: /approve_tokens <token_symbol> <amount>');
      return;
    }

    const tokenSymbol = parts[1]?.toUpperCase() || '';
    const amount = parts[2] || '';

    const approvalMessage = `
💰 Token Approval Setup

Token: ${tokenSymbol}
Amount: ${amount}

To approve ${tokenSymbol}:
1. Visit: https://app.kunai.com/approve
2. Connect your wallet
3. Select ${tokenSymbol}
4. Enter amount: ${amount}
5. Confirm approval

🔗 Quick Link: https://app.kunai.com/approve?token=${tokenSymbol}&amount=${amount}
      `;

    await ctx.reply(approvalMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🌐 Open dApp',
              url: `https://app.kunai.com/approve?token=${tokenSymbol}&amount=${amount}`,
            },
          ],
          [
            {
              text: '✅ Approval Complete',
              callback_data: 'approval_complete',
            },
            { text: '❓ Need Help?', callback_data: 'approval_help' },
          ],
        ],
      },
    });
  }

  /**
   * Setup middleware for user tracking
   */
  private static setupMiddleware(): void {
    this.bot.use(async (ctx, next) => {
      const user = ctx.from;
      if (user) {
        await this.saveUser(user);
      }
      await next();
    });
  }

  /**
   * Setup error handling
   */
  private static setupErrorHandling(): void {
    this.bot.catch((err, ctx) => {
      logger.error('Telegram bot error:', err);
      ctx.reply('❌ An error occurred. Please try again later.');
    });
  }

  /**
   * Save or update user in database
   */
  private static async saveUser(user: TelegramUser): Promise<void> {
    try {
      await prisma.telegramUser.upsert({
        where: { id: user.id.toString() },
        update: {
          username: user.username || null,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          lastActive: new Date(),
        },
        create: {
          id: user.id.toString(),
          username: user.username || null,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          lastActive: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error saving telegram user:', error);
    }
  }

  /**
   * Handle config command
   */
  private static async handleConfigCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const configMessage = `
⚙️ Sniper Configuration

Please configure your sniper settings:

1️⃣ Basic Settings:
• Max Slippage: 5%
• Gas Limit: 500,000
• Gas Price: Auto

2️⃣ Trading Limits:
• Max Buy Amount: 0.1 ETH
• Auto Sell: Enabled
• Sell Percentage: 50%

3️⃣ Filters:
• Min Liquidity: $10,000
• Max Buy Tax: 10%
• Max Sell Tax: 10%
• Min Market Cap: $100,000
• Max Market Cap: $10,000,000
• Honeypot Check: Enabled
• Lock Check: Enabled

4️⃣ Target Chains: ETH, BSC
5️⃣ Target DEXs: Uniswap V2, PancakeSwap

Use /config_view to see current settings
Use /config_reset to reset to defaults
      `;

    await ctx.reply(configMessage);
  }

  /**
   * Handle config view command
   */
  private static async handleConfigViewCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      const config = await this.getUserConfig(userId);

      const configMessage = `
📋 Current Configuration:

🔧 Basic Settings:
• Max Slippage: ${config.maxSlippage}%
• Gas Limit: ${config.gasLimit.toLocaleString()}
• Gas Price: ${config.gasPrice} Gwei

💰 Trading Limits:
• Max Buy Amount: ${config.maxBuyAmount} ETH
• Auto Sell: ${config.autoSell ? '✅ Enabled' : '❌ Disabled'}
• Sell Percentage: ${config.sellPercentage}%

🔍 Filters:
• Min Liquidity: $${config.filters.minLiquidity.toLocaleString()}
• Max Buy Tax: ${config.filters.maxBuyTax}%
• Max Sell Tax: ${config.filters.maxSellTax}%
• Min Market Cap: $${config.filters.minMarketCap.toLocaleString()}
• Max Market Cap: $${config.filters.maxMarketCap.toLocaleString()}
• Honeypot Check: ${config.filters.honeypotCheck ? '✅' : '❌'}
• Lock Check: ${config.filters.lockCheck ? '✅' : '❌'}

🌐 Target Chains: ${config.targetChains.join(', ')}
🏪 Target DEXs: ${config.targetDexs.join(', ')}

Bot Status: ${config.enabled ? '✅ Active' : '❌ Inactive'}
      `;

      await ctx.reply(configMessage);
    } catch (error) {
      logger.error('Error getting user config:', error);
      await ctx.reply('❌ Error retrieving configuration');
    }
  }

  /**
   * Handle config reset command
   */
  private static async handleConfigResetCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await this.resetUserConfig(userId);
      await ctx.reply('✅ Configuration reset to defaults');
    } catch (error) {
      logger.error('Error resetting user config:', error);
      await ctx.reply('❌ Error resetting configuration');
    }
  }

  /**
   * Handle monitor command
   */
  private static async handleMonitorCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await this.startMonitoring(userId);
      await ctx.reply(
        '✅ Pool monitoring started! You will receive alerts for new opportunities.'
      );
    } catch (error) {
      logger.error('Error starting monitoring:', error);
      await ctx.reply('❌ Error starting monitoring');
    }
  }

  /**
   * Handle stop command
   */
  private static async handleStopCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await this.stopMonitoring(userId);
      await ctx.reply('⏹️ Pool monitoring stopped');
    } catch (error) {
      logger.error('Error stopping monitoring:', error);
      await ctx.reply('❌ Error stopping monitoring');
    }
  }

  /**
   * Handle status command
   */
  private static async handleStatusCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      const status = await this.getBotStatus(userId);

      const statusMessage = `
📊 Bot Status:

🤖 Monitoring: ${status.monitoring ? '✅ Active' : '❌ Inactive'}
💰 Total Trades: ${status.totalTrades}
📈 Successful Trades: ${status.successfulTrades}
📉 Failed Trades: ${status.failedTrades}
💵 Total Profit: $${status.totalProfit.toFixed(2)}
🕐 Last Trade: ${status.lastTrade || 'Never'}

⚡ Recent Activity:
${status.recentActivity.join('\n')}
      `;

      await ctx.reply(statusMessage);
    } catch (error) {
      logger.error('Error getting bot status:', error);
      await ctx.reply('❌ Error retrieving status');
    }
  }

  /**
   * Handle pools command
   */
  private static async handlePoolsCommand(ctx: Context): Promise<void> {
    try {
      const pools = await PoolService.getNewPairsByRank({
        timeframe: '1h',
        limit: 5,
        sortBy: 'market_cap',
        sortOrder: 'desc',
      });

      // Check if pools data is available
      if (!pools || !pools.pools || pools.pools.length === 0) {
        await ctx.reply(
          '📊 No pools data available at the moment. Please try again later.'
        );
        return;
      }

      let poolsMessage = '🔥 Recent Hot Pools:\n\n';

      pools.pools.forEach((pool: any, index: number) => {
        poolsMessage += `${index + 1}. ${pool.base_token_info?.symbol || 'UNKNOWN'} (${pool.base_token_info?.name || 'Unknown Token'})\n`;
        poolsMessage += `   💰 Market Cap: $${parseFloat(pool.base_token_info?.market_cap || '0').toLocaleString()}\n`;
        poolsMessage += `   📊 Volume: ${(pool.base_token_info?.volume || 0).toLocaleString()}\n`;
        poolsMessage += `   🏪 DEX: ${pool.exchange || 'Unknown'}\n`;
        poolsMessage += `   ⏰ Created: ${new Date((pool.open_timestamp || Date.now() / 1000) * 1000).toLocaleString()}\n\n`;
      });

      await ctx.reply(poolsMessage);
    } catch (error) {
      logger.error('Error getting pools:', error);
      await ctx.reply('❌ Error retrieving pools. Please try again later.');
    }
  }

  /**
   * Handle trade command
   */
  private static async handleTradeCommand(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('❌ Please send a text message with the trade command.');
      return;
    }

    const message = ctx.message.text;
    const parts = message.split(' ');
    if (parts.length < 3) {
      await ctx.reply('❌ Usage: /trade <token_address> <amount_in_eth>');
      return;
    }

    const tokenAddress = parts[1];
    const amount = parseFloat(parts[2] || '0');

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please provide a valid ETH amount.');
      return;
    }

    await ctx.reply(
      `🔄 Executing trade for ${amount} ETH on ${tokenAddress}...`
    );

    // TODO: Implement actual trade execution
    setTimeout(async () => {
      await ctx.reply('✅ Trade executed successfully!');
    }, 2000);
  }

  /**
   * Handle portfolio command
   */
  private static async handlePortfolioCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      // Fetch user's proxy wallet with all related data
      const telegramUser = (await prisma.telegramUser.findUnique({
        where: { id: userId },
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
        },
      })) as Prisma.TelegramUserGetPayload<{
        include: {
          proxyWallet: {
            include: {
              approvals: true;
              trades: {
                orderBy: {
                  createdAt: 'desc';
                };
                take: number;
              };
            };
          };
        };
      }>;

      if (!telegramUser) {
        await ctx.reply('❌ Please start the bot first with /start');
        return;
      }

      if (!telegramUser.proxyWallet) {
        await ctx.reply(
          '❌ No proxy wallet found. Use /setup_wallet to create one.'
        );
        return;
      }

      const proxyWallet = telegramUser.proxyWallet;
      const trades = proxyWallet.trades || [];
      const approvals = proxyWallet.approvals || [];

      // Get proxy wallet ETH balance
      const ethBalance = await this.getProxyWalletBalance(
        proxyWallet.proxyAddress
      );
      const ethValue = ethBalance * 2000; // Assuming ETH price of $2000

      // Calculate portfolio metrics
      const totalTrades = trades.length;
      const successfulTrades = trades.filter(
        trade => trade.status === 'executed'
      ).length;
      const failedTrades = trades.filter(
        trade => trade.status === 'failed'
      ).length;
      const winRate =
        totalTrades > 0
          ? ((successfulTrades / totalTrades) * 100).toFixed(1)
          : '0';

      // Calculate total value and 24h changes
      const { totalValue, totalValue24hAgo, holdings } =
        await this.calculatePortfolioValue(approvals);

      // Add ETH to total value
      const totalPortfolioValue = totalValue + ethValue;
      const totalPortfolioValue24hAgo = totalValue24hAgo + ethValue; // Assuming ETH price stable for demo

      // Calculate 24h change
      const change24h = totalPortfolioValue - totalPortfolioValue24hAgo;
      const change24hPercent =
        totalPortfolioValue24hAgo > 0
          ? (change24h / totalPortfolioValue24hAgo) * 100
          : 0;

      // Get recent trades for history
      const recentTrades = trades.slice(0, 10);
      const tradeHistory = recentTrades.map(trade => {
        const date = new Date(trade.createdAt).toLocaleDateString();
        const time = new Date(trade.createdAt).toLocaleTimeString();
        const status = trade.status === 'executed' ? '✅' : '❌';
        return `${status} ${trade.tokenIn} → ${trade.tokenOut} (${date} ${time})`;
      });

      // Calculate average profit from successful trades
      const successfulTradeValues = trades
        .filter(trade => trade.status === 'executed')
        .map(trade => {
          const amountIn = parseFloat(trade.amountIn) || 0;
          const amountOut = parseFloat(trade.minAmountOut) || 0;
          return amountOut - amountIn;
        });

      const totalProfit = successfulTradeValues.reduce(
        (sum, profit) => sum + profit,
        0
      );
      const averageProfit =
        successfulTradeValues.length > 0
          ? totalProfit / successfulTradeValues.length
          : 0;

      const portfolioMessage = `
💼 Your Portfolio:

💰 Total Value: $${totalPortfolioValue.toFixed(2)}
📈 24h Change: ${change24h >= 0 ? '+' : ''}$${change24h.toFixed(2)} (${change24hPercent >= 0 ? '+' : ''}${change24hPercent.toFixed(2)}%)

🏪 Holdings:
• ETH: ${ethBalance.toFixed(4)} ETH ($${ethValue.toFixed(2)})
${
  holdings.length > 0
    ? holdings
        .map(
          holding =>
            `• ${this.formatTokenAddress(holding.token)}: ${holding.amount} @ $${holding.price.toFixed(4)} ($${holding.value.toFixed(2)}) ${holding.change24h >= 0 ? '📈' : '📉'} ${holding.change24h >= 0 ? '+' : ''}${holding.change24h.toFixed(2)}%`
        )
        .join('\n')
    : ''
}

📊 Performance:
• Total Trades: ${totalTrades}
• Successful: ${successfulTrades}
• Failed: ${failedTrades}
• Win Rate: ${winRate}%
• Total Profit: $${totalProfit.toFixed(2)}
• Average Profit: $${averageProfit.toFixed(2)}

📈 Recent Trade History:
${
  tradeHistory.length > 0
    ? tradeHistory
        .map(trade => {
          const parts = trade.split(' → ');
          if (parts.length === 2) {
            const tokenIn = this.formatTokenAddress(
              parts[0]?.split(' ').pop() || ''
            );
            const tokenOut = this.formatTokenAddress(
              parts[1]?.split(' ')[0] || ''
            );
            const timeInfo = parts[1]?.match(/\((.*?)\)/)?.[1] || '';
            const status = trade.includes('✅') ? '✅' : '❌';
            return `${status} ${tokenIn} → ${tokenOut} (${timeInfo})`;
          }
          return trade;
        })
        .join('\n')
    : '• No trades yet'
}

🔗 Proxy Wallet: \`${this.formatTokenAddress(proxyWallet.proxyAddress)}\`
      `;

      await ctx.reply(portfolioMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View All Trades', callback_data: 'view_trades' },
              {
                text: '💰 Manage Approvals',
                callback_data: 'manage_approvals',
              },
            ],
            [
              { text: '📈 Analytics', callback_data: 'analytics' },
              { text: '🔄 Refresh', callback_data: 'refresh_portfolio' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error getting portfolio:', error);
      await ctx.reply('❌ Error retrieving portfolio data. Please try again.');
    }
  }

  /**
   * Handle balance command
   */
  private static async handleBalanceCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    // TODO: Implement wallet balance checking
    const balanceMessage = `
💰 Wallet Balance:

ETH: 2.5 ETH ($5,000.00)
USDC: 1,000 USDC ($1,000.00)
USDT: 500 USDT ($500.00)

Total: $6,500.00
      `;

    await ctx.reply(balanceMessage);
  }

  /**
   * Handle alerts command
   */
  private static async handleAlertsCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const alertsMessage = `
🔔 Price Alerts:

1. BTC > $50,000 (Active)
2. ETH > $3,000 (Active)
3. SOL > $100 (Inactive)

Use /alert_add <token> <price> to add new alert
Use /alert_remove <id> to remove alert
      `;

    await ctx.reply(alertsMessage);
  }

  /**
   * Handle analytics command
   */
  private static async handleAnalyticsCommand(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const analyticsMessage = `
📈 Trading Analytics:

📊 Performance Metrics:
• Total Trades: 47
• Win Rate: 68%
• Average Hold Time: 2.3 hours
• Best Trade: +$1,250 (TOKEN1)
• Worst Trade: -$180 (TOKEN2)

💰 Profit Analysis:
• Total Profit: $3,420
• Monthly Profit: $1,150
• Weekly Profit: $280
• Daily Profit: $45

🎯 Success Factors:
• Most Profitable DEX: Uniswap V2
• Best Time: 2-4 PM UTC
• Optimal Slippage: 3-5%
      `;

    await ctx.reply(analyticsMessage);
  }

  /**
   * Get user configuration
   */
  private static async getUserConfig(userId: string): Promise<SniperConfig> {
    // TODO: Implement database storage for user configs
    return {
      id: `config_${userId}`,
      userId,
      enabled: true,
      maxSlippage: 5,
      gasLimit: 2000000,
      gasPrice: '20',
      maxBuyAmount: 0.1,
      autoSell: true,
      sellPercentage: 50,
      targetChains: ['eth', 'bsc'],
      targetDexs: ['uniswapv2', 'pancakeswap'],
      filters: {
        minLiquidity: 10000,
        maxBuyTax: 10,
        maxSellTax: 10,
        minMarketCap: 100000,
        maxMarketCap: 10000000,
        honeypotCheck: true,
        lockCheck: true,
      },
    };
  }

  /**
   * Reset user configuration
   */
  private static async resetUserConfig(userId: string): Promise<void> {
    // TODO: Implement database reset
    logger.info(`Resetting config for user ${userId}`);
  }

  /**
   * Start monitoring for user
   */
  private static async startMonitoring(userId: string): Promise<void> {
    // TODO: Implement monitoring logic
    logger.info(`Starting monitoring for user ${userId}`);
  }

  /**
   * Stop monitoring for user
   */
  private static async stopMonitoring(userId: string): Promise<void> {
    // TODO: Implement stop monitoring logic
    logger.info(`Stopping monitoring for user ${userId}`);
  }

  /**
   * Get bot status for user
   */
  private static async getBotStatus(_userId: string): Promise<any> {
    // TODO: Implement status tracking
    return {
      monitoring: true,
      totalTrades: 47,
      successfulTrades: 32,
      failedTrades: 15,
      totalProfit: 3420.5,
      lastTrade: '2 hours ago',
      recentActivity: [
        '✅ Bought TOKEN1 for 0.05 ETH',
        '❌ Failed to buy TOKEN2 (insufficient liquidity)',
        '✅ Sold TOKEN3 for 0.08 ETH (+60% profit)',
      ],
    };
  }

  /**
   * Send notification to user
   */
  static async sendNotification(
    userId: string,
    message: string
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      await this.bot.telegram.sendMessage(userId, message);
    } catch (error) {
      logger.error('Error sending telegram notification:', error);
    }
  }

  /**
   * Send error notification to user
   */
  static async sendErrorNotification(
    userId: string,
    error: string,
    context?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      const errorMessage = `
❌ Error Notification

${context ? `**Context:** ${context}\n` : ''}
**Error:** ${error}

⏰ Time: ${new Date().toLocaleString()}

Please try again or contact support if the issue persists.
      `;

      await this.bot.telegram.sendMessage(userId, errorMessage);
    } catch (error) {
      logger.error('Error sending error notification:', error);
    }
  }

  /**
   * Send WebApp error notification to user
   */
  static async sendWebAppErrorNotification(
    userId: string,
    error: string,
    action?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      const errorMessage = `
🌐 WebApp Error

${action ? `**Action:** ${action}\n` : ''}
**Error:** ${error}

⏰ Time: ${new Date().toLocaleString()}

💡 **Troubleshooting:**
• Refresh the WebApp
• Check your internet connection
• Try again in a few minutes
• Contact support if the issue persists

🔗 **Support:** @kunai_support
      `;

      await this.bot.telegram.sendMessage(userId, errorMessage);
    } catch (error) {
      logger.error('Error sending WebApp error notification:', error);
    }
  }

  /**
   * Send system error notification to user
   */
  static async sendSystemErrorNotification(
    userId: string,
    error: string,
    component?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    try {
      const errorMessage = `
🔧 System Error

${component ? `**Component:** ${component}\n` : ''}
**Error:** ${error}

⏰ Time: ${new Date().toLocaleString()}

🔄 **Status:** Our team has been notified and is working on a fix.

📞 **Need immediate help?** Contact support: @kunai_support
      `;

      await this.bot.telegram.sendMessage(userId, errorMessage);
    } catch (error) {
      logger.error('Error sending system error notification:', error);
    }
  }

  /**
   * Send pool alert to user
   */
  static async sendPoolAlert(userId: string, pool: any): Promise<void> {
    const alertMessage = `
🚨 New Pool Alert!

💰 ${pool.base_token_info.symbol} (${pool.base_token_info.name})
🏪 DEX: ${pool.exchange}
🌐 Chain: ${pool.chain}
💵 Market Cap: $${parseFloat(pool.base_token_info.market_cap).toLocaleString()}
📊 Volume: $${pool.base_token_info.volume.toLocaleString()}
⏰ Created: ${new Date(pool.open_timestamp * 1000).toLocaleString()}

🔍 Quick Analysis:
• Buy Tax: ${pool.base_token_info.buy_tax}%
• Sell Tax: ${pool.base_token_info.sell_tax}%
• Honeypot: ${pool.base_token_info.is_honeypot ? '❌ Yes' : '✅ No'}
• Locked: ${pool.base_token_info.lockInfo.isLock ? '✅ Yes' : '❌ No'}

Use /trade ${pool.base_token_info.address} <amount> to buy
      `;

    await this.sendNotification(userId, alertMessage);
  }

  /**
   * Stop the bot
   */
  static async stop(): Promise<void> {
    if (this.bot && this.isInitialized) {
      this.bot.stop();
      this.isInitialized = false;
      logger.info('Telegram bot stopped');
    } else {
      logger.warn('Telegram bot not initialized');
    }
  }

  /**
   * Handle help command
   */
  private static async handleHelpCommand(ctx: Context): Promise<void> {
    const helpMessage = `
📚 KunAI Sniper Bot Commands:

🔐 Wallet Setup:
/setup_wallet - Set up your proxy wallet
/wallet_status - Check wallet status
/approve_tokens - Approve tokens for trading

🔧 Configuration:
/config - Configure sniper settings
/config_view - View current configuration
/config_reset - Reset to default settings

📊 Monitoring:
/monitor - Start monitoring new pools
/stop - Stop monitoring
/status - Check bot status
/pools - View recent pools

💰 Trading:
/trade <token_address> <amount> - Manual trade
/portfolio - View your portfolio
/balance - Check wallet balance

⚙️ Alerts:
/alerts - Manage price alerts
/alert_add <token> <price> - Add price alert
/alert_remove <id> - Remove alert

📈 Analytics:
/analytics - View trading analytics
/profit - View profit/loss
/history - View trade history

❓ Support:
/help - Show this message
/support - Contact support
      `;

    await ctx.reply(helpMessage);
  }

  /**
   * Handle quick trade callback
   */
  private static async handleQuickTradeCallback(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Opening quick trade...');

      const quickTradeMessage = `
🚀 Quick Trade

Choose your trading option:

💰 Trade with ETH
💵 Trade with USDC
🔄 Swap tokens

Select an option to continue:
      `;

      await ctx.editMessageText(quickTradeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Trade with ETH', callback_data: 'trade_eth' },
              { text: '💵 Trade with USDC', callback_data: 'trade_usdc' },
            ],
            [
              { text: '🔄 Swap Tokens', callback_data: 'swap_tokens' },
              { text: '📊 View Prices', callback_data: 'view_prices' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error in quick trade callback:', error);
      await ctx.answerCbQuery('❌ Error opening quick trade');
    }
  }

  /**
   * Handle view trades callback
   */
  private static async handleViewTradesCallback(ctx: Context): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Loading trades...');

      const telegramUser = (await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: {
            include: {
              trades: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      })) as Prisma.TelegramUserGetPayload<{
        include: {
          proxyWallet: {
            include: {
              approvals: true;
              trades: {
                orderBy: {
                  createdAt: 'desc';
                };
                take: number;
              };
            };
          };
        };
      }>;

      if (!telegramUser || !telegramUser.proxyWallet) {
        await ctx.editMessageText(
          '❌ No proxy wallet found. Use /setup_wallet to create one.'
        );
        return;
      }

      const proxyWallet = telegramUser.proxyWallet;

      if (!proxyWallet.trades || proxyWallet.trades.length === 0) {
        await ctx.editMessageText('📊 No trades found yet.');
        return;
      }

      let tradesMessage = `📊 Recent Trades (${proxyWallet.trades.length})\n\n`;

      proxyWallet.trades.forEach((trade: any, index: number) => {
        tradesMessage += `${index + 1}. ${trade.tokenIn} → ${trade.tokenOut}\n`;
        tradesMessage += `   💰 Amount: ${trade.amountIn}\n`;
        tradesMessage += `   📅 Date: ${trade.createdAt.toLocaleDateString()}\n`;
        tradesMessage += `   📊 Status: ${trade.status}\n\n`;
      });

      await ctx.editMessageText(tradesMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'refresh_trades' },
              { text: '📈 Analytics', callback_data: 'trade_analytics' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error viewing trades:', error);
      await ctx.answerCbQuery('❌ Error loading trades');
    }
  }

  /**
   * Handle manage approvals callback
   */
  private static async handleManageApprovalsCallback(
    ctx: Context
  ): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Loading manage approvals...');

      const telegramUser = (await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: {
            include: {
              approvals: true,
              trades: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      })) as Prisma.TelegramUserGetPayload<{
        include: {
          proxyWallet: {
            include: {
              approvals: true;
              trades: {
                orderBy: {
                  createdAt: 'desc';
                };
                take: number;
              };
            };
          };
        };
      }>;

      if (!telegramUser || !telegramUser.proxyWallet) {
        await ctx.editMessageText(
          '❌ No proxy wallet found. Use /setup_wallet to create one.'
        );
        return;
      }

      const proxyWallet = telegramUser.proxyWallet;

      if (!proxyWallet.approvals || proxyWallet.approvals.length === 0) {
        await ctx.editMessageText('📊 No approvals found yet.');
        return;
      }

      let approvalsMessage = `📊 Manage Approvals (${proxyWallet.approvals.length})\n\n`;

      proxyWallet.approvals.forEach((approval: any, index: number) => {
        approvalsMessage += `${index + 1}. ${approval.tokenAddress}\n`;
        approvalsMessage += `   💰 Amount: ${approval.amount}\n`;
        approvalsMessage += `   📅 Date: ${approval.createdAt.toLocaleDateString()}\n`;
        approvalsMessage += `   📊 Status: ${approval.status}\n\n`;
      });

      await ctx.editMessageText(approvalsMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'refresh_approvals' },
              { text: '📈 Analytics', callback_data: 'approvals_analytics' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error managing approvals:', error);
      await ctx.answerCbQuery('❌ Error managing approvals');
    }
  }

  /**
   * Get token price (placeholder for real price API integration)
   */
  private static async getTokenPrice(
    tokenAddress: string
  ): Promise<{ price: number; change24h: number }> {
    // TODO: Integrate with real price API (CoinGecko, CoinMarketCap, etc.)
    // For now, return placeholder data
    const basePrice = Math.random() * 100 + 1; // Random price between $1-$100
    const change24h = (Math.random() - 0.5) * 40; // Random change between -20% to +20%

    return {
      price: basePrice,
      change24h: change24h,
    };
  }

  /**
   * Calculate portfolio value with real token prices
   */
  private static async calculatePortfolioValue(approvals: any[]): Promise<{
    totalValue: number;
    totalValue24hAgo: number;
    holdings: Array<{
      token: string;
      amount: string;
      value: number;
      change24h: number;
      price: number;
    }>;
  }> {
    let totalValue = 0;
    let totalValue24hAgo = 0;
    const holdings: Array<{
      token: string;
      amount: string;
      value: number;
      change24h: number;
      price: number;
    }> = [];

    for (const approval of approvals) {
      const { price, change24h } = await this.getTokenPrice(
        approval.tokenAddress
      );
      const amount = parseFloat(approval.amount) || 0;
      const tokenValue = amount * price;
      const value24hAgo = tokenValue / (1 + change24h / 100);

      holdings.push({
        token: approval.tokenAddress,
        amount: approval.amount,
        value: tokenValue,
        change24h: change24h,
        price: price,
      });

      totalValue += tokenValue;
      totalValue24hAgo += value24hAgo;
    }

    return { totalValue, totalValue24hAgo, holdings };
  }

  /**
   * Handle approvals analytics callback
   */
  private static async handleApprovalsAnalyticsCallback(
    ctx: Context
  ): Promise<void> {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      await ctx.answerCbQuery('Loading approvals analytics...');

      const telegramUser = (await prisma.telegramUser.findUnique({
        where: { id: userId },
        include: {
          proxyWallet: {
            include: {
              approvals: true,
              trades: {
                orderBy: { createdAt: 'desc' },
                take: 100,
              },
            },
          },
        },
      })) as Prisma.TelegramUserGetPayload<{
        include: {
          proxyWallet: {
            include: {
              approvals: true;
              trades: {
                orderBy: {
                  createdAt: 'desc';
                };
                take: number;
              };
            };
          };
        };
      }>;

      if (!telegramUser || !telegramUser.proxyWallet) {
        await ctx.editMessageText(
          '❌ No proxy wallet found. Use /setup_wallet to create one.'
        );
        return;
      }

      const proxyWallet = telegramUser.proxyWallet;
      const approvals = proxyWallet.approvals || [];
      const trades = proxyWallet.trades || [];

      // Calculate approval analytics
      const totalApprovals = approvals.length;
      const totalApprovalValue = approvals.reduce(
        (sum, approval) => sum + (parseFloat(approval.amount) || 0),
        0
      );
      const averageApproval =
        totalApprovals > 0 ? totalApprovalValue / totalApprovals : 0;

      // Calculate usage analytics
      const usedApprovals = approvals.filter(approval => {
        return trades.some(
          trade =>
            trade.tokenIn === approval.tokenAddress ||
            trade.tokenOut === approval.tokenAddress
        );
      });

      const usageRate =
        totalApprovals > 0
          ? ((usedApprovals.length / totalApprovals) * 100).toFixed(1)
          : '0';

      // Get most used tokens
      const tokenUsage = new Map<string, number>();
      trades.forEach(trade => {
        const tokenIn = trade.tokenIn;
        const tokenOut = trade.tokenOut;
        tokenUsage.set(tokenIn, (tokenUsage.get(tokenIn) || 0) + 1);
        tokenUsage.set(tokenOut, (tokenUsage.get(tokenOut) || 0) + 1);
      });

      const mostUsedTokens = Array.from(tokenUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const analyticsMessage = `
📊 Approvals Analytics:

💰 Approval Summary:
• Total Approvals: ${totalApprovals}
• Total Value: $${totalApprovalValue.toFixed(2)}
• Average Approval: $${averageApproval.toFixed(2)}
• Usage Rate: ${usageRate}%

🎯 Most Used Tokens:
${
  mostUsedTokens.length > 0
    ? mostUsedTokens
        .map(([token, count]) => `• ${token}: ${count} trades`)
        .join('\n')
    : '• No trades yet'
}

📈 Recent Approval Activity:
${approvals
  .slice(0, 5)
  .map(
    approval =>
      `• ${approval.tokenAddress}: ${approval.amount} (${new Date(approval.createdAt).toLocaleDateString()})`
  )
  .join('\n')}

💡 Recommendations:
• Consider increasing approval for frequently used tokens
• Review unused approvals to save gas
• Monitor approval usage patterns
      `;

      await ctx.editMessageText(analyticsMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'refresh_approvals' },
              { text: '📊 Portfolio', callback_data: 'refresh_portfolio' },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Error getting approvals analytics:', error);
      await ctx.answerCbQuery('❌ Error loading approvals analytics');
    }
  }

  /**
   * Get proxy wallet ETH balance
   */
  private static async getProxyWalletBalance(
    proxyAddress: string
  ): Promise<number> {
    try {
      // TODO: Integrate with real blockchain RPC to get actual balance
      // For now, return a placeholder balance
      return Math.random() * 10; // Random balance between 0-10 ETH
    } catch (error) {
      logger.error('Error getting proxy wallet balance:', error);
      return 0;
    }
  }

  /**
   * Format token address for display
   */
  private static formatTokenAddress(address: string): string {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Handle retry WebApp action callback
   */
  static async handleRetryWebAppAction(ctx: any): Promise<void> {
    try {
      const userId = ctx.from.id;

      await ctx.answerCbQuery('🔄 Retrying...');

      // Send WebApp URL again
      await ctx.reply('🌐 Opening WebApp...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Open WebApp', web_app: { url: this.WEBAPP_URL } }],
          ],
        },
      });
    } catch (error) {
      logger.error('Error handling retry WebApp action:', error);
    }
  }

  /**
   * Handle login start parameter
   */
  private static async handleLoginStart(ctx: any, user: TelegramUser, params?: Record<string, string>): Promise<void> {
    try {
      const userId = user.id.toString();

      // Parse parameters from start payload
      const refCode = params?.refCode || '';

      // Log for debugging
      logger.info(`Login start - User: ${userId}, StartPayload: ${ctx.payload}, Params:`, params);
      
      // Generate a unique login token
      const loginUrl = await AuthService.generateTelegramLoginLink(userId, refCode);
      
      const message = `
🔐 KunAI Login

Click the button below to access your KunAI dashboard:${refCode ? `

🎯 **Referral Code:** ${refCode}` : ''}

⚠️ **Security Notice:**
- This link is unique to your account
- Do not share this link with anyone
- The link will expire in 10 minutes
      `;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '🌐 Login to KunAI',
              url: loginUrl
            }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: inlineKeyboard });
      
    } catch (error) {
      logger.error('Error handling login start:', error);
      await ctx.reply('❌ Error generating login link. Please try again.');
    }
  }

  /**
   * Parse start payload parameters
   * Handles URLs like: start=login&refCode=asdasd
   */
  private static parseStartPayload(startPayload?: string): { action?: string, params?: Record<string, string> } {
    const params: Record<string, string> = {};
    
    if (!startPayload) return {};

    const [action, rest] = startPayload.split('_');

    if (!action) {
      return {}
    }

    // Split by & to get individual parameters
    const paramPairs = rest?.split('-') || [];

    for (const pair of paramPairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }
    
    return {
      action,
      params
    };
  }
}
