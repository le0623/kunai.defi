import { publicClient, walletClient, account } from '@/utils/client';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import ProxyWalletFactory from '../../artifacts/contracts/ProxyWalletFactory.sol/ProxyWalletFactory.json';
import ProxyWallet from '../../artifacts/contracts/ProxyWallet.sol/ProxyWallet.json';
import { Address, parseEther, zeroAddress } from 'viem';

const proxyWalletFactoryAbi = ProxyWalletFactory.abi;
const proxyWalletAbi = ProxyWallet.abi;

export interface ProxyWalletConfig {
  maxTradeAmount: string;
  maxSlippage: number;
  dailyTradeLimit: string;
  gasLimit: number;
  gasPrice: string;
}

export interface TradeRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  deadline: number;
  dexData: string;
}

export class SmartContractService {
  private static factoryAddress: Address;

  /**
   * Initialize the smart contract service
   */
  static initialize(): void {
    this.factoryAddress = process.env['PROXY_FACTORY_ADDRESS'] as Address;
  }

  /**
   * Deploy a new proxy wallet for a user
   */
  static async deployProxyWallet(
    userAddress: Address,
    config: ProxyWalletConfig
  ): Promise<Address> {
    try {
      logger.info(
        `Deploying proxy wallet for user ${userAddress} with config:`,
        config
      );

      // Prepare the transaction parameters
      const args = [
        userAddress as Address,
        parseEther(config.maxTradeAmount),
        BigInt(config.maxSlippage),
        parseEther(config.dailyTradeLimit),
      ] as const;

      // Simulate the transaction first
      logger.info('Simulating transaction...');
      console.log(account.address);
      const { result, request } = await publicClient.simulateContract({
        address: this.factoryAddress as Address,
        abi: proxyWalletFactoryAbi,
        functionName: 'deployProxyWallet',
        args,
        account: account.address,
        gas: BigInt(config.gasLimit),
        gasPrice: parseEther(config.gasPrice, 'gwei'),
      });

      logger.info('Transaction simulation successful, sending transaction...');

      // Send the transaction
      const hash = await walletClient.writeContract(request);
      logger.info(`Transaction sent: ${hash}, waiting for confirmation...`);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Parse logs to get the proxy address
      let proxyAddress = result as Address;

      if (!proxyAddress || proxyAddress === zeroAddress) {
        throw new Error('Failed to get proxy wallet address from deployment');
      }

      logger.info(
        `Deployed proxy wallet ${proxyAddress} for user ${userAddress}`
      );
      return proxyAddress;
    } catch (error) {
      logger.error('Error deploying proxy wallet:', error);
      throw error;
    }
  }

  /**
   * Get user's proxy wallet address
   */
  static async getUserProxyWallet(
    userAddress: Address,
    telegramUserId: string
  ): Promise<Address | null> {
    try {
      const proxyWallet = await prisma.proxyWallet.findUnique({
        where: {
          userAddress: userAddress.toLowerCase(),
          telegramUserId: telegramUserId,
        },
      });

      return (proxyWallet?.proxyAddress as Address) || null;
    } catch (error) {
      logger.error('Error getting user proxy wallet:', error);
      return null;
    }
  }

  /**
   * Get user's proxy wallet address from factory contract
   */
  static async getProxyWalletFromFactory(
    userAddress: Address
  ): Promise<Address | null> {
    try {
      if (!this.factoryAddress) {
        throw new Error('Smart contract service not initialized');
      }

      const proxyAddress = await publicClient.readContract({
        address: this.factoryAddress as Address,
        abi: proxyWalletFactoryAbi,
        functionName: 'getProxyWallet',
        args: [userAddress],
      });

      if (proxyAddress && proxyAddress !== zeroAddress) {
        return proxyAddress as Address;
      }

      return null;
    } catch (error) {
      logger.error('Error getting proxy wallet from factory:', error);
      return null;
    }
  }

