# Caching with Redis Guide

This document provides comprehensive guidance on the Redis caching implementation in the IT Asset Management System (ITAMS), including configuration, usage patterns, optimization strategies, and best practices.

## Redis Overview

Redis is an in-memory data structure store used as a database, cache, and message broker. ITAMS leverages Redis for caching to improve performance, reduce database load, and enhance user experience through faster response times.

### Key Benefits

1. **Performance**: Sub-millisecond data access
2. **Scalability**: Horizontal scaling capabilities
3. **Flexibility**: Support for various data structures
4. **Persistence**: Optional data persistence options
5. **High Availability**: Clustering and replication support

## Redis Configuration

### Connection Setup

#### Environment Configuration

```env
# Redis connection settings
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=itams:
REDIS_TTL_DEFAULT=300
REDIS_POOL_SIZE=10
REDIS_TIMEOUT=5000

# Cache-specific TTL values
CACHE_TTL_ASSETS=300
CACHE_TTL_ASSET_LIST=120
CACHE_TTL_PERMISSIONS=300
CACHE_TTL_CUSTOM_FIELDS=600
CACHE_TTL_SEARCH=60
```

#### Client Configuration

```typescript
// src/lib/redis-cache.ts
import Redis from 'ioredis';
import { logger } from './logger';

class RedisCache {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      retryDelayOnFailover: 500,
      maxRetriesPerRequest: 3,
      connectTimeout: parseInt(process.env.REDIS_TIMEOUT || '5000', 10),
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis client closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}

export const redisCache = new RedisCache();
```

### Cache Key Strategy

#### Key Naming Convention

```typescript
// src/lib/cache-manager.ts
export const cacheKeys = {
  // Asset-related keys
  assetList: (assetType: string, tenantId: string, params: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}assets:${assetType}:${tenantId}:list:${params}`,
  
  assetDetail: (assetType: string, tenantId: string, id: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}assets:${assetType}:${tenantId}:detail:${id}`,
  
  assetStats: (tenantId: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}assets:stats:${tenantId}`,
  
  // User and permission keys
  permissions: (userId: string, tenantId: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}permissions:${userId}:${tenantId}`,
  
  userSession: (sessionId: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}session:${sessionId}`,
  
  // Custom field keys
  customFields: (tenantId: string, modelType?: string) => 
    modelType 
      ? `${process.env.REDIS_PREFIX || 'itams:'}custom_fields:${tenantId}:${modelType}`
      : `${process.env.REDIS_PREFIX || 'itams:'}custom_fields:${tenantId}`,
  
  // Dashboard keys
  dashboardSummary: (tenantId: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}dashboard:summary:${tenantId}`,
  
  // Search keys
  searchResults: (tenantId: string, query: string, filters: string) => 
    `${process.env.REDIS_PREFIX || 'itams:'}search:${tenantId}:${query}:${filters}`
};
```

## Cache Implementation Patterns

### Basic Cache Operations

#### Get Operation

```typescript
// src/lib/cache-manager.ts
export class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    if (!redisCache.isConnected()) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await redisCache.client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async getWithFallback<T>(
    key: string, 
    fallback: () => Promise<T>,
    ttl: number = parseInt(process.env.REDIS_TTL_DEFAULT || '300', 10)
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, get from source and cache it
    try {
      const data = await fallback();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Cache fallback error:', { key, error });
      throw error;
    }
  }
}
```

#### Set Operation

```typescript
async set<T>(key: string, value: T, ttl: number = parseInt(process.env.REDIS_TTL_DEFAULT || '300', 10)): Promise<void> {
  if (!redisCache.isConnected()) {
    logger.warn('Redis not connected, skipping cache set');
    return;
  }

  try {
    await redisCache.client.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error:', { key, error });
  }
}

async setMultiple(items: { key: string; value: any; ttl?: number }[]): Promise<void> {
  if (!redisCache.isConnected()) {
    logger.warn('Redis not connected, skipping cache set multiple');
    return;
  }

  try {
    const pipeline = redisCache.client.pipeline();
    
    for (const item of items) {
      const ttl = item.ttl || parseInt(process.env.REDIS_TTL_DEFAULT || '300', 10);
      pipeline.setex(item.key, ttl, JSON.stringify(item.value));
    }
    
    await pipeline.exec();
  } catch (error) {
    logger.error('Cache set multiple error:', { error });
  }
}
```

#### Delete Operation

