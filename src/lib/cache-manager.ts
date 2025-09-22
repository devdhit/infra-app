import redisCache, { CACHE_PREFIXES, CACHE_TTL } from './redis-cache';
import logger, { LogData } from './logger';

/**
 * Cache Manager - Advanced caching utilities for optimized performance
 */

// Cache statistics tracking
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

class CacheManager {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  /**
   * Get cached value with statistics tracking
   */
  async get<T>(key: string, context?: LogData): Promise<T | null> {
    const result = await redisCache.get<T>(key);
    
    if (result !== null) {
      this.stats.hits++;
      logger.debug(`Cache HIT for key: ${key}`, context);
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS for key: ${key}`, context);
    }
    
    return result;
  }

  /**
   * Set cached value with statistics tracking
   */
  async set<T>(key: string, value: T, ttl?: number, context?: LogData): Promise<boolean> {
    const result = await redisCache.set(key, value, ttl);
    
    if (result) {
      this.stats.sets++;
      logger.debug(`Cache SET for key: ${key}`, context);
    }
    
    return result;
  }

  /**
   * Delete cached value with statistics tracking
   */
  async del(key: string, context?: LogData): Promise<boolean> {
    const result = await redisCache.del(key);
    
    if (result) {
      this.stats.deletes++;
      logger.debug(`Cache DELETE for key: ${key}`, context);
    }
    
    return result;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Create a composite cache key with multiple identifiers
   */
  createCompositeKey(prefix: string, ...identifiers: (string | number)[]): string {
    return redisCache.createKey(prefix, ...identifiers);
  }

  /**
   * Invalidate cache entries by pattern with performance optimization
   */
  async invalidateByPattern(pattern: string, context?: LogData): Promise<number> {
    const deletedCount = await redisCache.delByPattern(pattern);
    
    if (deletedCount > 0) {
      logger.info(`Invalidated ${deletedCount} cache entries with pattern: ${pattern}`, context);
    }
    
    return deletedCount;
  }

  /**
   * Invalidate all cache entries for a specific resource type
   */
  async invalidateResource(tenantId: string, resourceType: string, context?: LogData): Promise<void> {
    // Invalidate individual assets with comprehensive patterns
    const assetPatterns = [
      this.createCompositeKey(
        CACHE_PREFIXES.ASSETS,
        resourceType,
        tenantId,
        '*'
      )
    ];
    
    await this.batchInvalidate(assetPatterns, context);
    
    // Invalidate asset lists with comprehensive patterns to cover all variations
    const assetListPatterns = [
      this.createCompositeKey(
        CACHE_PREFIXES.ASSET_LIST,
        resourceType,
        tenantId,
        '*'
      ),
      this.createCompositeKey(
        CACHE_PREFIXES.ASSET_LIST,
        resourceType,
        tenantId,
        '*:*'
      ),
      this.createCompositeKey(
        CACHE_PREFIXES.ASSET_LIST,
        resourceType,
        tenantId,
        '*:*:*'
      ),
      this.createCompositeKey(
        CACHE_PREFIXES.ASSET_LIST,
        resourceType,
        tenantId,
        '*:*:*:*'
      ),
      this.createCompositeKey(
        CACHE_PREFIXES.ASSET_LIST,
        resourceType,
        tenantId,
        '*:*:*:*:*'
      )
    ];
    
    await this.batchInvalidate(assetListPatterns, context);
  }

  /**
   * Preload cache with frequently accessed data
   */
  async preloadCache<T>(
    key: string, 
    loader: () => Promise<T>, 
    ttl?: number, 
    context?: LogData
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key, context);
    if (cached !== null) {
      return cached;
    }
    
    // If not in cache, load the data
    try {
      const data = await loader();
      await this.set(key, data, ttl, context);
      return data;
    } catch (error) {
      logger.error('Error preloading cache', { 
        ...context, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Batch invalidate multiple patterns for better performance
   */
  async batchInvalidate(patterns: string[], context?: LogData): Promise<number> {
    let totalDeleted = 0;
    
    // Process patterns in parallel for better performance
    const results = await Promise.all(
      patterns.map(pattern => this.invalidateByPattern(pattern, context))
    );
    
    totalDeleted = results.reduce((sum, count) => sum + count, 0);
    
    if (totalDeleted > 0) {
      logger.info(`Batch invalidated ${totalDeleted} cache entries`, context);
    }
    
    return totalDeleted;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;

// Export types and constants for convenience
export { CACHE_PREFIXES, CACHE_TTL };
export type { CacheStats };