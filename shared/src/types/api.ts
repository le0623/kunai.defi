// API-related types

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters?: ApiParameter[]
  responses?: ApiResponse[]
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

export interface ApiResponse {
  statusCode: number
  description: string
  schema?: any
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

export interface WebSocketConnection {
  id: string
  userId?: string
  connectedAt: Date
  lastPing?: Date
  subscriptions: string[]
}

export interface RealtimeEvent {
  type: 'pool_created' | 'price_update' | 'trade_executed' | 'wallet_activity'
  data: any
  timestamp: Date
  chainId?: number
}

export interface ApiRateLimit {
  windowMs: number
  max: number
  message: string
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

export interface ApiMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  activeConnections: number
  lastUpdated: Date
} 