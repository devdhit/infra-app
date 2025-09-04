"use strict";
/**
 * Performance Monitoring Utilities
 *
 * This file contains utilities for monitoring and logging performance metrics
 * throughout the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.PerformanceMonitor = void 0;
exports.MonitorPerformance = MonitorPerformance;
exports.useRenderPerformance = useRenderPerformance;
// Performance monitoring class
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    // Start timing an operation
    startTiming(operation) {
        const id = `${operation}-${Date.now()}-${Math.random()}`;
        performance.mark(`${id}-start`);
        return id;
    }
    // End timing an operation and log the result
    endTiming(id, operation) {
        performance.mark(`${id}-end`);
        const measure = performance.measure(`${id}-measure`, `${id}-start`, `${id}-end`);
        const duration = measure.duration;
        // Log the timing
        console.log(`[PERFORMANCE] ${operation} took ${duration.toFixed(2)}ms`);
        // Store metric for aggregation
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        this.metrics.get(operation).push(duration);
        // Clean up marks and measures
        performance.clearMarks(`${id}-start`);
        performance.clearMarks(`${id}-end`);
        performance.clearMeasures(`${id}-measure`);
        return duration;
    }
    // Get average timing for an operation
    getAverageTiming(operation) {
        const timings = this.metrics.get(operation);
        if (!timings || timings.length === 0)
            return 0;
        const sum = timings.reduce((acc, timing) => acc + timing, 0);
        return sum / timings.length;
    }
    // Get all metrics
    getMetrics() {
        const result = {};
        for (const [operation, timings] of this.metrics.entries()) {
            if (timings.length > 0) {
                const sum = timings.reduce((acc, timing) => acc + timing, 0);
                const average = sum / timings.length;
                const min = Math.min(...timings);
                const max = Math.max(...timings);
                result[operation] = {
                    count: timings.length,
                    average,
                    min,
                    max
                };
            }
        }
        return result;
    }
    // Clear metrics
    clearMetrics() {
        this.metrics.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Decorator for monitoring method performance
function MonitorPerformance(operationName) {
    return function (descriptor) {
        const originalMethod = descriptor.value;
        const monitor = PerformanceMonitor.getInstance();
        descriptor.value = function (...args) {
            const id = monitor.startTiming(operationName);
            try {
                const result = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    return result.then((res) => {
                        monitor.endTiming(id, operationName);
                        return res;
                    }).catch((error) => {
                        monitor.endTiming(id, operationName);
                        throw error;
                    });
                }
                else {
                    monitor.endTiming(id, operationName);
                    return result;
                }
            }
            catch (error) {
                monitor.endTiming(id, operationName);
                throw error;
            }
        };
        return descriptor;
    };
}
// Hook for monitoring component render performance
function useRenderPerformance(componentName) {
    const monitor = PerformanceMonitor.getInstance();
    const id = monitor.startTiming(`${componentName}-render`);
    // End timing when component unmounts
    // This would typically be implemented with useEffect in a React component
    const endTiming = () => {
        monitor.endTiming(id, `${componentName}-render`);
    };
    return { endTiming };
}
// Global performance monitoring utilities
exports.performanceMonitor = PerformanceMonitor.getInstance();
// Log performance metrics periodically
if (typeof window !== 'undefined') {
    setInterval(() => {
        const metrics = exports.performanceMonitor.getMetrics();
        if (Object.keys(metrics).length > 0) {
            console.log('[PERFORMANCE METRICS]', metrics);
        }
    }, 30000); // Log every 30 seconds
}
