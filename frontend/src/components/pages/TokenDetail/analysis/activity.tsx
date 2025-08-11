import { DataTable } from "@/components/table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { cn, formatAge, formatNumber } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { type MoralisTokenSwap, type TokenInfo } from '@kunai/shared'
import { tokenAPI } from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { useAppSelector } from "@/store/hooks"
import { Icon } from "@/lib/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityProps {
  token: TokenInfo
}

const columns: ColumnDef<MoralisTokenSwap>[] = [
  {
    header: "Age",
    accessorKey: "age",
    cell: ({ row }) => {
      const now = new Date()
      const time = new Date(row.original.blockTimestamp)
      const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

      return (
        <span className="text-xs font-mono text-muted-foreground">
          {formatAge(diffInSeconds).formatted}
        </span>
      )
    },
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.original.transactionType as 'buy' | 'sell'
      return (
        <span
          className={cn(
            "text-xs font-medium",
            type === 'buy' ? "text-green-400" : "text-red-400"
          )}
        >
          {type.toUpperCase()}
        </span>
      )
    },
  },
  {
    header: "Total USD",
    accessorKey: "total",
    cell: ({ row }) => {
      const total = row.original.totalValueUsd
      return (
        <span className={cn("text-xs", row.original.transactionType === 'buy' ? "text-green-300" : "text-red-300")}>
          ${formatNumber(total)}
        </span>
      )
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount = row.original.transactionType === 'buy' ? row.original.bought.amount : row.original.sold.amount
      return (
        <span className={cn("text-xs", row.original.transactionType === 'buy' ? "text-green-300" : "text-red-300")}>
          {formatNumber(Math.abs(parseFloat(amount)))}
        </span>
      )
    },
  },
  {
    header: "Maker",
    accessorKey: "maker",
    cell: ({ row }) => {
      const maker = row.original.walletAddress
      const subCategory = row.original.subCategory
      const tooltip = row.original.subCategory === 'newPosition' ? 'New Holder' : 'Sell All'
      return (
        <a
          href={`https://etherscan.io/address/${maker}`}
          target="_blank"
          className="flex items-center gap-1 text-xs"
        >
          {subCategory && (
            <Tooltip>
              <TooltipTrigger>
                <Icon icon={subCategory} />
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-1 bg-muted text-white p-1 rounded">
                <Icon icon={subCategory} />
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {maker.slice(0, 4)}...{maker.slice(-4)}
        </a>
      )
    },
  },
  {
    header: "",
    accessorKey: "txHash",
    cell: ({ row }) => {
      const txHash = row.original.transactionHash
      return (
        <div className="flex items-center justify-end">
          <Link
            to={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            className="text-xs font-mono text-blue-500 hover:text-blue-400 transition-colors"
          >
            <img src={`/icon/etherscan.svg`} alt="Etherscan" className="w-4 h-4 hover:brightness-150" />
          </Link>
        </div>
      )
    },
  },
]

const TokenActivity = ({ token }: ActivityProps) => {
  // const {
  //   activities,
  //   isMonitoring,
  //   loading,
  //   error,
  // } = useTokenActivity({
  //   tokenAddress: token.address,
  //   poolAddress: token.topPools.length > 0 ? token.topPools[0].split('_')[1] : undefined,
  //   dexType: 'all',
  //   includeFailed: false,
  // }, {
  //   autoStart: true, // Auto-start monitoring when component loads
  //   maxActivities: 1000,
  //   initialActivityLimit: 10, // Fetch latest 10 transactions on initial load
  // })
  const { selectedChain } = useAppSelector((state) => state.other)


  const { data: swaps } = useQuery({
    queryKey: ['swaps', token.address],
    queryFn: () => tokenAPI.getTokenSwaps(selectedChain, token.address),
  })

  console.log("swaps", swaps)

  return (
    <div className="flex-1 overflow-hidden">
      <DataTable
        columns={columns}
        data={swaps || []}
      />
    </div>
  )
}

export default TokenActivity