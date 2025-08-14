import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketIOContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  emit: (event: string, data?: any) => void
  listenToEvent: (event: string, handler: (data: any) => void) => void
  stopListening: (event: string) => void
  getSocket: () => Socket | null
}

const SocketIOContext = createContext<SocketIOContextType | null>(null)

interface SocketIOProviderProps {
  children: React.ReactNode
  url?: string
  withCredentials?: boolean
  transports?: string[]
  timeout?: number
}

export const SocketIOProvider: React.FC<SocketIOProviderProps> = ({
  children,
  url = `${window.location.protocol}//${window.location.host}`,
  withCredentials = true,
  transports = ['websocket', 'polling'],
  timeout = 20000
}) => {
  // Store config in refs to avoid dependencies
  const configRef = useRef({ url, withCredentials, transports, timeout })
  configRef.current = { url, withCredentials, transports, timeout }
  const socketRef = useRef<Socket | null>(null)
  const initializedRef = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  const joinedRoomsRef = useRef<Set<string>>(new Set())

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected || initializedRef.current) return

    initializedRef.current = true
    setIsConnecting(true)
    setError(null)

    try {
      const { url: socketUrl, withCredentials: creds, transports: trans, timeout: time } = configRef.current
      const socket = io(socketUrl, {
        withCredentials: creds,
        transports: trans,
        timeout: time,
        autoConnect: true
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        console.log('Global Socket.IO connected')
      })

      socket.on('disconnect', (reason) => {
        setIsConnected(false)
        setIsConnecting(false)
        console.log('Global Socket.IO disconnected:', reason)
      })

      socket.on('connect_error', (err) => {
        setIsConnected(false)
        setIsConnecting(false)
        setError(err.message || 'Connection failed')
        console.error('Global Socket.IO connection error:', err)
      })

      socket.on('error', (err) => {
        setError(err.message || 'Socket error')
        console.error('Global Socket.IO error:', err)
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log('Global Socket.IO reconnected after', attemptNumber, 'attempts')
        // Re-join all rooms after reconnection
        joinedRoomsRef.current.forEach(room => {
          socket.emit('join-room', room)
        })
      })

    } catch (err) {
      setIsConnecting(false)
      setError(err instanceof Error ? err.message : 'Failed to create socket connection')
      console.error('Global Socket.IO initialization error:', err)
    }
  }, []) // Remove all dependencies to make it stable

  // Join a specific room
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected && !joinedRoomsRef.current.has(room)) {
      socketRef.current.emit('join-room', room)
      joinedRoomsRef.current.add(room)
      console.log(`Joined room: ${room}`)
    }
  }, [])

  // Leave a specific room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected && joinedRoomsRef.current.has(room)) {
      socketRef.current.emit('leave-room', room)
      joinedRoomsRef.current.delete(room)
      console.log(`Left room: ${room}`)
    }
  }, [])

  // Emit an event
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
      console.log(`Emitted event: ${event}`, data)
    } else {
      console.warn('Cannot emit event: socket not connected')
    }
  }, [])

  // Listen to a specific event
  const listenToEvent = useCallback((event: string, handler: (data: any) => void) => {
    if (socketRef.current?.connected) {
      // Remove existing handler if any
      const existingHandler = eventHandlersRef.current.get(event)
      if (existingHandler) {
        socketRef.current.off(event, existingHandler)
      }

      // Add new handler
      socketRef.current.on(event, handler)
      eventHandlersRef.current.set(event, handler)
      console.log(`Listening to event: ${event}`)
    } else {
      console.warn('Cannot listen to event: socket not connected')
    }
  }, [])

  // Stop listening to a specific event
  const stopListening = useCallback((event: string) => {
    const handler = eventHandlersRef.current.get(event)
    if (handler && socketRef.current) {
      socketRef.current.off(event, handler)
      eventHandlersRef.current.delete(event)
      console.log(`Stopped listening to event: ${event}`)
    }
  }, [])

  // Get socket instance
  const getSocket = useCallback(() => {
    return socketRef.current
  }, [])

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket()

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        // Remove all event listeners
        eventHandlersRef.current.forEach((handler, event) => {
          socketRef.current?.off(event, handler)
        })
        eventHandlersRef.current.clear()
        
        // Leave all rooms
        joinedRoomsRef.current.forEach(room => {
          socketRef.current?.emit('leave-room', room)
        })
        joinedRoomsRef.current.clear()

        socketRef.current.disconnect()
        socketRef.current = null
        initializedRef.current = false
        console.log('Global Socket.IO disconnected')
      }
    }
  }, [initializeSocket])

  const value: SocketIOContextType = {
    isConnected,
    isConnecting,
    error,
    joinRoom,
    leaveRoom,
    emit,
    listenToEvent,
    stopListening,
    getSocket
  }

  return (
    <SocketIOContext.Provider value={value}>
      {children}
    </SocketIOContext.Provider>
  )
}

