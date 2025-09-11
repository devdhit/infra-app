import logger from '@/lib/logger';

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
};

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    // Only initialize Redis on the server side
    if (typeof window === 'undefined') {
      this.initializeClient();
    }
  }

  /**
   * Initialize the Redis client
   */
  private async initializeClient(): Promise<void> {
    try {
      // Only initialize if Redis is enabled
      if (!process.env.REDIS_URL) {
        logger.info('Redis cache disabled - REDIS_URL not set');
        return;
      }

      logger.info(`Initializing Redis cache with URL: ${process.env.REDIS_URL}`);

      // Dynamic import to avoid bundling Redis client in client-side code
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 20) {
              logger.error('Redis reconnect strategy: Too many retries, giving up');
              return new Error('Redis max retries exceeded');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, ... up to 30 seconds
            return Math.min(retries * 100, 30000);
          }
        }
      }) as unknown as RedisClientType;

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis Client Reconnecting');
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready');
        this.isConnected = true;
      });

      await this.client.connect();
      logger.info('Redis cache initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Ensure Redis connection is established
   */
  private async ensureConnection(): Promise<boolean> {
    // If already connected, return true
    if (this.isConnected && this.client) {
      return true;
    }

    // If already connecting, wait a bit and check again
    if (this.isConnecting) {
      // Wait up to 5 seconds for connection to be established
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.isConnected) {
          return true;
        }
      }
      return false;
    }

    // If not connected and not connecting, try to initialize
    this.isConnecting = true;
    try {
      await this.initializeClient();
      this.isConnecting = false;
      return this.isConnected;
    } catch (error) {
      logger.error('Failed to establish Redis connection:', error);
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
    return this.isConnected && this.client !== null;
  }

  /**
   * Get a value from cache
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
      return null;
    }

    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value === null) {
        logger.debug(`Cache miss for key: ${key}`);
        return null;
      }
      
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
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
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client!.setEx(key, ttl, serializedValue);
      } else {
        await this.client!.set(key, serializedValue);
      }
      logger.debug(`Cache set for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  public async del(key: string): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param pattern - Pattern to match keys (e.g., "assets:*")
   */
  public async delByPattern(pattern: string): Promise<number> {
    // Always return 0 on client side
    if (typeof window !== 'undefined') {
      return 0;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      return 0;
    }

    if (!this.isReady()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        // Fix: spread the keys array as individual arguments
        await this.client!.del(...keys);
        logger.debug(`Cache deleted ${keys.length} keys by pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      logger.error(`Error deleting cache keys by pattern ${pattern}:`, error);
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
   * Clear all cache entries
   */
  public async flushAll(): Promise<boolean> {
    // Always return false on client side
    if (typeof window !== 'undefined') {
      return false;
    }
    
    // Ensure connection before proceeding
    if (!(await this.ensureConnection())) {
      return false;
    }

    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Error flushing all cache:', error);
      return false;
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
    
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis client disconnected');
      } catch (error) {
        logger.error('Error disconnecting Redis client:', error);
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