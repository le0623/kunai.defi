import { createPublicClient, http, parseAbiItem, formatEther, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { toast } from 'sonner'

// Uniswap V3 Swap event signature
const UNISWAP_V3_SWAP_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)')

// Uniswap V2 Swap event signature
const UNISWAP_V2_SWAP_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)')

export interface TokenActivity {
  id: string
  age: string
  type: 'buy' | 'sell'
  total: string
  amount: string
  price: string
  maker: string
  other: string
  txHash: string
  blockNumber: bigint
  timestamp: number
  dex: string
  poolAddress: string
  token0Amount: string
  token1Amount: string
  token0Symbol?: string
  token1Symbol?: string
}

export interface TokenActivityConfig {
  tokenAddress: string
  poolAddress?: string
  dexType?: 'uniswap-v2' | 'uniswap-v3' | 'sushiswap' | 'pancakeswap' | 'all'
  includeFailed?: boolean
}

class TokenActivityService {
  private client = createPublicClient({
    chain: mainnet,
    transport: http(import.meta.env.VITE_ETHEREUM_RPC_URL ?? "https://1rpc.io/eth"),
  })

  private listeners = new Map<string, () => void>()
  private activities = new Map<string, TokenActivity[]>()
  private maxActivities = 1000 // Keep last 1000 activities per token
  private poolInfo = new Map<string, { token0: string; token1: string; token0Symbol?: string; token1Symbol?: string }>()

  /**
   * Start monitoring DEX swap activity
   */
  async startMonitoring(
    config: TokenActivityConfig,
    onActivity: (activity: TokenActivity) => void,
    onError?: (error: Error) => void,
    initialActivityLimit: number = 10
  ): Promise<string> {
    const tokenAddress = getAddress(config.tokenAddress)
    const listenerId = `${tokenAddress}-${Date.now()}`

    try {
      // Initialize activities array for this token
      if (!this.activities.has(tokenAddress)) {
        this.activities.set(tokenAddress, [])
      }

      // Get recent swap activities first
      await this.fetchRecentSwapActivities(config, onActivity, initialActivityLimit)

      // Set up real-time monitoring for specific pool if provided
      if (config.poolAddress) {
        await this.monitorSpecificPool(config, onActivity, onError)
      } else {
        // Monitor multiple pools for the token
        await this.monitorMultiplePools(config, onActivity, onError)
      }

      toast.success(`Started monitoring DEX swaps for ${config.tokenAddress}`)
      return listenerId

    } catch (error) {
      console.error('Error starting DEX swap monitoring:', error)
      onError?.(error as Error)
      throw error
    }
  }

