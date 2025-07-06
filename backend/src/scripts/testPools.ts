import { PoolService } from '@/services/poolService';
import { logger } from '@/utils/logger';

async function testPoolAPI() {
  try {
    logger.info('Testing Pool API with real market data...');

    // Test getting new pairs by rank
    const result = await PoolService.getNewPairsByRank({
      timeframe: '1h',
      limit: 10,
      page: 1,
      sortBy: 'market_cap',
      sortOrder: 'desc'
    });

    logger.info(`Successfully fetched ${result.pools.length} pools`);
    logger.info(`Total pools available: ${result.total}`);
    logger.info(`Has more: ${result.hasMore}`);

    // Log first few pools
    result.pools.slice(0, 3).forEach((pool, index) => {
      logger.info(`Pool ${index + 1}:`);
      logger.info(`  Symbol: ${pool.base_token_info.symbol}`);
      logger.info(`  Name: ${pool.base_token_info.name}`);
      logger.info(`  Market Cap: $${pool.base_token_info.market_cap}`);
      logger.info(`  Volume: $${pool.base_token_info.volume}`);
      logger.info(`  Exchange: ${pool.exchange}`);
      logger.info(`  Chain: ${pool.chain}`);
      logger.info('---');
    });

    // Test getting pools by type
    const newPools = await PoolService.getPoolsByType('new', {
      timeframe: '1h',
      limit: 5
    });

    logger.info(`New pools found: ${newPools.pools.length}`);

    const burntPools = await PoolService.getPoolsByType('burnt', {
      timeframe: '1h',
      limit: 5
    });

    logger.info(`Burnt pools found: ${burntPools.pools.length}`);

    const dexscreenerPools = await PoolService.getPoolsByType('dexscreener', {
      timeframe: '1h',
      limit: 5
    });

    logger.info(`Dexscreener pools found: ${dexscreenerPools.pools.length}`);

    logger.info('Pool API test completed successfully!');
  } catch (error) {
    logger.error('Error testing Pool API:', error);
  }
}

// Run the test
testPoolAPI(); 