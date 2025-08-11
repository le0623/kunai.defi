import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CloudLightningIcon, RefreshCw, SearchIcon, StarIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { poolsAPI } from '@/services/api'
import type { Pool } from '@kunai/shared'
import CopyIcon from '@/components/common/copy'
import { Link, useNavigate } from 'react-router-dom'
import { cn, formatAge, formatNumber, getValueColor, formatPrice } from '@/lib/utils'
import Presets from '@/components/common/presets'
import TokenBuy from '@/components/common/token-buy'
import { useAppSelector } from '@/store/hooks'
import { type Column, type ColumnDef } from '@tanstack/react-table'
import { TooltipImage } from '@/components/common/tooltip-image'
import ButtonGroup from '@/components/common/button-group'

// Define Token type
export type Token = {
  id: string
  link: string
  token: {
    symbol: string
    address: string
    logo?: string
  }
  age: number
  initial: number
  mc: number
  holders: number
  tx: {
    buys: number
    sells: number
  }
  vol: number
  price: number
  change5m: number
  change1h: number
  change6h: number
  buy: string
}

// Transform pool data to Token format
const transformPoolToToken = (pool: Pool, selectedDuration: string) => {
  // Get transaction and volume data based on selected duration
  const getDurationData = () => {
    switch (selectedDuration) {
      case '5m':
        return {
          tx: {
            buys: pool.dexViewData?.transactions.m5.buys || 0,
            sells: pool.dexViewData?.transactions.m5.sells || 0,
          },
          vol: pool.dexViewData?.volume.m5 || 0,
        }
      case '1h':
        return {
          tx: {
            buys: pool.dexViewData?.transactions.h1.buys || 0,
            sells: pool.dexViewData?.transactions.h1.sells || 0,
          },
          vol: pool.dexViewData?.volume.h1 || 0,
        }
      case '6h':
        return {
          tx: {
            buys: pool.dexViewData?.transactions.h6.buys || 0,
            sells: pool.dexViewData?.transactions.h6.sells || 0,
          },
          vol: pool.dexViewData?.volume.h6 || 0,
        }
      case '24h':
        return {
          tx: {
            buys: pool.dexViewData?.transactions.h24.buys || 0,
            sells: pool.dexViewData?.transactions.h24.sells || 0,
          },
          vol: pool.dexViewData?.volume.h24 || 0,
        }
      default:
        return {
          tx: {
            buys: pool.dexViewData?.transactions.m5.buys || 0,
            sells: pool.dexViewData?.transactions.m5.sells || 0,
          },
          vol: pool.dexViewData?.volume.m5 || 0,
        }
    }
  }

  const durationData = getDurationData()

  return {
    id: pool.id.toString(),
    link: `/eth/token/${pool.token0.address}`,
    token: {
      symbol: pool.token0.symbol,
      address: pool.token0.address,
      logo: pool.token0.imageUrl,
    },
    age: pool.age,
    initial: pool.dexViewData?.liquidity.quote || 0,
    mc: 0,
    holders: 0,
    tx: durationData.tx,
    vol: durationData.vol,
    price: pool.dexViewData?.priceUsd || 0,
    change5m: pool.dexViewData?.priceChange.m5 || 0,
    change1h: pool.dexViewData?.priceChange.h1 || 0,
    change6h: pool.dexViewData?.priceChange.h6 || 0,  
    // degenAudit: {
    //   isHoneypot: false,
    //   isOpenSource: false,
    // },
    // taxes: {
    //   buy: 0,
    //   sell: 0,
    // },
    buy: 'buy',
  };
};

