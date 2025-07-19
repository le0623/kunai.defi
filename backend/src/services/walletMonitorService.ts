import { Web3 } from 'web3';
import { ethers } from 'ethers';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ContractAnalysis } from '@prisma/client';

export interface TransactionData {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  method?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenAmount?: string;
  tokenDecimals?: number;
}

export interface PortfolioData {
  tokenAddress: string;
  tokenSymbol?: string;
  tokenName?: string;
  balance: string;
  valueUSD?: string;
  priceUSD?: string;
}

export class WalletMonitorService {
  private static web3: Web3;
  private static provider: ethers.JsonRpcProvider;

  static initialize() {
    const rpcUrl =
      process.env['RPC_URL'] || 'https://mainnet.infura.io/v3/your-key';
    this.web3 = new Web3(rpcUrl);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Add wallet to monitoring
   */
  static async addWalletToMonitoring(
    userId: string,
    address: string,
    label?: string
  ): Promise<any> {
    try {
      // Check if wallet is already being monitored by this user
      const existing = await prisma.monitoredWallet.findUnique({
        where: {
          userId_address: {
            userId,
            address: address.toLowerCase(),
          },
        },
      });

      if (existing) {
        throw new Error('Wallet is already being monitored');
      }

      // Analyze wallet to determine if it's a smart wallet
      const isSmart = await this.analyzeSmartWallet(address);
      const riskScore = await this.calculateRiskScore(address);

      const monitoredWallet = await prisma.monitoredWallet.create({
        data: {
          address: address.toLowerCase(),
          label,
          isSmart,
          riskScore,
          userId,
        },
      });

      // Start monitoring this wallet
      await this.startMonitoring(address);

      return monitoredWallet;
    } catch (error) {
      logger.error('Error adding wallet to monitoring:', error);
      throw error;
    }
  }

  /**
   * Analyze if a wallet is a smart wallet (whale, influencer, etc.)
   */
  static async analyzeSmartWallet(address: string): Promise<boolean> {
    try {
      // Get transaction history
      const transactions = await this.getTransactionHistory(address);

      // Check for smart wallet indicators
      const indicators = {
        highValueTransactions: transactions.filter(
          tx => parseFloat(ethers.formatEther(tx.value)) > 10
        ).length,
        frequentTransactions: transactions.length > 100,
        contractInteractions: transactions.filter(tx => tx.method).length,
        tokenHoldings: await this.getTokenHoldings(address),
      };

      // Determine if it's a smart wallet based on indicators
      const isSmart =
        indicators.highValueTransactions > 5 ||
        indicators.frequentTransactions ||
        indicators.contractInteractions > 50 ||
        indicators.tokenHoldings.length > 20;

      // Update smart wallet label if needed
      if (isSmart) {
        await this.updateSmartWalletLabel(address, indicators);
      }

      return isSmart;
    } catch (error) {
      logger.error('Error analyzing smart wallet:', error);
      return false;
    }
  }

  /**
   * Calculate risk score for a wallet (0-100)
   */
  static async calculateRiskScore(address: string): Promise<number> {
    try {
      let riskScore = 0;

      // Check for suspicious patterns
      const transactions = await this.getTransactionHistory(address);

      // High frequency trading
      if (transactions.length > 1000) riskScore += 20;

      // Large value transfers
      const largeTransfers = transactions.filter(
        tx => parseFloat(ethers.formatEther(tx.value)) > 100
      ).length;
      if (largeTransfers > 10) riskScore += 30;

      // Contract interactions with known risky contracts
      const riskyContracts = await this.getRiskyContracts();
      const riskyInteractions = transactions.filter(
        tx => tx.to && riskyContracts.includes(tx.to.toLowerCase())
      ).length;
      if (riskyInteractions > 0) riskScore += 40;

      return Math.min(riskScore, 100);
    } catch (error) {
      logger.error('Error calculating risk score:', error);
      return 0;
    }
  }

  /**
   * Track real-time transactions for monitored wallets
   */
  static async trackTransaction(
    transactionData: TransactionData
  ): Promise<void> {
    try {
      // Check if transaction involves any monitored wallets
      const monitoredWallets = await prisma.monitoredWallet.findMany({
        where: {
          OR: [
            { address: transactionData.from.toLowerCase() },
            { address: transactionData.to.toLowerCase() },
          ],
        },
      });

      if (monitoredWallets.length === 0) return;

      // Save transaction
      const transaction = await prisma.transaction.create({
        data: {
          hash: transactionData.hash,
          blockNumber: BigInt(transactionData.blockNumber),
          timestamp: transactionData.timestamp,
          from: transactionData.from.toLowerCase(),
          to: transactionData.to.toLowerCase(),
          value: transactionData.value,
          gasPrice: transactionData.gasPrice,
          gasUsed: transactionData.gasUsed,
          method: transactionData.method,
          tokenAddress: transactionData.tokenAddress?.toLowerCase(),
          tokenSymbol: transactionData.tokenSymbol,
          tokenAmount: transactionData.tokenAmount,
          tokenDecimals: transactionData.tokenDecimals,
          monitoredWalletId: monitoredWallets[0].id,
        },
      });

      // Analyze transaction type (buy/sell)
      const transactionType =
        await this.analyzeTransactionType(transactionData);

      // Check for contract risks
      if (transactionData.to) {
        await this.analyzeContractRisk(transactionData.to);
      }

      // Create alerts for significant transactions
      await this.createTransactionAlert(transaction, transactionType);

      // Update portfolio
      await this.updatePortfolio(transactionData);

      logger.info(
        `Tracked transaction ${transactionData.hash} for monitored wallet`
      );
    } catch (error) {
      logger.error('Error tracking transaction:', error);
    }
  }

  /**
   * Analyze transaction type (buy/sell/transfer)
   */
  static async analyzeTransactionType(tx: TransactionData): Promise<string> {
    try {
      // Check if it's a token transfer
      if (tx.tokenAddress && tx.method) {
        if (tx.method.includes('transfer') || tx.method.includes('swap')) {
          // Determine if it's a buy or sell based on DEX interaction
          const dexAddresses = [
            '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
            '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
            '0x1111111254fb6c44bac0bed2854e76f90643097d', // 1inch
          ];

          if (dexAddresses.includes(tx.to.toLowerCase())) {
            // Analyze the swap direction
            return await this.determineSwapDirection(tx);
          }
        }
      }

      // Check if it's a large ETH transfer
      const ethValue = parseFloat(ethers.formatEther(tx.value));
      if (ethValue > 1) {
        return 'large_transfer';
      }

      return 'transfer';
    } catch (error) {
      logger.error('Error analyzing transaction type:', error);
      return 'unknown';
    }
  }

  /**
   * Determine if a swap is a buy or sell
   */
  static async determineSwapDirection(tx: TransactionData): Promise<string> {
    try {
      // This would require analyzing the swap parameters
      // For now, we'll use a simple heuristic
      if (tx.tokenAddress && tx.tokenAmount) {
        // If token amount is positive, it's likely a buy
        const amount = parseFloat(tx.tokenAmount);
        return amount > 0 ? 'buy' : 'sell';
      }
      return 'swap';
    } catch (error) {
      logger.error('Error determining swap direction:', error);
      return 'swap';
    }
  }

  /**
   * Analyze contract for risks (honeypot, rug pull, etc.)
   */
  static async analyzeContractRisk(contractAddress: string): Promise<void> {
    try {
      // Check if contract is already analyzed
      const existing = await prisma.contractAnalysis.findUnique({
        where: { contractAddress: contractAddress.toLowerCase() },
      });

      if (
        existing &&
        existing.lastAnalyzed > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        return; // Already analyzed recently
      }

      // Perform contract analysis
      const analysis = await this.performContractAnalysis(contractAddress);

      if (existing) {
        await prisma.contractAnalysis.update({
          where: { contractAddress: contractAddress.toLowerCase() },
          data: analysis,
        });
      } else {
        await prisma.contractAnalysis.create({
          data: {
            contractAddress: contractAddress.toLowerCase(),
            ...analysis,
          },
        });
      }

      // Create alert if contract is risky
      if (
        analysis.isHoneypot ||
        analysis.isRugPull ||
        analysis.riskScore > 70
      ) {
        await this.createContractAlert(contractAddress, analysis);
      }
    } catch (error) {
      logger.error('Error analyzing contract risk:', error);
    }
  }

  /**
   * Perform detailed contract analysis
   */
  static async performContractAnalysis(
    contractAddress: string
  ): Promise<Partial<ContractAnalysis>> {
    try {
      // This would integrate with contract analysis services
      // For now, return basic analysis
      return {
        isHoneypot: false,
        isRugPull: false,
        hasProxy: false,
        isVerified: false,
        riskScore: 0,
        riskFactors: [],
        lastAnalyzed: new Date(),
        analysisSource: 'kunai-analyzer',
      };
    } catch (error) {
      logger.error('Error performing contract analysis:', error);
      return {
        riskScore: 0,
        riskFactors: ['analysis_failed'],
        lastAnalyzed: new Date(),
        analysisSource: 'kunai-analyzer',
      };
    }
  }

  /**
   * Create transaction alert
   */
  static async createTransactionAlert(
    transaction: any,
    type: string
  ): Promise<void> {
    try {
      const monitoredWallet = await prisma.monitoredWallet.findFirst({
        where: { id: transaction.monitoredWalletId },
      });

      if (!monitoredWallet) return;

      let message = '';
      let severity = 'medium';

      switch (type) {
        case 'buy':
          message = `Smart wallet ${monitoredWallet.address} made a buy transaction`;
          severity = 'low';
          break;
        case 'sell':
          message = `Smart wallet ${monitoredWallet.address} made a sell transaction`;
          severity = 'high';
          break;
        case 'large_transfer':
          message = `Large transfer detected from ${monitoredWallet.address}`;
          severity = 'high';
          break;
        default:
          message = `Transaction detected for ${monitoredWallet.address}`;
          severity = 'medium';
      }

      await prisma.alert.create({
        data: {
          type,
          severity,
          message,
          metadata: { transactionHash: transaction.hash },
          userId: monitoredWallet.userId,
          monitoredWalletId: monitoredWallet.id,
        },
      });
    } catch (error) {
      logger.error('Error creating transaction alert:', error);
    }
  }

  /**
   * Create contract risk alert
   */
  static async createContractAlert(
    contractAddress: string,
    analysis: any
  ): Promise<void> {
    try {
      let message = '';
      let severity = 'medium';

      if (analysis.isHoneypot) {
        message = `Honeypot contract detected: ${contractAddress}`;
        severity = 'critical';
      } else if (analysis.isRugPull) {
        message = `Potential rug pull contract: ${contractAddress}`;
        severity = 'critical';
      } else if (analysis.riskScore > 70) {
        message = `High-risk contract detected: ${contractAddress}`;
        severity = 'high';
      }

      if (message) {
        // Create alerts for all users monitoring wallets that interacted with this contract
        const affectedWallets = await prisma.monitoredWallet.findMany({
          where: {
            transactions: {
              some: {
                to: contractAddress.toLowerCase(),
              },
            },
          },
        });

        for (const wallet of affectedWallets) {
          await prisma.alert.create({
            data: {
              type: 'contract_risk',
              severity,
              message,
              metadata: { contractAddress, analysis },
              userId: wallet.userId,
              monitoredWalletId: wallet.id,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error creating contract alert:', error);
    }
  }

  /**
   * Update portfolio for monitored wallet
   */
  static async updatePortfolio(tx: TransactionData): Promise<void> {
    try {
      if (!tx.tokenAddress) return;

      const monitoredWallet = await prisma.monitoredWallet.findFirst({
        where: {
          OR: [
            { address: tx.from.toLowerCase() },
            { address: tx.to.toLowerCase() },
          ],
        },
      });

      if (!monitoredWallet) return;

      // Get current balance
      const balance = await this.getTokenBalance(
        monitoredWallet.address,
        tx.tokenAddress
      );

      // Update or create portfolio entry
      await prisma.portfolio.upsert({
        where: {
          monitoredWalletId_tokenAddress: {
            monitoredWalletId: monitoredWallet.id,
            tokenAddress: tx.tokenAddress.toLowerCase(),
          },
        },
        update: {
          balance: balance.toString(),
          updatedAt: new Date(),
        },
        create: {
          monitoredWalletId: monitoredWallet.id,
          walletAddress: monitoredWallet.address,
          tokenAddress: tx.tokenAddress.toLowerCase(),
          tokenSymbol: tx.tokenSymbol,
          balance: balance.toString(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating portfolio:', error);
    }
  }

  /**
   * Get transaction history for an address
   */
  static async getTransactionHistory(
    address: string
  ): Promise<TransactionData[]> {
    try {
      // This would integrate with blockchain APIs
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get token holdings for an address
   */
  static async getTokenHoldings(address: string): Promise<PortfolioData[]> {
    try {
      // This would integrate with token balance APIs
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting token holdings:', error);
      return [];
    }
  }

  /**
   * Get token balance for specific token
   */
  static async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<bigint> {
    try {
      // This would integrate with token contract calls
      // For now, return 0
      return BigInt(0);
    } catch (error) {
      logger.error('Error getting token balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Get list of known risky contracts
   */
  static async getRiskyContracts(): Promise<string[]> {
    try {
      // This would come from a database of known risky contracts
      return [];
    } catch (error) {
      logger.error('Error getting risky contracts:', error);
      return [];
    }
  }

  /**
   * Update smart wallet label
   */
  static async updateSmartWalletLabel(
    address: string,
    indicators: any
  ): Promise<void> {
    try {
      let label = 'Smart Wallet';
      let category = 'unknown';
      let confidence = 0.5;

      if (indicators.highValueTransactions > 10) {
        label = 'Whale';
        category = 'whale';
        confidence = 0.8;
      } else if (indicators.frequentTransactions) {
        label = 'Active Trader';
        category = 'trader';
        confidence = 0.7;
      } else if (indicators.contractInteractions > 100) {
        label = 'DeFi User';
        category = 'defi';
        confidence = 0.6;
      }

      await prisma.smartWalletLabel.upsert({
        where: { address: address.toLowerCase() },
        update: {
          label,
          category,
          confidence,
          updatedAt: new Date(),
        },
        create: {
          address: address.toLowerCase(),
          label,
          category,
          confidence,
          source: 'kunai-analyzer',
        },
      });
    } catch (error) {
      logger.error('Error updating smart wallet label:', error);
    }
  }

  /**
   * Start monitoring a wallet
   */
  static async startMonitoring(address: string): Promise<void> {
    try {
      // This would set up real-time monitoring
      // For now, just log
      logger.info(`Started monitoring wallet: ${address}`);
    } catch (error) {
      logger.error('Error starting wallet monitoring:', error);
    }
  }
}
