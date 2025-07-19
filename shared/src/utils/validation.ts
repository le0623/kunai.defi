// Validation utilities

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Check if a string is a valid transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Check if a string is a valid chain ID
 */
export function isValidChainId(chainId: string | number): boolean {
  const validChainIds = [1, 56, 137, 42161, 10, 43114] // ETH, BSC, Polygon, Arbitrum, Optimism, Avalanche
  const id = typeof chainId === 'string' ? parseInt(chainId) : chainId
  return validChainIds.includes(id)
}

/**
 * Check if a string is a valid timeframe
 */
export function isValidTimeframe(timeframe: string): boolean {
  const validTimeframes = ['1m', '5m', '1h', '6h', '24h']
  return validTimeframes.includes(timeframe)
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if a value is a valid positive number
 */
export function isValidPositiveNumber(value: any): boolean {
  return isValidNumber(value) && value > 0
}

/**
 * Check if a value is a valid percentage (0-100)
 */
export function isValidPercentage(value: any): boolean {
  return isValidNumber(value) && value >= 0 && value <= 100
}

/**
 * Check if a string is a valid hex string
 */
export function isValidHexString(hex: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(hex)
}

/**
 * Check if a string is a valid signature
 */
export function isValidSignature(signature: string): boolean {
  return /^0x[a-fA-F0-9]{130}$/.test(signature)
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  page?: number
  limit?: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (params.page !== undefined && (!isValidPositiveNumber(params.page) || params.page < 1)) {
    errors.push('Page must be a positive integer')
  }
  
  if (params.limit !== undefined && (!isValidPositiveNumber(params.limit) || params.limit > 1000)) {
    errors.push('Limit must be a positive integer and not exceed 1000')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate pool filters
 */
export function validatePoolFilters(filters: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (filters.chain && !isValidChainId(filters.chain)) {
    errors.push('Invalid chain ID')
  }
  
  if (filters.tokenAddress && !isValidAddress(filters.tokenAddress)) {
    errors.push('Invalid token address')
  }
  
  if (filters.minMarketCap && !isValidPositiveNumber(filters.minMarketCap)) {
    errors.push('Min market cap must be a positive number')
  }
  
  if (filters.maxMarketCap && !isValidPositiveNumber(filters.maxMarketCap)) {
    errors.push('Max market cap must be a positive number')
  }
  
  if (filters.minLiquidity && !isValidPositiveNumber(filters.minLiquidity)) {
    errors.push('Min liquidity must be a positive number')
  }
  
  if (filters.maxLiquidity && !isValidPositiveNumber(filters.maxLiquidity)) {
    errors.push('Max liquidity must be a positive number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
} 