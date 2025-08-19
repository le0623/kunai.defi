import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { 
  initializePriceFeed, 
  disconnectPriceFeed,
} from '@/store/slices/priceSlice'

export interface UsePriceReturn {
  marketPrice: string | null
  selectedChain: 'eth' | 'sol'
  isLoading: boolean
  error: string | null
  isConnected: boolean
  lastUpdate: number | null
  initializePriceFeed: (chain: 'eth' | 'sol') => void
  disconnectPriceFeed: () => void
}

/**
 * Custom hook for price feed management
 * Provides real-time price data and connection status
 */
export const usePrice = (): UsePriceReturn => {
  const dispatch = useAppDispatch()
  const price = useAppSelector((state) => state.price)
  const selectedChain = useAppSelector((state) => state.other.selectedChain)

  // Initialize price feed on mount and when selected chain changes
  useEffect(() => {
    dispatch(initializePriceFeed(selectedChain))
    
    // Cleanup on unmount
    return () => {
      dispatch(disconnectPriceFeed())
    }
  }, [dispatch, selectedChain])

  return {
    marketPrice: price.marketPrice,
    selectedChain: price.selectedChain,
    isLoading: price.isLoading,
    error: price.error,
    isConnected: price.isConnected,
    lastUpdate: price.lastUpdate,
    initializePriceFeed: (chain: 'eth' | 'sol') => dispatch(initializePriceFeed(chain)),
    disconnectPriceFeed: () => dispatch(disconnectPriceFeed()),
  }
} 