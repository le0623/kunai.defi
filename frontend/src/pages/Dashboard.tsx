import { DataTable } from '@/components/table/data-table'
import { useAppSelector } from '@/store/hooks'
import { poolsAPI } from '@/services/api'
import { useEffect, useState } from 'react'
import type { GeckoTerminalTrendingPool } from '@kunai/shared'
import { SearchIcon, StarIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { shortenAddress, getValueColor, formatPrice, formatNumber, formatAge, cn } from '@/lib/utils'
import CopyIcon from '@/components/common/copy'
import { Button } from '@/components/ui/button'
import { CloudLightningIcon } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import Presets from '@/components/common/presets'
import TokenBuy from '@/components/common/token-buy'

const columnsTrendingTable = (duration: string = '1h'): ColumnDef<GeckoTerminalTrendingPool>[] => [
  {
    accessorKey: "token",
    header: "Token",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    accessorKey: "mc",
    header: "Market Cap",
  },
  {
    accessorKey: "txs",
    header: `${duration} TXs`,
  },
  {
    accessorKey: "vol",
    header: `${duration} Vol`,
  },

  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "price_change_5m",
    header: "5m%",
  },
  {
    accessorKey: "price_change_15m",
    header: "15m%",
  },
  {
    accessorKey: "price_change_1h",
    header: "1h%",
  },
  {
    accessorKey: "buy",
    header: "",
  },
]

type Duration = keyof GeckoTerminalTrendingPool['attributes']['transactions']

const durations: { value: Duration, label: string }[] = [
  { value: 'm5', label: '5m' },
  { value: 'm15', label: '15m' },
  { value: 'm30', label: '30m' },
  { value: 'h1', label: '1h' },
  { value: 'h6', label: '6h' },
  { value: 'h24', label: '24h' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedChain } = useAppSelector((state) => state.other)
  const [trendingPools, setTrendingPools] = useState<GeckoTerminalTrendingPool[]>([])
  const [duration, setDuration] = useState<Duration>('h1')
  const [amount, setAmount] = useState<number>(0)

  const renderCell = (value: any, row: GeckoTerminalTrendingPool, columnId: string) => {
    switch (columnId) {
      case 'token':
        const symbol = row.attributes.name.split(' ')[0]
        const address = row.attributes.address
        return (
          <div className="flex items-center gap-2">
            <StarIcon
              className="w-4 h-4 text-muted-foreground hover:text-white"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="w-16 h-16 bg-black border border-gray-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">{symbol.slice(0, 2)}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{symbol}</span>
                <Link to={`https://x.com/search?q=($${symbol} OR ${address})&src=typed_query&f=live`} target="_blank" className="cursor-pointer">
                  <SearchIcon className="w-3 h-3 text-muted-foreground hover:text-white" />
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{shortenAddress(address)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyIcon clipboardText={address} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'age':
        const poolCreatedAt = new Date(row.attributes.pool_created_at)
        const ageInSeconds = Math.floor((new Date().getTime() - poolCreatedAt.getTime()) / 1000)
        return (
          <span className="text-sm font-medium">
            {formatAge(ageInSeconds).formatted}
          </span>
        )

      case 'mc':
        return (
          <span className={`text-sm font-medium ${getValueColor(Number(row.attributes.market_cap_usd), 'mc')}`}>
            ${formatNumber(Number(row.attributes.market_cap_usd))}
          </span>
        )

      case 'txs':
        const txs = row.attributes.transactions[duration as keyof typeof row.attributes.transactions]
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{txs.buys + txs.sells}</span>
            <div className="text-xs">
              <span className="text-green-500">{txs.buys}</span>
              <span className="text-gray-500">/</span>
              <span className="text-red-500">{txs.sells}</span>
            </div>
          </div>
        )

      case 'vol':
        const vol = row.attributes.volume_usd[duration as keyof typeof row.attributes.volume_usd]
        const volColor = getValueColor(Number(vol), 'vol')
        return (
          <span className={`text-sm ${volColor}`}>
            ${formatNumber(Number(vol))}
          </span>
        )

      case 'price':
        return (
          <span className="text-sm font-mono font-medium">
            ${formatPrice(Number(row.attributes.base_token_price_usd))}
          </span>
        )

      case 'price_change_5m':
      case 'price_change_15m':
      case 'price_change_1h':
        const changeValue = Number(row.attributes.price_change_percentage[duration as keyof typeof row.attributes.price_change_percentage])
        const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{changeValue}%
          </span>
        )

      case 'buy':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button className="bg-gray-500 text-white hover:bg-primary cursor-pointer">
              <CloudLightningIcon className="w-4 h-4" />
              {amount ? `${amount} ${selectedChain.toUpperCase()}` : 'Buy'}
            </Button>
          </div>
        )

      default:
        return <>{value}</>
    }
  }

  useEffect(() => {
    const fetchTrendingPools = async () => {
      const trendingPools = await poolsAPI.getTrendingPools(selectedChain)
      setTrendingPools(trendingPools)
    }
    fetchTrendingPools()
  }, [selectedChain])

  const handleRowClick = (row: GeckoTerminalTrendingPool) => {
    const address = row.relationships.base_token.data.id.split('_')[1]
    navigate(`/eth/token/${address}`)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">Trending</span>
          {/* Duration Button Group */}
          <div className="flex items-center gap-1 bg-muted rounded p-0.5">
            {durations.map((dur) => (
              <div
                key={dur.value}
                onClick={() => setDuration(dur.value)}
                className={cn("px-2 py-1 text-sm font-medium cursor-pointer rounded", duration === dur.value && "bg-white/20")}
              >
                {dur.label}
              </div>
            ))}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <TokenBuy amount={amount} setAmount={setAmount} selectedChain={selectedChain} />
          <Presets />
        </div>
      </div>

      <div className="flex-1 px-2 overflow-hidden">
        <DataTable columns={columnsTrendingTable(duration)} data={trendingPools} renderCell={renderCell} onRowClick={handleRowClick} />
      </div>
    </div>
  )
}