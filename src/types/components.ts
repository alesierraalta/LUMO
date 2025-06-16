// Component Props Types for LUMO Inventory Management System

import { ReactNode } from 'react'
import { 
  UserResponse, 
  RoleResponse, 
  InventoryItemResponse, 
  CategoryResponse, 
  LocationResponse,
  SaleResponse,
  StockMovementResponse,
  PriceHistoryResponse,
  InventoryItemRequest,
  CategoryRequest,
  LocationRequest,
  SaleRequest,
  SaleItemRequest,
  StockMovementRequest
} from './api'

// Base Component Props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// Form Component Props
export interface FormFieldProps extends BaseComponentProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  value?: string | number
  onChange?: (value: string | number) => void
}

export interface FormProps extends BaseComponentProps {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  error?: string
  initialData?: Record<string, unknown>
}

// Auth Component Props
export interface LoginFormProps extends BaseComponentProps {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>
  loading?: boolean
  error?: string
}

export interface PermissionGuardProps extends BaseComponentProps {
  permissions: string[]
  userPermissions?: string[]
  fallback?: ReactNode
}

export interface UserButtonProps extends BaseComponentProps {
  user: UserResponse
  onLogout: () => void
}

// Inventory Component Props
export interface InventoryFormProps extends BaseComponentProps {
  initialData?: Partial<InventoryItemResponse>
  categories: CategoryResponse[]
  locations: LocationResponse[]
  onSubmit: (data: InventoryItemRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

export interface InventoryTableProps extends BaseComponentProps {
  items: InventoryItemResponse[]
  loading?: boolean
  onEdit?: (item: InventoryItemResponse) => void
  onDelete?: (item: InventoryItemResponse) => void
  onStockAdjustment?: (item: InventoryItemResponse) => void
}

// InventoryItemRequest is imported from './api'

export interface StockMovementFormProps extends BaseComponentProps {
  inventoryItem: InventoryItemResponse
  onSubmit: (data: StockMovementRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

// StockMovementRequest is imported from './api'

export interface PriceHistoryDialogProps extends BaseComponentProps {
  inventoryItemId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Category Component Props
export interface CategoryFormProps extends BaseComponentProps {
  initialData?: Partial<CategoryResponse>
  onSubmit: (data: CategoryRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

// CategoryRequest is imported from './api'

// Location Component Props
export interface LocationFormProps extends BaseComponentProps {
  initialData?: Partial<LocationResponse>
  onSubmit: (data: LocationRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

// LocationRequest is imported from './api'

// Sales Component Props
export interface SaleFormProps extends BaseComponentProps {
  inventoryItems: InventoryItemResponse[]
  onSubmit: (data: SaleRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

// SaleRequest and SaleItemRequest are imported from './api'

export interface SalesTableProps extends BaseComponentProps {
  sales: SaleResponse[]
  loading?: boolean
  onView?: (sale: SaleResponse) => void
  onEdit?: (sale: SaleResponse) => void
  onDelete?: (sale: SaleResponse) => void
}

// User Management Component Props
export interface UserFormProps extends BaseComponentProps {
  initialData?: Partial<UserResponse>
  roles: RoleResponse[]
  onSubmit: (data: UserRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

export interface UserRequest {
  email: string
  name: string
  firstName?: string
  lastName?: string
  roleId: string
  password?: string
  isActive: boolean
}

export interface UsersTableProps extends BaseComponentProps {
  users: UserResponse[]
  loading?: boolean
  onEdit?: (user: UserResponse) => void
  onDelete?: (user: UserResponse) => void
  onToggleActive?: (user: UserResponse) => void
}

export interface RoleFormProps extends BaseComponentProps {
  initialData?: Partial<RoleResponse>
  onSubmit: (data: RoleRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

export interface RoleRequest {
  name: string
  description: string
  permissions: string[]
  isActive: boolean
}

// Table Component Props
export interface TableProps extends BaseComponentProps {
  headers: string[]
  data: Record<string, unknown>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: Record<string, unknown>, index: number) => void
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
}

// Search and Filter Component Props
export interface SearchBarProps extends BaseComponentProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: (value: string) => void
  loading?: boolean
}

export interface FilterProps extends BaseComponentProps {
  filters: FilterOption[]
  selectedFilters: Record<string, unknown>
  onFilterChange: (filters: Record<string, unknown>) => void
  onClearFilters: () => void
}

export interface FilterOption {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'range' | 'date'
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
}

// Modal and Dialog Component Props
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ConfirmDialogProps extends BaseComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  variant?: 'default' | 'destructive'
}

// Report Component Props
export interface ReportProps extends BaseComponentProps {
  title: string
  data: Record<string, unknown>
  loading?: boolean
  error?: string
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void
  onRefresh?: () => void
}

export interface ChartProps extends BaseComponentProps {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  title?: string
  type?: 'bar' | 'line' | 'pie' | 'area'
  height?: number
  width?: number
}

// Navigation Component Props
export interface SidebarProps extends BaseComponentProps {
  user: UserResponse
  currentPath: string
  onNavigate: (path: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
}

// Error Component Props
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: Record<string, unknown>) => void
}

export interface ErrorDisplayProps extends BaseComponentProps {
  error: string | Error
  title?: string
  showRetry?: boolean
  onRetry?: () => void
}

// Loading Component Props
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export interface SkeletonProps extends BaseComponentProps {
  height?: number | string
  width?: number | string
  count?: number
  variant?: 'text' | 'rectangular' | 'circular'
}

// Notification Component Props
export interface ToastProps extends BaseComponentProps {
  title?: string
  description: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  duration?: number
  onClose?: () => void
}

// Import Component Props
export interface ImportWizardProps extends BaseComponentProps {
  onComplete: (sessionId: string) => void
  onCancel: () => void
  acceptedFileTypes: string[]
  maxFileSize: number
}

export interface ImportPreviewProps extends BaseComponentProps {
  data: Array<Record<string, unknown>>
  headers: string[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
  onConfirm: () => void
  onCancel: () => void
}

// Dashboard Component Props
export interface DashboardCardProps extends BaseComponentProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: ReactNode
  loading?: boolean
}

export interface StatCardProps extends BaseComponentProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
    label: string
  }
  icon?: ReactNode
} 