import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  rainbowWallet,
  safeWallet,
  injectedWallet,
  rabbyWallet,
  metaMaskWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        rainbowWallet,
        metaMaskWallet,
        coinbaseWallet,
        safeWallet,
        injectedWallet,
        rabbyWallet,
      ],
    },
  ],
  {
    appName: "KunAI",
    projectId: "YOUR_WALLET_CONNECT_PROJECT_ID",
    appIcon: "/icons/logo.png",
    appDescription: "Advanced DeFi Trading Platform",
  },
);

export const config = createConfig({
  connectors,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_ETHEREUM_RPC_URL ?? "https://eth-mainnet.g.alchemy.com/v2/demo"),
  },
});
