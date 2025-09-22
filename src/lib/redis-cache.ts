import logger, { LogData } from '@/lib/logger';

// Define cache key prefixes for different types of data
export const CACHE_PREFIXES = {
  ASSETS: 'assets',
  ASSET_LIST: 'asset_list',
  PERMISSIONS: 'permissions',
  CUSTOM_FIELDS: 'custom_fields',
  SEARCH: 'search'
} as const;

// Define cache TTL values (in seconds)
export const CACHE_TTL = {
  ASSETS: 300, // 5 minutes
  ASSET_LIST: 120, // 2 minutes
  PERMISSIONS: 300, // 5 minutes
  CUSTOM_FIELDS: 600, // 10 minutes
  SEARCH: 60 // 1 minute
} as const;

// Type definition for the Redis client (without importing it directly)
type RedisClientType = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string>;
  setEx: (key: string, ttl: number, value: string) => Promise<string>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  flushAll: () => Promise<string>;
  connect: () => Promise<void>;
  quit: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  ping: () => Promise<string>;
  isOpen: boolean;
};

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private retryDelay = 1000; // 1 second initial delay
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck = 0;
  private healthCheckThreshold = 30000; // 30 seconds

  constructor() {
    // Only initialize Redis on the server side
    if (typeof window === 'undefined') {
      this.initializeClient();
    }
  }

  /**
   * Initialize the Redis client with enhanced error handling and retry mechanism
   */
  private async initializeClient(): Promise<void> {
    const context: LogData = { component: 'redis-cache' };
    
    try {
      // Only initialize if Redis is enabled
      if (!process.env.REDIS_URL) {
        logger.info('Redis cache disabled - REDIS_URL not set', context);
        return;
      }

      logger.info(`Initializing Redis cache with URL: ${process.env.REDIS_URL}`, context);

      // Dynamic import to avoid bundling Redis client in client-side code
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 20) {
              logger.error('Redis reconnect strategy: Too many retries, giving up', context);
              return new Error('Redis max retries exceeded');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, ... up to 30 seconds
            return Math.min(retries * 100, 30000);
          },
          connectTimeout: 10000, // 10 second connection timeout
        },
        // Add performance optimizations
        disableOfflineQueue: true, // Disable offline queue to prevent memory issues
      }) as unknown as RedisClientType;

      this.client.on('error', (err: any) => {
        logger.error('Redis Client Error', { 
          ...context, 
          error: err.message, 
          stack: err.stack 
        });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected', context);
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset connection attempts on successful connection
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis Client Reconnecting', context);
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready', context);
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset connection attempts on successful connection
        // Start health check interval when client is ready
        this.startHealthCheckInterval();
      });

      await this.client.connect();
      logger.info('Redis cache initialized successfully', context);
    } catch (error: any) {
      logger.error('Failed to initialize Redis cache', { 
        ...context, 
        error: error.message, 
        stack: error.stack 
      });
      this.isConnected = false;
      
      // Implement retry mechanism with exponential backoff
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        const delay = Math.min(this.retryDelay * Math.pow(2, this.connectionAttempts - 1), 30000); // Max 30 seconds
        logger.info(`Retrying Redis connection in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`, context);
        setTimeout(() => {
          this.initializeClient();
        }, delay);
      } else {
        logger.error('Max Redis connection attempts reached. Giving up.', context);
      }
    }
  }

  /**
   * Start periodic health check interval
   */
  private startHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckThreshold);
  }

  /**
   * Perform a health check on the Redis connection
   */
  private async performHealthCheck(): Promise<boolean> {
    const context: LogData = { component: 'redis-cache' };
    
    // Skip if not connected or no client
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const pingResult = await this.client.ping();
      this.lastHealthCheck = Date.now();
      logger.debug('Redis connection health check passed', { 
        ...context, 
        pingResult 
      });
      return true;
    } catch (error: any) {
      logger.warn('Redis connection health check failed', { 
        ...context, 
        error: error.message,
        stack: error.stack
      });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Ensure Redis connection is established with health check
   */
  private async ensureConnection(): Promise<boolean> {
    const context: LogData = { component: 'redis-cache' };
    
    // If already connected, perform a health check if enough time has passed
    if (this.isConnected && this.client) {
      const now = Date.now();
      // Only perform health check if enough time has passed since last check
      if (now - this.lastHealthCheck > this.healthCheckThreshold) {
        try {
          // Perform a simple ping to check if the connection is still alive
          const pingResult = await this.client.ping();
          this.lastHealthCheck = now;
          logger.debug('Redis connection health check passed', { 
            ...context, 
            pingResult 
          });
          return true;
        } catch (error: any) {
          logger.warn('Redis connection health check failed', { 
            ...context, 
            error: error.message,
            stack: error.stack
          });
          this.isConnected = false;
        }
      } else {
        // Connection is recent enough, assume it's still good
        return true;
      }
    }

    // If already connecting, wait a bit and check again
    if (this.isConnecting) {
      logger.debug('Redis client is already connecting, waiting...', context);
      // Wait up to 5 seconds for connection to be established
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.isConnected) {
          logger.debug('Redis connection established while waiting', context);
          return true;
        }
      }
      logger.warn('Redis connection timeout while waiting', context);
      return false;
    }

    // If not connected and not connecting, try to initialize
    logger.info('Attempting to initialize Redis connection', context);
    this.isConnecting = true;
    try {
      await this.initializeClient();
      this.isConnecting = false;
      const result = this.isConnected;
      logger.info(`Redis connection initialization ${result ? 'successful' : 'failed'}`, context);
      return result;
    } catch (error: any) {
      logger.error('Failed to establish Redis connection', { 
        ...context, 
        error: error.message, 
        stack: error.stack 
      });
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Check if Redis is connected and ready
   */
  public isReady(): boolean {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    return this.isConnected && this.client !== null && this.client.isOpen;
  }

  /**
   * Get a value from cache with enhanced error handling
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  public async get<T>(key: string): Promise<T | null> {
    // Always return null on client side
    if (typeof window !== 'undefined') {
      return null;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to get cache key ${key}: Redis not connected`);
      return null;
    }

    if (!this.isReady()) {
      logger.warn(`Unable to get cache key ${key}: Redis not ready`);
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value === null) {
        logger.debug(`Cache miss for key: ${key}`, { component: 'redis-cache' });
        return null;
      }
      
      logger.debug(`Cache hit for key: ${key}`, { component: 'redis-cache' });
      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error(`Error getting cache key ${key}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Set a value in cache with enhanced error handling
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to set cache key ${key}: Redis not connected`);
      return false;
    }

    if (!this.isReady()) {
      logger.warn(`Unable to set cache key ${key}: Redis not ready`);
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client!.setEx(key, ttl, serializedValue);
      } else {
        await this.client!.set(key, serializedValue);
      }
      logger.debug(`Cache set for key: ${key}`, { component: 'redis-cache' });
      return true;
    } catch (error: any) {
      logger.error(`Error setting cache key ${key}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Update cache immediately with new data
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  public async update<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to update cache key ${key}: Redis not connected`);
      return false;
    }

    if (!this.isReady()) {
      logger.warn(`Unable to update cache key ${key}: Redis not ready`);
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client!.setEx(key, ttl, serializedValue);
      } else {
        await this.client!.set(key, serializedValue);
      }
      logger.debug(`Cache updated for key: ${key}`, { component: 'redis-cache' });
      return true;
    } catch (error: any) {
      logger.error(`Error updating cache key ${key}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Delete a value from cache with enhanced error handling
   * @param key - Cache key
   */
  public async del(key: string): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to delete cache key ${key}: Redis not connected`);
      return false;
    }

    if (!this.isReady()) {
      logger.warn(`Unable to delete cache key ${key}: Redis not ready`);
      return false;
    }

    try {
      await this.client!.del(key);
      logger.debug(`Cache deleted for key: ${key}`, { component: 'redis-cache' });
      return true;
    } catch (error: any) {
      logger.error(`Error deleting cache key ${key}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern with enhanced error handling
   * @param pattern - Pattern to match keys (e.g., "assets:*")
   */
  public async delByPattern(pattern: string): Promise<number> {
    // Always return 0 on client side
    if (typeof window !== 'undefined') {
      return 0;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to delete cache keys by pattern ${pattern}: Redis not connected`);
      return 0;
    }

    if (!this.isReady()) {
      logger.warn(`Unable to delete cache keys by pattern ${pattern}: Redis not ready`);
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        // Delete keys individually to avoid issues with batch deletion
        let totalDeleted = 0;
        for (const key of keys) {
          const deleted = await this.client!.del(key);
          totalDeleted += deleted;
          if (deleted > 0) {
            logger.debug(`Cache deleted key by pattern: ${pattern}`, { 
              component: 'redis-cache',
              key
            });
          }
        }
        
        logger.debug(`Cache deleted ${totalDeleted} total keys by pattern: ${pattern}`, { component: 'redis-cache' });
        return totalDeleted;
      }
      return 0;
    } catch (error: any) {
      logger.error(`Error deleting cache keys by pattern ${pattern}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return 0;
    }
  }

  /**
   * Create a namespaced cache key
   * @param prefix - Key prefix
   * @param identifiers - Additional identifiers to include in the key
   */
  public createKey(prefix: string, ...identifiers: (string | number)[]): string {
    return [prefix, ...identifiers.map(String)].join(':');
  }

  /**
   * Clear all cache entries with enhanced error handling
   */
  public async flushAll(): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn('Unable to flush cache: Redis not connected');
      return false;
    }

    if (!this.isReady()) {
      logger.warn('Unable to flush cache: Redis not ready');
      return false;
    }

    try {
      await this.client!.flushAll();
      logger.info('Cache flushed successfully', { component: 'redis-cache' });
      return true;
    } catch (error: any) {
      logger.error('Error flushing all cache', { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Warm up cache with multiple key-value pairs efficiently
   * @param entries - Array of key-value pairs to cache
   * @param ttl - Time to live in seconds (optional)
   */
  public async warmUp(entries: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn('Unable to warm up cache: Redis not connected');
      return false;
    }

    if (!this.isReady()) {
      logger.warn('Unable to warm up cache: Redis not ready');
      return false;
    }

    try {
      // Process entries in batches to avoid overwhelming Redis
      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const promises = batch.map(entry => {
          const serializedValue = JSON.stringify(entry.value);
          if (entry.ttl) {
            return this.client!.setEx(entry.key, entry.ttl, serializedValue);
          } else {
            return this.client!.set(entry.key, serializedValue);
          }
        });
        
        await Promise.all(promises);
      }
      
      logger.info(`Cache warmed up with ${entries.length} entries`, { component: 'redis-cache' });
      return true;
    } catch (error: any) {
      logger.error('Error warming up cache', { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get multiple values from cache efficiently
   * @param keys - Array of cache keys
   * @returns Array of cached values in the same order as keys
   */
  public async getMulti<T>(keys: string[]): Promise<(T | null)[]> {
    // Always return null array on client side
    if (typeof window !== 'undefined') {
      return keys.map(() => null);
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn('Unable to get multiple cache keys: Redis not connected');
      return keys.map(() => null);
    }

    if (!this.isReady()) {
      logger.warn('Unable to get multiple cache keys: Redis not ready');
      return keys.map(() => null);
    }

    try {
      // Use Promise.all for parallel execution
      const results = await Promise.all(keys.map(key => this.client!.get(key)));
      
      return results.map(result => {
        if (result === null) return null;
        try {
          return JSON.parse(result) as T;
        } catch (parseError) {
          logger.error('Error parsing cached value', { 
            component: 'redis-cache', 
            error: (parseError as Error).message 
          });
          return null;
        }
      });
    } catch (error: any) {
      logger.error('Error getting multiple cache keys', { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return keys.map(() => null);
    }
  }

  /**
   * Get keys matching a pattern (for testing purposes)
   * @param pattern - Pattern to match keys
   */
  public async keys(pattern: string): Promise<string[]> {
    // Always return empty array on client side
    if (typeof window !== 'undefined') {
      return [];
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      logger.warn(`Unable to get keys by pattern ${pattern}: Redis not connected`);
      return [];
    }

    if (!this.isReady()) {
      logger.warn(`Unable to get keys by pattern ${pattern}: Redis not ready`);
      return [];
    }

    try {
      const keys = await this.client!.keys(pattern);
      logger.debug(`Found ${keys.length} keys matching pattern: ${pattern}`, { component: 'redis-cache' });
      return keys;
    } catch (error: any) {
      logger.error(`Error getting keys by pattern ${pattern}`, { 
        component: 'redis-cache', 
        error: error.message, 
        stack: error.stack 
      });
      // Try to reconnect on error
      this.isConnected = false;
      return [];
    }
  }

  /**
   * Gracefully disconnect the Redis client
   */
  public async disconnect(): Promise<void> {
    // Do nothing on client side
    if (typeof window !== 'undefined') {
      return;
    }
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis client disconnected', { component: 'redis-cache' });
      } catch (error: any) {
        logger.error('Error disconnecting Redis client', { 
          component: 'redis-cache', 
          error: error.message, 
          stack: error.stack 
        });
      }
    }
  }
}

// Create a singleton instance
const redisCache = new RedisCache();

// Handle graceful shutdown only on server side
if (typeof process !== 'undefined' && typeof window === 'undefined') {
  const shutdownHandler = async () => {
    await redisCache.disconnect();
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
}

export default redisCache;