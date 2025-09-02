/**
 * Navigation Performance Monitoring
 * 
 * This file contains utilities for monitoring and optimizing navigation performance.
 */

// Performance monitoring for navigation transitions
export class NavigationPerformanceMonitor {
  private static instance: NavigationPerformanceMonitor;
  private navigationStart: number | null = null;
  private navigationEnd: number | null = null;

  private constructor() {}

  static getInstance(): NavigationPerformanceMonitor {
    if (!NavigationPerformanceMonitor.instance) {
      NavigationPerformanceMonitor.instance = new NavigationPerformanceMonitor();
    }
    return NavigationPerformanceMonitor.instance;
  }

  // Start timing a navigation
  startNavigation(): void {
    this.navigationStart = performance.now();
    console.log('[NAVIGATION] Navigation started');
  }

  // End timing a navigation and log the result
  endNavigation(navigationPath: string): number | null {
    if (!this.navigationStart) {
      console.warn('[NAVIGATION] Navigation timing not started');
      return null;
    }

    this.navigationEnd = performance.now();
    const duration = this.navigationEnd - this.navigationStart;
    
    console.log(`[NAVIGATION] Navigation to ${navigationPath} took ${duration.toFixed(2)}ms`);
    
    // Reset timing for next navigation
    this.navigationStart = null;
    this.navigationEnd = null;
    
    return duration;
  }

  // Check if navigation is taking too long
  isNavigationSlow(threshold: number = 1000): boolean {
    if (!this.navigationStart) return false;
    
    const currentTime = performance.now();
    const duration = currentTime - this.navigationStart;
    
    return duration > threshold;
  }
}

// Hook for monitoring navigation performance in components
export function useNavigationPerformance() {
  const monitor = NavigationPerformanceMonitor.getInstance();
  
  const startNavigation = () => {
    monitor.startNavigation();
  };
  
  const endNavigation = (path: string) => {
    return monitor.endNavigation(path);
  };
  
  const isNavigationSlow = (threshold?: number) => {
    return monitor.isNavigationSlow(threshold);
  };
  
  return { startNavigation, endNavigation, isNavigationSlow };
}

// Global navigation performance monitor
export const navigationMonitor = NavigationPerformanceMonitor.getInstance();