// Formatting utilities

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * Format a number with appropriate suffixes (K, M, B, T)
 */
export function formatNumber(num: number | string, decimals: number = 2): string {
  // Remove commas from strings before parsing
  const value = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(value)) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) return `${sign}${(absValue / 1e12).toFixed(decimals).replace(/\.00$/, '')}T`;
  if (absValue >= 1e9) return `${sign}${(absValue / 1e9).toFixed(decimals).replace(/\.00$/, '')}B`;
  if (absValue >= 1e6) return `${sign}${(absValue / 1e6).toFixed(decimals).replace(/\.00$/, '')}M`;
  if (absValue >= 1e3) return `${sign}${(absValue / 1e3).toFixed(decimals).replace(/\.00$/, '')}K`;

  return `${sign}${Number.isInteger(absValue) ? absValue : absValue.toFixed(decimals)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  
  return `${num.toFixed(decimals)}%`
}

/**
 * Format address with ellipsis
 */
export function formatAddress(
  address: string,
  start: number = 6,
  end: number = 4
): string {
  if (!address || address.length < start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: Date | number): string {
  const now = new Date()
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Format gas price in Gwei
 */
export function formatGasPrice(gasPrice: bigint | string): string {
  const price = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice
  const gwei = Number(price) / 1e9
  return `${gwei.toFixed(2)} Gwei`
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number = 18
): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount
  const divisor = BigInt(10 ** decimals)
  const whole = value / divisor
  const fraction = value % divisor
  
  if (fraction === 0n) return whole.toString()
  
  const fractionStr = fraction.toString().padStart(decimals, '0')
  const trimmedFraction = fractionStr.replace(/0+$/, '')
  
  return `${whole}.${trimmedFraction}`
} 