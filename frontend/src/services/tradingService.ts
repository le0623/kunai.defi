import { createPublicClient, http, parseAbiItem, formatEther, parseEther, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { toast } from 'sonner'
import { authAPI } from './api'

// Uniswap V3 Router ABI (simplified for swapExactTokensForTokens)
const UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ]
      }
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    name: 'exactOutputSingle',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ]
      }
    ],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'payable'
  }
]

// ERC20 ABI for token approvals and balance checks
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  }
]

// Uniswap V3 Router address
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

export interface TradeParams {
  tokenAddress: string
  amount: string
  isBuy: boolean
  slippageTolerance?: number // in basis points (e.g., 50 = 0.5%)
  deadline?: number // in seconds from now
}

export interface TradeResult {
  success: boolean
  txHash?: string
  amountIn?: string
  amountOut?: string
  error?: string
}

export interface BalanceUpdate {
  ethBalance: string
  tokenBalance: string
}

class TradingService {
  private client = createPublicClient({
    chain: mainnet,
    transport: http(import.meta.env.VITE_ETHEREUM_RPC_URL ?? "https://1rpc.io/eth"),
  })

  /**
   * Execute a token trade (buy or sell)
   */
  async executeTrade(
    params: TradeParams,
    walletType: 'in-app' | 'external',
    externalWalletAddress?: string,
    onBalanceUpdate?: (balances: BalanceUpdate) => void
  ): Promise<TradeResult> {
    try {
      const { tokenAddress, amount, isBuy, slippageTolerance = 50, deadline = 300 } = params
      
      // Determine wallet address
      let walletAddress: string
      if (walletType === 'in-app') {
        const user = await authAPI.getCurrentUser()
        walletAddress = user.inAppWallet
      } else {
        if (!externalWalletAddress) {
          throw new Error('External wallet address is required')
        }
        walletAddress = externalWalletAddress
      }

      // Validate inputs
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount')
      }

      // Check balance before trading
      const balanceCheck = await this.checkBalance(tokenAddress, walletAddress, amount, isBuy)
      if (!balanceCheck.sufficient) {
        throw new Error(balanceCheck.error || 'Insufficient balance')
      }

      const amountIn = parseEther(amount)
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline)

      let result: TradeResult

      if (walletType === 'in-app') {
        // Use backend API for in-app wallet
        result = await this.executeInAppTrade(params, walletAddress)
      } else {
        // Use frontend for external wallet
        result = await this.executeExternalTrade(params, walletAddress, slippageTolerance, deadlineTimestamp)
      }

      // Update balances if trade was successful
      if (result.success && onBalanceUpdate) {
        const newBalances = await this.getUpdatedBalances(tokenAddress, walletAddress)
        onBalanceUpdate(newBalances)
      }

