// Removed Prisma import - using Supabase

/**
 * Tipo para crear un nuevo producto
 */
export type CreateProductInput = {
  name: string;
  description?: string;
  sku: string;
  cost?: number;
  price: number;
  margin?: number;
  categoryId?: string;
  imageUrl?: string;
  // Inventory fields
  quantity?: number;
  minStockLevel?: number;
  location?: string;
};

/**
 * Tipo para actualizar un producto existente
 */
export type UpdateProductInput = {
  name?: string;
  description?: string;
  sku?: string;
  cost?: number;
  price?: number;
  margin?: number;
  categoryId?: string | null;
  imageUrl?: string;
  active?: boolean;
  // Inventory fields
  quantity?: number;
  minStockLevel?: number;
  location?: string;
};

/**
 * Tipo para opciones de ordenamiento
 */
export type SortOrder = "asc" | "desc";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  category?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationResult {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

// Client-safe function that makes a fetch request to the API
export async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const searchParamsString = new URLSearchParams();
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParamsString.append(key, v));
      } else {
        searchParamsString.append(key, value);
      }
    }
  });

  const response = await fetch(`/api/products/search?${searchParamsString.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const data = await response.json();
  
  return {
    products: data.products as Product[],
    pagination: data.pagination as PaginationResult
  };
} 