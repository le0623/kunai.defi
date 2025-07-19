// Security-related types

export interface TokenSecurityInfo {
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  chainId: string
  decimals: number
  isOpenSource: boolean
  isMalicious: boolean
  maliciousBehaviors: string[]
  approvedContracts: ApprovedAddressInfo[]
  balance: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  securityScore: number
}

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