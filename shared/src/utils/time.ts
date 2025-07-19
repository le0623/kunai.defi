// Time utilities

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestampMs(): number {
  return Date.now()
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000)
}

/**
 * Get timestamp for a specific timeframe ago
 */
export function getTimestampAgo(timeframe: '1m' | '5m' | '1h' | '6h' | '24h'): number {
  const now = getCurrentTimestamp()
  const timeframeSeconds = {
    '1m': 60,
    '5m': 300,
    '1h': 3600,
    '6h': 21600,
    '24h': 86400
  }
  return now - timeframeSeconds[timeframe]
}

/**
 * Check if a timestamp is within a timeframe
 */
export function isWithinTimeframe(
  timestamp: number,
  timeframe: '1m' | '5m' | '1h' | '6h' | '24h'
): boolean {
  const timeframeAgo = getTimestampAgo(timeframe)
  return timestamp >= timeframeAgo
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

/**
 * Parse ISO string to timestamp
 */
export function parseTimestamp(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000)
}

/**
 * Get time difference between two timestamps
 */
export function getTimeDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp1 - timestamp2)
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

/**
 * Get start of day timestamp
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  date.setHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

/**
 * Get end of day timestamp
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  date.setHours(23, 59, 59, 999)
  return Math.floor(date.getTime() / 1000)
}

/**
 * Get start of week timestamp
 */
export function getStartOfWeek(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

/**
 * Get start of month timestamp
 */
export function getStartOfMonth(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

/**
 * Add time to timestamp
 */
export function addTime(
  timestamp: number,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): number {
  const multipliers = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400
  }
  return timestamp + (amount * multipliers[unit])
}

/**
 * Subtract time from timestamp
 */
export function subtractTime(
  timestamp: number,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): number {
  return addTime(timestamp, -amount, unit)
} 