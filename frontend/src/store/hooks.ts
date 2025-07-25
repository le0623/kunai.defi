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
    dispatch(checkAuthStatus())
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