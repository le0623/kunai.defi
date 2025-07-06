import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { PoolCard } from './PoolCard'
import { poolsAPI } from '@/services/api'

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

interface PoolSectionProps {
  type: 'new' | 'burnt' | 'dexscreener'
  title: string
  description: string
}

const timeframes = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
]

export function PoolSection({ type, title, description }: PoolSectionProps) {
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('1h')
  const [error, setError] = useState<string | null>(null)

  const fetchPools = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let data
      switch (type) {
        case 'new':
          data = await poolsAPI.getNewPools(timeframe as any, 50, [])
          break
        case 'burnt':
          data = await poolsAPI.getBurntPools(timeframe as any, 50, [])
          break
        case 'dexscreener':
          data = await poolsAPI.getDexscreenerSpentPools(timeframe as any, 50, [])
          break
        default:
          throw new Error('Invalid pool type')
      }
      
      setPools(data.pools || data || [])
    } catch (err) {
      console.error(`Error fetching ${type} pools:`, err)
      setError('Failed to load pools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPools()
  }, [timeframe, type])

  const handleRefresh = () => {
    fetchPools()
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading pools...</span>
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pools found for this timeframe
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} type={type} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 