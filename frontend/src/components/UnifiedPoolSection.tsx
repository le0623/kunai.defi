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

interface PoolData {
  newPools: Pool[]
  burntPools: Pool[]
  dexscreenerSpentPools: Pool[]
}

const timeframes = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
]

export function UnifiedPoolSection() {
  const [poolData, setPoolData] = useState<PoolData>({
    newPools: [],
    burntPools: [],
    dexscreenerSpentPools: []
  })
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('1h')
  const [error, setError] = useState<string | null>(null)

  const fetchAllPools = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await poolsAPI.getAllPools(
        timeframe as any,
        50,
        [], // newPoolFilters
        [], // burntFilters
        []  // dexscreenerSpentFilters
      )
      
      setPoolData({
        newPools: data.newPools || data.new_pools || [],
        burntPools: data.burntPools || data.burnt || [],
        dexscreenerSpentPools: data.dexscreenerSpentPools || data.dexscreener_spent || []
      })
    } catch (err) {
      console.error('Error fetching pools:', err)
      setError('Failed to load pools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllPools()
  }, [timeframe])

  const handleRefresh = () => {
    fetchAllPools()
  }

  const renderPoolSection = (title: string, description: string, pools: Pool[], type: 'new' | 'burnt' | 'dexscreener') => (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </CardHeader>
      <CardContent>
        {pools.length === 0 ? (
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">All Pools</h1>
          <p className="text-muted-foreground">
            Monitor new pools, burnt/locked pools, and dexscreener spent pools
          </p>
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
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading all pools...</span>
        </div>
      )}

      {/* Pool Sections */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderPoolSection(
            "New Pools",
            "Recently created pools across all DEXs",
            poolData.newPools,
            'new'
          )}
          {renderPoolSection(
            "Burnt/Locked Pools",
            "Pools with tokens burnt or locked",
            poolData.burntPools,
            'burnt'
          )}
          {renderPoolSection(
            "Dexscreener Spent",
            "Pools tracked by Dexscreener spending",
            poolData.dexscreenerSpentPools,
            'dexscreener'
          )}
        </div>
      )}
    </div>
  )
} 