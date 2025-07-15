/**
 * Phase 3: Redis-Enhanced Database Optimization
 * Combines existing database optimizations with Redis caching
 */

import { db } from '@/lib/db-supabase';
import { 
  setCache, 
  getCache, 
  deleteCache, 
  cacheWithInvalidation,
  invalidateByKey,
  CACHE_KEYS, 
  CACHE_TTL,
  CacheOptions 
} from '@/lib/redis-cache';

// Enhanced inventory item interface with caching metadata
export interface CachedInventoryItem {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  minStockLevel: number;
  categoryId?: string;
  locationId?: string;
  isActive: boolean;
  category?: { name: string };
  location?: { name: string };
  createdBy?: { name: string };
  _cached?: boolean;
  _cacheTime?: number;
}

/**
 * Get optimized inventory items with Redis caching
 */
export async function getOptimizedInventoryItemsCached(
  page: number = 1,
  limit: number = 10,
  search?: string,
  category?: string,
  location?: string,
  lowStock?: boolean
): Promise<CachedInventoryItem[]> {
  // Create cache key based on parameters
  const cacheKey = `${CACHE_KEYS.INVENTORY_ITEMS}:page:${page}:limit:${limit}:search:${search || 'none'}:cat:${category || 'none'}:loc:${location || 'none'}:low:${lowStock || 'false'}`;
  
  return cacheWithInvalidation(
    cacheKey,
    async () => {
      const offset = (page - 1) * limit;
      
      const whereConditions: any = {
        isActive: true,
      };

      if (search) {
        whereConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        whereConditions.categoryId = category;
      }

      if (location) {
        whereConditions.locationId = location;
      }

      if (lowStock) {
        whereConditions.currentStock = { lte: { field: 'minStockLevel' } };
      }

      const items = await db.inventoryItem.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
          minStockLevel: true,
          categoryId: true,
          locationId: true,
          isActive: true,
          category: {
            select: { name: true },
          },
          location: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      });

      return items.map(item => ({
        ...item,
        _cached: true,
        _cacheTime: Date.now(),
      }));
    },
    {
      ttl: CACHE_TTL.MEDIUM,
      invalidationKeys: ['inventory_items', 'categories', 'locations'],
    }
  );
}

/**
 * Get optimized inventory count with Redis caching
 */
export async function getOptimizedInventoryCountCached(
  search?: string,
  category?: string,
  location?: string,
  lowStock?: boolean
): Promise<number> {
  const cacheKey = `${CACHE_KEYS.INVENTORY_COUNT}:search:${search || 'none'}:cat:${category || 'none'}:loc:${location || 'none'}:low:${lowStock || 'false'}`;
  
  return cacheWithInvalidation(
    cacheKey,
    async () => {
      const whereConditions: any = {
        isActive: true,
      };

      if (search) {
        whereConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        whereConditions.categoryId = category;
      }

      if (location) {
        whereConditions.locationId = location;
      }

      if (lowStock) {
        whereConditions.currentStock = { lte: { field: 'minStockLevel' } };
      }

      return await db.inventoryItem.count({
        where: whereConditions,
      });
    },
    {
      ttl: CACHE_TTL.SHORT,
      invalidationKeys: ['inventory_items'],
    }
  );
}

/**
 * Get categories with Redis caching
 */
export async function getCategoriesCached(): Promise<Array<{ id: string; name: string; description?: string }>> {
  return cacheWithInvalidation(
    CACHE_KEYS.CATEGORIES,
    async () => {
      return await db.category.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });
    },
    {
      ttl: CACHE_TTL.LONG,
      invalidationKeys: ['categories'],
    }
  );
}

/**
 * Get locations with Redis caching
 */
export async function getLocationsCached(): Promise<Array<{ id: string; name: string; description?: string }>> {
  return cacheWithInvalidation(
    CACHE_KEYS.LOCATIONS,
    async () => {
      return await db.location.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });
    },
    {
      ttl: CACHE_TTL.LONG,
      invalidationKeys: ['locations'],
    }
  );
}

/**
 * Get user by ID with Redis caching
 */
export async function getUserCached(userId: string): Promise<any> {
  const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
  
  return cacheWithInvalidation(
    cacheKey,
    async () => {
      return await db.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
        },
      });
    },
    {
      ttl: CACHE_TTL.MEDIUM,
      invalidationKeys: ['users', 'roles'],
    }
  );
}

/**
 * Invalidate inventory-related caches
 */
export async function invalidateInventoryCaches(): Promise<void> {
  await Promise.all([
    invalidateByKey('inventory_items'),
    invalidateByKey('categories'),
    invalidateByKey('locations'),
  ]);
}

/**
 * Invalidate user caches
 */
export async function invalidateUserCaches(userId?: string): Promise<void> {
  if (userId) {
    await deleteCache(`${CACHE_KEYS.USER_PERMISSIONS}:${userId}`);
  } else {
    await invalidateByKey('users');
    await invalidateByKey('roles');
  }
}

/**
 * Cache warmup - preload commonly accessed data
 */
export async function warmupCache(): Promise<void> {
  try {
    // Warm up categories and locations (frequently accessed, rarely changed)
    await Promise.all([
      getCategoriesCached(),
      getLocationsCached(),
    ]);

    // Warm up first page of inventory items
    await getOptimizedInventoryItemsCached(1, 20);
    
    console.log('Cache warmup completed successfully');
  } catch (error) {
    console.error('Cache warmup failed:', error);
  }
}

/**
 * Cache performance monitoring
 */
export async function getCachePerformanceMetrics(): Promise<{
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}> {
  try {
    // Simple hit rate tracking (in production, use more sophisticated metrics)
    const hits = await getCache<number>('metrics:cache_hits') || 0;
    const misses = await getCache<number>('metrics:cache_misses') || 0;
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;

    return {
      hitRate,
      totalRequests,
      cacheHits: hits,
      cacheMisses: misses,
    };
  } catch (error) {
    console.error('Cache metrics error:', error);
    return {
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

/**
 * Track cache hit
 */
export async function trackCacheHit(): Promise<void> {
  try {
    const current = await getCache<number>('metrics:cache_hits') || 0;
    await setCache('metrics:cache_hits', current + 1, { ttl: CACHE_TTL.EXTENDED });
  } catch (error) {
    // Fail silently
  }
}

/**
 * Track cache miss
 */
export async function trackCacheMiss(): Promise<void> {
  try {
    const current = await getCache<number>('metrics:cache_misses') || 0;
    await setCache('metrics:cache_misses', current + 1, { ttl: CACHE_TTL.EXTENDED });
  } catch (error) {
    // Fail silently
  }
}