import { Pool, PoolsQueryParams, PoolsResponse } from '@/types/pools';
import { logger } from '@/utils/logger';
import axios from 'axios';
import { createPublicClient, http, getAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, WETH_ADDRESS } from '@/config/abi';
import { prisma } from '@/config/database';
import { TelegramBotService } from './telegramBotService';

export class PoolService {
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static readonly DEXSCREENER_API = 'https://api.dexscreener.com/latest';
  private static readonly UNISWAP_API = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
  
  private static client = createPublicClient({
    chain: mainnet,
    transport: http(process.env['ETHEREUM_RPC_URL'] || 'https://eth-mainnet.g.alchemy.com/v2/demo')
  });

  private static isListening = false;
  private static unsubscribe: (() => void) | null = null;

  /**
   * Start listening to Uniswap V2 factory events
   */
  static async startListeningToNewPools(): Promise<void> {
    if (this.isListening) {
      logger.warn('Already listening to Uniswap V2 factory events');
      return;
    }

    try {
      logger.info('🎧 Starting to listen to Uniswap V2 factory events...');

      this.unsubscribe = this.client.watchContractEvent({
        address: UNISWAP_V2_FACTORY as `0x${string}`,
        abi: UNISWAP_V2_FACTORY_ABI,
        eventName: 'PairCreated',
        onLogs: async (logs) => {
          for (const log of logs) {
            const args = (log as any).args;
            console.log("args", args);
            if (args) {
              await this.handleNewPool(args);
            }
          }
        },
        onError: (error) => {
          logger.error('Error listening to Uniswap V2 factory events:', error);
        }
      });

      this.isListening = true;
      logger.info('✅ Successfully started listening to Uniswap V2 factory events');
    } catch (error) {
      logger.error('❌ Failed to start listening to Uniswap V2 factory events:', error);
      throw error;
    }
  }

  /**
   * Stop listening to Uniswap V2 factory events
   */
  static async stopListeningToNewPools(): Promise<void> {
    if (!this.isListening || !this.unsubscribe) {
      logger.warn('Not currently listening to Uniswap V2 factory events');
      return;
    }

    try {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isListening = false;
      logger.info('✅ Stopped listening to Uniswap V2 factory events');
    } catch (error) {
      logger.error('❌ Error stopping Uniswap V2 factory event listener:', error);
      throw error;
    }
  }

  /**
   * Handle new pool creation event
   */
  private static async handleNewPool(args: any): Promise<void> {
    try {
      const { token0, token1, pair } = args;
      
      // Check if one of the tokens is WETH
      if (
        getAddress(token0).toLowerCase() === WETH_ADDRESS.toLowerCase() ||
        getAddress(token1).toLowerCase() === WETH_ADDRESS.toLowerCase()
      ) {
        const tokenAddress = getAddress(token0).toLowerCase() === WETH_ADDRESS.toLowerCase() 
          ? getAddress(token1) 
          : getAddress(token0);

        logger.info('🚀 New V2 Pool with ETH Detected:', {
          token0: getAddress(token0),
          token1: getAddress(token1),
          pair: getAddress(pair),
          tokenAddress
        });

        // Create pool object
        const pool = await this.createPoolFromEvent(tokenAddress, getAddress(pair));
        
        // Send notifications to active users
        await this.notifyUsersOfNewPool(pool);
      }
    } catch (error) {
      logger.error('Error handling new pool event:', error);
    }
  }

  /**
   * Create pool object from event data
   */
  private static async createPoolFromEvent(tokenAddress: string, pairAddress: string): Promise<Pool> {
    try {
      // Get token information from blockchain
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      
      const pool: Pool = {
        id: Date.now(),
        chain: 'eth',
        address: pairAddress,
        exchange: 'uniswapv2',
        base_address: tokenAddress,
        quote_address: WETH_ADDRESS,
        quote_symbol: 'WETH',
        quote_reserve: '0',
        initial_liquidity: null,
        initial_quote_reserve: null,
        base_token_info: {
          symbol: tokenInfo.symbol || 'UNKNOWN',
          name: tokenInfo.name || 'Unknown Token',
          logo: '',
          total_supply: tokenInfo.totalSupply || 0,
          price: '0',
          holder_count: 0,
          price_change_percent1m: '0',
          price_change_percent5m: '0',
          price_change_percent1h: '0',
          is_show_alert: true,
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
            leftLockPercent: 100
          },
          liquidity: '0',
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
          market_cap: '0',
          creator: '',
          creator_created_inner_count: 0,
          creator_created_open_count: 0,
          creator_created_open_ratio: 0,
          creator_balance_rate: 0,
          rat_trader_amount_rate: 0,
          bundler_trader_amount_rate: 0,
          bluechip_owner_percentage: 0,
          volume: 0,
          swaps: 0,
          buys: 0,
          sells: 0,
          dev_token_burn_amount: null,
          dev_token_burn_ratio: null,
          dexscr_ad: 0,
          cto_flag: 0,
          twitter_change_flag: 0,
          address: tokenAddress
        },
        open_timestamp: Math.floor(Date.now() / 1000),
        bot_degen_count: '0'
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
  private static async getTokenInfo(tokenAddress: string): Promise<{ symbol: string; name: string; totalSupply: number }> {
    try {
      const erc20Abi = [
        { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
        { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
      ];

      const [symbol, name, totalSupply] = await Promise.all([
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol'
        }),
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'name'
        }),
        this.client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'totalSupply'
        })
      ]);

