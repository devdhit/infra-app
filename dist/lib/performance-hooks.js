"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMemoizedCallback = useMemoizedCallback;
exports.supportsIntersectionObserver = supportsIntersectionObserver;
/**
 * Performance Optimization Hooks
 *
 * This file contains React-specific performance optimization hooks.
 */
const react_1 = require("react");
/**
 * Custom hook for memoizing expensive operations
 * @param callback The expensive operation to memoize
 * @param deps Dependency array
 */
function useMemoizedCallback(callback, deps) {
    // Use useCallback to memoize the callback with proper dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return (0, react_1.useCallback)(callback, deps || []);
}
/**
 * Check if the browser supports IntersectionObserver for lazy loading
 */
function supportsIntersectionObserver() {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}
