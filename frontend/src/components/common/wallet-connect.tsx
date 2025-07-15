import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "../ui/button"
import { Wallet } from "lucide-react"

const WalletConnect = () => {
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

        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              className="w-full flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )
        }

        if (chain.unsupported) {
          return (
            <Button onClick={openChainModal} variant="destructive" className="w-full">
              Wrong network
            </Button>
          )
        }

        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Connected as:</p>
              <p className="font-medium">{account.displayName}</p>
              {account.displayBalance && (
                <p className="text-sm text-muted-foreground">
                  Balance: {account.displayBalance}
                </p>
              )}
            </div>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export default WalletConnect