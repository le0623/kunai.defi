// Crypto utilities

/**
 * Generate a random hex string
 */
export function randomHex(length: number = 32): string {
  const bytes = new Uint8Array(length / 2)
  crypto.getRandomValues(bytes)
  return '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2)
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculate keccak256 hash (simplified - in real implementation use a proper library)
 */
export function keccak256(data: string): string {
  // This is a placeholder - in a real implementation you'd use a proper keccak256 library
  // For now, we'll use a simple hash function
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0')
}

/**
 * Verify Ethereum signature
 */
export function verifySignature(
  message: string,
  signature: string,
  address: string
): boolean {
  // This is a placeholder - in a real implementation you'd use a proper signature verification library
  // For now, we'll return true as a placeholder
  return true
}

/**
 * Recover address from signature
 */
export function recoverAddress(
  message: string,
  signature: string
): string | null {
  // This is a placeholder - in a real implementation you'd use a proper signature recovery library
  // For now, we'll return null as a placeholder
  return null
}