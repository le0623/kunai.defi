import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface SocketIOOptions {
  url?: string
  autoConnect?: boolean
  withCredentials?: boolean
  transports?: string[]
  timeout?: number
}

export interface RoomEvent {
  room: string
  event: string
  handler: (data: any) => void
}

export interface UseSocketIOState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  socket: Socket | null
  connect: () => void
  disconnect: () => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  emit: (event: string, data?: any) => void
  listenToEvent: (event: string, handler: (data: any) => void) => void
  stopListening: (event: string) => void
}

export const useSocketIO = (
  options: SocketIOOptions = {},
  events: RoomEvent[] = []
): UseSocketIOState => {
  const {
    url = `${window.location.protocol}//${window.location.host}`,
    autoConnect = true,
    withCredentials = true,
    transports = ['websocket', 'polling'],
    timeout = 20000
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  const joinedRoomsRef = useRef<Set<string>>(new Set())

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    setIsConnecting(true)
    setError(null)

    try {
      const socket = io(url, {
        withCredentials,
        transports,
        timeout,
        autoConnect: false
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        console.log('Socket.IO connected')
      })

      socket.on('disconnect', (reason) => {
        setIsConnected(false)
        setIsConnecting(false)
        console.log('Socket.IO disconnected:', reason)
      })

      socket.on('connect_error', (err) => {
        setIsConnected(false)
        setIsConnecting(false)
        setError(err.message || 'Connection failed')
        console.error('Socket.IO connection error:', err)
      })

      socket.on('error', (err) => {
        setError(err.message || 'Socket error')
        console.error('Socket.IO error:', err)
      })

      // Connect to socket
      socket.connect()

      // Join rooms and set up event listeners
      events.forEach(({ room, event, handler }) => {
        if (room) {
          socket.emit('join-room', room)
          joinedRoomsRef.current.add(room)
        }
        
        if (event && handler) {
          socket.on(event, handler)
          eventHandlersRef.current.set(event, handler)
        }
      })

    } catch (err) {
      setIsConnecting(false)
      setError(err instanceof Error ? err.message : 'Failed to create socket connection')
      console.error('Socket.IO initialization error:', err)
    }
  }, [url, withCredentials, transports, timeout, events])

  // Disconnect socket
  const disconnect = useCallback(() => {
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
      setIsConnected(false)
      setIsConnecting(false)
      console.log('Socket.IO disconnected')
    }
  }, [])

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

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    socket: socketRef.current,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    emit,
    listenToEvent,
    stopListening
  }
}

// Convenience hook for listening to specific room events
export const useSocketIORoom = (
  room: string,
  events: { event: string; handler: (data: any) => void }[],
  options: SocketIOOptions = {}
) => {
  const roomEvents: RoomEvent[] = events.map(({ event, handler }) => ({
    room,
    event,
    handler
  }))

  return useSocketIO(options, roomEvents)
}

// Convenience hook for listening to global events (no room)
export const useSocketIOEvents = (
  events: { event: string; handler: (data: any) => void }[],
  options: SocketIOOptions = {}
) => {
  const globalEvents: RoomEvent[] = events.map(({ event, handler }) => ({
    room: '',
    event,
    handler
  }))

  return useSocketIO(options, globalEvents)
} 