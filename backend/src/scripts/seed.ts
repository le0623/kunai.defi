import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    // Clear existing data
    await prisma.alert.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.monitoredWallet.deleteMany();
    await prisma.smartWalletLabel.deleteMany();
    await prisma.contractAnalysis.deleteMany();
    await prisma.tradingBot.deleteMany();
    await prisma.copyTrade.deleteMany();
    await prisma.user.deleteMany();

    logger.info('🗑️  Cleared existing data');

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        nonce: 'test-nonce-1'
      }
    });

    const user2 = await prisma.user.create({
      data: {
        address: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
        nonce: 'test-nonce-2'
      }
    });

    logger.info('👥 Created test users');

    // Create smart wallet labels
    const smartWallets = [
      {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        label: 'Whale Wallet',
        category: 'whale',
        confidence: 0.9,
        source: 'kunai-analyzer'
      },
      {
        address: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
        label: 'Active Trader',
        category: 'trader',
        confidence: 0.8,
        source: 'kunai-analyzer'
      },
      {
        address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
        label: 'DeFi User',
        category: 'defi',
        confidence: 0.7,
        source: 'kunai-analyzer'
      }
    ];

    for (const wallet of smartWallets) {
      await prisma.smartWalletLabel.create({
        data: wallet
      });
    }

    logger.info('🏷️  Created smart wallet labels');

    // Create monitored wallets
    const monitoredWallet1 = await prisma.monitoredWallet.create({
      data: {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        label: 'Whale Wallet',
        isSmart: true,
        riskScore: 15,
        userId: user1.id
      }
    });

    const monitoredWallet2 = await prisma.monitoredWallet.create({
      data: {
        address: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
        label: 'Active Trader',
        isSmart: true,
        riskScore: 25,
        userId: user1.id
      }
    });

    logger.info('👀 Created monitored wallets');

    // Create sample transactions
    const transactions = [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: BigInt(18000000),
        timestamp: new Date('2024-01-15T10:30:00Z'),
        from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        value: '1000000000000000000', // 1 ETH
        gasPrice: '20000000000',
        gasUsed: '150000',
        method: 'swapExactETHForTokens',
        tokenAddress: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
        tokenSymbol: 'USDC',
        tokenAmount: '1800000000', // 1800 USDC
        tokenDecimals: 6,
        monitoredWalletId: monitoredWallet1.id
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: BigInt(18000001),
        timestamp: new Date('2024-01-15T11:15:00Z'),
        from: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
        to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        value: '500000000000000000', // 0.5 ETH
        gasPrice: '25000000000',
        gasUsed: '120000',
        method: 'swapExactETHForTokens',
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        tokenSymbol: 'USDT',
        tokenAmount: '900000000', // 900 USDT
        tokenDecimals: 6,
        monitoredWalletId: monitoredWallet2.id
      }
    ];

    for (const tx of transactions) {
      await prisma.transaction.create({
        data: tx
      });
    }

    logger.info('💸 Created sample transactions');

    // Create portfolio entries
    const portfolios = [
      {
        monitoredWalletId: monitoredWallet1.id,
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        tokenAddress: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        balance: '1800000000',
        valueUSD: '1800.00',
        priceUSD: '1.00'
      },
      {
        monitoredWalletId: monitoredWallet1.id,
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        tokenSymbol: 'ETH',
        tokenName: 'Ethereum',
        balance: '5000000000000000000',
        valueUSD: '10000.00',
        priceUSD: '2000.00'
      },
      {
        monitoredWalletId: monitoredWallet2.id,
        walletAddress: '0x8ba1f109551bD432803012645Hac136c772c3c7c',
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        tokenSymbol: 'USDT',
        tokenName: 'Tether USD',
        balance: '900000000',
        valueUSD: '900.00',
        priceUSD: '1.00'
      }
    ];

    for (const portfolio of portfolios) {
      await prisma.portfolio.create({
        data: portfolio
      });
    }

    logger.info('💼 Created portfolio entries');

    // Create sample alerts
    const alerts = [
      {
        type: 'buy',
        severity: 'low',
        message: 'Smart wallet 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 made a buy transaction',
        metadata: { transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
        userId: user1.id,
        monitoredWalletId: monitoredWallet1.id
      },
      {
        type: 'sell',
        severity: 'high',
        message: 'Smart wallet 0x8ba1f109551bD432803012645Hac136c772c3c7c made a sell transaction',
        metadata: { transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' },
        userId: user1.id,
        monitoredWalletId: monitoredWallet2.id
      }
    ];

    for (const alert of alerts) {
      await prisma.alert.create({
        data: alert
      });
    }

    logger.info('🚨 Created sample alerts');

    // Create contract analysis
    const contractAnalysis = [
      {
        contractAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        name: 'Uniswap V2 Router',
        symbol: 'UNI',
        decimals: 18,
        totalSupply: '1000000000000000000000000000',
        isHoneypot: false,
        isRugPull: false,
        hasProxy: false,
        isVerified: true,
        riskScore: 5,
        riskFactors: [],
        lastAnalyzed: new Date(),
        analysisSource: 'kunai-analyzer'
      },
      {
        contractAddress: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        totalSupply: '1000000000000000',
        isHoneypot: false,
        isRugPull: false,
        hasProxy: false,
        isVerified: true,
        riskScore: 0,
        riskFactors: [],
        lastAnalyzed: new Date(),
        analysisSource: 'kunai-analyzer'
      }
    ];

    for (const contract of contractAnalysis) {
      await prisma.contractAnalysis.create({
        data: contract
      });
    }

    logger.info('📋 Created contract analysis');

    // Create trading bots
    const tradingBots = [
      {
        name: 'DCA Bot',
        isActive: true,
        config: {
          strategy: 'dollar_cost_averaging',
          interval: 'daily',
          amount: '100',
          tokens: ['ETH', 'USDC']
        },
        status: 'running',
        lastRun: new Date(),
        userId: user1.id
      },
      {
        name: 'Arbitrage Bot',
        isActive: false,
        config: {
          strategy: 'arbitrage',
          minProfit: '0.5',
          exchanges: ['uniswap', 'sushiswap']
        },
        status: 'stopped',
        userId: user1.id
      }
    ];

    for (const bot of tradingBots) {
      await prisma.tradingBot.create({
        data: bot
      });
    }

    logger.info('🤖 Created trading bots');

    // Create copy trading entries
    const copyTrades = [
      {
        targetAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        allocation: 50.0,
        maxSlippage: 2.0,
        isActive: true,
        userId: user1.id
      }
    ];

    for (const copyTrade of copyTrades) {
      await prisma.copyTrade.create({
        data: copyTrade
      });
    }

    logger.info('📋 Created copy trading entries');

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`📊 Created ${smartWallets.length} smart wallet labels`);
    logger.info(`👀 Created ${2} monitored wallets`);
    logger.info(`💸 Created ${transactions.length} transactions`);
    logger.info(`💼 Created ${portfolios.length} portfolio entries`);
    logger.info(`🚨 Created ${alerts.length} alerts`);
    logger.info(`📋 Created ${contractAnalysis.length} contract analyses`);
    logger.info(`🤖 Created ${tradingBots.length} trading bots`);
    logger.info(`📋 Created ${copyTrades.length} copy trading entries`);

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('🎉 Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

export default seed; 