```typescript
async del(key: string): Promise<void> {
  if (!redisCache.isConnected()) {
    logger.warn('Redis not connected, skipping cache delete');
    return;
  }

  try {
    await redisCache.client.del(key);
  } catch (error) {
    logger.error('Cache delete error:', { key, error });
  }
}

async delPattern(pattern: string): Promise<void> {
  if (!redisCache.isConnected()) {
    logger.warn('Redis not connected, skipping cache delete pattern');
    return;
  }

  try {
    const keys = await redisCache.client.keys(pattern);
    if (keys.length > 0) {
      await redisCache.client.del(...keys);
    }
  } catch (error) {
    logger.error('Cache delete pattern error:', { pattern, error });
  }
}
```

### Advanced Cache Patterns

#### Cache Warming

```typescript
// src/lib/cache-warmer.ts
import { db } from './db';
import { cacheManager } from './cache-manager';
import { cacheKeys } from './cache-manager';

export class CacheWarmer {
  static async warmAssetCache(tenantId: string): Promise<void> {
    try {
      // Warm asset statistics cache
      const assetStats = await this.getAssetStats(tenantId);
      await cacheManager.set(
        cacheKeys.assetStats(tenantId),
        assetStats,
        parseInt(process.env.CACHE_TTL_ASSETS || '300', 10)
      );

      // Warm custom fields cache
      const customFields = await db.customField.findMany({
        where: { tenantId }
      });
      
      await cacheManager.set(
        cacheKeys.customFields(tenantId),
        customFields,
        parseInt(process.env.CACHE_TTL_CUSTOM_FIELDS || '600', 10)
      );

      logger.info('Asset cache warmed successfully', { tenantId });
    } catch (error) {
      logger.error('Cache warming error:', { tenantId, error });
    }
  }

  private static async getAssetStats(tenantId: string): Promise<any> {
    // Implementation for getting asset statistics
    const [pcCount, laptopCount, printerCount] = await Promise.all([
      db.pC.count({ where: { tenantId } }),
      db.laptop.count({ where: { tenantId } }),
      db.printer.count({ where: { tenantId } })
    ]);

    return {
      pc: pcCount,
      laptop: laptopCount,
      printer: printerCount
    };
  }
}
```

#### Cache Preloading

```typescript
// src/lib/cache-preloader.ts
export class CachePreloader {
  static async preloadCriticalData(userId: string, tenantId: string): Promise<void> {
    const preloadTasks = [
      // Preload user permissions
      this.preloadPermissions(userId, tenantId),
      
      // Preload frequently accessed assets
      this.preloadAssetLists(tenantId),
      
      // Preload dashboard data
      this.preloadDashboardData(tenantId)
    ];

    try {
      await Promise.all(preloadTasks);
      logger.info('Cache preloading completed', { userId, tenantId });
    } catch (error) {
      logger.error('Cache preloading error:', { userId, tenantId, error });
    }
  }

  private static async preloadPermissions(userId: string, tenantId: string): Promise<void> {
    // Implementation for preloading permissions
  }

  private static async preloadAssetLists(tenantId: string): Promise<void> {
    // Implementation for preloading asset lists
  }

  private static async preloadDashboardData(tenantId: string): Promise<void> {
    // Implementation for preloading dashboard data
  }
}
```

## Cache Invalidation Strategies

### Selective Invalidation

#### Asset-Based Invalidation

```typescript
// src/lib/cache-invalidator.ts
export class CacheInvalidator {
  static async invalidateAssetCache(
    tenantId: string, 
    assetType: string, 
    assetId?: string
  ): Promise<void> {
    try {
      if (assetId) {
        // Invalidate specific asset
        await cacheManager.del(cacheKeys.assetDetail(assetType, tenantId, assetId));
      }

      // Invalidate asset lists for this type
      await cacheManager.delPattern(
        `${process.env.REDIS_PREFIX || 'itams:'}assets:${assetType}:${tenantId}:list:*`
      );

      // Invalidate asset statistics
      await cacheManager.del(cacheKeys.assetStats(tenantId));

      logger.info('Asset cache invalidated', { tenantId, assetType, assetId });
    } catch (error) {
      logger.error('Asset cache invalidation error:', { tenantId, assetType, assetId, error });
    }
  }

  static async invalidateCustomFieldsCache(
    tenantId: string, 
    modelType?: string
  ): Promise<void> {
    try {
      if (modelType) {
        await cacheManager.del(cacheKeys.customFields(tenantId, modelType));
      } else {
        await cacheManager.delPattern(
          `${process.env.REDIS_PREFIX || 'itams:'}custom_fields:${tenantId}*`
        );
      }

      logger.info('Custom fields cache invalidated', { tenantId, modelType });
    } catch (error) {
      logger.error('Custom fields cache invalidation error:', { tenantId, modelType, error });
    }
  }

  static async invalidateUserCache(userId: string, tenantId: string): Promise<void> {
    try {
      await cacheManager.del(cacheKeys.permissions(userId, tenantId));
      
      logger.info('User cache invalidated', { userId, tenantId });
    } catch (error) {
      logger.error('User cache invalidation error:', { userId, tenantId, error });
    }
  }
}
```

