import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'

interface Pool {
  id: string
  name: string
  symbol: string
  address: string
  chain: string
  dex: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  marketCap: number
  createdAt: string
  url?: string
}

interface PoolCardProps {
  pool: Pool
  type: 'new' | 'burnt' | 'dexscreener'
}

export function PoolCard({ pool, type }: PoolCardProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'new':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'burnt':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'dexscreener':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'new':
        return 'New Pool'
      case 'burnt':
        return 'Burnt/Locked'
      case 'dexscreener':
        return 'Dexscreener'
      default:
        return 'Pool'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    if (price < 0.000001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    return `$${price.toFixed(4)}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{pool.symbol}</CardTitle>
            <Badge className={getTypeColor()}>{getTypeLabel()}</Badge>
          </div>
          {pool.url && (
            <a
              href={pool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{pool.name}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">{formatPrice(pool.price)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">24h Change</p>
            <div className="flex items-center gap-1">
              {pool.priceChange24h >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium ${pool.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pool.priceChange24h >= 0 ? '+' : ''}{pool.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Volume 24h</p>
            <p className="font-medium">{formatNumber(pool.volume24h)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Market Cap</p>
            <p className="font-medium">{formatNumber(pool.marketCap)}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pool.dex} • {pool.chain}</span>
          <span>{new Date(pool.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
} 