// Common types used across the platform

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface Timeframe {
  value: '1m' | '5m' | '1h' | '6h' | '24h'
  label: string
  seconds: number
}

export const TIMEFRAMES: Timeframe[] = [
  { value: '1m', label: '1 Minute', seconds: 60 },
  { value: '5m', label: '5 Minutes', seconds: 300 },
  { value: '1h', label: '1 Hour', seconds: 3600 },
  { value: '6h', label: '6 Hours', seconds: 21600 },
  { value: '24h', label: '24 Hours', seconds: 86400 }
]

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: any
}

export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export type ApiResult<T = any> = SuccessResponse<T> | ErrorResponse 