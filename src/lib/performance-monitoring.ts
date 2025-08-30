/**
 * Performance Monitoring Utilities
 * 
 * This file contains utilities for monitoring and logging performance metrics
 * throughout the application.
 */

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTiming(operation: string): string {
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    performance.mark(`${id}-start`);
    return id;
  }

  // End timing an operation and log the result
  endTiming(id: string, operation: string): number {
    performance.mark(`${id}-end`);
    const measure = performance.measure(`${id}-measure`, `${id}-start`, `${id}-end`);
    const duration = measure.duration;
    
    // Log the timing
    console.log(`[PERFORMANCE] ${operation} took ${duration.toFixed(2)}ms`);
    
    // Store metric for aggregation
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    
    // Clean up marks and measures
    performance.clearMarks(`${id}-start`);
    performance.clearMarks(`${id}-end`);
    performance.clearMeasures(`${id}-measure`);
    
    return duration;
  }

  // Get average timing for an operation
  getAverageTiming(operation: string): number {
    const timings = this.metrics.get(operation);
    if (!timings || timings.length === 0) return 0;
    
    const sum = timings.reduce((acc, timing) => acc + timing, 0);
    return sum / timings.length;
  }

  // Get all metrics
  getMetrics(): Record<string, { count: number; average: number; min: number; max: number }> {
    const result: Record<string, { count: number; average: number; min: number; max: number }> = {};
    
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
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Decorator for monitoring method performance
export function MonitorPerformance(operationName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();
    
    descriptor.value = function(...args: any[]) {
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
        } else {
          monitor.endTiming(id, operationName);
          return result;
        }
      } catch (error) {
        monitor.endTiming(id, operationName);
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string) {
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
export const performanceMonitor = PerformanceMonitor.getInstance();

// Log performance metrics periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    if (Object.keys(metrics).length > 0) {
      console.log('[PERFORMANCE METRICS]', metrics);
    }
  }, 30000); // Log every 30 seconds
}