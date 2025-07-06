# KunAI Proxy Wallet System

## Overview

The KunAI Proxy Wallet System provides a secure, non-custodial trading solution that eliminates the need to store user private keys while maintaining full security and control.

## How It Works

### 1. User Onboarding
- User connects their wallet to the Telegram bot
- Bot deploys a unique smart contract (proxy wallet) for the user
- User approves limited token access to the proxy contract
- No private keys are ever stored or transmitted

### 2. Smart Contract Architecture
```
User Wallet → Proxy Wallet → DEX Contracts
     ↑              ↑              ↑
Private Key    Smart Contract   Trading
(Stays with    (Executes       (Uniswap,
 user)         trades)         PancakeSwap)
```

### 3. Security Features
- **Non-custodial**: Users keep their private keys
- **Limited access**: Users set spending limits
- **Smart contract protection**: All trades go through secure contracts
- **Auditable**: All transactions are transparent and verifiable

## Smart Contracts

### ProxyWallet.sol
The main proxy contract that:
- Acts as a secure intermediary for user trades
- Enforces spending limits and slippage protection
- Executes trades on DEXs using approved tokens
- Provides emergency withdrawal functions

### ProxyWalletFactory.sol
Factory contract that:
- Deploys new proxy wallets for users
- Manages proxy wallet addresses
- Provides deployment tracking

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```bash
# Smart Contract Deployment
DEPLOYER_PRIVATE_KEY=your-deployer-private-key-here
OPERATOR_PRIVATE_KEY=your-operator-private-key-here
PROXY_FACTORY_ADDRESS=0x... # Deployed factory contract address
PROXY_WALLET_ADDRESS=0x... # Deployed proxy wallet contract address

# Ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

### 2. Deploy Smart Contracts
```bash
# Compile contracts
npx hardhat compile

# Deploy to network
npx hardhat run scripts/deploy.ts --network mainnet
```

### 3. Initialize Services
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the backend
npm run dev
```

## Telegram Bot Commands

### Wallet Setup
- `/setup_wallet` - Initialize proxy wallet
- `/wallet_status` - Check wallet status
- `/approve_tokens <token> <amount>` - Approve tokens for trading

### Trading
- `/trade <token_address> <amount>` - Execute manual trade
- `/portfolio` - View portfolio
- `/balance` - Check balances

### Configuration
- `/config` - Configure trading settings
- `/config_view` - View current configuration
- `/config_reset` - Reset to defaults

### Monitoring
- `/monitor` - Start pool monitoring
- `/stop` - Stop monitoring
- `/status` - Check bot status
- `/pools` - View recent pools

## User Flow

### 1. Initial Setup
```
User starts bot → Deploy proxy wallet → Approve tokens → Configure limits
```

### 2. Trading Process
```
Bot detects opportunity → User approves trade → Proxy executes → Tokens sent to user
```

### 3. Security Checks
- Proxy verifies user approval
- Checks spending limits
- Validates slippage protection
- Executes trade on DEX
- Returns tokens to user

## Database Schema

### ProxyWallet
```sql
- id: String (Primary Key)
- userAddress: String (User's wallet address)
- proxyAddress: String (Deployed proxy contract)
- maxTradeAmount: String (Max trade amount in ETH)
- maxSlippage: Int (Max slippage in basis points)
- dailyTradeLimit: String (Daily limit in ETH)
- isActive: Boolean
- deployedAt: DateTime
```

### ProxyApproval
```sql
- id: String (Primary Key)
- userAddress: String
- proxyAddress: String
- tokenAddress: String
- amount: String (Approved amount)
```

### ProxyTrade
```sql
- id: String (Primary Key)
- userAddress: String
- proxyAddress: String
- tradeId: String (Unique trade identifier)
- tokenIn: String
- tokenOut: String
- amountIn: String
- minAmountOut: String
- deadline: DateTime
- dexData: String
- status: String
- txHash: String
```

## Security Considerations

### 1. Private Key Security
- Never store or transmit private keys
- Users maintain full control of their wallets
- Proxy contracts only use approved allowances

### 2. Smart Contract Security
- All contracts are audited and verified
- Emergency withdrawal functions available
- Spending limits enforced at contract level

### 3. Access Control
- Only authorized operators can execute trades
- User approval required for all transactions
- Daily and per-trade limits enforced

## API Endpoints

### Proxy Wallet Management
```typescript
POST /api/proxy/deploy
POST /api/proxy/approve
GET /api/proxy/status/:userAddress
GET /api/proxy/trades/:userAddress
```

### Trading
```typescript
POST /api/trade/execute
GET /api/trade/history/:userAddress
POST /api/trade/cancel/:tradeId
```

## Monitoring and Analytics

### Real-time Tracking
- Live trade execution monitoring
- Portfolio value tracking
- Performance analytics
- Risk assessment

### Alerts
- Trade execution notifications
- Portfolio value changes
- Risk threshold alerts
- System status updates

## Troubleshooting

### Common Issues

1. **Proxy deployment fails**
   - Check deployer private key
   - Verify network connection
   - Ensure sufficient gas

2. **Trade execution fails**
   - Check token approvals
   - Verify spending limits
   - Check slippage settings

3. **Database connection issues**
   - Verify DATABASE_URL
   - Check PostgreSQL service
   - Run migrations if needed

### Support
For technical support:
- Email: support@kunai.com
- Telegram: @kunai_support
- Documentation: https://docs.kunai.com

## Development

### Local Development
```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run dev

# Run tests
npm test
```

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Contract tests
npx hardhat test
```

## Deployment

### Production Deployment
```bash
# Build application
npm run build

# Deploy contracts
npx hardhat run scripts/deploy.ts --network mainnet

# Start production server
npm start
```

### Environment Setup
- Use production RPC endpoints
- Secure private keys
- Enable monitoring and logging
- Configure backup systems

## License

This project is licensed under the MIT License - see the LICENSE file for details. 