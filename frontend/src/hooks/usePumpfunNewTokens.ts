import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppSelector } from '@/store/hooks'

export interface PumpfunEvent {
  // The Pump.fun payload structure isn't fully documented here; keep flexible
  [key: string]: any
}

export interface UsePumpfunOptions {
  enabled?: boolean
  maxBuffer?: number
  onEvent?: (event: PumpfunEvent) => void
}

export interface UsePumpfunState {
  isConnected: boolean
  error: string | null
  lastEvent: PumpfunEvent | null
  events: PumpfunEvent[]
  clear: () => void
  close: () => void
}

export const usePumpfunNewTokens = (options: UsePumpfunOptions = {}): UsePumpfunState => {
  const selectedChain = useAppSelector((state) => state.other.selectedChain)
  const shouldEnable = options.enabled ?? (selectedChain === 'sol')
  const maxBuffer = options.maxBuffer ?? 50

  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState<PumpfunEvent | null>(null)
  const [events, setEvents] = useState<PumpfunEvent[]>([])

  const subscribePayload = useMemo(() => ({ method: 'subscribeNewToken' }), [])

  const clear = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  const close = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (_) {
        // ignore
      }
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!shouldEnable) {
      // Ensure any existing connection is closed when disabled
      close()
      setIsConnected(false)
      return
    }

    // Avoid duplicate connections
    if (wsRef.current) return

    const ws = new WebSocket('wss://pumpportal.fun/api/data')
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      try {
        ws.send(JSON.stringify(subscribePayload))
      } catch (err: any) {
        setError(err?.message || 'Failed to subscribe to Pump.fun stream')
      }
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: PumpfunEvent = JSON.parse(event.data as string)
        setLastEvent(data)
        setEvents((prev) => [data, ...prev].slice(0, maxBuffer))
        options.onEvent?.(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to parse Pump.fun message')
      }
    }

    ws.onerror = () => {
      setError('Pump.fun WebSocket error')
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null
    }

    return () => {
      // Cleanup on unmount or dependency change
      try {
        ws.close()
      } catch (_) {
        // ignore
      }
      wsRef.current = null
    }
  }, [shouldEnable, subscribePayload, maxBuffer, options, close])

  return {
    isConnected,
    error,
    lastEvent,
    events,
    clear,
    close,
  }
} 