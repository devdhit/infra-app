'use client'

/**
 * Performance Optimization Hooks
 * 
 * This file contains React-specific performance optimization hooks.
 */

import { useCallback, DependencyList } from 'react';

/**
 * Custom hook for memoizing expensive operations
 * @param callback The expensive operation to memoize
 * @param deps Dependency array
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps?: DependencyList
): T {
  // Use useCallback to memoize the callback with proper dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps || []);
}

/**
 * Check if the browser supports IntersectionObserver for lazy loading
 */
export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}