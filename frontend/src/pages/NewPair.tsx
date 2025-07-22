import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CloudLightningIcon, RefreshCw, SearchIcon, StarIcon } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { createColumns, type Token } from '@/components/table/columns'
import { poolsAPI } from '@/services/api'
import type { Pool } from '@kunai/shared'
import CopyIcon from '@/components/common/copy'
import { Link, useNavigate } from 'react-router-dom'
import { cn, formatAge, formatNumber, getValueColor, formatPrice } from '@/lib/utils'
import Presets from '@/components/common/presets'

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
      logo: pool.token0.image_url,
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

  // Create dynamic columns based on selected duration
  const columns = createColumns(selectedDuration)

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

  const renderCell = (value: any, row: Token, columnId: string) => {
    switch (columnId) {
      case 'token':
        return (
          <div className="flex items-center gap-2">
            <StarIcon
              className="w-4 h-4 text-muted-foreground hover:text-white"
              onClick={(e) => e.stopPropagation()}
            />
            {row.token.logo ?
              <img src={row.token.logo} alt={row.token.symbol} className="w-16 h-16 rounded-full" /> :
              <div className="w-16 h-16 bg-black border border-gray-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">{row.token.symbol.slice(0, 2)}</span>
              </div>
            }
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{row.token.symbol}</span>
                <Link to={`https://x.com/search?q=($${row.token.symbol} OR ${row.token.address})&src=typed_query&f=live`} target="_blank" className="cursor-pointer">
                  <SearchIcon className="w-3 h-3 text-muted-foreground hover:text-white"/>
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{row.token.address.slice(0, 6)}...{row.token.address.slice(-4)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyIcon clipboardText={row.token.address} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'age':
        // Ensure value is a valid number
        const ageValue = typeof value === 'number' && !isNaN(value) ? value : 0
        const ageData = formatAge(ageValue)
        return (
          <span className={`text-sm font-medium ${ageData.color}`}>
            {ageData.formatted}
          </span>
        )
      
      case 'initial':
        const initialValue = value as number;
        const initialFormatted = formatNumber(initialValue)
        return (
          <span className="text-sm font-medium">WETH {initialFormatted}</span>
        )

      case 'mc':
        // Ensure value is a valid number
        const mcValue = typeof value === 'number' && !isNaN(value) ? value : 0
        if (mcValue === 0) return <span className="text-sm text-gray-500">N/A</span>
        const mcFormatted = formatNumber(mcValue)
        const mcColor = getValueColor(mcValue, 'mc')
        return (
          <span className={`text-sm font-medium ${mcColor}`}>
            ${mcFormatted}
          </span>
        )

      case 'vol':
        // Ensure value is a valid number
        const volValue = value as number;
        if (volValue === 0) return <span className="text-sm text-gray-500">N/A</span>
        const volFormatted = formatNumber(volValue)
        const volColor = getValueColor(volValue, 'vol')
        return (
          <span className={`text-sm font-medium ${volColor}`}>
            ${volFormatted}
          </span>
        )

      case 'holders':
        // Ensure value is a valid number
        const holdersValue = value as number;
        const holdersFormatted = formatNumber(holdersValue)
        const holdersColor = holdersValue < 1000 ? 'text-gray-500' : 'text-white'
        return (
          <span className={`text-sm font-medium ${holdersColor}`}>
            {holdersFormatted}
          </span>
        )

      case 'price':
        // Ensure value is a valid number
        const priceValue = value as number;
        const priceFormatted = formatPrice(priceValue)
        return (
          <span className="text-sm font-mono font-medium">
            {priceFormatted}
          </span>
        )

      case 'change5m':
      case 'change1h':
      case 'change6h':
        // Ensure value is a valid number
        const changeValue = value as number;
        const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500'
        const changeSign = changeValue >= 0 ? '+' : ''
        return (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeSign}{Number(changeValue).toPrecision(2)}%
          </span>
        )

      case 'tx':
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">{row.tx.buys + row.tx.sells}</span>
            <div>
              <span className="text-sm font-medium text-green-500">{row.tx.buys}</span>
              <span className="text-sm font-medium text-gray-500">/</span>
              <span className="text-sm font-medium text-red-500">{row.tx.sells}</span>
            </div>
          </div>
        )

      // case 'degenAudit':
      //   return (
      //     <div className="flex items-center gap-2">
      //       <span className="text-sm font-medium">{row.degenAudit.isHoneypot ? '🚨 Honeypot' : '✅ Verified'}</span>
      //       <span className="text-sm font-medium">{row.degenAudit.isOpenSource ? '✅ Open Source' : '❌ Closed Source'}</span>
      //     </div>
      //   )

      // case 'taxes':
      //   const buyTax = row.taxes.buy
      //   const sellTax = row.taxes.sell
      //   const buyColor = buyTax > 5 ? 'text-yellow-500' : 'text-sm font-medium'
      //   const sellColor = sellTax > 5 ? 'text-yellow-500' : 'text-sm font-medium'
      //   return (
      //     <div>
      //       <span className={`text-sm font-medium ${buyColor}`}>{buyTax}%</span>
      //       <span className="text-sm font-medium text-gray-500">/</span>
      //       <span className={`text-sm font-medium ${sellColor}`}>{sellTax}%</span>
      //     </div>
      //   )

      case 'buy':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button className="bg-gray-500 text-white hover:bg-primary cursor-pointer">
              <CloudLightningIcon className="w-4 h-4" />
              Buy
            </Button>
          </div>
        )

      default:
        return <>{value}</>
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">New Pairs</span>
          {/* Duration Button Group */}
          <div className="flex items-center gap-1 bg-accent rounded-xs p-0.5">
            {durations.map((duration) => (
              <div
                key={duration.value}
                onClick={() => handleDurationChange(duration.value)}
                className={cn("px-2 py-1 text-xs font-medium cursor-pointer rounded-xs", selectedDuration === duration.value && "bg-white/10")}
              >
                {duration.label}
              </div>
            ))}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isWindowFocused ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isWindowFocused ? 'Live' : 'Paused'}</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
        </div>
        <Presets />
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
          columns={columns}
          data={tokens}
          renderCell={renderCell}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}

export default NewPair