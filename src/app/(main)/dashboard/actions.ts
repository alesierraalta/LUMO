'use server'

/**
 * Dashboard Server Actions
 * Maneja todas las operaciones de base de datos para el dashboard
 * Evita imports directos de db en páginas
 */

import { getAllProducts } from "@/services/productService";
import { getLowStockItems } from "@/services/inventoryService";

export async function getDashboardData() {
  try {
    // Importación dinámica de db para evitar ejecución durante build
    const { db } = await import('@/lib/db-supabase');
    
    // Obtener datos en paralelo
    const [products, lowStockItems, categories] = await Promise.all([
      getAllProducts(),
      getLowStockItems(),
      db.category.findMany({
        orderBy: {
          name: "asc",
        },
      })
    ]);

    return {
      products,
      lowStockItems,
      categories,
      error: null
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      products: [],
      lowStockItems: [],
      categories: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getInventoryStats() {
  try {
    const { db } = await import('@/lib/db-supabase');
    
    const [totalProducts, totalCategories] = await Promise.all([
      db.inventoryItem.count(),
      db.category.count()
    ]);

    return {
      totalProducts,
      totalCategories,
      error: null
    };
  } catch (error) {
    console.error('Error loading inventory stats:', error);
    return {
      totalProducts: 0,
      totalCategories: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 