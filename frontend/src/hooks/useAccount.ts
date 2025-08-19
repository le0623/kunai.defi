import { useAppSelector } from '@/store/hooks'
import { type User } from '@/store/slices/authSlice'

export interface UseAccountReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * Custom hook for accessing authenticated user account data
 * Provides user information and authentication status
 */
export const useAccount = (): UseAccountReturn => {
  const auth = useAppSelector((state) => state.auth)

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
  }
} 