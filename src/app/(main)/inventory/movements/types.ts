// Tipo para la pestaña activa
export type TabState = "all" | "in" | "out" | "adjustment" | "sales";

// Tipo para usuario
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Tipo para producto
export interface Product {
  id: string;
  name: string;
  sku: string;
  price?: number;
  cost?: number;
  quantity?: number;
}

// Tipo para movimiento
export interface Movement {
  id: string;
  date: string | Date;
  quantity: number;
  type: string;
  notes?: string;
  user?: User;
  product?: Product;
  inventoryItemId: string;
  userId?: string;
}

// Tipo para venta
export interface Sale {
  id: string;
  date: string | Date;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  notes?: string;
  user?: User;
  transactions: SaleTransaction[];
}

// Tipo para transacción de venta
export interface SaleTransaction {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  inventoryItem?: Product;
} 