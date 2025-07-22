import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  StarIcon,
} from 'lucide-react'
import CopyIcon from '@/components/common/copy'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { TradingZone } from '@/components/pages/TokenDetail/trading-zone'
import { tokenAPI } from '@/services/api'
import { formatAddress, type TokenInfo } from '@kunai/shared'
import EtherscanIcon from '@/assets/icons/etherscan.svg'
import TokenAnalysis from '@/components/pages/TokenDetail/analysis'

// TradingView widget type
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
  }
}

// interface TokenInfo {
//   symbol: string
//   name: string
//   address: string
//   logo?: string
//   price: number
//   marketCap: number
//   volume24h: number
//   holders: number
//   totalSupply: number
//   circulatingSupply: number
//   priceChange24h: number
//   priceChange1h: number
//   priceChange7d: number
//   buyTax: number
//   sellTax: number
//   isHoneypot: boolean
//   isOpenSource: boolean
//   liquidity: number
//   createdAt: string
// }

const TokenDetail = () => {
  const { chain, tokenAddress } = useParams<{ chain: string; tokenAddress: string }>()
  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    if (!chain || !tokenAddress) {
      setError('Invalid token address')
      setLoading(false)
      return
    }
    
    tokenAPI.getTokenInfo(chain, tokenAddress).then((data) => {
      if (data.success) {
        setToken(data.data)
      } else {
        setError(data.message)
      }
    }).catch((err) => {
      setError('Failed to load token information')
    }).finally(() => {
      setLoading(false)
    })
  }, [chain, tokenAddress])

  const tokenInfo = useMemo(() => {
    return token?.tokenInfo
  }, [token])

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (chartContainerRef.current && token) {
        initTradingViewWidget()
      }
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup widget when component unmounts
      if (widgetRef.current) {
        widgetRef.current.remove()
        widgetRef.current = null
      }
    }
  }, [token])

  const initTradingViewWidget = () => {
    if (!window.TradingView || !chartContainerRef.current || !token) return

    // Clean up existing widget
    if (widgetRef.current) {
      widgetRef.current.remove()
    }

    // Create new widget
    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: getTradingViewSymbol(),
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: chartContainerRef.current.id,
      width: '100%',
      height: '100%',
      studies: [
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
        'Volume@tv-basicstudies'
      ],
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay'
      ],
      enabled_features: [
        'study_templates'
      ],
      overrides: {
        'paneProperties.background': '#1a1a1a',
        'paneProperties.vertGridProperties.color': '#2a2a2a',
        'paneProperties.horzGridProperties.color': '#2a2a2a',
        'symbolWatermarkProperties.transparency': 90,
        'scalesProperties.textColor': '#d1d4dc'
      },
      loading_screen: {
        backgroundColor: '#1a1a1a',
        foregroundColor: '#d1d4dc'
      }
    })
  }

  const getTradingViewSymbol = () => {
    return `${tokenInfo?.symbol}USD`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !token) {
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
        <div className="h-20 border-b bg-card p-2">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" />
                  {tokenInfo?.image_url ? (
                    <img src={tokenInfo.image_url} alt={tokenInfo.symbol} className="w-12 h-12 rounded-full" />
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
                    <Link to={`https://etherscan.io/address/${tokenInfo?.address}`} target="_blank" className="cursor-pointer">
                      <img src={EtherscanIcon} alt="Etherscan" className="w-4 h-4 text-muted-foreground hover:text-white" />
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
            <div
              id="tradingview-widget"
              ref={chartContainerRef}
              className="w-full h-full"
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Details Section */}
          <ResizablePanel defaultSize={40} minSize={20}>
            {token && <TokenAnalysis token={token} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <TradingZone token={token} />
    </div>
  )
}

export default TokenDetail 