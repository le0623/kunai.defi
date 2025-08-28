import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, TrendingDown, Users, Clock, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { type Trader } from '@/components/table/trader-columns'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TraderService, type TraderFilters } from '@/services/traderService'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CopyTradeSheet from '@/components/copy-trade-sheet'
import { useAppDispatch } from '@/store/hooks'
import { setIsCopyTradeSheetOpen } from '@/store/slices/uiSlice'
import { type Column, type ColumnDef } from '@tanstack/react-table'
import CopyIcon from '@/components/common/copy'

const CopyTrade = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [rankorCopy, setRankorCopy] = useState<'rank' | 'copy'>('rank')
  const [traders, setTraders] = useState<Trader[]>([])
  const [copyTrades, setCopyTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copyTradesLoading, setCopyTradesLoading] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<'all' | 'smart-money' | 'kol-vc' | 'fresh-wallet' | 'sniper'>('all')
  const [sortBy, setSortBy] = useState<string>('sevenDayPnl')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>('')

  // Helper function to render sorting arrow
  const renderSortArrow = (column: Column<Trader>) => {
    const isSorted = column.getIsSorted()
    const onClick = () => column.toggleSorting(column.getIsSorted() === "asc")
    if (isSorted === "asc") return <ArrowUp className="h-4 w-4 cursor-pointer" onClick={onClick} />
    if (isSorted === "desc") return <ArrowDown className="h-4 w-4 cursor-pointer" onClick={() => column.toggleSorting(true)} />
    return <ArrowDown className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => column.toggleSorting(true)} />
  }

  // Define columns with custom cell renderers
  const traderColumns: ColumnDef<Trader>[] = [
    {
      accessorKey: "wallet",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Wallet / ETH Bal
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">{row.original.wallet.slice(0, 6)}...{row.original.wallet.slice(-4)}</span>
            <CopyIcon clipboardText={row.original.wallet} />
          </div>
          <div className="flex items-center gap-1">
            <img src={`/icon/eth.svg`} alt="ETH" className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">{parseFloat(row.original.ethBalance).toFixed(4)}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "oneDayPnl",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          1D PnL
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const pnlValue = parseFloat(row.original.oneDayPnl)
        const isPositive = pnlValue >= 0
        return (
          <div className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{pnlValue.toFixed(4)} ETH</span>
          </div>
        )
      }
    },
    {
      accessorKey: "sevenDayPnl",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          7D PnL
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const pnlValue = parseFloat(row.original.sevenDayPnl)
        const isPositive = pnlValue >= 0
        return (
          <div className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{pnlValue.toFixed(4)} ETH</span>
          </div>
        )
      }
    },
    {
      accessorKey: "thirtyDayPnl",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          30D PnL
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const pnlValue = parseFloat(row.original.thirtyDayPnl)
        const isPositive = pnlValue >= 0
        return (
          <div className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{pnlValue.toFixed(4)} ETH</span>
          </div>
        )
      }
    },
    {
      accessorKey: "sevenDayWinRate",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          7D Win Rate
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-sm">{row.original.sevenDayWinRate.toFixed(1)}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(row.original.sevenDayWinRate, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      accessorKey: "sevenDayTransactions",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          7D TXs
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.sevenDayTransactions}</span>
      )
    },
    {
      accessorKey: "trackedBy",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Tracked/Remarked
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{row.original.trackedBy} users</span>
        </div>
      )
    },
    {
      accessorKey: "sevenDayTokenDistribution",
      header: "7D Token Distribution",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.sevenDayTokenDistribution.slice(0, 3).map((token: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {token}
            </Badge>
          ))}
          {row.original.sevenDayTokenDistribution.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.sevenDayTokenDistribution.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "sevenDayProfit",
      header: "7D Profit",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="w-20 h-8 flex items-end gap-0.5">
          {row.original.sevenDayProfit.map((profit: number, index: number) => (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-sm",
                profit >= 0 ? "bg-green-500" : "bg-red-500"
              )}
              style={{ 
                height: `${Math.abs(profit) * 10}px`,
                minHeight: '2px'
              }}
            />
          ))}
        </div>
      )
    },
    {
      accessorKey: "sevenDayAvgDuration",
      header: "7D Avg Duration",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{Math.round(row.original.sevenDayAvgDuration)}m</span>
        </div>
      )
    },
    {
      accessorKey: "sevenDayAvgCost",
      header: "7D Avg Cost",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span>{parseFloat(row.original.sevenDayAvgCost).toFixed(4)} ETH</span>
        </div>
      )
    },
    {
      accessorKey: "lastTime",
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          Last Time
          {renderSortArrow(column)}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.lastTime).toLocaleDateString()}
        </span>
      )
    },
    {
      accessorKey: "copy",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            // Set the target address and open the sheet
            setSelectedWalletAddress(row.original.wallet)
            dispatch(setIsCopyTradeSheetOpen(true))
          }}
        >
          <Wallet className="w-4 h-4 mr-1" /> 
          Copy
        </Button>
      )
    }
  ]

  // Define columns for copy trades table
  const copyTradeColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: "targetAddress",
      header: "Target Address",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm">{row.original.targetAddress.slice(0, 6)}...{row.original.targetAddress.slice(-4)}</span>
          <CopyIcon clipboardText={row.original.targetAddress} />
        </div>
      )
    },
    {
      accessorKey: "allocation",
      header: "Allocation",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.allocation}%</span>
      )
    },
    {
      accessorKey: "totalTrades",
      header: "Total Trades",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalTrades}</span>
      )
    },
    {
      accessorKey: "totalProfit",
      header: "Total Profit",
      enableSorting: true,
      cell: ({ row }) => {
        const profit = parseFloat(row.original.totalProfit)
        const isPositive = profit >= 0
        return (
          <div className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{profit.toFixed(4)} ETH</span>
          </div>
        )
      }
    },
    {
      accessorKey: "winRate",
      header: "Win Rate",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-sm">{row.original.winRate.toFixed(1)}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(row.original.winRate, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      accessorKey: "isActive",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      accessorKey: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              // Handle edit copy trade
            }}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              // Handle delete copy trade
            }}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  // Fetch traders data
  const fetchTraders = async () => {
    setLoading(true)
    try {
      const filters: TraderFilters = {
        category: currentCategory,
        sortBy: sortBy as any,
        sortOrder,
        limit: 50
      }
      const data = await TraderService.getTradersByRank(filters)
      setTraders(data)
    } catch (error) {
      console.error('Error fetching traders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch copy trades data
  const fetchCopyTrades = async () => {
    setCopyTradesLoading(true)
    try {
      const data = await TraderService.getUserCopyTrades()
      setCopyTrades(data)
    } catch (error) {
      console.error('Error fetching copy trades:', error)
    } finally {
      setCopyTradesLoading(false)
    }
  }

  console.log(traders)

  useEffect(() => {
    if (rankorCopy === 'rank') {
      fetchTraders()
    } else {
      fetchCopyTrades()
    }
  }, [rankorCopy, currentCategory, sortBy, sortOrder])

  // Handle row click
  const handleRowClick = (trader: Trader) => {
    // Navigate to trader details page
    navigate(`/eth/address/${trader.wallet}`);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'smart-money', label: 'Smart Money' },
    { value: 'kol-vc', label: 'KOL/VC' },
    { value: 'fresh-wallet', label: 'Fresh Wallet' },
    { value: 'sniper', label: 'Sniper' },
  ]



  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("font-bold cursor-pointer", rankorCopy === 'rank' ? 'text-white' : 'text-muted-foreground hover:text-white')} onClick={() => setRankorCopy('rank')}>Rank</span>
          <span className="text-muted-foreground">|</span>
          <span className={cn("font-bold cursor-pointer", rankorCopy === 'copy' ? 'text-white' : 'text-muted-foreground hover:text-white')} onClick={() => setRankorCopy('copy')}>CopyTrade</span>
        </div>
        <Button 
          size="sm"
          onClick={() => dispatch(setIsCopyTradeSheetOpen(true))}
        >
          <Wallet className="w-4 h-4" />
          Create Copy Trade
        </Button>
      </div>

      {/* Category Tabs - Only show for Rank tab */}
      {rankorCopy === 'rank' && (
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={currentCategory === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCategory(tab.value as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      )}

      {/* Data Tables */}
      {rankorCopy === 'rank' ? (
        // Rank tab - Show traders table
        loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading traders...</div>
          </div>
        ) : (
          <DataTable
            columns={traderColumns}
            data={traders}
            onRowClick={handleRowClick}
          />
        )
      ) : (
        // Copy Trade tab - Show copy trades table
        copyTradesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading copy trades...</div>
          </div>
        ) : copyTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-muted-foreground">No copy trades found</div>
            <Button 
              onClick={() => dispatch(setIsCopyTradeSheetOpen(true))}
              variant="outline"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Create Your First Copy Trade
            </Button>
          </div>
        ) : (
          <DataTable
            columns={copyTradeColumns}
            data={copyTrades}
            onRowClick={() => {}} // No row click for copy trades
          />
        )
      )}
      
      {/* Copy Trade Sheet */}
      <CopyTradeSheet 
        targetAddress={selectedWalletAddress} 
        onCopyTradeCreated={fetchCopyTrades}
      />
    </div>
  )
}

export default CopyTrade