import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Users,
  Activity,
  Target,
  Bell,
  Zap,
  Code,
} from 'lucide-react'
import CopyIcon from '@/components/common/copy'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { TradingZone } from '@/components/pages/TokenDetail/trading-zone'
import { formatPrice } from '@/lib/utils'
import { tokenAPI } from '@/services/api'
import type { TokenInfo } from '@kunai/shared'

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
      setToken(data)
    }).catch((err) => {
      setError('Failed to load token information')
    }).finally(() => {
      setLoading(false)
    })
  }, [chain, tokenAddress])

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
    // Map chain to TradingView symbol format
    const chainMap: { [key: string]: string } = {
      'eth': 'ETH',
      'bsc': 'BSC',
      'polygon': 'MATIC',
      'arbitrum': 'ARB',
      'optimism': 'OP',
      'avalanche': 'AVAX'
    }

    const chainSymbol = chainMap[chain?.toLowerCase() || 'eth'] || 'ETH'

    // For now, use a generic token symbol
    // In a real implementation, you'd map the token address to its actual symbol
    return `${chainSymbol}USD`
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
        <div className="h-20 border-b bg-card p-4">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {token.image_url ? (
                  <img src={token.image_url} alt={token.symbol} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{token.symbol?.slice(0, 2)}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold">{token.name}</h2>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {token.address?.slice(0, 6)}...{token.address?.slice(-4)}
                    </code>
                    <CopyIcon clipboardText={token.address} />
                    <Badge variant="outline" className="capitalize text-xs">{chain}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Explorer
              </Button>
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
            <div className="h-full p-4">
              <Tabs defaultValue="activity" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="activity" className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="positions" className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Positions
                  </TabsTrigger>
                  <TabsTrigger value="holders" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Holders
                  </TabsTrigger>
                  <TabsTrigger value="traders" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Traders
                  </TabsTrigger>
                  <TabsTrigger value="tracking" className="flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Tracking
                  </TabsTrigger>
                  <TabsTrigger value="signal" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Signal
                  </TabsTrigger>
                  <TabsTrigger value="degen-calls" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Degen Calls
                  </TabsTrigger>
                  <TabsTrigger value="dev-token" className="flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Dev Token
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="flex-1 mt-4 overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Mock activity data */}
                        {Array.from({ length: 10 }, (_, i) => ({
                          id: `tx-${i}`,
                          type: i % 2 === 0 ? 'buy' : 'sell' as const,
                          amount: Math.random() * 1000,
                          price: token.price_usd ? parseFloat(token.price_usd) * (1 + (Math.random() - 0.5) * 0.1) : 0,
                          timestamp: new Date(Date.now() - i * 60000).toISOString(),
                          wallet: `0x${Math.random().toString(16).slice(2, 10)}...`,
                          txHash: `0x${Math.random().toString(16).slice(2, 42)}`
                        })).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${activity.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium">
                                  {activity.type === 'buy' ? 'Buy' : 'Sell'} {activity.amount.toFixed(2)} {token.symbol}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatPrice(activity.price)} • {activity.wallet}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatPrice(activity.amount * activity.price)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="positions" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Positions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Position tracking coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="holders" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Holders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Holder information coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="traders" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Traders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Trader analytics coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tracking" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Tracking features coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="signal" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Signals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Trading signals coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="degen-calls" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Degen Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Degen calls coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dev-token" className="flex-1 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dev Token</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Developer token information coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <TradingZone token={token} />
    </div>
  )
}

export default TokenDetail 