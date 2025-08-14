import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
} from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { TradingZone } from '@/components/pages/TokenDetail/trading-zone'
import { tokenAPI } from '@/services/api'
import TokenAnalysis from '@/components/pages/TokenDetail/analysis'
import { TradingViewChart } from '@/components/pages/TokenDetail/tradingview-chart'
import { useQuery } from '@tanstack/react-query'
import TokenBar from '@/components/pages/TokenDetail/token-bar'

const TokenDetail = () => {
  const { chain, tokenAddress } = useParams<{ chain: string; tokenAddress: string }>()
  const location = useLocation();
  const { pool } = location.state || {};
  const { data: tokenInfo, isLoading, isError } = useQuery({
    queryKey: ['tokenInfo', chain, tokenAddress],
    queryFn: () => tokenAPI.getTokenInfo(chain || '', tokenAddress || ''),
    enabled: Boolean(chain && tokenAddress),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isError || !tokenInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
          <p className="text-muted-foreground mb-4">{isError ? 'Unable to load token information' : 'Token not found'}</p>
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
        <TokenBar tokenInfo={tokenInfo} />

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