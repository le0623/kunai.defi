// Address utilities

import { getAddress, isAddress } from 'viem'
import { isValidAddress } from './validation'

/**
 * Normalize an Ethereum address to checksum format
 */
export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }
  return getAddress(address)
}

/**
 * Shorten an address for display
 */
export function shortenAddress(
  address: string,
  start: number = 6,
  end: number = 4
): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Get ENS name from address (placeholder - would require ENS resolution)
 */
export function getENSName(address: string): string | null {
  // This is a placeholder - in a real implementation you'd resolve ENS names
  return null
}

/**
 * Get address from ENS name (placeholder - would require ENS resolution)
 */
export function getAddressFromENS(ensName: string): string | null {
  // This is a placeholder - in a real implementation you'd resolve ENS addresses
  return null
}

/**
 * Check if two addresses are equal (case-insensitive)
 */
export function addressesEqual(address1: string, address2: string): boolean {
  try {
    return normalizeAddress(address1) === normalizeAddress(address2)
  } catch {
    return false
  }
}

/**
 * Get contract creation address (placeholder)
 */
export function getContractCreationAddress(address: string): string | null {
  // This is a placeholder - in a real implementation you'd query the blockchain
  return null
}

/**
 * Check if address is a contract (placeholder)
 */
export function isContractAddress(address: string): boolean {
  // This is a placeholder - in a real implementation you'd check the code at the address
  return false
}

/**
 * Get address type (EOA, Contract, etc.)
 */
export function getAddressType(address: string): 'EOA' | 'Contract' | 'Unknown' {
  if (!isValidAddress(address)) return 'Unknown'
  return isContractAddress(address) ? 'Contract' : 'EOA'
}

/**
 * Generate a deterministic address from a seed
 */
export function generateDeterministicAddress(seed: string): string {
  // This is a simplified implementation - in practice you'd use proper key derivation
  const hash = require('crypto').createHash('sha256').update(seed).digest('hex')
  return '0x' + hash.slice(-40)
}

/**
 * Get address checksum
 */
export function getAddressChecksum(address: string): string {
  return normalizeAddress(address)
}

/**
 * Validate address format
 */
export function validateAddressFormat(address: string): {
  isValid: boolean
  error?: string
} {
  if (!address) {
    return { isValid: false, error: 'Address is required' }
  }
  
  if (!address.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' }
  }
  
  if (address.length !== 42) {
    return { isValid: false, error: 'Address must be 42 characters long' }
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: 'Address contains invalid characters' }
  }
  
  return { isValid: true }
} 