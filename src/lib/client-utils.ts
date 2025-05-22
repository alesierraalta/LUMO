"use client";

/**
 * Client-side utility function to calculate margin percentage
 * Uses the formula (Price-Cost)/Cost to calculate profit margin as a percentage of cost
 */
export function calculateMargin(cost: number, price: number): number {
  // Ensure we're working with numbers
  cost = Number(cost) || 0;
  price = Number(price) || 0;
  
  // Handle edge cases
  if (cost <= 0) return 0; // Cannot calculate margin if cost is zero or negative
  if (price <= 0) return 0; // Cannot have a negative or zero price
  
  return ((price - cost) / cost) * 100;
}

/**
 * Client-side utility function to calculate price from cost and margin
 * Uses the formula Price = Cost*(1+Margin/100) to derive price from margin
 */
export function calculatePrice(cost: number, margin: number): number {
  // Ensure we're working with numbers
  cost = Number(cost) || 0;
  margin = Number(margin) || 0;
  
  // Handle edge cases
  if (cost <= 0) return 0;
  if (margin <= 0) return cost; // No margin means price equals cost
  
  return cost * (1 + margin / 100);
}

/**
 * Interface for product data used in API calls
 */
export interface ProductData {
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
  // Price change reason
  changeReason?: string;
}

/**
 * Client-side API functions for products
 */
export async function createProductApi(productData: ProductData) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear el producto');
  }
  
  return response.json();
}

export async function updateProductApi(id: string, productData: ProductData) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al actualizar el producto');
  }
  
  return response.json();
} 