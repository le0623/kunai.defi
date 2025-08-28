import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { parseEther } from 'viem';

const sampleTokens = [
  { symbol: 'PEPE', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe' },
  { symbol: 'SHIB', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'Shiba Inu' },
  { symbol: 'DOGE', address: '0x3832d2f059e55934220881f831be501d180671a7', name: 'Dogecoin' },
  { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap' },
  { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca', name: 'Chainlink' },
];

async function seedTrades() {
  try {
    logger.info('Starting trade seed...');

    // Get users with in-app wallets
    const users = await prisma.user.findMany({
      where: {
        inAppWallet: {
          isActive: true
        }
      },
      include: {
        inAppWallet: true
      },
      take: 5
    });

    if (users.length === 0) {
      logger.warn('No users with in-app wallets found. Creating sample users...');
      
      // Create sample users with in-app wallets
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            email: `trader${i + 1}@example.com`,
            inAppWallet: {
              create: {
                address: `0x${Math.random().toString(16).slice(2, 42)}`,
                encryptedPrivateKey: 'sample-encrypted-key',
                isActive: true
              }
            }
          },
          include: {
            inAppWallet: true
          }
        });
        users.push(user);
      }
    }

    // Create sample trades for each user
    for (const user of users) {
      if (!user.inAppWallet) continue;

      logger.info(`Creating trades for user: ${user.inAppWallet.address}`);

      // Create trades for the last 30 days
      for (let day = 29; day >= 0; day--) {
        const tradeDate = new Date();
        tradeDate.setDate(tradeDate.getDate() - day);
        
        // Create 1-5 trades per day
        const tradesPerDay = Math.floor(Math.random() * 5) + 1;
        
        for (let tradeIndex = 0; tradeIndex < tradesPerDay; tradeIndex++) {
          const token = sampleTokens[Math.floor(Math.random() * sampleTokens.length)];
          if (!token) continue;
          
          const isBuy = Math.random() > 0.5;
          const amount = parseEther((Math.random() * 2 + 0.1).toFixed(4)).toString();
          const tokenAmount = (Math.random() * 1000000).toString();
          const priceUSD = Math.random() * 100;
          const priceETH = parseEther((Math.random() * 0.01).toFixed(6)).toString();
          const gasUsed = parseEther('0.001').toString();
          const gasPrice = parseEther('0.00000002').toString();
          const gasCost = parseEther('0.00000002').toString();
          
          // Calculate profit (simplified - in reality this would be calculated from actual trade data)
          const profit = parseEther((Math.random() * 2 - 1).toFixed(4)).toString();
          const duration = Math.floor(Math.random() * 60) + 5;
          
          // Randomly make some trades copy trades
          const isCopyTrade = Math.random() > 0.7;
          const copiedFrom = isCopyTrade ? users[Math.floor(Math.random() * users.length)]?.inAppWallet?.address : null;

          await (prisma as any).trade.create({
            data: {
              hash: `0x${Math.random().toString(16).slice(2, 66)}`,
              userAddress: user.inAppWallet.address,
              tokenAddress: token.address,
              tokenSymbol: token.symbol,
              tokenName: token.name,
              type: isBuy ? 'buy' : 'sell',
              amount,
              tokenAmount,
              priceUSD,
              priceETH,
              gasUsed,
              gasPrice,
              gasCost,
              timestamp: new Date(tradeDate.getTime() + tradeIndex * 3600000), // Spread trades throughout the day
              blockNumber: BigInt(Math.floor(Math.random() * 10000000)),
              status: 'confirmed',
              profit,
              duration,
              isCopyTrade,
              copiedFrom,
              dexName: 'Uniswap',
              dexVersion: 'V2',
              slippage: Math.random() * 5,
              riskScore: Math.floor(Math.random() * 100),
              isHoneypot: false,
              isRugPull: false,
              userId: user.id
            }
          });
        }
      }

      // Create some copy trade settings
      if (Math.random() > 0.5) {
        const targetUser = users[Math.floor(Math.random() * users.length)];
        if (targetUser && targetUser.inAppWallet && targetUser.id !== user.id) {
          await (prisma as any).copyTrade.create({
            data: {
              userId: user.id,
              name: `Copy ${targetUser.inAppWallet.address.slice(0, 6)}...`,
              targetAddress: targetUser.inAppWallet.address,
              targetLabel: `Trader ${targetUser.id.slice(0, 8)}`,
              allocation: Math.floor(Math.random() * 20) + 5, // 5-25%
              maxSlippage: Math.random() * 5 + 1, // 1-6%
              gasLimit: 500000,
              gasPrice: Math.floor(Math.random() * 30) + 10, // 10-40 Gwei
              minTradeAmount: '0.01',
              maxTradeAmount: '1.0',
              tokenWhitelist: sampleTokens.slice(0, 3).map(t => t.address),
              tokenBlacklist: [],
              maxDailyLoss: '0.1',
              stopLoss: Math.random() * 20 + 5, // 5-25%
              takeProfit: Math.random() * 30 + 10, // 10-40%
              totalTrades: Math.floor(Math.random() * 50),
              totalProfit: parseEther((Math.random() * 10 - 5).toFixed(4)).toString(),
              winRate: Math.random() * 100
            }
          });
        }
      }

      logger.info(`Created trades for user: ${user.inAppWallet.address}`);
    }

    logger.info('Trade seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding trades:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedTrades()
    .then(() => {
      logger.info('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedTrades }; 