### Batch Invalidation

#### Bulk Operations

```typescript
static async invalidateBulkAssetCache(
  tenantId: string,
  operations: Array<{ assetType: string; assetId?: string }>
): Promise<void> {
  try {
    const deleteKeys: string[] = [];
    const patternKeys: string[] = [];

    for (const op of operations) {
      if (op.assetId) {
        // Specific asset invalidation
        deleteKeys.push(cacheKeys.assetDetail(op.assetType, tenantId, op.assetId));
      } else {
        // Asset type invalidation
        patternKeys.push(`${process.env.REDIS_PREFIX || 'itams:'}assets:${op.assetType}:${tenantId}:list:*`);
      }
    }

    // Delete specific keys
    if (deleteKeys.length > 0) {
      const pipeline = redisCache.client.pipeline();
      deleteKeys.forEach(key => pipeline.del(key));
      await pipeline.exec();
    }

    // Delete pattern-based keys
    for (const pattern of patternKeys) {
      await cacheManager.delPattern(pattern);
    }

    logger.info('Bulk asset cache invalidated', { 
      tenantId, 
      operations: operations.length 
    });
  } catch (error) {
    logger.error('Bulk asset cache invalidation error:', { tenantId, error });
  }
}
```

## Performance Optimization

### Memory Management

#### Efficient Data Storage

```typescript
// src/lib/cache-optimizer.ts
export class CacheOptimizer {
  static async optimizeCacheStorage(): Promise<void> {
    try {
      // Get memory info
      const info = await redisCache.client.info('memory');
      logger.info('Redis memory info:', { info });

      // Check memory usage
      const memoryUsage = await redisCache.client.info('memory');
      const usedMemory = this.parseMemoryInfo(memoryUsage);

      if (usedMemory > 0.8 * this.getMaxMemory()) {
        logger.warn('Redis memory usage high, optimizing...');
        await this.cleanupOldCacheEntries();
      }
    } catch (error) {
      logger.error('Cache optimization error:', error);
    }
  }

  private static parseMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private static getMaxMemory(): number {
    // Implementation to get max memory limit
    return 1024 * 1024 * 1024; // 1GB default
  }

  private static async cleanupOldCacheEntries(): Promise<void> {
    // Implementation for cleaning up old entries
    // This could involve TTL-based cleanup or LRU eviction
  }
}
```

### Connection Pooling

#### Optimized Connection Management

```typescript
// src/lib/redis-connection-pool.ts
import Redis from 'ioredis';

class RedisConnectionPool {
  private pool: Redis[];
  private available: Redis[];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.pool = [];
    this.available = [];
    this.maxSize = maxSize;
    
    // Initialize pool
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.maxSize; i++) {
      const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.pool.push(client);
      this.available.push(client);
    }
  }

  async getConnection(): Promise<Redis> {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    // If pool is exhausted, create temporary connection
    if (this.pool.length < this.maxSize * 2) {
      const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.pool.push(client);
      return client;
    }

    throw new Error('Redis connection pool exhausted');
  }

  releaseConnection(client: Redis): void {
    if (this.available.length < this.maxSize) {
      this.available.push(client);
    } else {
      // Close excess connections
      client.quit();
      const index = this.pool.indexOf(client);
      if (index > -1) {
        this.pool.splice(index, 1);
      }
    }
  }
}

export const redisPool = new RedisConnectionPool(
  parseInt(process.env.REDIS_POOL_SIZE || '10', 10)
);
```

## Monitoring and Metrics

### Cache Performance Monitoring

#### Metrics Collection

```typescript
// src/lib/cache-metrics.ts
export class CacheMetrics {
  private static metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    evictions: 0
  };

  static recordHit(): void {
    this.metrics.hits++;
  }

  static recordMiss(): void {
    this.metrics.misses++;
  }

  static recordError(): void {
    this.metrics.errors++;
  }

  static recordEviction(): void {
    this.metrics.evictions++;
  }

  static getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  static getMetrics(): any {
    return {
      ...this.metrics,
      hitRate: this.getHitRate(),
      timestamp: new Date().toISOString()
    };
  }

  static resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      evictions: 0
    };
  }
}
```

