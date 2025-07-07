# Kunai DeFi Smart Contracts

This directory contains the smart contracts for the Kunai DeFi trading platform, implementing secure proxy wallet functionality for safe DeFi trading.

## 📋 Contracts Overview

### ProxyWallet.sol
The core contract that provides secure proxy trading functionality, allowing users to approve limited token access without sharing private keys.

**Key Features:**
- **Limited Approvals**: Users can approve specific amounts without sharing private keys
- **Daily Limits**: Configurable daily trading limits to prevent excessive trading
- **Slippage Protection**: Built-in slippage protection to prevent MEV attacks
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Pausable Functionality**: Emergency pause capability for security
- **Trade Execution**: Execute trades through DEX integration
- **Emergency Withdrawal**: Emergency withdrawal capabilities

**Security Features:**
```solidity
// Reentrancy protection
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Pausable functionality
import "@openzeppelin/contracts/utils/Pausable.sol";

// Access control
import "@openzeppelin/contracts/access/Ownable.sol";

// Safe ERC20 operations
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```

### ProxyWalletFactory.sol
Factory contract for deploying user-specific proxy wallets with predefined configurations.

**Key Features:**
- **User-Specific Deployment**: Deploy proxy wallets for individual users
- **Configuration Management**: Initialize user configurations during deployment
- **Proxy Tracking**: Track all deployed proxy wallets
- **Address Mapping**: Map users to their proxy wallet addresses

## 🏗️ Contract Architecture

```
ProxyWalletFactory
    ↓ deploys
ProxyWallet (per user)
    ↓ interacts with
DEX Contracts (Uniswap, etc.)
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Git

### Installation
```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile
```

### Available Scripts

#### Compilation & Testing
```bash
# Compile contracts
pnpm compile

# Run tests
pnpm test

# Run tests with gas reporting
REPORT_GAS=true pnpm test
```

#### Local Development
```bash
# Start local Hardhat node
pnpm node

# Deploy to local Hardhat node
pnpm deploy:localhost
```

#### Network Deployment
```bash
# Deploy to Sepolia testnet
pnpm deploy:sepolia

# Deploy to Ethereum mainnet
pnpm deploy:ethereum

# Deploy to local Hardhat network
pnpm deploy:hardhat
```

#### Contract Verification
```bash
# Verify on Sepolia
pnpm verify:sepolia

# Verify on Ethereum mainnet
pnpm verify:ethereum
```

## 📊 Contract Functions

### ProxyWallet Functions

#### User Management
- `initializeUser(address user, uint256 maxTradeAmount, uint256 maxSlippage, uint256 dailyTradeLimit)` - Initialize user configuration
- `updateApproval(address token, uint256 amount)` - Update token approval amount

#### Trading
- `executeTrade(address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline, bytes32 tradeId, bytes calldata dexData)` - Execute trade through proxy

#### Emergency Functions
- `pause()` - Pause all trading (owner only)
- `unpause()` - Unpause trading (owner only)
- `emergencyWithdraw(address token, uint256 amount)` - Emergency withdrawal

### ProxyWalletFactory Functions

#### Deployment
- `deployProxyWallet(address user, uint256 maxTradeAmount, uint256 maxSlippage, uint256 dailyTradeLimit)` - Deploy proxy wallet for user

#### Query Functions
- `getProxyWallet(address user)` - Get proxy wallet address for user
- `getAllDeployedProxies()` - Get all deployed proxy addresses
- `getDeployedCount()` - Get total number of deployed proxies

## 🔐 Security Considerations

### Access Control
- **Owner Functions**: Only contract owner can initialize users and pause/unpause
- **Operator Functions**: Only designated operator can execute trades
- **User Functions**: Users can only update their own approvals

### Limits and Protections
- **Maximum Approval**: 100 ETH maximum approval per token
- **Daily Limits**: Configurable daily trading limits per user
- **Slippage Protection**: Maximum 10% slippage allowed
- **Deadline Protection**: Trades must execute before deadline

### Reentrancy Protection
```solidity
modifier nonReentrant() {
    require(!_locked, "ReentrancyGuard: reentrant call");
    _locked = true;
    _;
    _locked = false;
}
```

## 🧪 Testing

### Test Structure
```
test/
├── ProxyWallet.ts          # ProxyWallet contract tests
├── ProxyWalletFactory.ts   # Factory contract tests
└── integration/            # Integration tests
    ├── TradingFlow.ts      # End-to-end trading tests
    └── SecurityTests.ts    # Security vulnerability tests
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test test/ProxyWallet.ts