  /**
   * Execute trade through proxy wallet
   */
  static async executeTrade(
    userAddress: Address,
    telegramUserId: string,
    tradeRequest: TradeRequest
  ): Promise<string> {
    try {
      const proxyAddress = await this.getUserProxyWallet(
        userAddress,
        telegramUserId
      );
      if (!proxyAddress) {
        throw new Error('User does not have a proxy wallet');
      }

      // Generate unique trade ID
      const tradeId =
        '0x' +
        Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

      // Prepare the transaction parameters
      const args = [
        userAddress as Address,
        tradeRequest.tokenIn as Address,
        tradeRequest.tokenOut as Address,
        tradeRequest.amountIn,
        tradeRequest.minAmountOut,
        BigInt(tradeRequest.deadline),
        tradeId as Address,
        tradeRequest.dexData as Address,
      ] as const;

      // Simulate the transaction first
      logger.info('Simulating trade transaction...');
      const { request } = await publicClient.simulateContract({
        address: proxyAddress as Address,
        abi: proxyWalletAbi,
        functionName: 'executeTrade',
        args,
        account: account.address,
        gas: BigInt(2000000),
        gasPrice: parseEther('20', 'gwei'),
      });

      logger.info('Trade simulation successful, sending transaction...');

      // Send the transaction
      const hash = await walletClient.writeContract(request);
      logger.info(
        `Trade transaction sent: ${hash}, waiting for confirmation...`
      );

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      logger.info(
        `Trade transaction confirmed in block ${receipt.blockNumber}`
      );

      // Save trade to database
      await prisma.proxyTrade.create({
        data: {
          userAddress: userAddress.toLowerCase(),
          proxyAddress: proxyAddress.toLowerCase(),
          tradeId: tradeId,
          tokenIn: tradeRequest.tokenIn.toLowerCase(),
          tokenOut: tradeRequest.tokenOut.toLowerCase(),
          amountIn: tradeRequest.amountIn,
          minAmountOut: tradeRequest.minAmountOut,
          deadline: new Date(tradeRequest.deadline * 1000),
          dexData: tradeRequest.dexData,
          status: 'executed',
          txHash: hash,
          executedAt: new Date(),
        },
      });

      logger.info(`Executed trade ${tradeId} for user ${userAddress}`);
      return tradeId;
    } catch (error) {
      logger.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Update user's token approval
   */
  static async updateApproval(
    userAddress: Address,
    telegramUserId: string,
    tokenAddress: Address,
    amount: string
  ): Promise<void> {
    try {
      const proxyAddress = await this.getUserProxyWallet(
        userAddress,
        telegramUserId
      );
      if (!proxyAddress) {
        throw new Error('User does not have a proxy wallet');
      }

      // Prepare the transaction parameters
      const args = [tokenAddress as Address, amount] as const;

      // Simulate the transaction first
      logger.info('Simulating approval transaction...');
      const { request } = await publicClient.simulateContract({
        address: proxyAddress as Address,
        abi: proxyWalletAbi,
        functionName: 'updateApproval',
        args,
        account: account.address,
        gas: BigInt(2000000),
        gasPrice: parseEther('20', 'gwei'),
      });

      logger.info('Approval simulation successful, sending transaction...');

      // Send the transaction
      const hash = await walletClient.writeContract(request);
      logger.info(
        `Approval transaction sent: ${hash}, waiting for confirmation...`
      );

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      // Update database
      await prisma.proxyApproval.upsert({
        where: {
          userAddress_tokenAddress: {
            userAddress: userAddress.toLowerCase(),
            tokenAddress: tokenAddress.toLowerCase(),
          },
        },
        update: {
          amount: amount,
          updatedAt: new Date(),
        },
        create: {
          userAddress: userAddress.toLowerCase(),
          proxyAddress: proxyAddress.toLowerCase(),
          tokenAddress: tokenAddress.toLowerCase(),
          amount: amount,
        },
      });

      logger.info(
        `Updated approval for user ${userAddress}, token ${tokenAddress}`
      );
    } catch (error) {
      logger.error('Error updating approval:', error);
      throw error;
    }
  }

  /**
   * Get user's proxy wallet configuration
   */
  static async getUserConfig(
    userAddress: Address,
    telegramUserId: string
  ): Promise<any> {
    try {
      const proxyWallet = await prisma.proxyWallet.findUnique({
        where: {
          userAddress: userAddress.toLowerCase(),
          telegramUserId: telegramUserId,
        },
        include: {
          approvals: true,
          trades: {
            orderBy: { executedAt: 'desc' },
            take: 10,
          },
        },
      });

      return proxyWallet;
    } catch (error) {
      logger.error('Error getting user config:', error);
      throw error;
    }
  }
}