#### Performance Monitoring

```typescript
// src/lib/cache-monitor.ts
export class CacheMonitor {
  static async monitorPerformance(): Promise<void> {
    try {
      const info = await redisCache.client.info();
      const metrics = CacheMetrics.getMetrics();
      
      logger.info('Cache performance metrics:', {
        redisInfo: info,
        cacheMetrics: metrics
      });

      // Check for performance issues
      if (metrics.hitRate < 0.7) {
        logger.warn('Low cache hit rate detected', { hitRate: metrics.hitRate });
      }

      if (metrics.errors > 10) {
        logger.error('High cache error rate detected', { errors: metrics.errors });
      }
    } catch (error) {
      logger.error('Cache monitoring error:', error);
    }
  }

  static async getDetailedStats(): Promise<any> {
    try {
      const [
        info,
        dbsize,
        slowlog
      ] = await Promise.all([
        redisCache.client.info(),
        redisCache.client.dbsize(),
        redisCache.client.slowlog('get', 10)
      ]);

      return {
        info,
        dbsize,
        slowlog,
        metrics: CacheMetrics.getMetrics()
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      throw error;
    }
  }
}
```

## Error Handling and Resilience

### Graceful Degradation

#### Fallback Mechanisms

```typescript
// src/lib/cache-fallback.ts
export class CacheFallback {
  static async withCacheFallback<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    try {
      // Try cache first
      const cached = await cacheManager.get<T>(cacheKey);
      if (cached !== null) {
        CacheMetrics.recordHit();
        return cached;
      }

      // Try primary operation
      const result = await operation();
      
      // Cache the result
      await cacheManager.set(cacheKey, result, ttl);
      CacheMetrics.recordMiss();
      
      return result;
    } catch (primaryError) {
      logger.warn('Primary operation failed, trying fallback:', primaryError);
      CacheMetrics.recordError();
      
      try {
        // Try fallback operation
        const fallbackResult = await fallback();
        
        // Cache fallback result
        await cacheManager.set(cacheKey, fallbackResult, ttl);
        
        return fallbackResult;
      } catch (fallbackError) {
        logger.error('Both primary and fallback operations failed:', {
          primaryError,
          fallbackError
        });
        throw fallbackError;
      }
    }
  }
}
```

### Retry Logic

#### Exponential Backoff

```typescript
// src/lib/cache-retry.ts
export class CacheRetry {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          10000
        ) + Math.random() * 1000;

        logger.warn(`Cache operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
```

## Security Considerations

### Data Protection

#### Cache Security

```typescript
// src/lib/cache-security.ts
export class CacheSecurity {
  static async secureSet<T>(
    key: string,
    value: T,
    ttl: number = 300
  ): Promise<void> {
    try {
      // Sanitize key
      const sanitizedKey = this.sanitizeKey(key);
      
      // Encrypt sensitive data if needed
      const processedValue = this.processSensitiveData(value);
      
      await cacheManager.set(sanitizedKey, processedValue, ttl);
    } catch (error) {
      logger.error('Secure cache set error:', { key, error });
      throw error;
    }
  }

  private static sanitizeKey(key: string): string {
    // Remove potentially dangerous characters
    return key.replace(/[^a-zA-Z0-9:_\-\.]/g, '_');
  }

  private static processSensitiveData<T>(data: T): T {
    // Implementation for processing sensitive data
    // This could include encryption or redaction
    return data;
  }

  static async secureGet<T>(key: string): Promise<T | null> {
    try {
      const sanitizedKey = this.sanitizeKey(key);
      const value = await cacheManager.get<T>(sanitizedKey);
      
      if (value === null) {
        return null;
      }
      
      // Decrypt or process sensitive data if needed
      return this.processRetrievedData(value);
    } catch (error) {
      logger.error('Secure cache get error:', { key, error });
      return null;
    }
  }

