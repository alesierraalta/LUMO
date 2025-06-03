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

// Tipo para ubicación
export interface Location {
  id: string;
  name: string;
  description?: string;
}

// Tipo para producto de inventario con más detalles
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price?: number;
  cost?: number;
  quantity?: number;
  locationId?: string;
  locationRelation?: Location;
  category?: {
    id: string;
    name: string;
  };
}

// Tipo para movimiento
export interface Movement {
  id: string;
  date: string | Date;
  quantity: number;
  type: string;
  notes?: string;
  user?: User;
  product?: Product; // mantener por compatibilidad con código anterior
  inventoryItem?: InventoryItem; // nuevo campo con información completa
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