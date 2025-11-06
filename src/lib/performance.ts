/**
 * Performance Optimization Utilities
 * 
 * This file contains utility functions to help optimize performance across the application.
 * Note: This file should NOT contain React hooks. See performance-hooks.ts for React-specific utilities.
 */

import logger from "./logger";

/**
 * Type-safe debounce function
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Type-safe throttle function
 * @param func The function to throttle
 * @param limit Limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Optimize large array operations by processing in chunks
 * @param array The array to process
 * @param chunkSize Size of each processing chunk
 * @param processor Function to process each chunk
 */
export async function processArrayInChunks<T, R>(
  array: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Calculate optimal batch size based on item complexity and estimated processing time
 * @param itemCount Number of items to process
 * @param complexity Complexity factor (1-10, where 10 is most complex)
 */
export function calculateOptimalBatchSize(itemCount: number, complexity: number): number {
  // Base batch size for average complexity
  const baseBatchSize = 500;
  
  // Adjust for complexity (1-10 scale)
  const complexityFactor = Math.max(1, Math.min(10, complexity));
  const adjustedBatchSize = Math.floor(baseBatchSize / (complexityFactor / 2));
  
  // Adjust for very small datasets
  if (itemCount < 100) {
    return itemCount;
  }
  
  return Math.min(adjustedBatchSize, itemCount);
}

/**
 * Measure the execution time of a function
 * @param fn Function to measure
 * @param label Label for console output
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  logger.debug(`${label} execution time: ${Math.round(end - start)}ms`);
  
  return result;
}

/**
 * Cache manager for optimizing repeated operations
 */
export class CacheManager<K, V> {
  private cache = new Map<K, { value: V, timestamp: number }>();
  private ttl: number;
  
  constructor(ttlInMs: number = 5 * 60 * 1000) {
    this.ttl = ttlInMs;
  }
  
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  invalidate(key: K): void {
    this.cache.delete(key);
  }
  
  invalidateAll(): void {
    this.cache.clear();
  }
}