  private static processRetrievedData<T>(data: T): T {
    // Implementation for processing retrieved data
    return data;
  }
}
```

## Best Practices

### Cache Design Principles

#### Effective Caching

1. **Cache Appropriately Sized Data**
   - Avoid caching very large objects
   - Use pagination for large datasets
   - Compress data when beneficial

2. **Set Appropriate TTL Values**
   - Short TTL for frequently changing data
   - Long TTL for static data
   - Consider business requirements

3. **Use Composite Keys**
   - Include tenant ID for multi-tenancy
   - Add version information for cache invalidation
   - Use descriptive key naming

#### Cache Invalidation

1. **Proactive Invalidation**
   - Invalidate cache when data changes
   - Use event-driven invalidation
   - Implement cache versioning

2. **Pattern-Based Invalidation**
   - Use wildcards for bulk invalidation
   - Group related cache entries
   - Minimize invalidation overhead

### Performance Optimization

#### Memory Efficiency

1. **Data Serialization**
   - Use efficient serialization formats
   - Minimize JSON payload size
   - Consider binary formats for large data

2. **Memory Management**
   - Monitor memory usage regularly
   - Implement eviction policies
   - Use Redis memory optimization features

#### Connection Management

1. **Connection Pooling**
   - Reuse connections efficiently
   - Monitor connection usage
   - Handle connection failures gracefully

2. **Timeout Configuration**
   - Set appropriate timeouts
   - Implement retry logic
   - Monitor connection latency

## Troubleshooting

### Common Issues

#### Connection Problems

1. **Connection Refused**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Check Redis configuration
   redis-cli config get bind
   redis-cli config get port
   
   # Check firewall settings
   sudo ufw status
   ```

2. **Timeout Issues**
   ```bash
   # Check Redis performance
   redis-cli info stats
   redis-cli slowlog get 10
   
   # Monitor system resources
   htop
   iotop
   ```

#### Memory Issues

1. **Memory Exhaustion**
   ```bash
   # Check Redis memory usage
   redis-cli info memory
   
   # Monitor cache hit rate
   redis-cli info stats | grep keyspace
   
   # Check for memory leaks
   redis-cli memory doctor
   ```

2. **Eviction Problems**
   ```bash
   # Check eviction policy
   redis-cli config get maxmemory-policy
   
   # Monitor evicted keys
   redis-cli info stats | grep evicted
   ```

### Diagnostic Commands

#### Redis CLI Commands

```bash
# Basic connectivity
redis-cli ping

# Memory information
redis-cli info memory

# Key space statistics
redis-cli info keyspace

# Slow query log
redis-cli slowlog get 10

# List all keys (use with caution)
redis-cli keys "*"

# Check specific key
redis-cli get "your-key"

# Cache hit/miss statistics
redis-cli info stats

# Configuration
redis-cli config get "*"
```

## Monitoring and Maintenance

### Health Checks

#### Automated Health Monitoring

```typescript
// src/lib/cache-health.ts
export class CacheHealth {
  static async checkHealth(): Promise<boolean> {
    try {
      const result = await redisCache.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  static async getHealthReport(): Promise<any> {
    try {
      const [
        ping,
        info,
        dbsize
      ] = await Promise.all([
        redisCache.client.ping(),
        redisCache.client.info(),
        redisCache.client.dbsize()
      ]);

      return {
        status: ping === 'PONG' ? 'healthy' : 'unhealthy',
        ping,
        info,
        dbsize,
        metrics: CacheMetrics.getMetrics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Cache health report error:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

### Maintenance Tasks

#### Regular Maintenance

```bash
#!/bin/bash
# cache-maintenance.sh

# Check Redis connectivity
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Redis is not responding"
  exit 1
fi

# Check memory usage
MEMORY_USAGE=$(redis-cli info memory | grep used_memory_human | cut -d: -f2)
echo "Current memory usage: $MEMORY_USAGE"

# Check cache hit rate
KEYSPACE_HITS=$(redis-cli info stats | grep keyspace_hits | cut -d: -f2)
KEYSPACE_MISSES=$(redis-cli info stats | grep keyspace_misses | cut -d: -f2)
TOTAL=$((KEYSPACE_HITS + KEYSPACE_MISSES))

if [ $TOTAL -gt 0 ]; then
  HIT_RATE=$(echo "scale=2; $KEYSPACE_HITS * 100 / $TOTAL" | bc)
  echo "Cache hit rate: ${HIT_RATE}%"
fi

# Check for slow queries
SLOW_QUERIES=$(redis-cli slowlog len)
echo "Slow queries in log: $SLOW_QUERIES"

# Clean up slow log
redis-cli slowlog reset
```

## Conclusion

The Redis caching implementation in ITAMS provides a robust, scalable solution for improving application performance and reducing database load. By following the patterns, best practices, and optimization strategies outlined in this guide, organizations can maximize the benefits of caching while maintaining system reliability and data consistency.

Regular monitoring, proper configuration, and adherence to security best practices will ensure that the caching layer continues to provide optimal performance as the system grows and evolves. The multi-layered approach to caching, combined with comprehensive error handling and monitoring, creates a resilient caching infrastructure that supports the demanding requirements of enterprise asset management.