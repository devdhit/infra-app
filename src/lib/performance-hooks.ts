'use client'

/**
 * Performance Optimization Hooks
 * 
 * This file contains React-specific performance optimization hooks.
 */

import { useEffect, useRef, DependencyList } from 'react';

/**
 * Custom hook for memoizing expensive operations
 * @param callback The expensive operation to memoize
 * @param deps Dependency array
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<T>(callback);
  
  // Create a stable dependency array by combining callback with individual deps
  // This avoids the spread operator in the useEffect dependency array
  const dependencies: any[] = [callback];
  if (deps) {
    for (let i = 0; i < deps.length; i++) {
      dependencies.push(deps[i]);
    }
  }
  
  useEffect(() => {
    ref.current = callback;
  }, dependencies);
  
  return ref.current;
}

/**
 * Check if the browser supports IntersectionObserver for lazy loading
 */
export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}