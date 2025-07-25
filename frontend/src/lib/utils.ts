import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function showAlert(message: string) {
  try {
    window.Telegram.WebApp.showAlert(message);
  } catch (error) {
    alert(message);
  }
};

// Helper function to format numbers with k, m, b units
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b'
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num > 0 ? num.toFixed(2).toString() : '0'
}

// Helper function to get color class for market cap and volume
export const getValueColor = (value: number, type: 'mc' | 'vol'): string => {
  if (type === 'mc' || type === 'vol') {
    if (value < 20000) return 'text-gray-500'
    if (value < 40000) return 'text-green-500'
    if (value < 1000000) return 'text-cyan-500'
    return 'text-yellow-500'
  }
  return ''
}

// Helper function to format age
export const formatAge = (ageInSeconds: number): { formatted: string; color: string } => {
  const seconds = ageInSeconds
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return { formatted: `${days}d`, color: 'text-gray-500' }
  } else if (hours > 0) {
    return { formatted: `${hours}h`, color: 'text-gray-500' }
  } else if (minutes > 0) {
    return { formatted: `${minutes}m`, color: 'text-gray-500' }
  } else {
    return { formatted: `${seconds}s`, color: 'text-green-500' }
  }
}

// Helper function to format price with subscript
export const formatPrice = (price: number): string => {
  if (price >= 0.0001) {
    return price.toFixed(4);
  }

  // Use exponential notation to count zeros
  const [mantissa, expStr] = price.toExponential().split('e-');
  const leadingZeros = Math.max(0, parseInt(expStr) - 1); // e.g., e-9 → 8 zeros

  // Remove decimal and take only first 4 significant digits
  const significantDigits = mantissa.replace('.', '').slice(0, 4);

  // Unicode subscript (only works for 0-9)
  const subscript = leadingZeros < 10
    ? String.fromCharCode(8320 + leadingZeros) // '₀' to '₉'
    : `(${leadingZeros})`; // fallback for ≥10

  return `0.0${subscript}${significantDigits}`;
}