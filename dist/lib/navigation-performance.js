"use strict";
/**
 * Navigation Performance Monitoring
 *
 * This file contains utilities for monitoring and optimizing navigation performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationMonitor = exports.NavigationPerformanceMonitor = void 0;
exports.useNavigationPerformance = useNavigationPerformance;
// Performance monitoring for navigation transitions
class NavigationPerformanceMonitor {
    constructor() {
        this.navigationStart = null;
        this.navigationEnd = null;
    }
    static getInstance() {
        if (!NavigationPerformanceMonitor.instance) {
            NavigationPerformanceMonitor.instance = new NavigationPerformanceMonitor();
        }
        return NavigationPerformanceMonitor.instance;
    }
    // Start timing a navigation
    startNavigation() {
        this.navigationStart = performance.now();
        console.log('[NAVIGATION] Navigation started');
    }
    // End timing a navigation and log the result
    endNavigation(navigationPath) {
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
    isNavigationSlow(threshold = 1000) {
        if (!this.navigationStart)
            return false;
        const currentTime = performance.now();
        const duration = currentTime - this.navigationStart;
        return duration > threshold;
    }
}
exports.NavigationPerformanceMonitor = NavigationPerformanceMonitor;
// Hook for monitoring navigation performance in components
function useNavigationPerformance() {
    const monitor = NavigationPerformanceMonitor.getInstance();
    const startNavigation = () => {
        monitor.startNavigation();
    };
    const endNavigation = (path) => {
        return monitor.endNavigation(path);
    };
    const isNavigationSlow = (threshold) => {
        return monitor.isNavigationSlow(threshold);
    };
    return { startNavigation, endNavigation, isNavigationSlow };
}
// Global navigation performance monitor
exports.navigationMonitor = NavigationPerformanceMonitor.getInstance();
