# Token Security API

This document describes the token security analysis feature powered by GoPlus Labs API.

## Overview

The token security API provides comprehensive security analysis for tokens across multiple blockchain networks. It helps users identify potential risks, malicious behaviors, and security vulnerabilities in tokens.

## Features

- **Malicious Behavior Detection**: Identifies known malicious patterns and behaviors
- **Open Source Verification**: Checks if the token contract is verified and open source
- **Approved Contract Analysis**: Lists contracts that have approval to spend tokens
- **Risk Level Assessment**: Provides risk levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Security Score**: Calculates a security score from 0-100
- **Multi-Chain Support**: Supports Ethereum, BSC, Polygon, Arbitrum, Optimism, and Avalanche

## API Endpoints

### 1. Get Token Security Information
```
GET /api/token-security/:chainId/:tokenAddress
```

**Parameters:**
- `chainId` (string, required): Chain ID (1, 56, 137, 42161, 10, 43114)
- `tokenAddress` (string, required): Token contract address

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "0x...",
    "tokenName": "Token Name",
    "tokenSymbol": "TKN",
    "chainId": "1",
    "decimals": 18,
    "isOpenSource": true,
    "isMalicious": false,
    "maliciousBehaviors": [],
    "approvedContracts": [...],
    "balance": "1000000000000000000000",
    "riskLevel": "LOW",
    "securityScore": 95
  }
}
```

### 2. Get Multiple Tokens Security
```
POST /api/token-security/batch
```

**Body:**
```json
{
  "chainId": "1",
  "tokenAddresses": ["0x...", "0x..."]
}
```

### 3. Check Token Safety
```
GET /api/token-security/:chainId/:tokenAddress/safe
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "0x...",
    "chainId": "1",
    "isSafe": true
  }
}
```

### 4. Get Malicious Behaviors
```
GET /api/token-security/:chainId/:tokenAddress/malicious-behaviors
```

### 5. Get Approved Contracts
```
GET /api/token-security/:chainId/:tokenAddress/approved-contracts
```

## Supported Chains

| Chain ID | Name | Network |
|----------|------|---------|
| 1 | Ethereum | Mainnet |
| 56 | Binance Smart Chain | Mainnet |
| 137 | Polygon | Mainnet |
| 42161 | Arbitrum One | Mainnet |
| 10 | Optimism | Mainnet |
| 43114 | Avalanche C-Chain | Mainnet |

## Risk Levels

- **LOW**: Token appears safe with no major security concerns
- **MEDIUM**: Token has some potential risks, proceed with caution
- **HIGH**: Token has significant security risks, not recommended
- **CRITICAL**: Token is malicious or highly risky, avoid at all costs

## Security Score

The security score (0-100) is calculated based on:
- Malicious status (-100 points if malicious)
- Open source status (-30 points if not open source)
- Malicious behaviors (-10 points per behavior)
- Number of approved contracts (-10 to -20 points based on count)

## Environment Variables

Add the following to your `.env` file:

```env
GOPLUS_API_KEY=your_goplus_api_key_here
```

## Frontend Integration

The frontend includes:
- `TokenSecurityCard` component for displaying security analysis
- `TokenSecurity` page for testing and demonstration
- `tokenSecurityService` for API communication

## Usage Examples

### Backend Service Usage
```typescript
import { goplusService } from '../services/goplusService'

// Get security info for a single token
const securityInfo = await goplusService.getTokenSecurity('1', '0x...')

// Check if token is safe
const isSafe = await goplusService.isTokenSafe('1', '0x...')

// Get malicious behaviors
const behaviors = await goplusService.getMaliciousBehaviors('1', '0x...')
```

### Frontend Component Usage
```tsx
import { TokenSecurityCard } from '../components/TokenSecurityCard'

<TokenSecurityCard 
  chainId="1" 
  tokenAddress="0x..." 
  className="w-full" 
/>
```

## Error Handling

The API handles various error scenarios:
- Invalid chain ID or token address format
- Missing or invalid API key
- Network timeouts and connection errors
- GoPlus API errors (401, 403, 404)

## Rate Limiting

The API includes rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Timeout of 10-15 seconds for API calls

## Security Considerations

- API key should be kept secure and not exposed in client-side code
- All token addresses are validated for proper format
- Chain IDs are restricted to supported networks
- Error messages don't expose sensitive information

## Dependencies

- `axios` for HTTP requests
- `express` for API routing
- Environment variables for configuration 