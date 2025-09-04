"use strict";
/**
 * Performance Optimization Utilities
 *
 * This file contains utility functions to help optimize performance across the application.
 * Note: This file should NOT contain React hooks. See performance-hooks.ts for React-specific utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.debounce = debounce;
exports.throttle = throttle;
exports.processArrayInChunks = processArrayInChunks;
exports.calculateOptimalBatchSize = calculateOptimalBatchSize;
exports.measureExecutionTime = measureExecutionTime;
/**
 * Type-safe debounce function
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 */
function debounce(func, wait) {
    let timeout = null;
    return function (...args) {
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
function throttle(func, limit) {
    let inThrottle = false;
    return function (...args) {
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
async function processArrayInChunks(array, chunkSize, processor) {
    const results = [];
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
function calculateOptimalBatchSize(itemCount, complexity) {
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
async function measureExecutionTime(fn, label) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label} execution time: ${Math.round(end - start)}ms`);
    return result;
}
/**
 * Cache manager for optimizing repeated operations
 */
class CacheManager {
    constructor(ttlInMs = 5 * 60 * 1000) {
        this.cache = new Map();
        this.ttl = ttlInMs;
    }
    get(key) {
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
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    invalidate(key) {
        this.cache.delete(key);
    }
    invalidateAll() {
        this.cache.clear();
    }
}
exports.CacheManager = CacheManager;
