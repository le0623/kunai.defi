import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { 
  checkAuthStatus, 
  logout, 
  showAuthDlg, 
  login,
  type User 
} from '@/store/slices/authSlice'
import { useStorageListener } from '@/services/localstorage'

export interface UseAuthReturn {
  isAuthenticated: boolean
  isAuthDlgOpen: boolean
  isLoading: boolean
  error: string | null
  user: User | null
  token: string | null
  showAuthDlg: (show?: boolean) => void
  checkAuthStatus: () => void
  logout: () => void
  login: (token: string) => void
}

/**
 * Custom hook for authentication state management
 * Provides authentication status, user data, and auth-related actions
 */
export const useAuth = (): UseAuthReturn => {
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