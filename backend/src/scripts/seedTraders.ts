import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { parseEther } from 'viem';

const sampleTraders = [
  {
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    label: 'Whale Trader 1',
    category: 'smart-money',
    ethBalance: parseEther('150.5').toString(),
    oneDayPnl: parseEther('2.3').toString(),
    sevenDayPnl: parseEther('15.7').toString(),
    thirtyDayPnl: parseEther('45.2').toString(),
    sevenDayWinRate: 78.5,
    sevenDayTransactions: 23,
    trackedBy: 156,
    sevenDayAvgDuration: 45,
    sevenDayAvgCost: parseEther('0.8').toString(),
  },
  {
    address: '0x8ba1f109551bD432803012645Hac136c22C177e9',
    label: 'KOL Trader',
    category: 'kol-vc',
    ethBalance: parseEther('89.2').toString(),
    oneDayPnl: parseEther('1.8').toString(),
    sevenDayPnl: parseEther('12.4').toString(),
    thirtyDayPnl: parseEther('38.9').toString(),
    sevenDayWinRate: 82.1,
    sevenDayTransactions: 18,
    trackedBy: 234,
    sevenDayAvgDuration: 32,
    sevenDayAvgCost: parseEther('0.6').toString(),
  },
  {
    address: '0x1234567890123456789012345678901234567890',
    label: 'Fresh Wallet',
    category: 'fresh-wallet',
    ethBalance: parseEther('25.8').toString(),
    oneDayPnl: parseEther('0.9').toString(),
    sevenDayPnl: parseEther('6.2').toString(),
    thirtyDayPnl: parseEther('18.5').toString(),
    sevenDayWinRate: 65.3,
    sevenDayTransactions: 12,
    trackedBy: 45,
    sevenDayAvgDuration: 28,
    sevenDayAvgCost: parseEther('0.4').toString(),
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    label: 'Sniper Bot',
    category: 'sniper',
    ethBalance: parseEther('67.3').toString(),
    oneDayPnl: parseEther('1.2').toString(),
    sevenDayPnl: parseEther('8.9').toString(),
    thirtyDayPnl: parseEther('27.3').toString(),
    sevenDayWinRate: 71.8,
    sevenDayTransactions: 31,
    trackedBy: 89,
    sevenDayAvgDuration: 15,
    sevenDayAvgCost: parseEther('0.3').toString(),
  },
  {
    address: '0x9876543210987654321098765432109876543210',
    label: 'Smart Money 2',
    category: 'smart-money',
    ethBalance: parseEther('203.7').toString(),
    oneDayPnl: parseEther('3.1').toString(),
    sevenDayPnl: parseEther('21.5').toString(),
    thirtyDayPnl: parseEther('62.8').toString(),
    sevenDayWinRate: 85.2,
    sevenDayTransactions: 27,
    trackedBy: 312,
    sevenDayAvgDuration: 52,
    sevenDayAvgCost: parseEther('1.2').toString(),
  },
];

const sampleTokens = [
  { symbol: 'PEPE', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933' },
  { symbol: 'SHIB', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  { symbol: 'DOGE', address: '0x3832d2f059e55934220881f831be501d180671a7' },
  { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
  { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
];

async function seedTraders() {
  try {
    logger.info('Starting trader seed...');

    for (const traderData of sampleTraders) {
      // Create or update trader
      const trader = await (prisma as any).trader.upsert({
        where: { address: traderData.address },
        update: traderData,
        create: traderData,
      });

      // Create sample stats for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dailyPnl = parseEther((Math.random() * 2 - 1).toFixed(4)).toString();
        const trades = Math.floor(Math.random() * 5) + 1;
        const wins = Math.floor(trades * (traderData.sevenDayWinRate / 100));
        const losses = trades - wins;
        
        await (prisma as any).traderStats.upsert({
          where: {
            traderId_date: {
              traderId: trader.id,
              date: date.toISOString().split('T')[0],
            },
          },
          update: {
            pnl: dailyPnl,
            trades,
            wins,
            losses,
            volume: parseEther((Math.random() * 10).toFixed(4)).toString(),
            topTokens: sampleTokens.slice(0, 3).map(t => t.address),
            profitChart: Array.from({ length: 7 }, () => Math.random() * 2 - 1),
          },
          create: {
            traderId: trader.id,
            date: date.toISOString().split('T')[0],
            pnl: dailyPnl,
            trades,
            wins,
            losses,
            volume: parseEther((Math.random() * 10).toFixed(4)).toString(),
            topTokens: sampleTokens.slice(0, 3).map(t => t.address),
            profitChart: Array.from({ length: 7 }, () => Math.random() * 2 - 1),
          },
        });
      }

      // Create sample token holdings
      for (let i = 0; i < 5; i++) {
        const token = sampleTokens[i];
        if (token) {
          await (prisma as any).traderToken.upsert({
            where: {
              traderId_tokenAddress: {
                traderId: trader.id,
                tokenAddress: token.address,
              },
            },
            update: {
              tokenSymbol: token.symbol,
              tokenName: token.symbol,
              balance: (Math.random() * 1000000).toString(),
              valueUSD: (Math.random() * 50000).toString(),
              percentage: Math.random() * 20,
            },
            create: {
              traderId: trader.id,
              tokenAddress: token.address,
              tokenSymbol: token.symbol,
              tokenName: token.symbol,
              balance: (Math.random() * 1000000).toString(),
              valueUSD: (Math.random() * 50000).toString(),
              percentage: Math.random() * 20,
            },
          });
        }
      }

      // Create sample trades
      for (let i = 0; i < 10; i++) {
        const tradeDate = new Date();
        tradeDate.setDate(tradeDate.getDate() - Math.floor(Math.random() * 7));
        
        const randomToken = sampleTokens[Math.floor(Math.random() * sampleTokens.length)];
        if (randomToken) {
          await (prisma as any).traderTrade.create({
            data: {
              traderId: trader.id,
              hash: `0x${Math.random().toString(16).slice(2, 66)}`,
              tokenAddress: randomToken.address,
              tokenSymbol: randomToken.symbol,
              type: Math.random() > 0.5 ? 'buy' : 'sell',
              amount: parseEther((Math.random() * 2).toFixed(4)).toString(),
              tokenAmount: (Math.random() * 1000000).toString(),
              priceUSD: Math.random() * 100,
              gasUsed: parseEther('0.001').toString(),
              gasPrice: parseEther('0.00000002').toString(),
              timestamp: tradeDate,
              profit: parseEther((Math.random() * 2 - 1).toFixed(4)).toString(),
              duration: Math.floor(Math.random() * 60) + 5,
            },
          });
        }
      }

      logger.info(`Seeded trader: ${traderData.label}`);
    }

    logger.info('Trader seed completed successfully!');
  } catch (error) {
    logger.error('Error seeding traders:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedTraders()
    .then(() => {
      logger.info('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedTraders }; 