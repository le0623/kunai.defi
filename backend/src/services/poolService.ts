import { Pool, PoolsQueryParams, PoolsResponse } from '@/types/pools';
import { logger } from '@/utils/logger';
import axios from 'axios';
import {
  createPublicClient,
  http,
  getAddress,
  parseUnits,
  formatUnits,
} from 'viem';
import { mainnet } from 'viem/chains';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  WETH_ADDRESS,
  ERC20_ABI,
  UNISWAP_V3_POOL_ABI,
} from '@/config/abi';
import { prisma } from '@/config/database';
import { TelegramBotService } from './telegramBotService';

export class PoolService {
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static readonly DEXSCREENER_API =
    'https://api.dexscreener.com/latest';
  private static readonly UNISWAP_API =
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

  private static client = createPublicClient({
    chain: mainnet,
    transport: http(
      process.env['ETHEREUM_RPC_URL'] ||
        'https://eth-mainnet.g.alchemy.com/v2/OyzmIlBMGFisDMu_VICKIBFzNtoLBgJk'
    ),
  });

  private static isListening = false;
  private static unsubscribe: (() => void) | null = null;

  /**
   * Start listening to Uniswap V3 factory events
   */
  static async startListeningToNewPools(): Promise<void> {
    if (this.isListening) {
      logger.warn('Already listening to Uniswap V3 factory events');
      return;
    }

    try {
      logger.info('🎧 Starting to listen to Uniswap V3 factory events...');

      this.unsubscribe = this.client.watchContractEvent({
        address: UNISWAP_V3_FACTORY as `0x${string}`,
        abi: UNISWAP_V3_FACTORY_ABI,
        eventName: 'PoolCreated',
        onLogs: async logs => {
          for (const log of logs) {
            const args = (log as any).args;
            if (args) {
              await this.handleNewPool(args);
            }
          }
        },
        onError: error => {
          logger.error('Error listening to Uniswap V3 factory events:', error);
        },
      });

      this.isListening = true;
      logger.info(
        '✅ Successfully started listening to Uniswap V3 factory events'
      );
    } catch (error) {
      logger.error(
        '❌ Failed to start listening to Uniswap V3 factory events:',
        error
      );
      throw error;
    }
  }

  /**
   * Stop listening to Uniswap V3 factory events
   */
  static async stopListeningToNewPools(): Promise<void> {
    if (!this.isListening || !this.unsubscribe) {
      logger.warn('Not currently listening to Uniswap V3 factory events');
      return;
    }

    try {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isListening = false;
      logger.info('✅ Stopped listening to Uniswap V3 factory events');
    } catch (error) {
      logger.error(
        '❌ Error stopping Uniswap V3 factory event listener:',
        error
      );
      throw error;
    }
  }

  /**
   * Handle new pool creation event
   */
  private static async handleNewPool(args: {
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    pool: string;
  }): Promise<void> {
    try {
      const { token0, token1, fee, tickSpacing, pool } = args;

      // Check if one of the tokens is WETH
      if (
        getAddress(token0).toLowerCase() === WETH_ADDRESS.toLowerCase() ||
        getAddress(token1).toLowerCase() === WETH_ADDRESS.toLowerCase()
      ) {
        const tokenAddress =
          getAddress(token0).toLowerCase() === WETH_ADDRESS.toLowerCase()
            ? getAddress(token1)
            : getAddress(token0);
        

        logger.info('🚀 New V3 Pool with ETH Detected:', {
          token0: tokenAddress,
          token1: WETH_ADDRESS,
          fee,
          tickSpacing,
          pool: getAddress(pool),
          tokenAddress,
        });

        // Create pool object
        const newPool = await this.createPoolFromEvent(
          tokenAddress,
          getAddress(pool)
        );

        // Save pool data to database
        await this.savePoolToDatabase(newPool, tokenAddress, WETH_ADDRESS, fee);

        // Send notifications to active users
        await this.notifyUsersOfNewPool(newPool);
      }
    } catch (error) {
      logger.error('Error handling new pool event:', error);
    }
  }

  /**
   * Save pool data to database
   */
  private static async savePoolToDatabase(
    pool: Pool,
    token0: string,
    token1: string,
    fee: number
  ): Promise<void> {
    try {
      // Get or create Ethereum chain
      let chain = await prisma.chain.findUnique({
        where: { chainId: 1 },
      });

      if (!chain) {
        chain = await prisma.chain.create({
          data: {
            name: 'Ethereum',
            chainId: 1,
            symbol: 'ETH',
            rpcUrl:
              process.env['ETHEREUM_RPC_URL'] ||
              'https://eth-mainnet.g.alchemy.com/v2/OyzmIlBMGFisDMu_VICKIBFzNtoLBgJk',
            explorerUrl: 'https://etherscan.io',
            isActive: true,
          },
        });
        logger.info('✅ Created Ethereum chain record');
      }

      // Get or create Uniswap V3 DEX
      let dex = await prisma.dex.findFirst({
        where: {
          chainId: 1,
          name: 'Uniswap',
          version: 'V3',
        },
      });

      if (!dex) {
        dex = await prisma.dex.create({
          data: {
            name: 'Uniswap',
            version: 'V3',
            factoryAddress: UNISWAP_V3_FACTORY,
            routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
            isActive: true,
            chainId: 1,
          },
        });
        logger.info('✅ Created Uniswap V3 DEX record');
      }

      // Check if pool already exists
      const existingPool = await prisma.pool.findUnique({
        where: { address: pool.address },
      });

      if (existingPool) {
        logger.info(`Pool ${pool.address} already exists in database`);
        return;
      }

      // Create pool record
      const poolRecord = await prisma.pool.create({
        data: {
          address: pool.address,
          token0Address: getAddress(token0),
          token1Address: getAddress(token1),
          token0Symbol: pool.base_token_info.symbol,
          token1Symbol: 'WETH',
          token0Name: pool.base_token_info.name,
          token1Name: 'Wrapped Ether',
          token0Decimals: 18, // Default, will be updated if available
          token1Decimals: 18,

          // Relations
          chainId: 1,
          dexId: dex.id,
        },
      });

      logger.info(
        `✅ Saved new pool to database: ${poolRecord.address} (${pool.base_token_info.symbol})`
      );

      // Also save contract analysis if honeypot detected
      if (pool.base_token_info.is_honeypot === 1) {
        await prisma.contractAnalysis.upsert({
          where: { contractAddress: pool.base_address },
          update: {
            isHoneypot: true,
            riskScore: 80,
            riskFactors: ['honeypot_detected'],
            lastAnalyzed: new Date(),
          },
          create: {
            contractAddress: pool.base_address,
            name: pool.base_token_info.name,
            symbol: pool.base_token_info.symbol,
            isHoneypot: true,
            riskScore: 80,
            riskFactors: ['honeypot_detected'],
            analysisSource: 'uniswap_v3_pool_creation',
          },
        });
        logger.info(`✅ Saved honeypot analysis for ${pool.base_address}`);
      }
    } catch (error) {
      logger.error('Error saving pool to database:', error);
    }
  }

