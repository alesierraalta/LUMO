/**
 * Phase 3: Redis Hybrid Caching System
 * Implements distributed caching with @upstash/redis for persistence and performance
 */

import { Redis } from '@upstash/redis';

// Redis configuration with mock detection
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

// Detect if we're using mock Redis configuration
const isMockRedis = REDIS_URL.startsWith('mock://') || REDIS_TOKEN === 'mock-token';

console.log('🔍 [Redis Cache] Configuration:', {
  url: isMockRedis ? 'MOCK MODE' : 'REAL UPSTASH',
  isMockRedis,
  urlPreview: REDIS_URL.substring(0, 20) + '...'
});

// Initialize Redis client only if not in mock mode
let redis: Redis | null = null;

if (!isMockRedis) {
  try {
    redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
    console.log('✅ [Redis Cache] Real Upstash client initialized');
  } catch (error) {
    console.error('❌ [Redis Cache] Failed to initialize:', error);
    redis = null;
  }
} else {
  console.log('⚠️ [Redis Cache] Mock mode detected - Redis caching disabled');
}

// Cache configuration
export const CACHE_KEYS = {
  INVENTORY_ITEMS: 'inventory:items',
  INVENTORY_COUNT: 'inventory:count',
  CATEGORIES: 'categories:all',
  LOCATIONS: 'locations:all',
  USERS: 'users:all',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  USER_PERMISSIONS: 'user:permissions',
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 3600, // 1 hour
  EXTENDED: 86400, // 24 hours
} as const;

/**
 * Generic cache interface
 */
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  prefix?: string;
}

/**
 * Cache a value with optional TTL and tags
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    // Skip caching if Redis is in mock mode
    if (!redis) {
      return;
    }

    const { ttl = CACHE_TTL.MEDIUM, prefix = '' } = options;
    const cacheKey = prefix ? `${prefix}:${key}` : key;
    
    const serializedValue = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      ttl,
    });

    if (ttl > 0) {
      await redis.setex(cacheKey, ttl, serializedValue);
    } else {
      await redis.set(cacheKey, serializedValue);
    }
  } catch (error) {
    console.error('Redis cache set error:', error);
    // Fail silently to maintain application functionality
  }
}

/**
 * Get a cached value
 */
export async function getCache<T>(
  key: string,
  prefix: string = ''
): Promise<T | null> {
  try {
    // Return null if Redis is in mock mode
    if (!redis) {
      return null;
    }

    const cacheKey = prefix ? `${prefix}:${key}` : key;
    const cached = await redis.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached as string);
    
    // Check if cache has expired (additional safety check)
    if (parsed.ttl > 0) {
      const age = (Date.now() - parsed.timestamp) / 1000;
      if (age > parsed.ttl) {
        await deleteCache(key, prefix);
        return null;
      }
    }

    return parsed.data as T;
  } catch (error) {
    console.error('Redis cache get error:', error);
    return null;
  }
}

/**
 * Delete a cached value
 */
export async function deleteCache(
  key: string,
  prefix: string = ''
): Promise<void> {
  try {
    // Skip delete if Redis is in mock mode
    if (!redis) {
      return;
    }

    const cacheKey = prefix ? `${prefix}:${key}` : key;
    await redis.del(cacheKey);
  } catch (error) {
    console.error('Redis cache delete error:', error);
  }
}

/**
 * Delete multiple cache entries by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    // Skip pattern delete if Redis is in mock mode
    if (!redis) {
      return;
    }

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis cache pattern delete error:', error);
  }
}

/**
 * Cache with automatic invalidation on data changes
 */
export async function cacheWithInvalidation<T>(
  key: string,
  dataFetcher: () => Promise<T>,
  options: CacheOptions & { invalidationKeys?: string[] } = {}
): Promise<T> {
  const { invalidationKeys = [], ...cacheOptions } = options;
  
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await dataFetcher();
  
  // Cache the result
  await setCache(key, data, cacheOptions);
  
  // Set invalidation markers
  for (const invKey of invalidationKeys) {
    await setCache(`inv:${invKey}:${key}`, true, { ttl: cacheOptions.ttl });
  }

  return data;
}

/**
 * Invalidate cache entries based on invalidation keys
 */
export async function invalidateByKey(invalidationKey: string): Promise<void> {
  try {
    // Skip invalidation if Redis is in mock mode
    if (!redis) {
      return;
    }

    const pattern = `inv:${invalidationKey}:*`;
    const invKeys = await redis.keys(pattern);
    
    if (invKeys.length > 0) {
      // Extract the actual cache keys to invalidate
      const cacheKeys = invKeys.map(key => key.replace(`inv:${invalidationKey}:`, ''));
      
      // Delete both the cache entries and invalidation markers
      await redis.del(...invKeys, ...cacheKeys);
    }
  } catch (error) {
    console.error('Redis cache invalidation error:', error);
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    // Return false if Redis is in mock mode
    if (!redis) {
      return false;
    }

    const response = await redis.ping();
    return response === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  totalKeys: number;
  memoryUsage?: string;
}> {
  try {
    // Return disconnected stats if Redis is in mock mode
    if (!redis) {
      return {
        connected: false,
        totalKeys: 0,
        memoryUsage: 'Mock mode - Redis disabled'
      };
    }

    const connected = await checkRedisHealth();
    
    if (!connected) {
      return { connected: false, totalKeys: 0 };
    }

    const allKeys = await redis.keys('*');
    const totalKeys = allKeys.length;

    return {
      connected: true,
      totalKeys,
      memoryUsage: 'Redis Cloud - managed',
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return { connected: false, totalKeys: 0 };
  }
}

/**
 * Batch cache operations for better performance
 */
export class CacheBatch {
  private operations: Array<() => Promise<any>> = [];

  set<T>(key: string, value: T, options: CacheOptions = {}): this {
    this.operations.push(() => setCache(key, value, options));
    return this;
  }

  delete(key: string, prefix: string = ''): this {
    this.operations.push(() => deleteCache(key, prefix));
    return this;
  }

  async execute(): Promise<void> {
    try {
      await Promise.all(this.operations.map(op => op()));
    } catch (error) {
      console.error('Batch cache operation error:', error);
    }
    this.operations = [];
  }
}

/**
 * Create a new cache batch
 */
export function createCacheBatch(): CacheBatch {
  return new CacheBatch();
}