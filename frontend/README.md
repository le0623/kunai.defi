# KunAI Frontend

A modern DeFi trading platform built with React, TypeScript, and shadcn/ui.

## Features

- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 🔗 **Web3 Integration**: RainbowKit wallet connection
- 🔐 **Authentication**: Sign in with Ethereum (SIWE)
- 📊 **Trading Dashboard**: Real-time portfolio tracking
- 🤖 **Trading Bot**: Automated trading strategies
- 📋 **Copy Trading**: Follow successful traders
- 🖥️ **Terminal**: Command-line interface for advanced users
- 👛 **Wallet Monitor**: Track wallet activities
- 🌐 **API Integration**: Axios-based API service layer

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Web3**: RainbowKit + Wagmi + Viem
- **State Management**: Zustand
- **Data Fetching**: TanStack Query + Axios
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- A WalletConnect Project ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Install axios (if not already installed)**
   ```bash
   pnpm add axios
   # or
   npm install axios
   ```

4. **Environment Setup**
   
   Create a `.env` file in the frontend directory:
   ```env
   # Backend API URL (required)
   VITE_API_URL=http://localhost:3001
   
   # WalletConnect Project ID (get from https://cloud.walletconnect.com/)
   VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here
   
   # RPC URLs (optional - will use defaults if not provided)
   VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_alchemy_key
   VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
   VITE_POLYGON_RPC_URL=https://polygon-rpc.com
   VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
   ```

5. **Update WalletConnect Project ID**
   
   Replace `YOUR_WALLET_CONNECT_PROJECT_ID` in `src/config/wagmi.config.ts` with your actual project ID.

6. **Start the development server**
   ```bash
   pnpm dev
   ```

## API Integration

The frontend uses axios for all API calls with the following features:

### Configuration
- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Interceptors**: Automatic error handling and authentication
- **Credentials**: Cookies included for session management
- **Timeout**: 10-second timeout for all requests

### API Services
- **Authentication**: SIWE sign-in, logout, auth status check
- **Wallet Monitoring**: Add/remove wallets, get transactions, portfolio
- **Trading Bot**: Start/stop bot, get status, update config
- **Copy Trading**: Get traders, start/stop copy trading
- **Contract Analysis**: Analyze contracts, get risk scores

### Usage Example
```typescript
import { authAPI, walletAPI } from '@/services/api'

// Check authentication
const isAuth = await authAPI.checkAuth()

// Get monitored wallets
const wallets = await walletAPI.getMonitoredWallets()

// Add wallet to monitoring
await walletAPI.addMonitoredWallet('0x1234...', 'My Wallet')
```

## Wallet Connection

The app uses RainbowKit for wallet connection with the following features:

- **Multiple Wallets**: MetaMask, Rainbow, Coinbase Wallet, Safe, and more
- **Multiple Chains**: Ethereum Mainnet, Sepolia, Polygon, Arbitrum
- **Authentication**: Sign in with Ethereum (SIWE) integration
- **Custom UI**: Styled with shadcn/ui components

### Authentication Flow

1. **Connect Wallet**: User connects their wallet using RainbowKit
2. **Sign Message**: User signs a SIWE message to authenticate
3. **Backend Verification**: Signature is verified by the backend via axios
4. **Session Management**: JWT token is stored for authenticated requests

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Layout components
│   └── ConnectWallet.tsx
├── services/
│   └── api.ts        # API service functions
├── lib/
│   └── axios.ts      # Axios configuration
├── pages/            # Page components
├── hooks/            # Custom hooks
├── config/           # Configuration files
└── types/            # TypeScript types
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Backend Integration

This frontend is designed to work with the KunAI backend API. Make sure the backend is running on the URL specified in `VITE_API_URL`.

### API Endpoints

The frontend expects the following backend endpoints:

- `GET /api/auth/nonce` - Get nonce for SIWE
- `POST /api/auth/verify` - Verify SIWE signature
- `GET /api/auth/me` - Check authentication status
- `POST /api/auth/logout` - Logout user
- `GET /api/wallet/monitored` - Get monitored wallets
- `POST /api/wallet/monitor` - Add wallet to monitoring
- `DELETE /api/wallet/monitor/:address` - Remove wallet from monitoring
- `GET /api/wallet/transactions/:address` - Get wallet transactions
- `GET /api/wallet/portfolio/:address` - Get wallet portfolio
- `GET /api/trading/bot/status` - Get bot status
- `POST /api/trading/bot/start` - Start trading bot
- `POST /api/trading/bot/stop` - Stop trading bot
- `GET /api/trading/copy/traders` - Get available traders
- `POST /api/trading/copy/start` - Start copy trading
- `POST /api/contract/analyze` - Analyze contract

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
