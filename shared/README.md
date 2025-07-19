# @kunai/shared

Shared types and utilities for the Kunai DeFi platform.

## Overview

This package contains common types, utilities, and constants that are used across both the backend and frontend of the Kunai platform. It ensures type safety and consistency across the entire application.

## Installation

```bash
npm install @kunai/shared
```

## Usage

### Types

```typescript
import { Pool, TokenInfo, TradeRequest } from '@kunai/shared'

// Use types in your code
const pool: Pool = {
  id: '1',
  address: '0x...',
  chain: 'Ethereum',
  // ... other properties
}
```

### Utilities

```typescript
import { 
  formatCurrency, 
  formatAddress, 
  isValidAddress,
  calculatePercentageChange 
} from '@kunai/shared'

// Format currency
const formatted = formatCurrency(1234.56) // "$1,234.56"

// Format address
const shortAddress = formatAddress('0x1234567890abcdef...') // "0x1234...cdef"

// Validate address
const isValid = isValidAddress('0x1234...') // true/false

// Calculate percentage change
const change = calculatePercentageChange(100, 120) // 20
```

### Constants

```typescript
import { CHAIN_IDS, DEX_NAMES, TIMEFRAMES } from '@kunai/shared'

// Use constants
const ethereumChainId = CHAIN_IDS.ETHEREUM // 1
const uniswapName = DEX_NAMES.UNISWAP_V3 // "Uniswap V3"
const oneHour = TIMEFRAMES['1h'] // { label: "1 Hour", seconds: 3600 }
```

## Available Types

### Core Types
- `BaseEntity` - Base entity with id, createdAt, updatedAt
- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated data response
- `Timeframe` - Time interval definitions

### Pool Types
- `Pool` - Pool information
- `TokenInfo` - Token metadata
- `PoolMetrics` - Pool performance metrics
- `DexViewData` - Real-time trading data
- `PoolFilters` - Pool filtering options

### Trading Types
- `TradeRequest` - Trade execution request
- `TradeResponse` - Trade execution response
- `SniperConfig` - Sniper bot configuration
- `CopyTradeConfig` - Copy trading configuration

### Wallet Types
- `WalletInfo` - Wallet information
- `MonitoredWallet` - Monitored wallet data
- `Transaction` - Transaction details
- `Portfolio` - Portfolio holdings

### Security Types
- `TokenSecurityInfo` - Token security analysis
- `ContractAnalysis` - Contract security analysis
- `RiskAssessment` - Risk evaluation results

## Available Utilities

### Formatting
- `formatCurrency()` - Format numbers as currency
- `formatNumber()` - Format numbers with suffixes (K, M, B, T)
- `formatAddress()` - Shorten Ethereum addresses
- `formatPercentage()` - Format percentage values
- `formatDuration()` - Format time durations

### Validation
- `isValidAddress()` - Validate Ethereum addresses
- `isValidTxHash()` - Validate transaction hashes
- `isValidChainId()` - Validate chain IDs
- `validatePaginationParams()` - Validate pagination parameters

### Crypto
- `normalizeAddress()` - Normalize Ethereum addresses
- `addressesEqual()` - Compare addresses
- `randomHex()` - Generate random hex strings
- `sha256()` - Calculate SHA-256 hash

### Time
- `getCurrentTimestamp()` - Get current timestamp
- `getTimestampAgo()` - Get timestamp for timeframe ago
- `isWithinTimeframe()` - Check if timestamp is within timeframe
- `formatRelativeTime()` - Format relative time

### Math
- `calculatePercentageChange()` - Calculate percentage change
- `round()`, `floor()`, `ceil()` - Number rounding functions
- `clamp()` - Clamp value between min/max
- `average()`, `median()` - Statistical functions

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Clean

```bash
npm run clean
```

## Contributing

When adding new types or utilities:

1. Add the type/utility to the appropriate file in `src/types/` or `src/utils/`
2. Export it from the main index file
3. Update this README with documentation
4. Add tests if applicable

## License

MIT 