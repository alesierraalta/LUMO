/**
 * Response Caching System
 * Implements in-memory caching for API responses with TTL
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  set(key: string, data: any, ttlMs: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0,
      size: this.cache.size
    };
  }

  // Automatic cleanup of expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const responseCache = new ResponseCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  responseCache.cleanup();
}, 300000);

// Cache key generators
export const getCacheKey = {
  inventory: (params: any) => `inventory:${JSON.stringify(params)}`,
  categories: () => 'categories:all',
  locations: () => 'locations:all',
  userPermissions: (userId: string) => `permissions:${userId}`
};