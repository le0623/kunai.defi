import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { useEffect } from 'react'
import type { RootState, AppDispatch } from './index'
import { 
  checkAuthStatus, 
  logout, 
  showAuthDlg, 
  login,
  type User 
} from './slices/authSlice'
import { 
  initializePriceFeed, 
  disconnectPriceFeed,
} from './slices/priceSlice'
import { useStorageListener } from '@/services/localstorage'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector 

// Custom hook to replace useAuth from context
export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  // Check auth status on mount
  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch])

  // Listen for auth token changes (same tab and other tabs)
  useStorageListener('authToken', (newValue, oldValue) => {
    console.log('Auth token changed:', { newValue, oldValue })
    // Only check auth status if token was removed (logout) or if we don't have a current token
    // This prevents interference with external wallet authentication
    if (!newValue || !auth.token) {
      dispatch(checkAuthStatus())
    }
  })

  return {
    isAuthenticated: auth.isAuthenticated,
    isAuthDlgOpen: auth.isAuthDlgOpen,
    isLoading: auth.isLoading,
    error: auth.error,
    user: auth.user,
    token: auth.token,
    showAuthDlg: (show: boolean = true) => dispatch(showAuthDlg(show)),
    checkAuthStatus: () => dispatch(checkAuthStatus()),
    logout: () => dispatch(logout()),
    login: (token: string) => dispatch(login(token)),
  }
}

// Custom hook for price data
export const usePrice = () => {
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