const NewPair = () => {
  const navigate = useNavigate()
  const [selectedDuration, setSelectedDuration] = useState('1h')
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [amount, setAmount] = useState<number>(0)
  const { selectedChain } = useAppSelector((state) => state.other)

  // Helper function to render sorting arrow
  const renderSortArrow = (column: Column<Token>) => {
    const isSorted = column.getIsSorted()
    const onClick = () => column.toggleSorting(column.getIsSorted() === "asc")
    if (isSorted === "asc") return <ArrowUp className="h-4 w-4 cursor-pointer" onClick={onClick} />
    if (isSorted === "desc") return <ArrowDown className="h-4 w-4 cursor-pointer" onClick={onClick} />
    return <ArrowDown className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => column.toggleSorting(true)} />
  }

  // Create dynamic columns based on selected duration
  const columns = (duration: string = '1h'): ColumnDef<Token>[] => [
    {
      accessorKey: "token",
      header: "Token",
      cell: ({ row }) => {
        const token = row.original.token
        
        return (
          <div className="flex items-center gap-2">
            <StarIcon
              className="w-4 h-4 text-muted-foreground hover:text-white"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="relative">
              {token.logo ? (
                <TooltipImage
                  src={token.logo}
                  alt={token.symbol}
                  size={64}
                  tooltipSize={256}
                  className="rounded-full"
                  tooltipClassName="rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">{token.symbol.slice(0, 2)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{token.symbol}</span>
                <Link to={`https://x.com/search?q=($${token.symbol} OR ${token.address})&src=typed_query&f=live`} target="_blank" className="cursor-pointer">
                  <SearchIcon className="w-4 h-4 text-muted-foreground hover:text-white"/>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyIcon clipboardText={token.address} />
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorFn: (row) => row.age,
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
        const ageValue = row.getValue("age") as number
        const ageData = formatAge(ageValue)
        return (
          <span className={`text-sm font-medium ${ageData.color}`}>
            {ageData.formatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.initial,
      id: "initial",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Liq/initial
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const initialValue = row.getValue("initial") as number
        const initialFormatted = formatNumber(initialValue)
        return (
          <span className="text-sm font-medium">WETH {initialFormatted}</span>
        )
      },
    },
    {
      accessorFn: (row) => row.mc,
      id: "mc",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            MC
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const mcValue = row.getValue("mc") as number
        if (mcValue === 0) return <span className="text-sm text-gray-500">N/A</span>
        const mcFormatted = formatNumber(mcValue)
        const mcColor = getValueColor(mcValue, 'mc')
        return (
          <span className={`text-sm font-medium ${mcColor}`}>
            ${mcFormatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.holders,
      id: "holders",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            Holders
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const holdersValue = row.getValue("holders") as number
        const holdersFormatted = formatNumber(holdersValue)
        const holdersColor = holdersValue < 1000 ? 'text-gray-500' : 'text-white'
        return (
          <span className={`text-sm font-medium ${holdersColor}`}>
            {holdersFormatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.tx.buys + row.tx.sells,
      id: "tx",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            {duration} TXs
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const tx = row.original.tx
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">{tx.buys + tx.sells}</span>
            <div>
              <span className="text-sm font-medium text-green-300">{tx.buys}</span>
              <span className="text-sm font-medium text-gray-500">/</span>
              <span className="text-sm font-medium text-red-300">{tx.sells}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorFn: (row) => row.vol,
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
        const volValue = row.getValue("vol") as number
        if (volValue === 0) return <span className="text-sm text-gray-500">N/A</span>
        const volFormatted = formatNumber(volValue)
        const volColor = getValueColor(volValue, 'vol')
        return (
          <span className={`text-sm font-medium ${volColor}`}>
            ${volFormatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.price,
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
        const priceValue = row.getValue("price") as number
        const priceFormatted = formatPrice(priceValue)
        return (
          <span className="text-sm font-mono font-medium">
            {priceFormatted}
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.change5m,
      id: "change5m",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            5m%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("change5m") as number
        const changeColor = changeValue >= 0 ? 'text-green-300' : 'text-red-300'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{Number(changeValue).toPrecision(2)}%
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.change1h,
      id: "change1h",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            1h%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("change1h") as number
        const changeColor = changeValue >= 0 ? 'text-green-300' : 'text-red-300'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{Number(changeValue).toPrecision(2)}%
          </span>
        )
      },
    },
    {
      accessorFn: (row) => row.change6h,
      id: "change6h",
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            6h%
            {renderSortArrow(column)}
          </div>
        )
      },
      cell: ({ row }) => {
        const changeValue = row.getValue("change6h") as number
        const changeColor = changeValue >= 0 ? 'text-green-300' : 'text-red-300'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{Number(changeValue).toPrecision(2)}%
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
              Buy
            </Button>
          </div>
        )
      },
    },
  ]

  // Transform pools to tokens for table display
  const tokens = pools.map(pool => transformPoolToToken(pool, selectedDuration));

  // Fetch pools function
  const fetchPools = useCallback(async () => {
    if (!isWindowFocused) return; // Don't fetch if window is not focused

    try {
      setLoading(true);
      setError(null);

      const response = await poolsAPI.getPools();

      if (response.success && response.data.pools) {
        setPools(response.data.pools);
      } else {
        setError('Failed to fetch pools');
      }
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError('Error fetching pools');
    } finally {
      setLoading(false);
    }
  }, [isWindowFocused]);

  // Handle window focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true);
      // Fetch immediately when window gains focus
      fetchPools();
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [fetchPools]);

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchPools();

    // Set up interval for polling (only when window is focused)
    const interval = setInterval(() => {
      if (isWindowFocused) {
        fetchPools();
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [fetchPools, isWindowFocused]);

  // Handle duration change
  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
  };

  // Handle row click
  const handleRowClick = (token: Token) => {
    if (token.link) {
      navigate(token.link);
    }
  };

  const durations = [
    { value: '5m', label: '5m' },
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
  ]



  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">New Pairs</span>
          {/* Duration Button Group */}
          <ButtonGroup
            buttons={durations.map((d) => ({
              id: d.value,
              component: <span className="text-sm font-medium">{d.label}</span>,
              onClick: () => handleDurationChange(d.value),
            }))}
            selectedButtons={[selectedDuration]}
            className={cn("w-12 px-2 py-1 text-sm font-medium cursor-pointer rounded-sm")}
          />

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isWindowFocused ? 'bg-green-300' : 'bg-gray-400'}`} />
            <span>{isWindowFocused ? 'Live' : 'Paused'}</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <TokenBuy amount={amount} setAmount={setAmount} selectedChain={selectedChain} />
          <Presets />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 mb-4 flex-shrink-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 px-2 pb-2 overflow-hidden">
        <DataTable
          columns={columns(selectedDuration)}
          data={tokens}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}

export default NewPair