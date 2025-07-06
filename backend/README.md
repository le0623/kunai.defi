# Kunai Trading Platform Backend

A high-performance backend API for the Kunai trading platform with real-time wallet monitoring, smart contract analysis, and automated trading capabilities.

## 🚀 Features

### Real-Time Wallet Monitoring
- **Live Transaction Tracking**: Monitor wallet transactions in real-time
- **Smart Wallet Detection**: Automatically identify whales, influencers, and active traders
- **Buy/Sell Analysis**: Detect and categorize trading activities
- **Portfolio Tracking**: Real-time portfolio updates and value tracking
- **Risk Assessment**: Calculate risk scores for monitored wallets

### Security & Analysis
- **Contract Analysis**: Detect honeypots, rug pulls, and risky contracts
- **Alert System**: Real-time notifications for significant activities
- **Smart Wallet Labeling**: Categorize wallets by behavior patterns
- **Risk Scoring**: 0-100 risk assessment for wallets and contracts

### Trading Features
- **Copy Trading**: Automatically copy successful traders
- **Trading Bots**: Automated trading strategies
- **Portfolio Management**: Track and manage token holdings
- **Trade History**: Comprehensive transaction history

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for live updates
- **Blockchain**: Web3.js, Ethers.js, Viem
- **Authentication**: SIWE (Sign-In with Ethereum)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- pnpm (recommended) or npm

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
pnpm install
```

### 2. Database Setup

```bash
# Install PostgreSQL if not already installed
# Create database
createdb kunai_db

# Copy environment file
cp env.example .env

# Update .env with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/kunai_db"
```

### 3. Environment Configuration

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kunai_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Database Migration

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with sample data
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3001`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce for SIWE
- `POST /api/auth/verify` - Verify SIWE signature
- `POST /api/auth/refresh` - Refresh JWT token

### Wallet Monitoring
- `GET /api/wallet/monitored` - Get monitored wallets
- `POST /api/wallet/monitor` - Add wallet to monitoring
- `DELETE /api/wallet/monitor/:address` - Remove wallet from monitoring
- `GET /api/wallet/activity/:address` - Get wallet activity
- `GET /api/wallet/portfolio/:address` - Get wallet portfolio
- `GET /api/wallet/labels/:address` - Get smart wallet labels
- `GET /api/wallet/alerts` - Get user alerts
- `PATCH /api/wallet/alerts/:id/read` - Mark alert as read

### Trading
- `GET /api/trading/bots` - Get trading bots
- `POST /api/trading/bots` - Create trading bot
- `PUT /api/trading/bots/:id` - Update trading bot
- `DELETE /api/trading/bots/:id` - Delete trading bot
- `GET /api/trading/copy-trades` - Get copy trading settings
- `POST /api/trading/copy-trades` - Set up copy trading

## 🔌 Real-Time Features

The backend provides real-time updates via Socket.IO:

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join user room
socket.emit('join-user', userAddress);

// Join wallet monitoring
socket.emit('join-wallet', walletAddress);
```

### Events
- `transaction` - New transaction detected
- `wallet-activity` - Wallet activity update
- `alert` - New alert notification
- `portfolio-update` - Portfolio change
- `smart-wallet-detected` - Smart wallet identified
- `contract-risk` - Contract risk detected

## 🤖 Telegram Bot

The platform includes a powerful Telegram bot for sniper trading and pool monitoring.

### Features
- **Real-time Pool Monitoring**: Automatically detect new pools
- **Smart Filtering**: Filter pools based on liquidity, taxes, market cap
- **Instant Alerts**: Get notified immediately when good opportunities arise
- **Trade Execution**: Execute trades directly from Telegram
- **Portfolio Tracking**: Monitor your holdings and profits
- **Customizable Settings**: Configure your own sniper parameters

### Setup

1. **Create a Telegram Bot**:
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Copy the bot token

2. **Configure Environment**:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token-here
   ```

3. **Run the Bot**:
   ```bash
   # Run in production
   pnpm bot
   
   # Run in development mode
   pnpm bot:dev
   ```

### Bot Commands

#### Configuration
- `/start` - Welcome message and bot introduction
- `/help` - Show all available commands
- `/config` - Configure sniper settings
- `/config_view` - View current configuration
- `/config_reset` - Reset to default settings

#### Monitoring
- `/monitor` - Start monitoring new pools
- `/stop` - Stop monitoring
- `/status` - Check bot status
- `/pools` - View recent pools

#### Trading
- `/trade <token_address> <amount>` - Manual trade execution
- `/portfolio` - View your portfolio
- `/balance` - Check wallet balance

#### Alerts & Analytics
- `/alerts` - Manage price alerts
- `/analytics` - View trading analytics
- `/support` - Contact support

### Sniper Configuration

The bot allows you to configure:

- **Basic Settings**: Slippage, gas limit, gas price
- **Trading Limits**: Max buy amount, auto sell, sell percentage
- **Filters**: Liquidity, taxes, market cap, honeypot check
- **Target Chains**: ETH, BSC, Polygon, etc.
- **Target DEXs**: Uniswap V2, PancakeSwap, etc.

### Database Models

The bot uses these additional database models:

- **TelegramUser** - Bot users and their settings
- **SniperConfig** - User sniper configurations
- **TelegramTrade** - Trade history and execution
- **TelegramAlert** - Alert notifications

### Running the Bot

The bot can run independently from the web API:

```bash
# Start the bot only
pnpm bot

# Start the web API only
pnpm dev

# Start both (in separate terminals)
pnpm dev & pnpm bot
```

The bot will:
- Monitor new pools every 30 seconds
- Filter pools based on user criteria
- Send instant alerts to active users
- Execute trades when conditions are met
- Clean up old data automatically

## 🗄️ Database Schema

### Core Models
- **User** - Platform users with SIWE authentication
- **MonitoredWallet** - Wallets being tracked
- **Transaction** - Blockchain transactions
- **Portfolio** - Token holdings and values
- **Alert** - User notifications
- **SmartWalletLabel** - Wallet categorization
- **ContractAnalysis** - Contract security analysis
- **TradingBot** - Automated trading strategies
- **CopyTrade** - Copy trading configurations

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Bot
pnpm bot              # Start Telegram bot
pnpm bot:dev          # Start bot in development mode

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting

# Testing
pnpm test             # Run tests
```

### Project Structure

```
src/
├── config/           # Configuration files
├── middleware/       # Express middleware
├── models/          # Prisma models (auto-generated)
├── routes/          # API route handlers
├── services/        # Business logic
├── scripts/         # Database scripts
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🔒 Security Features

- **SIWE Authentication**: Secure wallet-based authentication
- **JWT Tokens**: Stateless session management
- **Rate Limiting**: Prevent abuse
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Request data validation
- **SQL Injection Protection**: Prisma ORM

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging
- **Health Check**: `/health` endpoint
- **Error Tracking**: Comprehensive error handling
- **Performance Monitoring**: Request timing and metrics

## 🚀 Deployment

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Ensure all required environment variables are set in production:

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
ETHEREUM_RPC_URL=your-production-rpc-url
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Note**: This is a development version. For production use, ensure proper security measures, environment configuration, and thorough testing. 