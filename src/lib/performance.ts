// Performance monitoring utilities

// Define memory info interface
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

// Track component render time
export function trackRenderTime(componentName: string, startTime: number) {
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${componentName}] Render time: ${renderTime.toFixed(2)}ms`);
  }
  
  // In production, you might send this to your analytics service
  // Example: analytics.track('component_render_time', { componentName, renderTime });
}

// Track API request time
export function trackApiRequest(url: string, startTime: number) {
  const endTime = performance.now();
  const requestTime = endTime - startTime;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${url} - Request time: ${requestTime.toFixed(2)}ms`);
  }
  
  // In production, you might send this to your analytics service
  // Example: analytics.track('api_request_time', { url, requestTime });
}

// Track database query time
export function trackDbQuery(query: string, startTime: number) {
  const endTime = performance.now();
  const queryTime = endTime - startTime;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${query} - Query time: ${queryTime.toFixed(2)}ms`);
  }
  
  // In production, you might send this to your analytics service
  // Example: analytics.track('db_query_time', { query, queryTime });
}

// Memory usage tracking (browser only)
export function trackMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    // Cast performance to access memory property which is not standard
    const memory = (performance as any).memory as MemoryInfo;
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Memory] Used: ${usedMB}MB, Total: ${totalMB}MB, Limit: ${limitMB}MB`);
      }
      
      // In production, you might send this to your analytics service
      // Example: analytics.track('memory_usage', { usedMB, totalMB, limitMB });
    }
  }
}

// Track page load time
export function trackPageLoad() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Page Load] Time: ${loadTime.toFixed(2)}ms`);
          }
          
          // In production, you might send this to your analytics service
          // Example: analytics.track('page_load_time', { loadTime });
        }
      }, 0);
    });
  }
}

// Track user interactions
export function trackUserInteraction(action: string, label?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[User Interaction] ${action}${label ? `: ${label}` : ''}`);
  }
  
  // In production, you might send this to your analytics service
  // Example: analytics.track('user_interaction', { action, label });
}