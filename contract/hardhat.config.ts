import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // etherscan: {
  //   apiKey: {
  //     mainnet: process.env.ETHERSCAN_API_KEY || '',
  //     sepolia: process.env.ETHERSCAN_API_KEY || '',
  //   },
  // },
  sourcify: {
    enabled: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: process.env.RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: process.env.OPERATOR_PRIVATE_KEY ? [process.env.OPERATOR_PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      accounts: process.env.OPERATOR_PRIVATE_KEY ? [process.env.OPERATOR_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    ethereum: {
      url: process.env.RPC_URL || 'https://eth.blockrazor.xyz',
      accounts: process.env.OPERATOR_PRIVATE_KEY ? [process.env.OPERATOR_PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
  },
};

export default config;