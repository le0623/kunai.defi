import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authAPI } from '@/services/api'
import { storageService, useStorageListener } from '@/services/localstorage'
import { useDisconnect } from 'wagmi'

interface AuthContextType {
  isAuthenticated: boolean
  isAuthDlgOpen: boolean
  showAuthDlg: (show?: boolean) => void
  checkAuthStatus: () => Promise<void>
  logout: () => Promise<void>
  login: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthDlgOpen, setIsAuthDlgOpen] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const { disconnect } = useDisconnect()

  const showAuthDlg = (show: boolean = true) => {
    setIsAuthDlgOpen(show)
  }

  const checkAuthStatus = async () => {
    try {
      const token = storageService.getItem('authToken')

      if (!token) {
        setIsAuth(false)
        return
      }

      setIsAuth(true)

      // // Verify token with API
      // const isValid = await authAPI.checkAuth()
      // setIsAuth(isValid)

      // if (!isValid) {
      //   // Clear invalid token
      //   storageService.removeItem('authToken')
      // }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuth(false)
      storageService.removeItem('authToken')
    }
  }

  const logout = async () => {
    try {
      disconnect()
      await authAPI.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuth(false)
      storageService.removeItem('authToken')
    }
  }

  const login = (token: string) => {
    storageService.setItem('authToken', token)
    setIsAuth(true)
    setIsAuthDlgOpen(false)
  }

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Listen for auth token changes (same tab and other tabs)
  useStorageListener('authToken', (newValue, oldValue) => {
    console.log('Auth token changed:', { newValue, oldValue })
    checkAuthStatus()
  })

  const value: AuthContextType = {
    isAuthenticated: isAuth,
    isAuthDlgOpen,
    showAuthDlg,
    checkAuthStatus,
    logout,
    login,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
