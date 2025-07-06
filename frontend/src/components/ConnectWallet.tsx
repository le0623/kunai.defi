import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { useDisconnect } from 'wagmi'
import { authAPI } from '@/services/api'

export function ConnectWallet() {
  const { disconnect } = useDisconnect()

  const handleDisconnect = async () => {
    try {
      // Sign out from backend
      await authAPI.logout()
      // Disconnect wallet
      disconnect()
    } catch (error) {
      console.error('Error during disconnect:', error)
      // Still disconnect wallet even if backend logout fails
      disconnect()
    }
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div className="flex items-center gap-2">
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant="outline">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="destructive">
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <Button onClick={handleDisconnect} variant="outline">
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
} 