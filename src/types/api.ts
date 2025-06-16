// API Types for LUMO Inventory Management System

// Base API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserResponse
  token: string
}

export interface UserResponse {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  roleId: string
  role?: RoleResponse
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RoleResponse {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Inventory Types
export interface InventoryItemResponse {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  category?: CategoryResponse
  locationId?: string
  location?: LocationResponse
  currentStock: number
  minStockLevel: number
  unitCost: number
  unitPrice: number
  createdById: string
  createdBy?: UserResponse
  createdAt: string
  updatedAt: string
}

export interface InventoryItemRequest {
  sku: string
  name: string
  description?: string
  categoryId: string
  locationId?: string
  currentStock: number
  minStockLevel: number
  unitCost: number
  unitPrice: number
}

export interface CategoryResponse {
  id: string
  name: string
  description?: string
  createdById: string
  createdBy?: UserResponse
  createdAt: string
  updatedAt: string
}

export interface CategoryRequest {
  name: string
  description?: string
}

export interface LocationResponse {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface LocationRequest {
  name: string
  description?: string
}

// Stock Movement Types
export interface StockMovementResponse {
  id: string
  inventoryItemId: string
  inventoryItem?: InventoryItemResponse
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  notes?: string
  createdById: string
  createdBy?: UserResponse
  createdAt: string
}

export interface StockMovementRequest {
  inventoryItemId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  notes?: string
}

// Sales Types
export interface SaleResponse {
  id: string
  customerName?: string
  customerEmail?: string
  totalAmount: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  items: SaleItemResponse[]
  createdById: string
  createdBy?: UserResponse
  createdAt: string
  updatedAt: string
}

export interface SaleItemResponse {
  id: string
  saleId: string
  inventoryItemId: string
  inventoryItem?: InventoryItemResponse
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface SaleRequest {
  customerName?: string
  customerEmail?: string
  items: SaleItemRequest[]
}

export interface SaleItemRequest {
  inventoryItemId: string
  quantity: number
  unitPrice: number
}

// Import Types
export interface ImportSessionResponse {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  totalRows: number
  processedRows: number
  errorRows: number
  errors: ImportErrorResponse[]
  createdById: string
  createdBy?: UserResponse
  createdAt: string
  updatedAt: string
}

export interface ImportErrorResponse {
  id: string
  sessionId: string
  row: number
  field: string
  value: string
  error: string
}

export interface ImportPreviewResponse {
  headers: string[]
  rows: Record<string, unknown>[]
  mapping: Record<string, string>
  errors: string[]
}

// Price History Types
export interface PriceHistoryResponse {
  id: string
  inventoryItemId: string
  inventoryItem?: InventoryItemResponse
  oldUnitCost?: number
  newUnitCost?: number
  oldUnitPrice?: number
  newUnitPrice?: number
  changeReason?: string
  createdById: string
  createdBy?: UserResponse
  createdAt: string
}

// Report Types
export interface ReportResponse {
  id: string
  name: string
  type: string
  data: Record<string, unknown>
  generatedAt: string
}

export interface LowStockReportResponse {
  items: InventoryItemResponse[]
  summary: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    lowStockPercentage: number
  }
}

export interface MarginReportResponse {
  items: Array<{
    item: InventoryItemResponse
    margin: number
    marginPercentage: number
    profit: number
  }>
  summary: {
    averageMargin: number
    totalProfit: number
    itemCount: number
  }
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

// Search and Filter Types
export interface SearchParams {
  query?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface FilterOptions {
  categories?: string[]
  locations?: string[]
  stockStatus?: ('IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK')[]
  priceRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
}

// Bulk Operations Types
export interface BulkOperationRequest {
  operation: 'UPDATE' | 'DELETE' | 'ADJUST_STOCK'
  items: string[]
  data?: Record<string, unknown>
}

export interface BulkOperationResponse {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    itemId: string
    error: string
  }>
}

// Dashboard Types
export interface DashboardStatsResponse {
  totalProducts: number
  totalCategories: number
  lowStockItems: number
  totalValue: number
  recentSales: SaleResponse[]
  recentMovements: StockMovementResponse[]
}

// System Types
export interface SystemHealthResponse {
  status: 'HEALTHY' | 'WARNING' | 'ERROR'
  database: {
    connected: boolean
    responseTime: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  uptime: number
  version: string
} 