// Hook to use the Socket.IO context
export const useSocketIO = () => {
  const context = useContext(SocketIOContext)
  if (!context) {
    throw new Error('useSocketIO must be used within a SocketIOProvider')
  }
  return context
}

// Unified hook for room and event management
export const useSocketIOData = (room: string, events: { [key: string]: (data: any) => void }) => {
  const { joinRoom, leaveRoom, listenToEvent, stopListening, isConnected } = useSocketIO()
  const joinedRef = useRef(false)
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  
  // Memoize events to prevent unnecessary re-renders
  const memoizedEvents = useMemo(() => events, [JSON.stringify(events)])

  // Join room only once when connected
  useEffect(() => {
    if (isConnected && !joinedRef.current) {
      joinRoom(room)
      joinedRef.current = true
      console.log(`Joined room: ${room}`)
    }

    return () => {
      if (isConnected && joinedRef.current) {
        leaveRoom(room)
        joinedRef.current = false
        console.log(`Left room: ${room}`)
      }
    }
  }, [isConnected, room, joinRoom, leaveRoom])

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return

    // Set up new event handlers
    Object.entries(memoizedEvents).forEach(([event, handler]) => {
      // Remove existing handler if any
      const existingHandler = eventHandlersRef.current.get(event)
      if (existingHandler) {
        stopListening(event)
      }

      // Add new handler
      listenToEvent(event, handler)
      eventHandlersRef.current.set(event, handler)
      console.log(`Listening to event: ${event} in room: ${room}`)
    })

    // Cleanup function
    return () => {
      Object.keys(memoizedEvents).forEach((event) => {
        const handler = eventHandlersRef.current.get(event)
        if (handler) {
          stopListening(event)
          eventHandlersRef.current.delete(event)
          console.log(`Stopped listening to event: ${event} in room: ${room}`)
        }
      })
    }
  }, [isConnected, room, memoizedEvents, listenToEvent, stopListening])

  return useSocketIO()
}

// Hook for room-specific operations (deprecated, use useSocketIOData instead)
export const useSocketIORoom = (room: string) => {
  const { joinRoom, leaveRoom, isConnected } = useSocketIO()

  useEffect(() => {
    if (isConnected) {
      joinRoom(room)
    }

    return () => {
      if (isConnected) {
        leaveRoom(room)
      }
    }
  }, [room, isConnected, joinRoom, leaveRoom])

  return useSocketIO()
}

// Hook for listening to specific events (deprecated, use useSocketIOData instead)
export const useSocketIOEvent = (event: string, handler: (data: any) => void) => {
  const { listenToEvent, stopListening, isConnected } = useSocketIO()

  useEffect(() => {
    if (isConnected) {
      listenToEvent(event, handler)
    }

    return () => {
      if (isConnected) {
        stopListening(event)
      }
    }
  }, [event, handler, isConnected, listenToEvent, stopListening])
} 