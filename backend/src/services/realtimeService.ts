import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import { Web3 } from 'web3';
import { ethers } from 'ethers';
import { prisma } from '@/config/database';
import {
  WalletMonitorService,
  TransactionData,
} from '@/services/walletMonitorService';
import { logger } from '@/utils/logger';

export class RealtimeService {
  public static io: SocketIOServer;
  private static web3: Web3;
  private static provider: ethers.JsonRpcProvider;
  private static isMonitoring = false;

  static initialize(server: Server | HttpsServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
        credentials: true,
      },
    });

    const rpcUrl = process.env['RPC_URL'] || '';
    this.web3 = new Web3(rpcUrl);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    this.setupSocketHandlers();
    this.startBlockMonitoring();
  }

  private static setupSocketHandlers() {
    this.io.on('connection', socket => {
      logger.info(`Client connected: ${socket.id}`);

      // Join user to quotation room
      socket.on('quotation', (deviceId: string) => {
        socket.join(`quotation`);
        logger.info(`User ${deviceId} joined quotation room`);
      });

      // Join wallet monitoring room
      socket.on('join-wallet', (walletAddress: string) => {
        socket.join(`wallet-${walletAddress.toLowerCase()}`);
        logger.info(`Client joined wallet monitoring: ${walletAddress}`);
      });

      // Leave wallet monitoring room
      socket.on('leave-wallet', (walletAddress: string) => {
        socket.leave(`wallet-${walletAddress.toLowerCase()}`);
        logger.info(`Client left wallet monitoring: ${walletAddress}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private static async startBlockMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    logger.info('Starting real-time block monitoring...');

    // Monitor new blocks
    this.provider.on('block', async blockNumber => {
      try {
        await this.processNewBlock(blockNumber);
      } catch (error) {
        logger.error('Error processing new block:', error);
      }
    });

    // Monitor pending transactions
    this.provider.on('pending', async txHash => {
      try {
        await this.processPendingTransaction(txHash);
      } catch (error) {
        logger.error('Error processing pending transaction:', error);
      }
    });
  }

  private static async processNewBlock(blockNumber: number) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      logger.info(
        `Processing block ${blockNumber} with ${block.transactions.length} transactions`
      );

      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue;

        const transactionData: TransactionData = {
          hash: tx.hash,
          blockNumber: blockNumber,
          timestamp: new Date(block.timestamp * 1000),
          from: tx.from,
          to: tx.to || '',
          value: tx.value.toString(),
          gasPrice: tx.gasPrice?.toString() || '0',
          gasUsed: '0', // Will be updated when transaction is mined
          method: this.extractMethod(tx.data),
        };

        // Check if this transaction involves any monitored wallets
        await this.checkMonitoredWallets(transactionData);
      }
    } catch (error) {
      logger.error('Error processing block:', error);
    }
  }

  private static async processPendingTransaction(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;

      const transactionData: TransactionData = {
        hash: tx.hash,
        blockNumber: 0, // Pending
        timestamp: new Date(),
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasUsed: '0',
        method: this.extractMethod(tx.data),
      };

      // Check if this pending transaction involves monitored wallets
      await this.checkMonitoredWallets(transactionData);
    } catch (error) {
      logger.error('Error processing pending transaction:', error);
    }
  }

  private static async checkMonitoredWallets(transactionData: TransactionData) {
    try {
      // Check if transaction involves any monitored wallets
      const monitoredWallets = await prisma.monitoredWallet.findMany({
        where: {
          OR: [
            { address: transactionData.from.toLowerCase() },
            { address: transactionData.to.toLowerCase() },
          ],
        },
        include: {
          user: true,
        },
      });

      if (monitoredWallets.length === 0) return;

      // Process transaction through monitoring service
      await WalletMonitorService.trackTransaction(transactionData);

      // Emit real-time updates to connected clients
      for (const wallet of monitoredWallets) {
        // Emit to wallet-specific room
        this.io.to(`wallet-${wallet.address}`).emit('transaction', {
          wallet: wallet.address,
          transaction: transactionData,
          type: await WalletMonitorService.analyzeTransactionType(
            transactionData
          ),
        });

        // Emit to user's personal room
        this.io.to(`user-${wallet.user.address}`).emit('wallet-activity', {
          wallet: wallet.address,
          transaction: transactionData,
          type: await WalletMonitorService.analyzeTransactionType(
            transactionData
          ),
        });
      }
    } catch (error) {
      logger.error('Error checking monitored wallets:', error);
    }
  }

  private static extractMethod(data: string): string | undefined {
    if (!data || data === '0x' || data.length < 10) return undefined;

    // Extract method signature (first 4 bytes)
    const methodSignature = data.slice(0, 10);

    // Common method signatures
    const methods: { [key: string]: string } = {
      '0xa9059cbb': 'transfer',
      '0x23b872dd': 'transferFrom',
      '0x095ea7b3': 'approve',
      '0x38ed1739': 'swapExactTokensForTokens',
      '0x7ff36ab5': 'swapExactETHForTokens',
      '0x18cbafe5': 'swapExactTokensForETH',
      '0xfb3bdb41': 'swapTokensForExactTokens',
      '0x4a25d94a': 'swapETHForExactTokens',
      '0x8803dbee': 'swapTokensForExactETH',
      '0x1f00ca74': 'getAmountsOut',
      '0xd06ca61f': 'getAmountsIn',
    };

    return methods[methodSignature] || 'unknown';
  }

  /**
   * Emit alert to specific user
   */
  static emitAlert(userAddress: string, alert: any) {
    this.io.to(`user-${userAddress.toLowerCase()}`).emit('alert', alert);
  }

  /**
   * Emit portfolio update to specific user
   */
  static emitPortfolioUpdate(
    userAddress: string,
    walletAddress: string,
    portfolio: any
  ) {
    this.io.to(`user-${userAddress.toLowerCase()}`).emit('portfolio-update', {
      wallet: walletAddress,
      portfolio,
    });
  }

  /**
   * Emit smart wallet detection
   */
  static emitSmartWalletDetection(walletAddress: string, label: any) {
    this.io
      .to(`wallet-${walletAddress.toLowerCase()}`)
      .emit('smart-wallet-detected', {
        wallet: walletAddress,
        label,
      });
  }

  /**
   * Emit contract risk alert
   */
  static emitContractRiskAlert(contractAddress: string, analysis: any) {
    this.io.emit('contract-risk', {
      contract: contractAddress,
      analysis,
    });
  }

  /**
   * Get connected clients count
   */
  static getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get monitoring status
   */
  static getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
}
