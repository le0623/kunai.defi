import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { UNISWAP_V3 } from '../constants/dex.constants';

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string; // human-readable amount
  fee: number; // 500, 3000, 10000
  slippageBps?: number;
  deadlineSecs?: number;
}

export class TradingService {
  private static rpcUrl: string = process.env.ETHEREUM_RPC_URL || 'https://1rpc.io/eth';

  /**
   * Swap tokens using Uniswap V3 exactInputSingle
   * @param privateKey - Private key
   * @param params - Swap parameters
   * @param rpcUrl - RPC URL (optional, defaults to environment variable)
   * @returns Tx hash
   */
  static async swapTokenInUniswapV3(
    privateKey: string,
    params: SwapParams,
    rpcUrl?: string
  ) {
    const slippageBps = params.slippageBps ?? 50;
    const deadlineSecs = params.deadlineSecs ?? 300;

    // Use provided RPC URL or default to environment variable
    const finalRpcUrl = rpcUrl || this.rpcUrl;

    const provider = new ethers.JsonRpcProvider(finalRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    try {
      logger.info(`Starting Uniswap V3 swap: ${params.amountIn} ${params.tokenIn} -> ${params.tokenOut}`);

      const tokenIn = new ethers.Contract(params.tokenIn, UNISWAP_V3.ERC20_ABI, wallet);
      const tokenOut = new ethers.Contract(params.tokenOut, UNISWAP_V3.ERC20_ABI, wallet);
      const router = new ethers.Contract(UNISWAP_V3.SWAP_ROUTER, UNISWAP_V3.SWAP_ROUTER_ABI, wallet);
      const quoter = new ethers.Contract(UNISWAP_V3.QUOTER_V2, UNISWAP_V3.QUOTER_ABI, wallet);

      const tokenInDecimals = await tokenIn.decimals?.();
      const tokenOutDecimals = await tokenOut.decimals?.();
      const amountInWei = ethers.parseUnits(params.amountIn, tokenInDecimals);

      // 1. Get quote
      const quoteParams = [
        params.tokenIn,
        params.tokenOut,
        params.fee,
        amountInWei,
        0n // sqrtPriceLimitX96
      ];
      const amountOutQuoted = await quoter.quoteExactInputSingle!(quoteParams);
      console.log("amountOutQuoted", amountOutQuoted);
      const minAmountOut = (amountOutQuoted * (10_000n - BigInt(slippageBps))) / 10_000n;

      logger.info(`Quote: ${ethers.formatUnits(amountOutQuoted, tokenOutDecimals)} out`);
      logger.info(`Min out (slippage ${slippageBps / 100}%): ${ethers.formatUnits(minAmountOut, tokenOutDecimals)}`);

      // 2. Approve if needed
      const currentAllowance = await tokenIn.allowance?.(wallet.address, UNISWAP_V3.SWAP_ROUTER);
      if (currentAllowance < amountInWei) {
        logger.info(`Approving Uniswap router to spend tokenIn...`);
        const txApprove = await tokenIn.approve?.(UNISWAP_V3.SWAP_ROUTER, amountInWei);
        await txApprove.wait();
      }

      // 3. Swap
      const deadline = Math.floor(Date.now() / 1000) + deadlineSecs;
      const swapParams = [
        params.tokenIn,
        params.tokenOut,
        params.fee,
        wallet.address,
        deadline,
        amountInWei,
        minAmountOut,
        0n // sqrtPriceLimitX96
      ];

      logger.info(`Sending swap transaction...`);
      const tx = await router.exactInputSingle!(swapParams, { value: 0 });
      const receipt = await tx.wait();

      logger.info(`Swap complete! Tx hash: ${receipt.hash}`);
      return receipt.hash as string;
    } catch (err) {
      logger.error('Uniswap V3 swap failed', err);
      throw err;
    }
  }
}