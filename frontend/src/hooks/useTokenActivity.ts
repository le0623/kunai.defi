import { useState, useEffect, useCallback, useRef } from 'react'
import { tokenActivityService, type TokenActivity, type TokenActivityConfig } from '@/services/tokenActivityService'
import { toast } from 'sonner'

interface UseTokenActivityOptions {
  autoStart?: boolean
  maxActivities?: number
  initialActivityLimit?: number
  onError?: (error: Error) => void
}

interface UseTokenActivityReturn {
  activities: TokenActivity[]
  isMonitoring: boolean
  loading: boolean
  error: string | null
}

export function useTokenActivity(
  initialConfig: TokenActivityConfig,
  options: UseTokenActivityOptions = {}
): UseTokenActivityReturn {
  const { autoStart = false, maxActivities = 1000, initialActivityLimit = 10, onError } = options
  
  const [activities, setActivities] = useState<TokenActivity[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const listenerIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  // Handle new activity
  const handleNewActivity = useCallback((activity: TokenActivity) => {
    setActivities(prev => [activity, ...prev.slice(0, maxActivities - 1)])
  }, [maxActivities])

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('Token activity error:', error)
    setError(error.message)
    onError?.(error)
    toast.error(`Activity monitoring error: ${error.message}`)
  }, [onError])

  // Start monitoring automatically
  const startMonitoring = useCallback(async () => {
    if (!initialConfig.tokenAddress) {
      const errorMsg = 'Token address is required'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const id = await tokenActivityService.startMonitoring(
        initialConfig,
        handleNewActivity,
        handleError,
        initialActivityLimit
      )

      listenerIdRef.current = id
      setIsMonitoring(true)
      toast.success(`Started monitoring ${initialConfig.tokenAddress}`)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start monitoring'
      setError(errorMsg)
      toast.error(errorMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [initialConfig, handleNewActivity, handleError])

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (autoStart && initialConfig.tokenAddress && !isMonitoring && !isInitializedRef.current) {
      startMonitoring().catch(console.error)
      isInitializedRef.current = true
    }
  }, [autoStart, initialConfig.tokenAddress, isMonitoring, startMonitoring])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerIdRef.current) {
        tokenActivityService.stopMonitoring(listenerIdRef.current)
      }
    }
  }, [])

  return {
    activities,
    isMonitoring,
    loading,
    error,
  }
} 