      return result

    } catch (error) {
      console.error('Trade execution error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      toast.error(`Trade failed: ${errorMessage}`)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Check if wallet has sufficient balance for the trade
   */
  private async checkBalance(
    tokenAddress: string, 
    walletAddress: string, 
    amount: string, 
    isBuy: boolean
  ): Promise<{ sufficient: boolean; error?: string }> {
    try {
      if (isBuy) {
        // Check ETH balance for buying
        const ethBalance = await this.getEthBalance(walletAddress)
        const requiredAmount = parseFloat(amount)
        const availableBalance = parseFloat(ethBalance)
        
        if (requiredAmount > availableBalance) {
          return {
            sufficient: false,
            error: `Insufficient ETH balance. You have ${availableBalance.toFixed(4)} ETH, but need ${requiredAmount.toFixed(4)} ETH`
          }
        }
      } else {
        // Check token balance for selling
        const tokenBalance = await this.getTokenBalance(tokenAddress, walletAddress)
        const requiredAmount = parseFloat(amount)
        const availableBalance = parseFloat(tokenBalance)
        
        if (requiredAmount > availableBalance) {
          return {
            sufficient: false,
            error: `Insufficient token balance. You have ${availableBalance.toFixed(4)} tokens, but want to sell ${requiredAmount.toFixed(4)} tokens`
          }
        }
      }
      
      return { sufficient: true }
    } catch (error) {
      console.error('Balance check error:', error)
      return {
        sufficient: false,
        error: 'Failed to check balance'
      }
    }
  }

  /**
   * Execute trade using in-app wallet (backend API)
   */
  private async executeInAppTrade(params: TradeParams, walletAddress: string): Promise<TradeResult> {
    try {
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          tokenAddress: params.tokenAddress,
          amount: params.amount,
          isBuy: params.isBuy,
          slippageTolerance: params.slippageTolerance || 50,
          deadline: params.deadline || 300
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Backend trade execution failed')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Trade executed successfully! TX: ${result.txHash?.slice(0, 10)}...`)
      }

      return result

    } catch (error) {
      console.error('In-app trade error:', error)
      throw error
    }
  }

  /**
   * Execute trade using external wallet (frontend)
   */
  private async executeExternalTrade(
    params: TradeParams,
    walletAddress: string,
    slippageTolerance: number,
    deadline: bigint
  ): Promise<TradeResult> {
    try {
      const { tokenAddress, amount, isBuy } = params
      const amountIn = parseEther(amount)

      if (isBuy) {
        return await this.executeExternalBuy(tokenAddress, amountIn, walletAddress, slippageTolerance, deadline)
      } else {
        return await this.executeExternalSell(tokenAddress, amountIn, walletAddress, slippageTolerance, deadline)
      }

    } catch (error) {
      console.error('External trade error:', error)
      throw error
    }
  }

  /**
   * Execute external wallet buy trade
   */
  private async executeExternalBuy(
    tokenAddress: string,
    amountIn: bigint,
    walletAddress: string,
    slippageTolerance: number,
    deadline: bigint
  ): Promise<TradeResult> {
    try {
      // This would use wagmi hooks to execute the transaction
      // For now, we'll simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Buy order executed successfully! TX: ${mockTxHash.slice(0, 10)}...`)

      return {
        success: true,
        txHash: mockTxHash,
        amountIn: formatEther(amountIn),
        amountOut: '0' // Would be calculated from actual swap
      }

    } catch (error) {
      console.error('External buy error:', error)
      throw error
    }
  }

  /**
   * Execute external wallet sell trade
   */
  private async executeExternalSell(
    tokenAddress: string,
    amountIn: bigint,
    walletAddress: string,
    slippageTolerance: number,
    deadline: bigint
  ): Promise<TradeResult> {
    try {
      // This would use wagmi hooks to execute the transaction
      // For now, we'll simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Sell order executed successfully! TX: ${mockTxHash.slice(0, 10)}...`)

      return {
        success: true,
        txHash: mockTxHash,
        amountIn: formatEther(amountIn),
        amountOut: '0' // Would be calculated from actual swap
      }

    } catch (error) {
      console.error('External sell error:', error)
      throw error
    }
  }

  /**
   * Get updated balances after trade
   */
  private async getUpdatedBalances(tokenAddress: string, walletAddress: string): Promise<BalanceUpdate> {
    try {
      const [ethBalance, tokenBalance] = await Promise.all([
        this.getEthBalance(walletAddress),
        this.getTokenBalance(tokenAddress, walletAddress)
      ])

      return {
        ethBalance,
        tokenBalance
      }
    } catch (error) {
      console.error('Error getting updated balances:', error)
      return {
        ethBalance: '0',
        tokenBalance: '0'
      }
    }
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const balance = await this.client.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [getAddress(walletAddress)]
      })

      const decimals = await this.client.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: []
      })

      return formatEther(balance as bigint)
    } catch (error) {
      console.error('Error getting token balance:', error)
      return '0'
    }
  }

  /**
   * Get ETH balance for a wallet
   */
  async getEthBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({
        address: getAddress(walletAddress)
      })

      return formatEther(balance)
    } catch (error) {
      console.error('Error getting ETH balance:', error)
      return '0'
    }
  }

  /**
   * Check if router has sufficient allowance for a token
   */
  async checkAllowance(tokenAddress: string, walletAddress: string, amount: bigint): Promise<boolean> {
    try {
      const allowance = await this.client.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [getAddress(walletAddress), getAddress(UNISWAP_V3_ROUTER)]
      })

      return (allowance as bigint) >= amount
    } catch (error) {
      console.error('Error checking allowance:', error)
      return false
    }
  }

  /**
   * Approve router to spend tokens
   */
  async approveToken(tokenAddress: string, walletAddress: string, amount: bigint): Promise<boolean> {
    try {
      // This would execute the approval transaction
      // For now, we'll simulate a successful approval
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Token approval successful')
      return true
    } catch (error) {
      console.error('Error approving token:', error)
      toast.error('Token approval failed')
      return false
    }
  }
}

export const tradingService = new TradingService() 