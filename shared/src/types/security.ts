// Security-related types

/**
 * TokenSecurity - Comprehensive token security analysis data
 * 
 * This interface contains all security-related information for a token including:
 * - Basic token information (name, symbol, supply)
 * - Security flags (honeypot, proxy, mintable, etc.)
 * - Tax information (buy/sell taxes)
 * - Holder information and distribution
 * - DEX information and liquidity
 * - Risk assessments and notes
 * 
 * Usage:
 * ```typescript
 * import { TokenSecurity } from '@kunai/shared'
 * 
 * const securityData: TokenSecurity = await getTokenSecurity(tokenAddress)
 * console.log(securityData.is_honeypot) // '1' for true, '0' for false
 * console.log(securityData.buy_tax) // Tax percentage as string
 * ```
 */
export interface TokenSecurityInfo {
  anti_whale_modifiable: string
  buy_tax: string
  can_take_back_ownership: string
  cannot_buy: string
  cannot_sell_all: string
  creator_address: string
  creator_balance: string
  creator_percent: string
  dex: DexInfo[]
  external_call: string
  fake_token: FakeTokenInfo
  hidden_owner: string
  holder_count: string
  holders: HolderInfo[]
  honeypot_with_same_creator: string
  is_airdrop_scam: string
  is_anti_whale: string
  is_blacklisted: string
  is_honeypot: string
  is_in_dex: string
  is_mintable: string
  is_open_source: string
  is_proxy: string
  is_true_token: string
  is_whitelisted: string
  lp_holder_count: string
  lp_holders: LpHolderInfo[]
  lp_total_supply: string
  note: string
  other_potential_risks: string
  owner_address: string
  owner_balance: string
  owner_change_balance: string
  owner_percent: string
  personal_slippage_modifiable: string
  selfdestruct: string
  sell_tax: string
  slippage_modifiable: string
  token_name: string
  token_symbol: string
  total_supply: string
  trading_cooldown: string
  transfer_pausable: string
  trust_list: string
}

export interface DexInfo {
  liquidity: string
  name: string
  pair: string
}

export interface FakeTokenInfo {
  true_token_address: string
  value: number
}

export interface HolderInfo {
  address: string
  balance: string
  is_contract: number
  is_locked: number
  locked_detail: LockedDetailInfo[]
  percent: string
  tag: string
}

export interface LpHolderInfo {
  NFT_list: NftInfo[]
  address: string
  balance: string
  is_contract: number
  is_locked: number
  locked_detail: LockedDetailInfo[]
  percent: string
  tag: string
}

export interface LockedDetailInfo {
  amount: string
  end_time: string
  opt_time: string
}

export interface NftInfo {
  NFT_id: string
  NFT_percentage: string
  amount: string
  in_effect: string
  value: string
}

// export interface TokenSecurityInfo {
//   tokenAddress: string
//   tokenName: string
//   tokenSymbol: string
//   chainId: string
//   decimals: number
//   isOpenSource: boolean
//   isMalicious: boolean
//   maliciousBehaviors: string[]
//   approvedContracts: ApprovedAddressInfo[]
//   balance: string
//   riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
//   securityScore: number
// }

export interface ApprovedAddressInfo {
  approved_amount: string
  approved_contract: string
  approved_time: number
  hash: string
  initial_approval_hash: string
  initial_approval_time: number
}

export interface ContractAnalysis {
  contractAddress: string
  name?: string
  symbol?: string
  decimals?: number
  totalSupply?: string
  isHoneypot: boolean
  isRugPull: boolean
  hasProxy: boolean
  isVerified: boolean
  riskScore: number
  riskFactors: string[]
  lastAnalyzed: Date
  analysisSource?: string
}

export interface SecurityScanResult {
  contractAddress: string
  scanId: string
  status: 'pending' | 'completed' | 'failed'
  results: {
    honeypot: boolean
    rugPull: boolean
    proxy: boolean
    verified: boolean
    riskScore: number
    riskFactors: string[]
    recommendations: string[]
  }
  scannedAt: Date
  completedAt?: Date
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number
  riskFactors: RiskFactor[]
  recommendations: string[]
  lastUpdated: Date
}

export interface RiskFactor {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  impact: string
  mitigation?: string
}

export interface SecurityAlert {
  id: string
  type: 'honeypot_detected' | 'rug_pull_suspected' | 'high_risk_token' | 'suspicious_activity'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  tokenAddress?: string
  poolAddress?: string
  metadata?: any
  isRead: boolean
  createdAt: Date
  userId?: string
}

export interface SecurityConfig {
  honeypotCheck: boolean
  rugPullCheck: boolean
  proxyCheck: boolean
  verificationCheck: boolean
  riskThreshold: number
  autoBlock: boolean
  alertOnRisk: boolean
}

export interface TokenApprovalRisk {
  tokenAddress: string
  spenderAddress: string
  approvedAmount: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskFactors: string[]
  recommendation: string
  lastUpdated: Date
} 