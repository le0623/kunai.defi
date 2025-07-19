// Blockchain-related types

export interface Block {
  number: number
  hash: string
  parentHash: string
  timestamp: number
  gasLimit: bigint
  gasUsed: bigint
  miner: string
  transactions: string[]
  baseFeePerGas?: bigint
}

export interface TransactionReceipt {
  transactionHash: string
  blockNumber: number
  blockHash: string
  gasUsed: bigint
  cumulativeGasUsed: bigint
  effectiveGasPrice: bigint
  contractAddress?: string
  logs: Log[]
  status: number
  to?: string
  from: string
}

export interface Log {
  address: string
  topics: string[]
  data: string
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  blockHash: string
  logIndex: number
  removed: boolean
}

export interface ContractEvent {
  name: string
  signature: string
  address: string
  blockNumber: number
  transactionHash: string
  logIndex: number
  args: any
  timestamp: number
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  estimatedCost: string
}

export interface NetworkInfo {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockTime: number
  isTestnet: boolean
}

export interface TokenContract {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  owner?: string
  isVerified: boolean
  abi?: any[]
}

export interface PoolContract {
  address: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
}

export interface ContractCall {
  to: string
  data: string
  value?: bigint
  gasLimit?: bigint
  gasPrice?: bigint
}

export interface ContractCallResult {
  success: boolean
  data?: string
  gasUsed?: bigint
  error?: string
}

export interface EventFilter {
  address?: string
  topics?: (string | string[])[]
  fromBlock?: number
  toBlock?: number
}

export interface EventSubscription {
  id: string
  filter: EventFilter
  callback: (event: ContractEvent) => void
  isActive: boolean
} 