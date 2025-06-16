// Central Types Export for LUMO Inventory Management System

// Re-export all API types
export * from './api'

// Re-export all component types
export * from './components'

// Additional utility types
export type ID = string

export type Timestamp = string

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonEmptyArray<T> = [T, ...T[]]

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

// Database operation types
export interface DatabaseOptions {
  where?: Record<string, unknown>
  data?: Record<string, unknown>
  include?: Record<string, unknown>
  select?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error'

// Sort order types
export type SortOrder = 'asc' | 'desc'

// Permission types
export type Permission = 
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'roles:read'
  | 'roles:write'
  | 'roles:delete'
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'categories:read'
  | 'categories:write'
  | 'categories:delete'
  | 'locations:read'
  | 'locations:write'
  | 'locations:delete'
  | 'sales:read'
  | 'sales:write'
  | 'sales:delete'
  | 'reports:read'
  | 'reports:export'
  | 'import:execute'
  | 'system:admin'

// Environment types
export type Environment = 'development' | 'staging' | 'production'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// File types
export type FileType = 'csv' | 'xlsx' | 'pdf' | 'json'

// Stock status types
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

// Movement types
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

// Sale status types
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

// Import status types
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

// System health status types
export type HealthStatus = 'HEALTHY' | 'WARNING' | 'ERROR' 