/**
 * Database Query Optimization Utilities
 * Implements selective field querying and optimized query patterns
 */

import { db } from '@/lib/db-supabase';

// Optimized inventory query with selective fields
export async function getOptimizedInventoryItems(params: {
  search?: string;
  categoryId?: string;
  locationId?: string;
  lowStock?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { search, categoryId, locationId, lowStock, limit = 50, offset = 0 } = params;

  const where: any = {
    isActive: true
  };

  // Search optimization
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (locationId) {
    where.locationId = locationId;
  }

  if (lowStock) {
    // Optimized low stock query
    where.currentStock = { lte: { field: 'minStockLevel' } };
  }

  // Optimized query with selective fields
  const items = await db.inventoryItem.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      sku: true,
      barcode: true,
      currentStock: true,
      minStockLevel: true,
      maxLevel: true,
      unitCost: true,
      unitPrice: true,
      imageUrl: true,
      categoryId: true,
      locationId: true,
      createdAt: true,
      updatedAt: true,
      // Optimized relations with selective fields
      category: {
        select: {
          id: true,
          name: true,
          color: true
        }
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { name: 'asc' },
    take: limit,
    skip: offset
  });

  return items;
}

// Optimized category query
export async function getOptimizedCategories() {
  return await db.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      createdAt: true,
      _count: {
        select: {
          items: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

// Optimized location query
export async function getOptimizedLocations() {
  return await db.location.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          items: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

// Optimized count query
export async function getOptimizedInventoryCount(params: {
  search?: string;
  categoryId?: string;
  locationId?: string;
  lowStock?: boolean;
}) {
  const { search, categoryId, locationId, lowStock } = params;

  const where: any = {
    isActive: true
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (locationId) {
    where.locationId = locationId;
  }

  if (lowStock) {
    where.currentStock = { lte: { field: 'minStockLevel' } };
  }

  return await db.inventoryItem.count({ where });
}

// Connection pooling optimization
export const dbConfig = {
  // Connection pool settings
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  // Query optimization settings
  logging: process.env.NODE_ENV === 'development',
  benchmark: process.env.NODE_ENV === 'development'
};