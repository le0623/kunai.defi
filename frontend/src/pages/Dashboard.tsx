import { DataTable } from '@/components/table/data-table'
import { useAppSelector } from '@/store/hooks'
import { poolsAPI } from '@/services/api'
import { useEffect, useState } from 'react'
import type { KunaiPool } from '@kunai/shared'
import { ArrowUp, ArrowDown, SearchIcon, StarIcon, User, Globe, X, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { shortenAddress, getValueColor, formatPrice, formatNumber, formatAge, cn } from '@/lib/utils'
import CopyIcon from '@/components/common/copy'
import { Button } from '@/components/ui/button'
import { CloudLightningIcon } from 'lucide-react'
import { type Column, type ColumnDef } from '@tanstack/react-table'
import Presets from '@/components/common/presets'
import TokenBuy from '@/components/common/token-buy'
import { TooltipImage } from '@/components/common/tooltip-image'
import ButtonGroup from '@/components/common/button-group'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

type Duration = keyof KunaiPool['attributes']['transactions']

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
  const [duration, setDuration] = useState<Duration>('h1')
  const [amount, setAmount] = useState<number>(0)
  const { data: trendingPools, isLoading, error, refetch } = useQuery({
    queryKey: ['trendingPools'],
    queryFn: () => poolsAPI.getTrendingPools(selectedChain),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  // Helper function to render sorting arrow
  const renderSortArrow = (column: Column<KunaiPool>) => {
    const isSorted = column.getIsSorted()
    const onClick = () => column.toggleSorting(column.getIsSorted() === "asc")
    if (isSorted === "asc") return <ArrowUp className="h-4 w-4 cursor-pointer" onClick={onClick} />
    if (isSorted === "desc") return <ArrowDown className="h-4 w-4 cursor-pointer" onClick={onClick} />
    return <ArrowDown className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => column.toggleSorting(true)} />
  }

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'website':
        return <Globe className="w-4 h-4" />
      case 'twitter':
        return <img src="/icon/x.svg" className="w-4 h-4" alt="X" />
      case 'telegram':
        return <Send className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const columnsTrendingTable = (duration: string = '1h'): ColumnDef<KunaiPool>[] => [
    {
      accessorKey: "token",
      header: "Token",
      cell: ({ row }) => {
        const symbol = row.original.attributes.name.split(' ')[0]
        const address = row.original.attributes.address
        const links = row.original.moralisToken?.links || {}

        // Only show website, telegram, and twitter in sequence
        const priorityLinks = ['website', 'telegram', 'twitter']
        const linkEntries = priorityLinks
          .map(platform => [platform, (links as any)[platform]])
          .filter(([_, url]) => url)

        return (
          <div className="flex items-center gap-2">
            <StarIcon
              className="w-4 h-4 text-muted-foreground hover:text-white"
              onClick={(e) => e.stopPropagation()}
            />
            {row.original.moralisToken?.thumbnail ? (
              <TooltipImage thumbnail={row.original.moralisToken?.thumbnail} src={row.original.moralisToken?.logo} alt={symbol} />
            ) : (
              <div className="w-16 h-16 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">{symbol.slice(0, 2)}</span>
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{symbol}</span>
                <Link to={`https://x.com/search?q=($${symbol} OR ${address})&src=typed_query&f=live`} target="_blank" className="cursor-pointer">
                  <SearchIcon className="w-4 h-4 text-muted-foreground hover:text-white" />
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{shortenAddress(address)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyIcon clipboardText={address} />
                </div>
                {linkEntries.map(([platform, url]) => (
                  <Link
                    key={platform}
                    to={url as string}
                    target="_blank"
                    className="cursor-pointer hover:scale-110 transition-transform"
                    title={platform}
                  >
                    {getLinkIcon(platform)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorFn: (row) => {
        const poolCreatedAt = new Date(row.attributes.pool_created_at)
        return Math.floor((new Date().getTime() - poolCreatedAt.getTime()) / 1000)
      },
      id: "age",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Age
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const ageInSeconds = row.getValue("age") as number
        return (
          <span className="text-sm font-medium">
            {formatAge(ageInSeconds).formatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.market_cap_usd),
      id: "mc",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Market Cap
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const marketCap = row.getValue("mc") as number
        return (
          <span className={`text-sm font-medium ${getValueColor(marketCap, 'mc')}`}>
            ${formatNumber(marketCap)}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => {
        const txs = row.attributes.transactions[duration as keyof typeof row.attributes.transactions]
        return txs.buys + txs.sells
      },
      id: "txs",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            {duration} TXs
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const txs = row.original.attributes.transactions[duration as keyof typeof row.original.attributes.transactions]
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
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.volume_usd[duration as keyof typeof row.attributes.volume_usd]),
      id: "vol",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            {duration} Vol
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const volume = row.getValue("vol") as number
        const volColor = getValueColor(volume, 'vol')
        return (
          <span className={`text-sm ${volColor}`}>
            ${formatNumber(volume)}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.base_token_price_usd),
      id: "price",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Price
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const price = row.getValue("price") as number
        return (
          <span className="text-sm font-mono font-medium">
            ${formatPrice(price)}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.price_change_percentage.m5),
      id: "price_change_5m",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            5m%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("price_change_5m") as number
        const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{changeValue}%
          </span>
        )
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.price_change_percentage.m15),
      id: "price_change_15m",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            15m%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("price_change_15m") as number
        const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{changeValue}%
          </span>
        )
      },
    },
    {
      accessorFn: (row) => Number(row.attributes.price_change_percentage.h1),
      id: "price_change_1h",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            1h%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("price_change_1h") as number
        const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{changeValue}%
          </span>
        )
      },
    },
    {
      accessorKey: "buy",
      header: "",
      cell: ({ row }) => {
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button>
              <CloudLightningIcon className="w-4 h-4" />
              {amount ? `${amount} ${selectedChain.toUpperCase()}` : 'Buy'}
            </Button>
          </div>
        )
      },
    },
  ]

  const handleRowClick = (row: KunaiPool) => {
    const address = row.relationships.base_token.data.id.split('_')[1]
    navigate(`/eth/token/${address}`, {
      state: { pool: row.attributes.address }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">Trending</span>
          {/* Duration Button Group */}
          <ButtonGroup
            buttons={durations.map((d) => ({
              id: d.value,
              component: <span className="text-sm font-medium">{d.label}</span>,
              onClick: () => setDuration(d.value),
            }))}
            selectedButtons={[duration]}
            className={cn("w-10 px-2 py-1 text-sm font-medium cursor-pointer rounded-sm")}
          />
        </div>
        <div className='flex items-center gap-2'>
          <TokenBuy amount={amount} setAmount={setAmount} selectedChain={selectedChain} />
          <Presets />
        </div>
      </div>

      <div className="flex-1 px-2 overflow-hidden">
        {isLoading ?
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-20" />
            ))}
          </div>
        : <DataTable columns={columnsTrendingTable(duration)} data={trendingPools || []} onRowClick={handleRowClick} />}
      </div>
    </div>
  )
}