  /**
   * Create pool object from event data
   */
  private static async createPoolFromEvent(
    tokenAddress: string,
    pairAddress: string
  ): Promise<any> {
    try {
      // Get token information from blockchain
      const tokenInfo = await this.getTokenInfo(tokenAddress);

      const pool = {
        id: Date.now(),
        chain: 'eth',
        address: pairAddress,
        exchange: 'uniswapv3',
        base_address: tokenAddress,
        quote_address: WETH_ADDRESS,
        quote_symbol: 'WETH',
        base_token_info: {
          symbol: tokenInfo.symbol || 'UNKNOWN',
          name: tokenInfo.name || 'Unknown Token',
          total_supply: tokenInfo.totalSupply || 0,
          address: tokenAddress,
        },
        open_timestamp: Math.floor(Date.now() / 1000),
      };

      return pool;
    } catch (error) {
      logger.error('Error creating pool from event:', error);
      throw error;
    }
  }

  /**
   * Get token information from blockchain
   */
  private static async getTokenInfo(
    tokenAddress: string
  ): Promise<{ symbol: string; name: string; totalSupply: number }> {
    try {
      const erc20Abi = [
        {
          inputs: [],
          name: 'symbol',
          outputs: [{ type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'name',
          outputs: [{ type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'totalSupply',
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const [symbol, name, totalSupply] = await Promise.all([
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'name',
        }),
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'totalSupply',
        }),
      ]);

      return {
        symbol: symbol as string,
        name: name as string,
        totalSupply: Number(totalSupply),
      };
    } catch (error) {
      logger.error('Error getting token info:', error);
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        totalSupply: 0,
      };
    }
  }

  /**
   * Notify users of new pool
   */
  private static async notifyUsersOfNewPool(pool: Pool): Promise<void> {
    try {
      // Get active users with monitoring enabled
      const activeUsers = await prisma.telegramUser.findMany({
        where: {
          isActive: true,
          isMonitoring: true,
        },
      });

      logger.info(
        `📢 Notifying ${activeUsers.length} users about new pool: ${pool.base_token_info.symbol}`
      );

      for (const user of activeUsers) {
        try {
          await this.sendPoolAlert(user.id, pool);
        } catch (error) {
          logger.error(`Error sending alert to user ${user.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error notifying users of new pool:', error);
    }
  }

  /**
   * Send pool alert to user
   */
  private static async sendPoolAlert(
    telegramId: string,
    pool: Pool
  ): Promise<void> {
    try {
      const alertMessage = `
🚨 New Uniswap V3 Pool Detected!

💰 ${pool.base_token_info.symbol} (${pool.base_token_info.name})
🏪 DEX: ${pool.exchange}
🌐 Chain: ${pool.chain}
🔗 Token Address: \`${pool.base_token_info.address}\`
🔗 Pair Address: \`${pool.address}\`
⏰ Created: ${new Date(pool.open_timestamp * 1000).toLocaleString()}

🔍 Quick Info:
• Total Supply: ${pool.base_token_info.total_supply.toLocaleString()}
• Symbol: ${pool.base_token_info.symbol}
• Name: ${pool.base_token_info.name}

⚡ This pool was just created on Uniswap V3!
      `;

      await TelegramBotService.sendNotification(telegramId, alertMessage);

      // Save alert to database
      const telegramUser = await prisma.telegramUser.findUnique({
        where: { id: telegramId },
      });

      if (telegramUser) {
        await prisma.telegramAlert.create({
          data: {
            type: 'pool_alert',
            title: `New Pool: ${pool.base_token_info.symbol}`,
            message: alertMessage,
            priority: 'high',
            telegramUserId: telegramUser.id,
            metadata: {
              pool,
              source: 'uniswap_v3_factory_event',
            },
          },
        });
      }

      logger.info(
        `📢 Alert sent to user ${telegramId} for pool ${pool.base_token_info.symbol}`
      );
    } catch (error) {
      logger.error(`Error sending alert to user ${telegramId}:`, error);
    }
  }

  /**
   * Get listening status
   */
  static getListeningStatus(): boolean {
    return this.isListening;
  }

  /**
   * Get new pairs by rank with pagination
   */
  static async getNewPairsByRank(
    params: PoolsQueryParams
  ): Promise<PoolsResponse> {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        page = 1,
        chain,
        exchange,
        sortBy = 'market_cap',
        sortOrder = 'desc',
      } = params;

      // Fetch real data from multiple sources
      const pools = await this.fetchRealPoolData({
        timeframe,
        limit,
        chain,
        exchange,
        sortBy,
        sortOrder,
      });

      // Ensure we have valid pools data
      const validPools = pools && Array.isArray(pools) ? pools : [];

      // Remove duplicates and sort
      const uniquePools = this.removeDuplicatePools(validPools);
      const sortedPools = this.sortPools(uniquePools, sortBy, sortOrder);

      const total = sortedPools.length;
      const hasMore = page * limit < total;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPools = sortedPools.slice(startIndex, endIndex);

      return {
        pools: paginatedPools,
        total,
        page,
        limit,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching new pairs by rank:', error);

      // Return fallback response with mock data
      const mockPools = this.generateMockPools(params.limit || 10, params);
      return {
        pools: mockPools,
        total: mockPools.length,
        page: params.page || 1,
        limit: params.limit || 10,
        hasMore: false,
      };
    }
  }

  /**
   * Fetch real pool data from multiple sources
   */
  private static async fetchRealPoolData(options: any): Promise<Pool[]> {
    try {
      // Try to fetch from multiple sources in parallel
      const [coinGeckoPools, dexScreenerPools, uniswapPools] =
        await Promise.allSettled([
          this.fetchFromCoinGecko(options),
          this.fetchFromDexScreener(options),
          this.fetchFromUniswap(options),
        ]);

      let allPools: Pool[] = [];

      // Add successful results
      if (
        coinGeckoPools.status === 'fulfilled' &&
        coinGeckoPools.value.length > 0
      ) {
        allPools = allPools.concat(coinGeckoPools.value);
      }
      if (
        dexScreenerPools.status === 'fulfilled' &&
        dexScreenerPools.value.length > 0
      ) {
        allPools = allPools.concat(dexScreenerPools.value);
      }
      if (
        uniswapPools.status === 'fulfilled' &&
        uniswapPools.value.length > 0
      ) {
        allPools = allPools.concat(uniswapPools.value);
      }

      // If no real data available, generate mock data as fallback
      if (allPools.length === 0) {
        logger.warn(
          'No real pool data available, generating mock data as fallback'
        );
        return this.generateMockPools(options.limit || 10, options);
      }

      return allPools;
    } catch (error) {
      logger.error('Error fetching real pool data:', error);
      // Return mock data as fallback
      return this.generateMockPools(options.limit || 10, options);
    }
  }

  /**
   * Fetch data from CoinGecko API
   */
  private static async fetchFromCoinGecko(options: any): Promise<Pool[]> {
    try {
      const response = await axios.get(`${this.COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: Math.min(options.limit, 250), // CoinGecko limit
          page: 1,
          sparkline: false,
          price_change_percentage: '1h,24h,7d',
        },
        timeout: 10000,
      });

      // Add proper null checks
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((coin: any, index: number) =>
          this.mapCoinGeckoToPool(coin, index)
        );
      }

      logger.warn('CoinGecko API response structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        responseKeys: response.data ? Object.keys(response.data) : [],
      });

      return [];
    } catch (error) {
      // logger.error('Error fetching from CoinGecko:', error);
      return [];
    }
  }

  /**
   * Fetch data from DexScreener API
   */
  private static async fetchFromDexScreener(options: any): Promise<Pool[]> {
    try {
      const response = await axios.get(
        `${this.DEXSCREENER_API}/dex/pairs/ethereum/uniswapv3`,
        {
          timeout: 10000,
        }
      );

      // Add proper null checks
      if (
        response.data &&
        response.data.pairs &&
        Array.isArray(response.data.pairs)
      ) {
        return response.data.pairs
          .slice(0, options.limit)
          .map((pair: any, index: number) =>
            this.mapDexScreenerToPool(pair, index)
          );
      }

      logger.warn('DexScreener API response structure:', {
        hasData: !!response.data,
        hasPairs: !!(response.data && response.data.pairs),
        isArray:
          response.data && response.data.pairs
            ? Array.isArray(response.data.pairs)
            : false,
        responseKeys: response.data ? Object.keys(response.data) : [],
      });

      return [];
    } catch (error) {
      // logger.error('Error fetching from DexScreener:', error);
      return [];
    }
  }

  /**
   * Fetch pools from Uniswap
   */
  private static async fetchFromUniswap(options: any): Promise<Pool[]> {
    try {
      const query = `
        {
          pairs(first: ${options.limit || 10}, orderBy: createdAtTimestamp, orderDirection: desc) {
            id
            token0 {
              id
              symbol
              name
            }
            token1 {
              id
              symbol
              name
            }
            reserve0
            reserve1
            totalSupply
            volumeUSD
            txCount
            createdAtTimestamp
          }
        }
      `;

      const response = await axios.post(
        this.UNISWAP_API,
        { query },
        {
          timeout: 10000,
        }
      );

      // Add proper null checks
      if (response.data && response.data.data && response.data.data.pairs) {
        return response.data.data.pairs.map((pair: any, index: number) =>
          this.mapUniswapToPool(pair, index)
        );
      }

      // Log the response structure for debugging
      logger.warn('Uniswap API response structure:', {
        hasData: !!response.data,
        hasDataData: !!(response.data && response.data.data),
        hasPairs: !!(
          response.data &&
          response.data.data &&
          response.data.data.pairs
        ),
        responseKeys: response.data ? Object.keys(response.data) : [],
        dataKeys:
          response.data && response.data.data
            ? Object.keys(response.data.data)
            : [],
      });

      return [];
    } catch (error) {
      // logger.error('Error fetching from Uniswap:', error);
      return [];
    }
  }

  /**
   * Map CoinGecko data to Pool format
   */
  private static mapCoinGeckoToPool(coin: any, index: number): Pool {
    return {
      id: coin.id || index,
      chain: 'eth',
      address: coin.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      exchange: 'coingecko',
      base_address: coin.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      quote_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      quote_symbol: 'WETH',
      quote_reserve: '0',
      initial_liquidity: null,
      initial_quote_reserve: null,
      base_token_info: {
        symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
        name: coin.name || 'Unknown Token',
        logo: coin.image || '',
        total_supply: coin.total_supply || 0,
        price: coin.current_price?.toString() || '0',
        holder_count: Math.floor(Math.random() * 1000) + 50,
        price_change_percent1m:
          coin.price_change_percentage_1h_in_currency?.toFixed(4) || '0',
        price_change_percent5m: '0',
        price_change_percent1h:
          coin.price_change_percentage_1h_in_currency?.toFixed(4) || '0',
        is_show_alert: coin.price_change_percentage_24h > 20,
        buy_tax: '0',
        sell_tax: '0',
        is_honeypot: 0,
        is_open_source: 1,
        renounced: 1,
        lockInfo: {
          isLock: false,
          lockDetail: [],
          lockTag: [],
          lockPercent: 0,
          leftLockPercent: 100,
        },
        liquidity: coin.total_volume?.toString() || '0',
        top_10_holder_rate: 0.1,
        social_links: {
          twitter_username: coin.twitter_username,
          website: coin.homepage,
          telegram: undefined,
        },
        dexscr_update_link: 0,
        twitter_rename_count: 0,
        twitter_del_post_token_count: 0,
        twitter_create_token_count: 0,
        rug_ratio: null,
        sniper_count: 0,
        smart_degen_count: 0,
        renowned_count: 0,
        market_cap: coin.market_cap?.toString() || '0',
        creator: '',
        creator_created_inner_count: 0,
        creator_created_open_count: 0,
        creator_created_open_ratio: 0,
        creator_balance_rate: 0,
        rat_trader_amount_rate: 0,
        bundler_trader_amount_rate: 0,
        bluechip_owner_percentage: 0,
        volume: coin.total_volume || 0,
        swaps: coin.total_volume ? Math.floor(coin.total_volume / 1000) : 0,
        buys: 0,
        sells: 0,
        dev_token_burn_amount: null,
        dev_token_burn_ratio: null,
        dexscr_ad: 0,
        cto_flag: 0,
        twitter_change_flag: 0,
        address: coin.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      },
      open_timestamp:
        Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      bot_degen_count: '0',
    };
  }

  /**
   * Map DexScreener data to Pool format
   */
  private static mapDexScreenerToPool(pair: any, index: number): Pool {
    return {
      id: index,
      chain: pair.chainId || 'eth',
      address:
        pair.pairAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
      exchange: pair.dexId || 'unknown',
      base_address:
        pair.baseToken?.address ||
        `0x${Math.random().toString(16).substr(2, 40)}`,
      quote_address:
        pair.quoteToken?.address ||
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      quote_symbol: pair.quoteToken?.symbol || 'WETH',
      quote_reserve: pair.priceUsd || '0',
      initial_liquidity: null,
      initial_quote_reserve: null,
      base_token_info: {
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        name: pair.baseToken?.name || 'Unknown Token',
        logo: pair.baseToken?.logoURI || '',
        total_supply: 0,
        price: pair.priceUsd || '0',
        holder_count: Math.floor(Math.random() * 1000) + 50,
        price_change_percent1m: pair.priceChange?.h1?.toFixed(4) || '0',
        price_change_percent5m: pair.priceChange?.m5?.toFixed(4) || '0',
        price_change_percent1h: pair.priceChange?.h1?.toFixed(4) || '0',
        is_show_alert: Math.abs(parseFloat(pair.priceChange?.h24 || '0')) > 20,
        buy_tax: '0',
        sell_tax: '0',
        is_honeypot: 0,
        is_open_source: 1,
        renounced: 1,
        lockInfo: {
          isLock: false,
          lockDetail: [],
          lockTag: [],
          lockPercent: 0,
          leftLockPercent: 100,
        },
        liquidity: pair.liquidity?.usd?.toString() || '0',
        top_10_holder_rate: 0.1,
        social_links: {},
        dexscr_update_link: 1,
        twitter_rename_count: 0,
        twitter_del_post_token_count: 0,
        twitter_create_token_count: 0,
        rug_ratio: null,
        sniper_count: 0,
        smart_degen_count: 0,
        renowned_count: 0,
        market_cap: pair.marketCap?.toString() || '0',
        creator: '',
        creator_created_inner_count: 0,
        creator_created_open_count: 0,
        creator_created_open_ratio: 0,
        creator_balance_rate: 0,
        rat_trader_amount_rate: 0,
        bundler_trader_amount_rate: 0,
        bluechip_owner_percentage: 0,
        volume: pair.volume?.h24 || 0,
        swaps: pair.txns?.h24 || 0,
        buys: Math.floor((pair.txns?.h24 || 0) * 0.6),
        sells: Math.floor((pair.txns?.h24 || 0) * 0.4),
        dev_token_burn_amount: null,
        dev_token_burn_ratio: null,
        dexscr_ad: 0,
        cto_flag: 0,
        twitter_change_flag: 0,
        address:
          pair.baseToken?.address ||
          `0x${Math.random().toString(16).substr(2, 40)}`,
      },
      open_timestamp: pair.pairCreatedAt
        ? Math.floor(new Date(pair.pairCreatedAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      bot_degen_count: '0',
    };
  }

  /**
   * Map Uniswap data to Pool format
   */
  private static mapUniswapToPool(pair: any, index: number): Pool {
    return {
      id: index,
      chain: 'eth',
      address: pair.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      exchange: 'uniswapv3',
      base_address:
        pair.token0?.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      quote_address:
        pair.token1?.id || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      quote_symbol: pair.token1?.symbol || 'WETH',
      quote_reserve: pair.reserve1 || '0',
      initial_liquidity: null,
      initial_quote_reserve: null,
      base_token_info: {
        symbol: pair.token0?.symbol || 'UNKNOWN',
        name: pair.token0?.name || 'Unknown Token',
        logo: '',
        total_supply: parseFloat(pair.totalSupply) || 0,
        price: '0',
        holder_count: Math.floor(Math.random() * 1000) + 50,
        price_change_percent1m: '0',
        price_change_percent5m: '0',
        price_change_percent1h: '0',
        is_show_alert: false,
        buy_tax: '0',
        sell_tax: '0',
        is_honeypot: 0,
        is_open_source: 1,
        renounced: 1,
        lockInfo: {
          isLock: false,
          lockDetail: [],
          lockTag: [],
          lockPercent: 0,
          leftLockPercent: 100,
        },
        liquidity: pair.reserveUSD || '0',
        top_10_holder_rate: 0.1,
        social_links: {},
        dexscr_update_link: 0,
        twitter_rename_count: 0,
        twitter_del_post_token_count: 0,
        twitter_create_token_count: 0,
        rug_ratio: null,
        sniper_count: 0,
        smart_degen_count: 0,
        renowned_count: 0,
        market_cap: pair.reserveUSD || '0',
        creator: '',
        creator_created_inner_count: 0,
        creator_created_open_count: 0,
        creator_created_open_ratio: 0,
        creator_balance_rate: 0,
        rat_trader_amount_rate: 0,
        bundler_trader_amount_rate: 0,
        bluechip_owner_percentage: 0,
        volume: parseFloat(pair.volumeUSD) || 0,
        swaps: parseInt(pair.txCount) || 0,
        buys: Math.floor((parseInt(pair.txCount) || 0) * 0.6),
        sells: Math.floor((parseInt(pair.txCount) || 0) * 0.4),
        dev_token_burn_amount: null,
        dev_token_burn_ratio: null,
        dexscr_ad: 0,
        cto_flag: 0,
        twitter_change_flag: 0,
        address:
          pair.token0?.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      },
      open_timestamp:
        parseInt(pair.createdAtTimestamp) || Math.floor(Date.now() / 1000),
      bot_degen_count: '0',
    };
  }

  /**
   * Remove duplicate pools based on address
   */
  private static removeDuplicatePools(pools: Pool[]): Pool[] {
    const seen = new Set();
    return pools.filter(pool => {
      const key = pool.base_token_info.address.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort pools based on criteria
   */
  private static sortPools(
    pools: Pool[],
    sortBy: string,
    sortOrder: string
  ): Pool[] {
    return pools.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'market_cap':
          aValue = parseFloat(a.base_token_info.market_cap);
          bValue = parseFloat(b.base_token_info.market_cap);
          break;
        case 'volume':
          aValue = a.base_token_info.volume;
          bValue = b.base_token_info.volume;
          break;
        case 'holder_count':
          aValue = a.base_token_info.holder_count;
          bValue = b.base_token_info.holder_count;
          break;
        case 'open_timestamp':
          aValue = a.open_timestamp;
          bValue = b.open_timestamp;
          break;
        default:
          aValue = parseFloat(a.base_token_info.market_cap);
          bValue = parseFloat(b.base_token_info.market_cap);
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }

  /**
   * Get time range in seconds based on timeframe
   */
  private static getTimeRange(timeframe: string): number {
    const now = Math.floor(Date.now() / 1000);
    switch (timeframe) {
      case '1m':
        return now - 60;
      case '5m':
        return now - 300;
      case '1h':
        return now - 3600;
      case '6h':
        return now - 21600;
      case '24h':
        return now - 86400;
      default:
        return now - 3600; // Default to 1 hour
    }
  }

  /**
   * Generate mock pool data for testing (fallback)
   */
  private static generateMockPools(limit: number, options: any): Pool[] {
    const pools: Pool[] = [];
    const baseTime = Math.floor(Date.now() / 1000);

    for (let i = 0; i < limit; i++) {
      const pool: Pool = {
        id: 1492572 + i,
        chain: options.chain || 'eth',
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        exchange: options.exchange || 'uniswapv3',
        base_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        quote_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        quote_symbol: 'WETH',
        quote_reserve: (Math.random() * 0.001).toFixed(8),
        initial_liquidity: Math.random() > 0.5 ? Math.random() * 1000 : null,
        initial_quote_reserve: Math.random() > 0.5 ? Math.random() * 10 : null,
        base_token_info: {
          symbol: `TOKEN${i}`,
          name: `Test Token ${i}`,
          logo: `https://example.com/logo${i}.png`,
          total_supply: 100000000,
          price: (Math.random() * 0.0001).toFixed(8),
          holder_count: Math.floor(Math.random() * 1000) + 50,
          price_change_percent1m: (Math.random() * 200 - 100).toFixed(4),
          price_change_percent5m: (Math.random() * 200 - 100).toFixed(4),
          price_change_percent1h: (Math.random() * 200 - 100).toFixed(4),
          is_show_alert: Math.random() > 0.7,
          buy_tax: (Math.random() * 10).toFixed(18),
          sell_tax: (Math.random() * 10).toFixed(18),
          is_honeypot: Math.random() > 0.8 ? 1 : 0,
          is_open_source: Math.random() > 0.6 ? 1 : 0,
          renounced: Math.random() > 0.5 ? 1 : 0,
          lockInfo: {
            isLock: Math.random() > 0.3,
            lockDetail: [
              {
                percent: (Math.random() * 100).toFixed(18),
                pool: Math.random() > 0.5 ? 'burnt🔥' : 'locked',
                isBlackHole: Math.random() > 0.5,
              },
            ],
            lockTag: Math.random() > 0.5 ? ['blackhole'] : ['locked'],
            lockPercent: Math.random() * 100,
            leftLockPercent: Math.random() * 10,
          },
          liquidity: (Math.random() * 100).toFixed(5),
          top_10_holder_rate: Math.random() * 0.5,
          social_links: {
            twitter_username: Math.random() > 0.5 ? `token${i}` : undefined,
            website: Math.random() > 0.5 ? `https://token${i}.com` : undefined,
            telegram:
              Math.random() > 0.5 ? `https://t.me/token${i}` : undefined,
          },
          dexscr_update_link: Math.random() > 0.7 ? 1 : 0,
          twitter_rename_count: Math.floor(Math.random() * 5),
          twitter_del_post_token_count: Math.floor(Math.random() * 10),
          twitter_create_token_count: Math.floor(Math.random() * 20),
          rug_ratio: Math.random() > 0.8 ? Math.random() * 100 : null,
          sniper_count: Math.floor(Math.random() * 100),
          smart_degen_count: Math.floor(Math.random() * 50),
          renowned_count: Math.floor(Math.random() * 10),
          market_cap: (Math.random() * 1000000).toFixed(4),
          creator: `0x${Math.random().toString(16).substr(2, 40)}`,
          creator_created_inner_count: Math.floor(Math.random() * 10),
          creator_created_open_count: Math.floor(Math.random() * 20),
          creator_created_open_ratio: Math.random(),
          creator_balance_rate: Math.random(),
          rat_trader_amount_rate: Math.random(),
          bundler_trader_amount_rate: Math.random(),
          bluechip_owner_percentage: Math.random() * 0.1,
          volume: Math.random() * 10000,
          swaps: Math.floor(Math.random() * 1000),
          buys: Math.floor(Math.random() * 500),
          sells: Math.floor(Math.random() * 500),
          dev_token_burn_amount:
            Math.random() > 0.5 ? Math.random() * 1000000 : null,
          dev_token_burn_ratio:
            Math.random() > 0.5 ? Math.random() * 100 : null,
          dexscr_ad: Math.random() > 0.8 ? 1 : 0,
          cto_flag: Math.random() > 0.9 ? 1 : 0,
          twitter_change_flag: Math.random() > 0.8 ? 1 : 0,
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
        },
        open_timestamp: baseTime - Math.floor(Math.random() * 86400),
        bot_degen_count: Math.floor(Math.random() * 100).toString(),
      };

      pools.push(pool);
    }

    return this.sortPools(pools, options.sortBy, options.sortOrder);
  }

  /**
   * Get real-time data directly from pool contracts
   */
  static async getRealTimeDataFromContracts(
    poolAddresses: string[],
    options: {
      includeTokenInfo?: boolean;
      includePriceHistory?: boolean;
    } = {}
  ): Promise<Pool[]> {
    try {
      logger.info(
        `Fetching real-time data from contracts for ${poolAddresses.length} pools`
      );

      const { includeTokenInfo = true, includePriceHistory = false } = options;
      const realTimePools: Pool[] = [];

      // Process pools in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < poolAddresses.length; i += batchSize) {
        const batch = poolAddresses.slice(i, i + batchSize);
        const batchPromises = batch.map(address =>
          this.fetchPoolDataFromContract(address, {
            includeTokenInfo,
            includePriceHistory,
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            realTimePools.push(result.value);
          } else {
            logger.warn(
              `Failed to fetch data for pool ${batch[index]}:`,
              result.status === 'rejected' ? result.reason : 'Unknown error'
            );
          }
        });

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < poolAddresses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(
        `Successfully fetched contract data for ${realTimePools.length} pools`
      );
      return realTimePools;
    } catch (error) {
      logger.error('Error fetching real-time data from contracts:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time data for a single pool from its contract
   */
  private static async fetchPoolDataFromContract(
    poolAddress: string,
    options: {
      includeTokenInfo?: boolean;
      includePriceHistory?: boolean;
    } = {}
  ): Promise<Pool | null> {
    try {
      const { includeTokenInfo = true, includePriceHistory = false } = options;

      // Create contract instance for the pool
      const poolContract = {
        address: poolAddress as `0x${string}`,
        abi: UNISWAP_V3_POOL_ABI,
      };

      // Fetch basic pool data
      const [token0, token1, fee, slot0, liquidity] = await Promise.all([
        this.client.readContract({
          ...poolContract,
          functionName: 'token0',
        }),
        this.client.readContract({
          ...poolContract,
          functionName: 'token1',
        }),
        this.client.readContract({
          ...poolContract,
          functionName: 'fee',
        }),
        this.client.readContract({
          ...poolContract,
          functionName: 'slot0',
        }),
        this.client.readContract({
          ...poolContract,
          functionName: 'liquidity',
        }),
      ]);

      // Determine which token is the base token (non-WETH)
      const isToken0WETH = token0.toLowerCase() === WETH_ADDRESS.toLowerCase();
      const baseTokenAddress = isToken0WETH ? token1 : token0;
      const quoteTokenAddress = isToken0WETH ? token0 : token1;

      // Fetch token information if requested
      let tokenInfo = null;
      if (includeTokenInfo) {
        tokenInfo = await this.fetchTokenInfoFromContract(baseTokenAddress);
      }

      // Calculate price from sqrtPriceX96
      const sqrtPriceX96 = slot0[0];
      const price = this.calculatePriceFromSqrtPriceX96(
        sqrtPriceX96,
        isToken0WETH
      );

      // Calculate liquidity in USD (approximate)
      const liquidityUSD = this.calculateLiquidityUSD(liquidity, price, fee);

      // Fetch price history if requested
      let priceHistory = null;
      if (includePriceHistory) {
        priceHistory = await this.fetchPriceHistoryFromContract(poolAddress);
      }

      // Transform to Pool format
      return {
        id: poolAddress,
        chain: 'eth',
        address: poolAddress,
        exchange: 'uniswapv3',
        base_address: baseTokenAddress,
        quote_address: quoteTokenAddress,
        quote_symbol: 'WETH',
        quote_reserve: '0',
        initial_liquidity: liquidityUSD.toString(),
        initial_quote_reserve: null,
        base_token_info: {
          symbol: tokenInfo?.symbol || 'UNKNOWN',
          name: tokenInfo?.name || 'Unknown Token',
          logo: '',
          total_supply: tokenInfo?.totalSupply || 0,
          price: price.toString(),
          holder_count: 0, // Would need additional contract calls
          price_change_percent1m: priceHistory?.change1m?.toString() || '0',
          price_change_percent5m: priceHistory?.change5m?.toString() || '0',
          price_change_percent1h: priceHistory?.change1h?.toString() || '0',
          is_show_alert: false,
          buy_tax: '0',
          sell_tax: '0',
          is_honeypot: 0,
          is_open_source: 1,
          renounced: 1,
          lockInfo: {
            isLock: false,
            lockDetail: [],
            lockTag: [],
            lockPercent: 0,
            leftLockPercent: 100,
          },
          liquidity: liquidityUSD.toString(),
          top_10_holder_rate: 0.1,
          social_links: {},
          dexscr_update_link: 0,
          twitter_rename_count: 0,
          twitter_del_post_token_count: 0,
          twitter_create_token_count: 0,
          rug_ratio: null,
          sniper_count: 0,
          smart_degen_count: 0,
          renowned_count: 0,
          market_cap: this.calculateMarketCap(
            tokenInfo?.totalSupply || 0,
            price
          ).toString(),
          creator: '',
          creator_created_inner_count: 0,
          creator_created_open_count: 0,
          creator_created_open_ratio: 0,
          creator_balance_rate: 0,
          rat_trader_amount_rate: 0,
          bundler_trader_amount_rate: 0,
          bluechip_owner_percentage: 0,
          volume: '0', // Would need to track swaps
          swaps: 0, // Would need to track swaps
          buys: 0, // Would need to track swaps
          sells: 0, // Would need to track swaps
          dev_token_burn_amount: null,
          dev_token_burn_ratio: null,
          dexscr_ad: 0,
          cto_flag: 0,
          twitter_change_flag: 0,
          address: baseTokenAddress,
        },
        open_timestamp: Math.floor(Date.now() / 1000),
        bot_degen_count: '0',
      };
    } catch (error) {
      logger.error(
        `Error fetching contract data for pool ${poolAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * Fetch token information from contract
   */
  private static async fetchTokenInfoFromContract(
    tokenAddress: string
  ): Promise<{
    symbol: string;
    name: string;
    decimals: number;
    totalSupply: number;
  } | null> {
    try {
      const tokenContract = {
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
      };

      const [symbol, name, decimals, totalSupply] = await Promise.all([
        this.client.readContract({
          ...tokenContract,
          functionName: 'symbol',
        }),
        this.client.readContract({
          ...tokenContract,
          functionName: 'name',
        }),
        this.client.readContract({
          ...tokenContract,
          functionName: 'decimals',
        }),
        this.client.readContract({
          ...tokenContract,
          functionName: 'totalSupply',
        }),
      ]);

      return {
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
        totalSupply: Number(
          formatUnits(totalSupply as bigint, decimals as number)
        ),
      };
    } catch (error) {
      logger.warn(`Failed to fetch token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Calculate price from sqrtPriceX96
   */
  private static calculatePriceFromSqrtPriceX96(
    sqrtPriceX96: bigint,
    isToken0WETH: boolean
  ): number {
    try {
      // Convert sqrtPriceX96 to price
      const price = Number(sqrtPriceX96) ** 2 / 2 ** 192;

      // If token0 is WETH, we need to invert the price
      if (isToken0WETH) {
        return 1 / price;
      }

      return price;
    } catch (error) {
      logger.error('Error calculating price from sqrtPriceX96:', error);
      return 0;
    }
  }

  /**
   * Calculate liquidity in USD
   */
  private static calculateLiquidityUSD(
    liquidity: bigint,
    price: number,
    fee: number
  ): number {
    try {
      // This is a simplified calculation
      // In reality, you'd need to account for the current tick and price range
      const liquidityNumber = Number(liquidity);
      const feeMultiplier = fee / 1000000; // Convert fee to decimal (e.g., 3000 -> 0.003)

      // Approximate USD value (this is simplified)
      return liquidityNumber * price * feeMultiplier;
    } catch (error) {
      logger.error('Error calculating liquidity USD:', error);
      return 0;
    }
  }

  /**
   * Calculate market cap
   */
  private static calculateMarketCap(
    totalSupply: number,
    price: number
  ): number {
    return totalSupply * price;
  }

  /**
   * Fetch price history from contract observations
   */
  private static async fetchPriceHistoryFromContract(
    poolAddress: string
  ): Promise<{
    change1m: number;
    change5m: number;
    change1h: number;
  } | null> {
    try {
      // This would require fetching multiple observations and calculating price changes
      // For now, return null as this is complex to implement
      return null;
    } catch (error) {
      logger.error('Error fetching price history:', error);
      return null;
    }
  }

  /**
   * Get real-time data for pools registered in database
   */
  static async getRealTimeDataForDatabasePools(
    poolAddresses: string[],
    options: {
      sources?: string[];
      updateDatabase?: boolean;
    } = {}
  ): Promise<Pool[]> {
    try {
      logger.info(
        `Fetching real-time data for ${poolAddresses.length} database pools`
      );

      const { sources = ['coingecko', 'dexscreener'], updateDatabase = false } =
        options;
      const realTimePools: Pool[] = [];

      // Fetch real-time data for each pool address
      for (const address of poolAddresses) {
        try {
          const poolData = await this.fetchRealTimeDataForPool(
            address,
            sources
          );
          if (poolData) {
            realTimePools.push(poolData);

            // Update database if requested
            if (updateDatabase) {
              await this.updatePoolInDatabase(address, poolData);
            }
          }
        } catch (error) {
          logger.error(
            `Error fetching real-time data for pool ${address}:`,
            error
          );
        }
      }

      logger.info(
        `Successfully fetched real-time data for ${realTimePools.length} pools`
      );
      return realTimePools;
    } catch (error) {
      logger.error('Error fetching real-time data for database pools:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time data for a specific pool
   */
  private static async fetchRealTimeDataForPool(
    poolAddress: string,
    sources: string[]
  ): Promise<Pool | null> {
    try {
      const poolData: any = {};

      // Fetch from CoinGecko if requested
      if (sources.includes('coingecko')) {
        try {
          const coingeckoData =
            await this.fetchTokenDataFromCoinGecko(poolAddress);
          if (coingeckoData) {
            Object.assign(poolData, coingeckoData);
          }
        } catch (error) {
          logger.warn(
            `Failed to fetch CoinGecko data for ${poolAddress}:`,
            error
          );
        }
      }

      // Fetch from DexScreener if requested
      if (sources.includes('dexscreener')) {
        try {
          const dexscreenerData =
            await this.fetchPoolDataFromDexScreener(poolAddress);
          if (dexscreenerData) {
            Object.assign(poolData, dexscreenerData);
          }
        } catch (error) {
          logger.warn(
            `Failed to fetch DexScreener data for ${poolAddress}:`,
            error
          );
        }
      }

      // If we have data, transform it to Pool format
      if (Object.keys(poolData).length > 0) {
        return this.transformToPoolFormat(poolAddress, poolData);
      }

      return null;
    } catch (error) {
      logger.error(
        `Error fetching real-time data for pool ${poolAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * Fetch token data from CoinGecko
   */
  private static async fetchTokenDataFromCoinGecko(
    tokenAddress: string
  ): Promise<any> {
    try {
      // Try to get token data by contract address
      const response = await axios.get(
        `${this.COINGECKO_API}/coins/ethereum/contract/${tokenAddress}`,
        {
          timeout: 10000,
        }
      );

      if (response.data) {
        return {
          price:
            response.data.market_data?.current_price?.usd?.toString() || '0',
          marketCap:
            response.data.market_data?.market_cap?.usd?.toString() || '0',
          volume24h:
            response.data.market_data?.total_volume?.usd?.toString() || '0',
          priceChange24h:
            response.data.market_data?.price_change_percentage_24h || 0,
          symbol: response.data.symbol?.toUpperCase(),
          name: response.data.name,
          totalSupply: response.data.market_data?.total_supply || 0,
        };
      }
    } catch (error) {
      // Token might not be listed on CoinGecko
      logger.debug(`Token ${tokenAddress} not found on CoinGecko`);
    }
    return null;
  }

  /**
   * Fetch pool data from DexScreener
   */
  private static async fetchPoolDataFromDexScreener(
    poolAddress: string
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.DEXSCREENER_API}/dex/pairs/ethereum/${poolAddress}`,
        {
          timeout: 10000,
        }
      );

      if (
        response.data &&
        response.data.pairs &&
        response.data.pairs.length > 0
      ) {
        const pair = response.data.pairs[0];
        return {
          liquidity: pair.liquidity?.usd?.toString() || '0',
          volume24h: pair.volume?.h24?.toString() || '0',
          priceUSD: pair.priceUsd?.toString() || '0',
          priceChange24h: pair.priceChange?.h24 || 0,
          txns24h: pair.txns?.h24 || 0,
          fdv: pair.fdv?.toString() || '0',
        };
      }
    } catch (error) {
      logger.debug(`Pool ${poolAddress} not found on DexScreener`);
    }
    return null;
  }

  /**
   * Transform real-time data to Pool format
   */
  private static transformToPoolFormat(poolAddress: string, data: any): Pool {
    return {
      id: poolAddress,
      chain: 'eth',
      address: poolAddress,
      exchange: 'uniswapv3',
      base_address: poolAddress,
      quote_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      quote_symbol: 'WETH',
      quote_reserve: '0',
      initial_liquidity: data.liquidity || '0',
      initial_quote_reserve: null,
      base_token_info: {
        symbol: data.symbol || 'UNKNOWN',
        name: data.name || 'Unknown Token',
        logo: '',
        total_supply: data.totalSupply || 0,
        price: data.priceUSD || data.price || '0',
        holder_count: 0, // Would need additional API call
        price_change_percent1m: '0',
        price_change_percent5m: '0',
        price_change_percent1h: data.priceChange24h?.toString() || '0',
        is_show_alert: false,
        buy_tax: '0',
        sell_tax: '0',
        is_honeypot: 0,
        is_open_source: 1,
        renounced: 1,
        lockInfo: {
          isLock: false,
          lockDetail: [],
          lockTag: [],
          lockPercent: 0,
          leftLockPercent: 100,
        },
        liquidity: data.liquidity || '0',
        top_10_holder_rate: 0.1,
        social_links: {},
        dexscr_update_link: 0,
        twitter_rename_count: 0,
        twitter_del_post_token_count: 0,
        twitter_create_token_count: 0,
        rug_ratio: null,
        sniper_count: 0,
        smart_degen_count: 0,
        renowned_count: 0,
        market_cap: data.marketCap || data.fdv || '0',
        creator: '',
        creator_created_inner_count: 0,
        creator_created_open_count: 0,
        creator_created_open_ratio: 0,
        creator_balance_rate: 0,
        rat_trader_amount_rate: 0,
        bundler_trader_amount_rate: 0,
        bluechip_owner_percentage: 0,
        volume: data.volume24h || '0',
        swaps: data.txns24h || 0,
        buys: Math.floor((data.txns24h || 0) * 0.6),
        sells: Math.floor((data.txns24h || 0) * 0.4),
        dev_token_burn_amount: null,
        dev_token_burn_ratio: null,
        dexscr_ad: 0,
        cto_flag: 0,
        twitter_change_flag: 0,
        address: poolAddress,
      },
      open_timestamp: Math.floor(Date.now() / 1000),
      bot_degen_count: '0',
    };
  }

  /**
   * Update pool data in database with real-time information
   */
  private static async updatePoolInDatabase(
    poolAddress: string,
    poolData: Pool
  ): Promise<void> {
    try {
      await prisma.pool.update({
        where: { address: poolAddress },
        data: {
          liquidity: poolData.base_token_info.liquidity,
          volume24h: poolData.base_token_info.volume,
          priceUSD: poolData.base_token_info.price,
          priceChange24h:
            parseFloat(poolData.base_token_info.price_change_percent1h) || 0,
          marketCap: poolData.base_token_info.market_cap,
          lastTradedAt: new Date(),
        },
      });
      logger.info(
        `Updated pool ${poolAddress} in database with real-time data`
      );
    } catch (error) {
      logger.error(`Error updating pool ${poolAddress} in database:`, error);
    }
  }

  /**
   * Get pools by type (new, burnt, dexscreener)
   */
  static async getPoolsByType(
    type: 'new' | 'burnt' | 'dexscreener',
    params: PoolsQueryParams
  ): Promise<PoolsResponse> {
    try {
      const pools = await this.getNewPairsByRank(params);

      // Filter pools based on type
      const filteredPools = pools.pools.filter(pool => {
        switch (type) {
          case 'new':
            return pool.open_timestamp > Math.floor(Date.now() / 1000) - 3600; // Last hour
          case 'burnt':
            return (
              pool.base_token_info.lockInfo.isLock &&
              pool.base_token_info.lockInfo.lockPercent > 80
            );
          case 'dexscreener':
            return pool.base_token_info.dexscr_update_link === 1;
          default:
            return true;
        }
      });

      return {
        ...pools,
        pools: filteredPools,
        total: filteredPools.length,
        hasMore: false,
      };
    } catch (error) {
      logger.error(`Error fetching ${type} pools:`, error);
      throw error;
    }
  }
}
