// Math utilities

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Calculate percentage of a value
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Round to specified decimal places
 */
export function round(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Floor to specified decimal places
 */
export function floor(value: number, decimals: number = 2): number {
  return Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Ceil to specified decimal places
 */
export function ceil(value: number, decimals: number = 2): number {
  return Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Check if a number is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Calculate average of an array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Calculate median of an array of numbers
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  
  return sorted[middle]
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const avg = average(numbers)
  const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2))
  const avgSquaredDiff = average(squaredDiffs)
  
  return Math.sqrt(avgSquaredDiff)
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  initialValue: number,
  finalValue: number,
  years: number
): number {
  if (initialValue <= 0 || years <= 0) return 0
  return Math.pow(finalValue / initialValue, 1 / years) - 1
}

/**
 * Calculate simple interest
 */
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  time: number
): number {
  return principal * (rate / 100) * time
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  frequency: number = 1
): number {
  return principal * Math.pow(1 + (rate / 100) / frequency, frequency * time) - principal
}

/**
 * Calculate future value
 */
export function calculateFutureValue(
  principal: number,
  rate: number,
  time: number,
  frequency: number = 1
): number {
  return principal * Math.pow(1 + (rate / 100) / frequency, frequency * time)
}

/**
 * Calculate present value
 */
export function calculatePresentValue(
  futureValue: number,
  rate: number,
  time: number,
  frequency: number = 1
): number {
  return futureValue / Math.pow(1 + (rate / 100) / frequency, frequency * time)
}

/**
 * Calculate weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0
  
  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  return totalWeight === 0 ? 0 : weightedSum / totalWeight
}

/**
 * Calculate moving average
 */
export function movingAverage(values: number[], period: number): number[] {
  if (values.length < period) return []
  
  const result: number[] = []
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  
  return result
} 