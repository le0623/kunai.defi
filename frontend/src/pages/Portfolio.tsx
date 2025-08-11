import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Share2, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  Settings,
  Lock
} from 'lucide-react'
import { useAuth } from '@/store/hooks'
import { useAccount, useBalance } from 'wagmi'
import { shortenAddress, formatNumber } from '@/lib/utils'
import CopyIcon from '@/components/common/copy'
import { authAPI } from '@/services/api'

interface Holding {
  id: string
  token: string
  symbol: string
  lastActive: string
  boughtAmount: number
  boughtAvg: number
  soldAmount: number
  soldAvg: number
  balance: number
  balanceUSD: number
  unrealizedPnL: number
  totalProfit: number
  holdingDuration: string
}

const Portfolio = () => {
  const { isAuthenticated, user } = useAuth()
  const { address: walletAddress, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: walletAddress,
    chainId: 1,
  })

  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: number
  } | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'all'>('7d')
  const [filters, setFilters] = useState({
    hideDidntBuy: true,
    hideLowLiq: true,
    hideSmallAsset: true,
    hideSellOut: true,
  })

  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (isAuthenticated) {
        if (isConnected && walletAddress) {
          // Use external wallet balance
          setWalletInfo({
            address: walletAddress,
            balance: Number(balance?.formatted || 0),
          })
        } else {
          // Use in-app wallet balance from backend
          try {
            const balanceData = await import('@/services/api').then(m => 
              m.walletAPI.getCurrentUserWalletBalance()
            )
            if (balanceData.success) {
              setWalletInfo({
                address: balanceData.balance.address,
                balance: Number(balanceData.balance.eth || 0),
              })
            }
          } catch (error) {
            console.error('Error fetching in-app wallet balance:', error)
            // Fallback to user data if API fails
            try {
              const user = await authAPI.getCurrentUser()
              setWalletInfo({
                address: user.inAppWallet || '',
                balance: 0,
              })
            } catch (userError) {
              console.error('Error fetching user data:', userError)
            }
          }
        }
      }
      setLoading(false)
    }
    fetchWalletInfo()
  }, [isAuthenticated, isConnected, walletAddress, balance?.formatted])

  // Mock data for holdings - in real implementation, this would come from API
  useEffect(() => {
    // Simulate loading holdings data
    setTimeout(() => {
      setHoldings([]) // Empty for now, would be populated from API
    }, 1000)
  }, [])

  const totalPnL = 0 // Would be calculated from holdings
  const unrealizedPnL = 0 // Would be calculated from holdings
  const realizedPnL = 0 // Would be calculated from holdings

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">Please connect your wallet to view your portfolio.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Row - ETH Wallet, PnL, Wallet Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ETH Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ETH Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">My Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{shortenAddress(walletInfo?.address || '')}</span>
                <CopyIcon clipboardText={walletInfo?.address || ''} />
                <ExternalLink className="w-4 h-4 cursor-pointer" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{walletInfo?.balance || 0} ETH</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share Wallets
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Import Private Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PnL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PnL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PNL Calendar</span>
              <div className="flex gap-1">
                {(['1d', '7d', '30d', 'all'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="text-xs"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">7D Realized PnL</span>
                <span className="text-sm font-medium">0% $0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total PnL</span>
                <span className="text-sm font-medium">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Unrealized Profits</span>
                <span className="text-sm font-medium">$0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Wallet Balance</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                Updated: 1m ago
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{walletInfo?.balance || 0} ETH</div>
              <div className="text-sm text-muted-foreground">~ $0</div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Button className="h-16 rounded-full" variant="outline">
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Deposit</span>
                </div>
              </Button>
              <Button className="h-16 rounded-full" variant="outline">
                <div className="text-center">
                  <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Withdraw</span>
                </div>
              </Button>
              <Button className="h-16 rounded-full" variant="outline">
                <div className="text-center">
                  <RefreshCw className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Buy</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Holding</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hideDidntBuy"
                  checked={filters.hideDidntBuy}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hideDidntBuy: checked as boolean }))
                  }
                />
                <label htmlFor="hideDidntBuy" className="text-sm">Hide Didn't Buy</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hideLowLiq"
                  checked={filters.hideLowLiq}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hideLowLiq: checked as boolean }))
                  }
                />
                <label htmlFor="hideLowLiq" className="text-sm">Hide Low Liq/Honeypot</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hideSmallAsset"
                  checked={filters.hideSmallAsset}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hideSmallAsset: checked as boolean }))
                  }
                />
                <label htmlFor="hideSmallAsset" className="text-sm">Hide Small Asset</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hideSellOut"
                  checked={filters.hideSellOut}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hideSellOut: checked as boolean }))
                  }
                />
                <label htmlFor="hideSellOut" className="text-sm">Hide Sell Out</label>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm">Sell 100%</Button>
              <Button variant="outline" size="sm">P1</Button>
              <Button variant="outline" size="sm">P2</Button>
              <Button variant="outline" size="sm">P3</Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Holdings Table */}
          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div className="text-lg font-semibold mb-2">CLOSE</div>
              <div className="text-muted-foreground">No Data</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer">
                    Token / Last Active
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Bought ⇅ / Avg
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Sold ⇅ / Avg
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Balance ⇅ USD($)
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Unrealized ⇅
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Total Profit ⇅
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Holding Duration
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{holding.symbol}</div>
                        <div className="text-sm text-muted-foreground">{holding.lastActive}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{formatNumber(holding.boughtAmount)}</div>
                        <div className="text-sm text-muted-foreground">${holding.boughtAvg}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{formatNumber(holding.soldAmount)}</div>
                        <div className="text-sm text-muted-foreground">${holding.soldAvg}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{formatNumber(holding.balance)}</div>
                        <div className="text-sm text-muted-foreground">${formatNumber(holding.balanceUSD)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={holding.unrealizedPnL >= 0 ? 'default' : 'destructive'}>
                        ${formatNumber(Math.abs(holding.unrealizedPnL))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={holding.totalProfit >= 0 ? 'default' : 'destructive'}>
                        ${formatNumber(Math.abs(holding.totalProfit))}
                      </Badge>
                    </TableCell>
                    <TableCell>{holding.holdingDuration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Portfolio 