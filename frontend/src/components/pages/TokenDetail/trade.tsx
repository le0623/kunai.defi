import Presets from "@/components/common/presets"
import Input from "@/components/common/input"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/store/hooks'
import { useAccount, useBalance } from 'wagmi'
import { tradingService } from '@/services/tradingService'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/utils'
import ButtonGroup from "@/components/common/button-group"

interface TradeProps {
  tokenAddress: string
  tokenSymbol: string
  onBalanceUpdate?: (balances: { ethBalance: string; tokenBalance: string }) => void
}

export const Trade = ({ tokenAddress, tokenSymbol, onBalanceUpdate }: TradeProps) => {
  const [isBuy, setIsBuy] = useState(true)
  const [amount, setAmount] = useState('0.01')
  const [loading, setLoading] = useState(false)
  const [ethBalance, setEthBalance] = useState('0')
  const [tokenBalance, setTokenBalance] = useState('0')

  const { isAuthenticated, showAuthDlg } = useAuth()
  const { address: externalWalletAddress, isConnected } = useAccount()
  const { data: externalEthBalance } = useBalance({
    address: externalWalletAddress,
    chainId: 1,
  })

  // Determine wallet type and address
  const walletType = isConnected ? 'external' : 'in-app'
  const walletAddress = isConnected ? externalWalletAddress : undefined

  // Load balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!isAuthenticated) return

      try {
        if (isConnected && externalWalletAddress) {
          // External wallet balances
          const ethBal = await tradingService.getEthBalance(externalWalletAddress)
          const tokenBal = await tradingService.getTokenBalance(tokenAddress, externalWalletAddress)
          setEthBalance(ethBal)
          setTokenBalance(tokenBal)
        } else {
          // In-app wallet balances
          const user = await import('@/services/api').then(m => m.authAPI.getCurrentUser())
          const ethBal = await tradingService.getEthBalance(user.inAppWallet)
          const tokenBal = await tradingService.getTokenBalance(tokenAddress, user.inAppWallet)
          setEthBalance(ethBal)
          setTokenBalance(tokenBal)
        }
      } catch (error) {
        console.error('Error loading balances:', error)
      }
    }

    loadBalances()
  }, [isAuthenticated, isConnected, externalWalletAddress, tokenAddress])

  const handleTrade = async () => {
    if (!isAuthenticated && !isConnected) {
      showAuthDlg(true)
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const result = await tradingService.executeTrade(
        {
          tokenAddress,
          amount,
          isBuy,
          slippageTolerance: 50, // 0.5%
          deadline: 300 // 5 minutes
        },
        walletType,
        walletAddress,
        (balances) => {
          // Update balances in UI
          setEthBalance(balances.ethBalance)
          setTokenBalance(balances.tokenBalance)
          // Notify parent component
          onBalanceUpdate?.(balances)
        }
      )

      if (result.success) {
        const action = isBuy ? 'bought' : 'sold'
        const amountText = isBuy ? `${amount} ETH worth of ${tokenSymbol}` : `${amount} ${tokenSymbol}`
        toast.success(`Successfully ${action} ${amountText}`)
      } else {
        const action = isBuy ? 'Buy' : 'Sell'
        toast.error(result.error || `${action} transaction failed`)
      }
    } catch (error) {
      console.error(`${isBuy ? 'Buy' : 'Sell'} error:`, error)
      const action = isBuy ? 'Buy' : 'Sell'
      toast.error(`${action} transaction failed`)
    } finally {
      setLoading(false)
    }
  }

  const handlePreset = (preset: 'p1' | 'p2' | 'p3') => {
    if (preset === 'p1') {
      setAmount('0.01')
    } else if (preset === 'p2') {
      setAmount('0.05')
    } else if (preset === 'p3') {
      setAmount('0.1')
    }
  }

  const handleMaxAmount = () => {
    if (isBuy) {
      // For buying, use ETH balance (with some buffer for gas)
      const maxEth = parseFloat(ethBalance) * 0.95 // Leave 5% for gas
      setAmount(maxEth.toFixed(4))
    } else {
      // For selling, use token balance
      setAmount(tokenBalance)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <ButtonGroup
        buttons={[{
          id: 'buy',
          component: <div className={`${isBuy ? 'text-green-300' : 'text-white/50'}`}>Buy</div>,
          onClick: () => setIsBuy(true)
        }, {
          id: 'sell',
          component: <div className={`${!isBuy ? 'text-red-300' : 'text-white/50'}`}>Sell</div>,
          onClick: () => setIsBuy(false)
        }]}
        selectedButtons={[isBuy ? 'buy' : 'sell']}
        className="flex-1 px-2 py-1 text-sm font-medium cursor-pointer rounded-sm"
      />

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm text-white/50">
          <Presets />
          <div className="flex items-center gap-2">
            <span className="text-white/50">Balance:</span>
            <span className="text-white">
              {isBuy ? `${formatNumber(parseFloat(ethBalance))} ETH` : `${formatNumber(parseFloat(tokenBalance))} ${tokenSymbol}`}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col border border-border rounded-sm overflow-hidden">
          <Input
            topClassName="rounded-b-none bg-transparent"
            className="border-inherit w-full bg-transparent"
            prefixComp={<span className="text-white/50 px-2 bg-transparent">Amount</span>}
            suffixComp={
              <div className="flex items-center gap-1 px-2">
                <span className="text-white/50">{isBuy ? 'ETH' : tokenSymbol}</span>
                <button
                  onClick={handleMaxAmount}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
            }
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.001"
            min="0"
          />

          <div className="flex items-center border-t">
            {[0.01, 0.05, 0.1, 0.2].map((p, index) => (
              <div
                className={`flex items-center gap-2 cursor-pointer flex-1 justify-center border-r last:border-r-0 py-1 text-sm text-white/50 hover:bg-white/10`}
                key={index}
                onClick={() => setAmount(p.toString())}
              >
                {p}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-sm text-white/50">
          <span>1 ETH ≈ $1,000</span>
          <span>Wallet: {walletType === 'external' ? 'External' : 'In-App'}</span>
        </div>
      </div>

      <Button
        disabled={!amount || loading}
        onClick={handleTrade}
        variant="primary"
        className={isBuy ? 'bg-green-300 text-black' : 'bg-red-400 text-black'}
      >
        {loading ? 'Processing...' : (isBuy ? 'Buy' : 'Sell')}
      </Button>
    </div>
  )
}