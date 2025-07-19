import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(process.env['RPC_URL'] || ''),
});

export const walletClient = createWalletClient({
  chain: hardhat,
  transport: http(process.env['RPC_URL'] || ''),
});

export const account = privateKeyToAccount(
  process.env['OPERATOR_PRIVATE_KEY'] as `0x${string}`
);
