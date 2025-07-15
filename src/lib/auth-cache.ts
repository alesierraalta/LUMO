/**
 * Authentication Cache System
 * Implements in-memory caching for user authentication results
 * with TTL (Time To Live) to reduce database queries
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  clears: number;
  evictions: number;
}

class AuthCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    clears: 0,
    evictions: 0
  };
  
  // Default TTL: 5 minutes (300 seconds)
  private defaultTTL: number = 5 * 60 * 1000;
  
  // Cleanup interval: 1 minute
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.defaultTTL = ttlMs;
    this.startCleanupTimer();
  }
  
  /**
   * Get cached authentication result
   */
  get(token: string): any | null {
    const cacheKey = this.getCacheKey(token);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      console.log(`🔍 Auth Cache MISS for token: ${token.substring(0, 20)}...`);
      return null;
    }
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      // Entry expired, remove and return null
      this.cache.delete(cacheKey);
      this.stats.evictions++;
      this.stats.misses++;
      console.log(`⏰ Auth Cache EXPIRED for token: ${token.substring(0, 20)}...`);
      return null;
    }
    
    this.stats.hits++;
    console.log(`✅ Auth Cache HIT for token: ${token.substring(0, 20)}... (age: ${now - entry.timestamp}ms)`);
    return entry.data;
  }
  
  /**
   * Set authentication result in cache
   */
  set(token: string, userData: any, ttlMs?: number): void {
    const cacheKey = this.getCacheKey(token);
    const now = Date.now();
    const ttl = ttlMs || this.defaultTTL;
    
    const entry: CacheEntry = {
      data: userData,
      timestamp: now,
      expiresAt: now + ttl
    };
    
    this.cache.set(cacheKey, entry);
    this.stats.sets++;
    
    console.log(`💾 Auth Cache SET for token: ${token.substring(0, 20)}... (TTL: ${ttl}ms, expires at: ${new Date(entry.expiresAt).toISOString()})`);
  }
  
  /**
   * Clear specific cache entry
   */
  clear(token: string): void {
    const cacheKey = this.getCacheKey(token);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      this.stats.clears++;
      console.log(`🗑️ Auth Cache CLEAR for token: ${token.substring(0, 20)}...`);
    }
  }
  
  /**
   * Clear all cache entries
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.clears += size;
    console.log(`🗑️ Auth Cache CLEAR ALL - removed ${size} entries`);
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }
  
  /**
   * Get cache key from token (hash for security)
   */
  private getCacheKey(token: string): string {
    // Simple hash to avoid storing full tokens in memory
    // In production, consider using a proper hashing algorithm
    return Buffer.from(token).toString('base64').substring(0, 32);
  }
  
  /**
   * Start cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 1000); // Run every minute
  }
  
  /**
   * Remove expired entries from cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
        this.stats.evictions++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Auth Cache cleanup: removed ${removedCount} expired entries`);
    }
  }
  
  /**
   * Stop cleanup timer (for testing/shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Global cache instance
const authCache = new AuthCache();

export { authCache, AuthCache };
export type { CacheStats };