  /**
   * Stop monitoring token activity
   */
  stopMonitoring(listenerId: string): void {
    const unsubscribe = this.listeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(listenerId)
      toast.info('Stopped monitoring DEX swap activity')
    }
  }

  /**
   * Get cached activities for a token
   */
  getActivities(tokenAddress: string): TokenActivity[] {
    const normalizedAddress = getAddress(tokenAddress)
    return this.activities.get(normalizedAddress) || []
  }

  /**
   * Clear activities for a token
   */
  clearActivities(tokenAddress: string): void {
    const normalizedAddress = getAddress(tokenAddress)
    this.activities.delete(normalizedAddress)
  }

  /**
   * Fetch recent swap activities from the blockchain
   */
  private async fetchRecentSwapActivities(
    config: TokenActivityConfig,
    onActivity: (activity: TokenActivity) => void,
    limit: number = 10
  ): Promise<void> {
    const tokenAddress = getAddress(config.tokenAddress)

    try {
      // Get recent blocks (last 1000 blocks)
      const latestBlock = await this.client.getBlockNumber()
      const fromBlock = latestBlock - BigInt(1000)

      // Get pools for this token
      const pools = await this.getPoolsForToken(tokenAddress, config.dexType)

      const allActivities: TokenActivity[] = []

      // Get swap events from all pools
      for (const pool of pools) {
        try {
          const event = this.getSwapEventForDex(pool.dex)
          const logs = await this.client.getLogs({
            address: pool.address as `0x${string}`,
            event,
            fromBlock,
            toBlock: latestBlock,
          })

          // Process logs in reverse order (newest first)
          for (let i = logs.length - 1; i >= 0; i--) {
            const log = logs[i]
            try {
              const activity = await this.processSwapLog(log, config, pool)
              if (activity) {
                allActivities.push(activity)
              }
            } catch (error) {
              console.error('Error processing historical swap log:', error)
            }
          }
        } catch (error) {
          console.error(`Error fetching logs for pool ${pool.address}:`, error)
        }
      }

      // Sort by timestamp (newest first) and take only the latest 'limit' activities
      const sortedActivities = allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)

      // Add activities to cache and notify
      for (const activity of sortedActivities) {
        this.addActivity(tokenAddress, activity)
        onActivity(activity)
      }

    } catch (error) {
      console.error('Error fetching recent swap activities:', error)
    }
  }

  /**
   * Monitor specific DEX pool for swap events
   */
  private async monitorSpecificPool(
    config: TokenActivityConfig,
    onActivity: (activity: TokenActivity) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!config.poolAddress) return

    const poolAddress = getAddress(config.poolAddress)
    const dexType = config.dexType || 'all'
    const event = this.getSwapEventForDex(dexType)

    try {
      // Get pool info
      const poolInfo = await this.getPoolInfo(poolAddress)

      const unsubscribe = this.client.watchContractEvent({
        address: poolAddress as `0x${string}`,
        abi: [event],
        eventName: 'Swap',
        onLogs: async (logs) => {
          for (const log of logs) {
            try {
              const pool = { address: poolAddress, dex: dexType, ...poolInfo }
              const activity = await this.processSwapLog(log, config, pool)
              if (activity) {
                const tokenAddress = getAddress(config.tokenAddress)
                this.addActivity(tokenAddress, activity)
                onActivity(activity)
              }
            } catch (error) {
              console.error('Error processing swap log:', error)
              onError?.(error as Error)
            }
          }
        },
        onError: (error) => {
          console.error('Error watching DEX pool:', error)
          onError?.(error)
        }
      })

      // Store the unsubscribe function
      const listenerId = `pool-${poolAddress}-${Date.now()}`
      this.listeners.set(listenerId, unsubscribe)

    } catch (error) {
      console.error('Error setting up DEX pool monitoring:', error)
      onError?.(error as Error)
    }
  }

  /**
   * Monitor multiple pools for a token
   */
  private async monitorMultiplePools(
    config: TokenActivityConfig,
    onActivity: (activity: TokenActivity) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const tokenAddress = getAddress(config.tokenAddress)
    const pools = await this.getPoolsForToken(tokenAddress, config.dexType)

    for (const pool of pools) {
      try {
        const event = this.getSwapEventForDex(pool.dex)

        const unsubscribe = this.client.watchContractEvent({
          address: pool.address as `0x${string}`,
          abi: [event],
          eventName: 'Swap',
          onLogs: async (logs) => {
            for (const log of logs) {
              try {
                const activity = await this.processSwapLog(log, config, pool)
                if (activity) {
                  this.addActivity(tokenAddress, activity)
                  onActivity(activity)
                }
              } catch (error) {
                console.error('Error processing swap log:', error)
                onError?.(error as Error)
              }
            }
          },
          onError: (error) => {
            console.error(`Error watching pool ${pool.address}:`, error)
            onError?.(error)
          }
        })

        // Store the unsubscribe function
        const listenerId = `pool-${pool.address}-${Date.now()}`
        this.listeners.set(listenerId, unsubscribe)

      } catch (error) {
        console.error(`Error setting up monitoring for pool ${pool.address}:`, error)
        onError?.(error as Error)
      }
    }
  }

  /**
   * Process a swap log and convert it to activity
   */
  private async processSwapLog(
    log: any,
    config: TokenActivityConfig,
    pool: { address: string; dex: string; token0?: string; token1?: string; token0Symbol?: string; token1Symbol?: string }
  ): Promise<TokenActivity | null> {
    try {
      const tokenAddress = getAddress(config.tokenAddress)
      const block = await this.client.getBlock({ blockNumber: log.blockNumber })
      const timestamp = Number(block.timestamp) * 1000

      let tokenAmount: bigint
      let otherAmount: bigint
      let type: 'buy' | 'sell'
      let sender: string
      let recipient: string

      if (pool.dex === 'uniswap-v3') {
        // Uniswap V3 swap event
        const { sender: s, recipient: r, amount0, amount1 } = log.args
        sender = s
        recipient = r

        // Determine which token is our target token
        const isToken0 = pool.token0?.toLowerCase() === tokenAddress.toLowerCase()
        tokenAmount = isToken0 ? amount0 : amount1
        otherAmount = isToken0 ? amount1 : amount0
        type = tokenAmount > 0 ? 'buy' : 'sell'
      } else {
        // Uniswap V2 style swap event
        const { sender: s, amount0In, amount1In, amount0Out, amount1Out, to } = log.args
        sender = s
        recipient = to

        // Determine which token is our target token
        const isToken0 = pool.token0?.toLowerCase() === tokenAddress.toLowerCase()

        if (isToken0) {
          tokenAmount = amount0Out > 0 ? amount0Out : -amount0In
          otherAmount = amount1Out > 0 ? amount1Out : -amount1In
        } else {
          tokenAmount = amount1Out > 0 ? amount1Out : -amount1In
          otherAmount = amount0Out > 0 ? amount0Out : -amount0In
        }

        type = tokenAmount > 0 ? 'buy' : 'sell'
      }

      // Skip if amount is too small or too large
      if (this.shouldSkipSwap(tokenAmount, config)) {
        return null
      }

      // Calculate price
      const price = await this.calculateSwapPrice(tokenAmount, otherAmount, pool)

      const activity: TokenActivity = {
        id: `${log.transactionHash}-${log.logIndex}`,
        age: this.formatAge(timestamp),
        type,
        total: formatEther(tokenAmount > 0 ? tokenAmount : -tokenAmount),
        amount: formatEther(tokenAmount > 0 ? tokenAmount : -tokenAmount),
        price: price.toString(),
        maker: this.formatAddress(sender),
        other: this.formatAddress(recipient),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp,
        dex: pool.dex,
        poolAddress: pool.address,
        token0Amount: pool.token0 ? formatEther(tokenAmount > 0 ? tokenAmount : -tokenAmount) : '0',
        token1Amount: pool.token1 ? formatEther(otherAmount > 0 ? otherAmount : -otherAmount) : '0',
        token0Symbol: pool.token0Symbol,
        token1Symbol: pool.token1Symbol,
      }

      return activity

    } catch (error) {
      console.error('Error processing swap log:', error)
      return null
    }
  }

  /**
   * Get pools for a specific token
   */
  private async getPoolsForToken(tokenAddress: string, dexType: string = 'all'): Promise<Array<{ address: string; dex: string; token0?: string; token1?: string }>> {
    const pools: Array<{ address: string; dex: string; token0?: string; token1?: string }> = []

    // This is a simplified implementation
    // In a real implementation, you would query DEX factories to get all pools for the token
    const dexTypes = dexType === 'all' ? ['uniswap-v2', 'uniswap-v3', 'sushiswap'] : [dexType]

    for (const dex of dexTypes) {
      // For now, we'll use some known pools as examples
      // In production, you'd query the factory contracts
      if (dex === 'uniswap-v2') {
        // Example: USDT/WETH pool
        if (tokenAddress.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7') {
          pools.push({
            address: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
            dex: 'uniswap-v2',
            token0: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
          })
        }
      }
    }

    return pools
  }

  /**
   * Get pool information
   */
  private async getPoolInfo(poolAddress: string): Promise<{ token0?: string; token1?: string; token0Symbol?: string; token1Symbol?: string }> {
    // Check cache first
    if (this.poolInfo.has(poolAddress)) {
      return this.poolInfo.get(poolAddress)!
    }

    try {
      // Get token addresses from pool
      const [token0, token1] = await Promise.all([
        this.client.readContract({
          address: poolAddress as `0x${string}`,
          abi: [{ name: 'token0', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
          functionName: 'token0',
        }),
        this.client.readContract({
          address: poolAddress as `0x${string}`,
          abi: [{ name: 'token1', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
          functionName: 'token1',
        }),
      ])

      // Get token symbols
      const [token0Symbol, token1Symbol] = await Promise.all([
        this.getTokenSymbol(token0),
        this.getTokenSymbol(token1),
      ])

      const poolInfo = { token0, token1, token0Symbol, token1Symbol }
      this.poolInfo.set(poolAddress, poolInfo)
      return poolInfo

    } catch (error) {
      console.error('Error getting pool info:', error)
      return {}
    }
  }

  /**
   * Get token symbol
   */
  private async getTokenSymbol(tokenAddress: string): Promise<string | undefined> {
    try {
      return await this.client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [{ name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
        functionName: 'symbol',
      })
    } catch (error) {
      console.error('Error getting token symbol:', error)
      return undefined
    }
  }

  /**
   * Get swap event for DEX type
   */
  private getSwapEventForDex(dexType: string) {
    switch (dexType) {
      case 'uniswap-v3':
        return UNISWAP_V3_SWAP_EVENT
      case 'uniswap-v2':
      case 'sushiswap':
      case 'pancakeswap':
      default:
        return UNISWAP_V2_SWAP_EVENT
    }
  }

  /**
   * Add activity to cache
   */
  private addActivity(tokenAddress: string, activity: TokenActivity): void {
    const activities = this.activities.get(tokenAddress) || []
    activities.unshift(activity) // Add to beginning

    // Keep only the latest activities
    if (activities.length > this.maxActivities) {
      activities.splice(this.maxActivities)
    }

    this.activities.set(tokenAddress, activities)
  }

  /**
   * Determine if swap should be skipped
   */
  private shouldSkipSwap(tokenAmount: bigint, config: TokenActivityConfig): boolean {
    // Skip zero swaps only
    if (tokenAmount === 0n) return true

    return false
  }

  /**
   * Calculate price from swap amounts
   */
  private async calculateSwapPrice(
    tokenAmount: bigint,
    otherAmount: bigint,
    pool: { dex: string; token0?: string; token1?: string }
  ): Promise<number> {
    try {
      if (tokenAmount === 0n || otherAmount === 0n) return 0

      const tokenValue = parseFloat(formatEther(tokenAmount > 0 ? tokenAmount : -tokenAmount))
      const otherValue = parseFloat(formatEther(otherAmount > 0 ? otherAmount : -otherAmount))

      if (tokenValue === 0) return 0

      // Calculate price as other token amount / token amount
      return otherValue / tokenValue
    } catch (error) {
      console.error('Error calculating swap price:', error)
      return 0
    }
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Format age from timestamp
   */
  private formatAge(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s`
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string) {
    try {
      const address = getAddress(tokenAddress)

      // Get token details (name, symbol, decimals)
      const [name, symbol, decimals] = await Promise.all([
        this.client.readContract({
          address: address as `0x${string}`,
          abi: [{ name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
          functionName: 'name',
        }),
        this.client.readContract({
          address: address as `0x${string}`,
          abi: [{ name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
          functionName: 'symbol',
        }),
        this.client.readContract({
          address: address as `0x${string}`,
          abi: [{ name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }],
          functionName: 'decimals',
        }),
      ])

      return { name, symbol, decimals }
    } catch (error) {
      console.error('Error getting token info:', error)
      return null
    }
  }
}

export const tokenActivityService = new TokenActivityService() 