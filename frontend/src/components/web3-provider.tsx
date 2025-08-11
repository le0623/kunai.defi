import React from "react";
import { WagmiProvider } from "wagmi";
import { config } from "../config/wagmi.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { darkTheme, RainbowKitAuthenticationProvider, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit';
import { createSiweMessage } from 'viem/siwe';
import { useAccount } from 'wagmi';
import { authAPI } from '@/services/api';
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    return await authAPI.getNonce();
  },
  createMessage: ({ nonce, address, chainId }) => {
    return createSiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Ethereum to KunAI.',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
    });
  },
  verify: async ({ message, signature }) => {
    return await authAPI.verifySignature(message, signature);
  },
  signOut: async () => {
    await authAPI.logout();
  },
});

function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, address } = useAccount();
  const [authStatus, setAuthStatus] = React.useState<"loading" | "unauthenticated" | "authenticated">("unauthenticated");

  React.useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isConnected || !address) {
        setAuthStatus("unauthenticated");
        return;
      }
    };

    // checkAuthStatus();
  }, [isConnected, address]);

  return (
    <RainbowKitAuthenticationProvider
      adapter={authenticationAdapter}
      status={authStatus}
    >
      {children}
    </RainbowKitAuthenticationProvider>
  );
}

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = darkTheme();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider>
          <RainbowKitProvider theme={theme}>
            {children}
          </RainbowKitProvider>
        </AuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
