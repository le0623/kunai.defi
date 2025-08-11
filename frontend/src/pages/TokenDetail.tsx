import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Search,
} from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { TradingZone } from '@/components/pages/TokenDetail/trading-zone'
import { tokenAPI } from '@/services/api'
import { formatAddress, type TokenInfo } from '@kunai/shared'
import TokenAnalysis from '@/components/pages/TokenDetail/analysis'
import { TradingViewChart } from '@/components/pages/TokenDetail/tradingview-chart'
import CopyIcon from '@/components/common/copy'

const TokenDetail = () => {
  const { chain, tokenAddress } = useParams<{ chain: string; tokenAddress: string }>()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation();
  const { pool } = location.state || {}; 

  useEffect(() => {
    if (!chain || !tokenAddress) {
      setError('Invalid token address')
      setLoading(false)
      return
    }

    tokenAPI.getTokenInfo(chain, tokenAddress).then((data) => {
      if (data.success) {
        const { tokenInfo } = data.data
        setTokenInfo(tokenInfo)
      } else {
        setError(data.message)
      }
    }).catch((err) => {
      setError('Failed to load token information')
    }).finally(() => {
      setLoading(false)
    })
  }, [chain, tokenAddress])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !tokenInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'Unable to load token information'}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-x-hidden">
      {/* Left Side - Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Section - Token Details */}
        <div className="border-b bg-card p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* StarIcon removed as per new_code */}
                  {tokenInfo?.imageUrl ? (
                    <img src={tokenInfo.imageUrl} alt={tokenInfo.symbol} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{tokenInfo?.symbol?.slice(0, 2)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-end gap-1">
                    <h2 className="font-semibold">{tokenInfo?.symbol}</h2>
                    <p className="text-sm text-muted-foreground">{tokenInfo?.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">{formatAddress(tokenInfo?.address || '')}</p>
                    <CopyIcon clipboardText={tokenInfo?.address || ''} />
                    {/* CopyIcon removed as per new_code */}
                    <Link to={`https://etherscan.io/address/${tokenInfo?.address}`} target="_blank" className="cursor-pointer">
                      <img src="/icon/etherscan.svg" alt="Etherscan" className="w-4 h-4 hover:brightness-150" />
                    </Link>
                    <Link to={`https://x.com/search?q=$${tokenInfo?.symbol}`} target="_blank" className="flex items-center gap-0.5 cursor-pointer text-muted-foreground hover:text-foreground">
                      <Search className="w-4 h-4" />
                      <span className="text-sm">Name</span>
                    </Link>
                    <Link to={`https://x.com/search?q=${tokenInfo?.address}`} target="_blank" className="flex items-center gap-0.5 cursor-pointer text-muted-foreground hover:text-foreground">
                      <Search className="w-4 h-4" />
                      <span className="text-sm">CA</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle and Bottom Sections - Chart and Details */}
        <ResizablePanelGroup direction="vertical" className="flex-1">
          {/* Chart Section */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <TradingViewChart pool={pool} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Details Section */}
          <ResizablePanel defaultSize={40} minSize={20}>
            {tokenInfo && <TokenAnalysis token={tokenInfo} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <TradingZone token={tokenInfo} />
    </div>
  )
}

export default TokenDetail 