      return {
        symbol: symbol as string,
        name: name as string,
        totalSupply: Number(totalSupply)
      };
    } catch (error) {
      logger.error('Error getting token info:', error);
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        totalSupply: 0
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
          isMonitoring: true 
        }
      });

      logger.info(`📢 Notifying ${activeUsers.length} users about new pool: ${pool.base_token_info.symbol}`);

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
  private static async sendPoolAlert(telegramId: string, pool: Pool): Promise<void> {
    try {
      const alertMessage = `
🚨 New Uniswap V2 Pool Detected!

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

⚡ This pool was just created on Uniswap V2!
      `;

      await TelegramBotService.sendNotification(telegramId, alertMessage);

      // Save alert to database
      const telegramUser = await prisma.telegramUser.findUnique({
        where: { id: telegramId }
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
              source: 'uniswap_v2_factory_event'
            }
          }
        });
      }

      logger.info(`📢 Alert sent to user ${telegramId} for pool ${pool.base_token_info.symbol}`);
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
  static async getNewPairsByRank(params: PoolsQueryParams): Promise<PoolsResponse> {
    try {
      const {
        timeframe = '1h',
        limit = 50,
        page = 1,
        chain,
        exchange,
        sortBy = 'market_cap',
        sortOrder = 'desc'
      } = params;

      // Fetch real data from multiple sources
      const pools = await this.fetchRealPoolData({
        timeframe,
        limit,
        chain,
        exchange,
        sortBy,
        sortOrder
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
        hasMore
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
        hasMore: false
      };
    }
  }

  /**
   * Fetch real pool data from multiple sources
   */
  private static async fetchRealPoolData(options: any): Promise<Pool[]> {
    try {
      // Try to fetch from multiple sources in parallel
      const [coinGeckoPools, dexScreenerPools, uniswapPools] = await Promise.allSettled([
        this.fetchFromCoinGecko(options),
        this.fetchFromDexScreener(options),
        this.fetchFromUniswap(options)
      ]);

      let allPools: Pool[] = [];

      // Add successful results
      if (coinGeckoPools.status === 'fulfilled' && coinGeckoPools.value.length > 0) {
        allPools = allPools.concat(coinGeckoPools.value);
      }
      if (dexScreenerPools.status === 'fulfilled' && dexScreenerPools.value.length > 0) {
        allPools = allPools.concat(dexScreenerPools.value);
      }
      if (uniswapPools.status === 'fulfilled' && uniswapPools.value.length > 0) {
        allPools = allPools.concat(uniswapPools.value);
      }

      // If no real data available, generate mock data as fallback
      if (allPools.length === 0) {
        logger.warn('No real pool data available, generating mock data as fallback');
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
          price_change_percentage: '1h,24h,7d'
        },
        timeout: 10000
      });

      // Add proper null checks
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((coin: any, index: number) => this.mapCoinGeckoToPool(coin, index));
      }
      
      logger.warn('CoinGecko API response structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        responseKeys: response.data ? Object.keys(response.data) : []
      });
      
      return [];
    } catch (error) {
      logger.error('Error fetching from CoinGecko:', error);
      return [];
    }
  }

  /**
   * Fetch data from DexScreener API
   */
  private static async fetchFromDexScreener(options: any): Promise<Pool[]> {
    try {
      const response = await axios.get(`${this.DEXSCREENER_API}/dex/pairs/ethereum/uniswapv2`, {
        timeout: 10000
      });

      // Add proper null checks
      if (response.data && response.data.pairs && Array.isArray(response.data.pairs)) {
        return response.data.pairs
          .slice(0, options.limit)
          .map((pair: any, index: number) => this.mapDexScreenerToPool(pair, index));
      }
      
      logger.warn('DexScreener API response structure:', {
        hasData: !!response.data,
        hasPairs: !!(response.data && response.data.pairs),
        isArray: response.data && response.data.pairs ? Array.isArray(response.data.pairs) : false,
        responseKeys: response.data ? Object.keys(response.data) : []
      });
      
      return [];
    } catch (error) {
      logger.error('Error fetching from DexScreener:', error);
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

      const response = await axios.post(this.UNISWAP_API, { query }, {
        timeout: 10000
      });

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
        hasPairs: !!(response.data && response.data.data && response.data.data.pairs),
        responseKeys: response.data ? Object.keys(response.data) : [],
        dataKeys: response.data && response.data.data ? Object.keys(response.data.data) : []
      });
      
      return [];
    } catch (error) {
      logger.error('Error fetching from Uniswap:', error);
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
        price_change_percent1m: coin.price_change_percentage_1h_in_currency?.toFixed(4) || '0',
        price_change_percent5m: '0',
        price_change_percent1h: coin.price_change_percentage_1h_in_currency?.toFixed(4) || '0',
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
          leftLockPercent: 100
        },
        liquidity: coin.total_volume?.toString() || '0',
        top_10_holder_rate: 0.1,
        social_links: {
          twitter_username: coin.twitter_username,
          website: coin.homepage,
          telegram: undefined
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
        address: coin.id || `0x${Math.random().toString(16).substr(2, 40)}`
      },
      open_timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      bot_degen_count: '0'
    };
  }

  /**
   * Map DexScreener data to Pool format
   */
  private static mapDexScreenerToPool(pair: any, index: number): Pool {
    return {
      id: index,
      chain: pair.chainId || 'eth',
      address: pair.pairAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
      exchange: pair.dexId || 'unknown',
      base_address: pair.baseToken?.address || `0x${Math.random().toString(16).substr(2, 40)}`,
      quote_address: pair.quoteToken?.address || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
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
          leftLockPercent: 100
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
        address: pair.baseToken?.address || `0x${Math.random().toString(16).substr(2, 40)}`
      },
      open_timestamp: pair.pairCreatedAt ? Math.floor(new Date(pair.pairCreatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
      bot_degen_count: '0'
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
      exchange: 'uniswapv2',
      base_address: pair.token0?.id || `0x${Math.random().toString(16).substr(2, 40)}`,
      quote_address: pair.token1?.id || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
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
          leftLockPercent: 100
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
        address: pair.token0?.id || `0x${Math.random().toString(16).substr(2, 40)}`
      },
      open_timestamp: parseInt(pair.createdAtTimestamp) || Math.floor(Date.now() / 1000),
      bot_degen_count: '0'
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
  private static sortPools(pools: Pool[], sortBy: string, sortOrder: string): Pool[] {
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
        exchange: options.exchange || 'univ2',
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
                isBlackHole: Math.random() > 0.5
              }
            ],
            lockTag: Math.random() > 0.5 ? ['blackhole'] : ['locked'],
            lockPercent: Math.random() * 100,
            leftLockPercent: Math.random() * 10
          },
          liquidity: (Math.random() * 100).toFixed(5),
          top_10_holder_rate: Math.random() * 0.5,
          social_links: {
            twitter_username: Math.random() > 0.5 ? `token${i}` : undefined,
            website: Math.random() > 0.5 ? `https://token${i}.com` : undefined,
            telegram: Math.random() > 0.5 ? `https://t.me/token${i}` : undefined
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
          dev_token_burn_amount: Math.random() > 0.5 ? Math.random() * 1000000 : null,
          dev_token_burn_ratio: Math.random() > 0.5 ? Math.random() * 100 : null,
          dexscr_ad: Math.random() > 0.8 ? 1 : 0,
          cto_flag: Math.random() > 0.9 ? 1 : 0,
          twitter_change_flag: Math.random() > 0.8 ? 1 : 0,
          address: `0x${Math.random().toString(16).substr(2, 40)}`
        },
        open_timestamp: baseTime - Math.floor(Math.random() * 86400),
        bot_degen_count: Math.floor(Math.random() * 100).toString()
      };

      pools.push(pool);
    }

    return this.sortPools(pools, options.sortBy, options.sortOrder);
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
            return pool.base_token_info.lockInfo.isLock && 
                   pool.base_token_info.lockInfo.lockPercent > 80;
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
        hasMore: false
      };
    } catch (error) {
      logger.error(`Error fetching ${type} pools:`, error);
      throw error;
    }
  }
} 