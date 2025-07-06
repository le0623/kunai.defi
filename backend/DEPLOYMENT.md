# Contract Deployment Guide

This guide explains how to deploy the KunAI proxy wallet contracts to different networks.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

2. **Required Environment Variables**
   ```env
   # For mainnet deployment
   MAINNET_RPC_URL=your_mainnet_rpc_url
   OPERATOR_PRIVATE_KEY=your_private_key
   
   # For Sepolia testnet
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   OPERATOR_PRIVATE_KEY=your_private_key
   
   # Optional: For contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

## Deployment Commands

### 1. Local Development (Hardhat Network)

```bash
# Start Hardhat node (publicly accessible)
npm run node

# In another terminal, deploy to Hardhat network
npm run contracts:deploy:hardhat
```

### 2. Local Development (Localhost)

```bash
# Start Hardhat node
npx hardhat node

# Deploy to localhost network
npm run contracts:deploy:localhost
```

### 3. Sepolia Testnet

```bash
# Deploy to Sepolia testnet
npm run contracts:deploy:sepolia

# Verify contract on Etherscan (optional)
npm run contracts:verify:sepolia
```

### 4. Ethereum Mainnet

```bash
# Deploy to Ethereum mainnet
npm run contracts:deploy:mainnet

# Verify contract on Etherscan (optional)
npm run contracts:verify:mainnet
```

## Running Hardhat Node Publicly

To make the Hardhat node accessible from other machines:

```bash
# Start node on 0.0.0.0 (all interfaces)
npm run node

# Or manually
npx hardhat node --hostname 0.0.0.0 --port 8545
```

## Contract Addresses

After deployment, the contract addresses will be displayed in the console. Update your `.env` file:

```env
PROXY_FACTORY_ADDRESS=deployed_factory_address_here
```

## Verification

### Manual Verification

1. Go to [Etherscan](https://etherscan.io) or [Sepolia Etherscan](https://sepolia.etherscan.io)
2. Search for your deployed contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in the verification form

### Automatic Verification

```bash
# For mainnet
npm run contracts:verify:mainnet

# For Sepolia
npm run contracts:verify:sepolia
```

## Troubleshooting

### Common Issues

1. **Insufficient Balance**
   - Ensure your wallet has enough ETH for deployment
   - For mainnet, you need real ETH
   - For testnets, get test ETH from faucets

2. **Network Connection Issues**
   - Check your RPC URL is correct
   - Ensure you have internet connection
   - Try different RPC providers

3. **Gas Issues**
   - Increase gas limit if deployment fails
   - Check current gas prices
   - Use gas estimation tools

### Gas Estimation

```bash
# Check current gas prices
npx hardhat run scripts/check-gas.ts --network mainnet
```

### Balance Check

```bash
# Check wallet balance
npx hardhat run scripts/check-balance.ts --network mainnet
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**

1. **Private Key Security**
   - Never commit private keys to version control
   - Use environment variables for sensitive data
   - Consider using hardware wallets for mainnet

2. **Test First**
   - Always test on testnets before mainnet
   - Use Hardhat network for development
   - Verify contracts before production use

3. **Backup**
   - Keep backup of deployment addresses
   - Document deployment parameters
   - Save deployment transaction hashes

## Support

If you encounter issues:

1. Check the [Hardhat documentation](https://hardhat.org/docs)
2. Review the [Ignition documentation](https://hardhat.org/ignition)
3. Check network status and gas prices
4. Verify your environment configuration 