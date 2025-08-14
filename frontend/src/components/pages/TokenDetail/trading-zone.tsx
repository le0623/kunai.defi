import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type { KunaiTokenInfo } from "@kunai/shared"
import { Trade } from "./trade"
import { useAuth } from '@/store/hooks'
import { useAccount } from 'wagmi'
import { tradingService } from '@/services/tradingService'
import { TokenSecurity } from "./token-security"
import { Separator } from "@/components/ui/separator"
import TokenAnalytics from "./token-analytics"

export const TradingZone = ({ token }: { token: KunaiTokenInfo }) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [tokenBalance, setTokenBalance] = useState('0')
  const [ethBalance, setEthBalance] = useState('0')

  const { isAuthenticated } = useAuth()
  const { address: externalWalletAddress, isConnected } = useAccount()

  // Load balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!isAuthenticated) return

      try {
        if (isConnected && externalWalletAddress) {
          // External wallet balances
          const ethBal = await tradingService.getEthBalance(externalWalletAddress)
          const tokenBal = await tradingService.getTokenBalance(token.moralisToken.address, externalWalletAddress)
          setEthBalance(ethBal)
          setTokenBalance(tokenBal)
        } else {
          // In-app wallet balances
          const user = await import('@/services/api').then(m => m.authAPI.getCurrentUser())
          const ethBal = await tradingService.getEthBalance(user.inAppWallet)
          const tokenBal = await tradingService.getTokenBalance(token.moralisToken.address, user.inAppWallet)
          setEthBalance(ethBal)
          setTokenBalance(tokenBal)
        }
      } catch (error) {
        console.error('Error loading balances:', error)
      }
    }

    loadBalances()
  }, [isAuthenticated, isConnected, externalWalletAddress, token.moralisToken.address])

  // Handle balance updates from trading
  const handleBalanceUpdate = (balances: { ethBalance: string; tokenBalance: string }) => {
    setEthBalance(balances.ethBalance)
    setTokenBalance(balances.tokenBalance)
  }

  return (
    <div className={`relative border-l bg-background ${leftPanelCollapsed ? 'w-0' : 'w-96'}`}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full border bg-background p-0 cursor-pointer"
        onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
      >
        {leftPanelCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      {!leftPanelCollapsed && (
        <div className="h-full overflow-y-auto">
          <TokenAnalytics token={token} />
          <Separator />
          <Trade
            token={token}
            onBalanceUpdate={handleBalanceUpdate}
          />
          <Separator />
          <TokenSecurity />
        </div>
      )}
    </div>
  )
}