# Run with gas reporting
REPORT_GAS=true pnpm test

# Run coverage
pnpm test:coverage
```

## 📈 Gas Optimization

### ProxyWallet Gas Costs
- **Deployment**: ~2,500,000 gas
- **User Initialization**: ~50,000 gas
- **Trade Execution**: ~150,000 gas (varies with DEX complexity)
- **Approval Update**: ~30,000 gas

### ProxyWalletFactory Gas Costs
- **Deployment**: ~800,000 gas
- **Proxy Deployment**: ~2,500,000 gas per user

## 🔍 Verification

### Etherscan Verification
```bash
# Verify on Etherscan
pnpm verify:ethereum

# Verify on Sepolia
pnpm verify:sepolia
```

### Contract Addresses
After deployment, contract addresses will be stored in:
```
ignition/deployments/chain-{chainId}/deployed_addresses.json
```

## 🚀 Deployment Scripts

### Hardhat Ignition Modules
```
ignition/modules/
└── ProxyWallet.ts          # Deployment module for ProxyWallet
```

### Deployment Process
1. Deploy ProxyWalletFactory
2. Deploy ProxyWallet through factory
3. Initialize user configurations
4. Set operator permissions
5. Verify contracts on Etherscan

## 🌐 Network Configuration

### Supported Networks
- **Hardhat**: Local development network (chainId: 31337)
- **Localhost**: Local node (chainId: 31337)
- **Sepolia**: Ethereum testnet (chainId: 11155111)
- **Ethereum**: Mainnet (chainId: 1)

### Environment Variables
```bash
# Required for deployment
OPERATOR_PRIVATE_KEY=0x...your-private-key-here...

# Optional - RPC URLs (defaults provided)
RPC_URL=https://your-rpc-url.com

# Optional - Etherscan API key for verification
ETHERSCAN_API_KEY=your-etherscan-api-key

# Optional - Gas reporting
REPORT_GAS=true
```

## 📚 Documentation

### Events
- `TradeExecuted(address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, bytes32 tradeId)`
- `ApprovalUpdated(address user, address token, uint256 oldAmount, uint256 newAmount)`
- `EmergencyWithdraw(address user, address token, uint256 amount)`
- `ProxyWalletDeployed(address user, address proxyWallet, uint256 maxTradeAmount, uint256 maxSlippage)`

### Error Messages
- `"ProxyWallet: Only operator"` - Only operator can execute trades
- `"ProxyWallet: User not active"` - User not initialized or inactive
- `"ProxyWallet: Amount too high"` - Approval amount exceeds maximum
- `"ProxyWallet: Trade expired"` - Trade deadline passed
- `"ProxyWallet: Daily limit exceeded"` - Daily trading limit reached

## 🔧 Integration

### Backend Integration
The contracts integrate with the backend through:
- **Web3.js/Ethers.js**: Contract interaction
- **Event Listening**: Real-time trade monitoring
- **Gas Estimation**: Dynamic gas price calculation
- **Transaction Management**: Nonce and confirmation tracking

### Frontend Integration
- **Wallet Connection**: MetaMask integration
- **Approval Management**: Token approval interface
- **Trade Execution**: User-friendly trading interface
- **Portfolio Tracking**: Real-time balance updates

## 🛠️ Development Workflow

### 1. Setup Development Environment
```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile
```

### 2. Local Testing
```bash
# Start local node
pnpm node

# In another terminal, run tests
pnpm test

# Deploy to local network
pnpm deploy:localhost
```

### 3. Testnet Deployment
```bash
# Set environment variables
export OPERATOR_PRIVATE_KEY=0x...
export RPC_URL=https://sepolia.infura.io/v3/...

# Deploy to Sepolia
pnpm deploy:sepolia

# Verify contracts
pnpm verify:sepolia
```

### 4. Mainnet Deployment
```bash
# Set mainnet environment variables
export OPERATOR_PRIVATE_KEY=0x...
export RPC_URL=https://mainnet.infura.io/v3/...

# Deploy to mainnet
pnpm deploy:ethereum

# Verify contracts
pnpm verify:ethereum
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Kunai DeFi Smart Contracts** - Secure, gas-optimized proxy wallet system for DeFi trading 