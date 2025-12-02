import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { typedLogger as logger } from '@/lib/logger';
import { toast } from 'sonner';

/**
 * Enhanced Search Hook
 * 
 * Features:
 * - Debounced search with configurable delay
 * - Client-side result caching
 * - Loading and error states
 * - Search suggestions
 * - Filter options
 * - Pagination support
 */

export interface SearchFilters {
  status?: string;
  dept?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: SearchFilters;
}

export interface SearchResult<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  query: string;
  assetType: string;
}

export interface UseEnhancedSearchOptions {
  debounceMs?: number;
  enableCache?: boolean;
  cacheTimeMs?: number;
  autoSearch?: boolean;
  onSuccess?: (result: SearchResult) => void;
  onError?: (error: Error) => void;
}

// Client-side cache for search results
interface CacheEntry<T> {
  data: SearchResult<T>;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<any>>();

/**
 * Custom hook for enhanced search functionality
 */
export function useEnhancedSearch<T = any>(
  assetType: string,
  options: UseEnhancedSearchOptions = {}
) {
  const {
    debounceMs = 500,
    enableCache = true,
    cacheTimeMs = 60000, // 1 minute
    autoSearch = false,
    onSuccess,
    onError,
  } = options;

  // State management
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    filters: {},
  });

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate cache key for search
   */
  const getCacheKey = useCallback((
    searchQuery: string,
    opts: SearchOptions
  ): string => {
    return `${assetType}:${searchQuery}:${JSON.stringify(opts)}`;
  }, [assetType]);

  /**
   * Get cached result if available and valid
   */
  const getCachedResult = useCallback((
    searchQuery: string,
    opts: SearchOptions
  ): SearchResult<T> | null => {
    if (!enableCache) return null;

    const cacheKey = getCacheKey(searchQuery, opts);
    const cached = searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
      logger.debug('Using cached search results', { 
        component: 'useEnhancedSearch',
        cacheKey 
      });
      return cached.data;
    }

    // Remove stale cache entry
    if (cached) {
      searchCache.delete(cacheKey);
    }

    return null;
  }, [enableCache, cacheTimeMs, getCacheKey]);

  /**
   * Set cache entry
   */
  const setCachedResult = useCallback((
    searchQuery: string,
    opts: SearchOptions,
    data: SearchResult<T>
  ) => {
    if (!enableCache) return;

    const cacheKey = getCacheKey(searchQuery, opts);
    searchCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (keep last 50)
    if (searchCache.size > 50) {
      const oldestKey = Array.from(searchCache.keys())[0];
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }
  }, [enableCache, getCacheKey]);

  /**
   * Execute search API call
   */
  const executeSearch = useCallback(async (
    searchQuery: string,
    opts: SearchOptions = searchOptions
  ): Promise<SearchResult<T> | null> => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults(null);
      return null;
    }

    // Check cache first
    const cached = getCachedResult(searchQuery, opts);
    if (cached) {
      setResults(cached);
      return cached;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: searchQuery,
        page: (opts.page || 1).toString(),
        limit: (opts.limit || 20).toString(),
      });

      if (opts.sortBy) params.append('sortBy', opts.sortBy);
      if (opts.sortOrder) params.append('sortOrder', opts.sortOrder);
      if (opts.filters?.status) params.append('status', opts.filters.status);
      if (opts.filters?.dept) params.append('dept', opts.filters.dept);
      if (opts.filters?.dateFrom) params.append('dateFrom', opts.filters.dateFrom);
      if (opts.filters?.dateTo) params.append('dateTo', opts.filters.dateTo);

      // Add additional filters as JSON
      const additionalFilters = { ...opts.filters };
      delete additionalFilters.status;
      delete additionalFilters.dept;
      delete additionalFilters.dateFrom;
      delete additionalFilters.dateTo;

      if (Object.keys(additionalFilters).length > 0) {
        params.append('filters', JSON.stringify(additionalFilters));
      }

      // Execute API call
      const result = await api.get<SearchResult<T>>(
        `/search/${assetType}?${params.toString()}`
      );

      // Cache the result
      setCachedResult(searchQuery, opts, result);
      setResults(result);

      if (onSuccess) {
        onSuccess(result);
      }

      logger.info('Search completed', {
        component: 'useEnhancedSearch',
        query: searchQuery,
        resultsCount: result.data.length,
        total: result.total,
      });

      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.debug('Search request aborted', { component: 'useEnhancedSearch' });
        return null;
      }

      const error = new Error(err.message || 'Search failed');
      setError(error);

      if (onError) {
        onError(error);
      } else {
        toast.error(`Search failed: ${error.message}`);
      }

      logger.error('Search error', {
        component: 'useEnhancedSearch',
        error: error.message,
      });

      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [assetType, searchOptions, getCachedResult, setCachedResult, onSuccess, onError]);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback((
    searchQuery: string,
    opts: SearchOptions = searchOptions
  ) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Execute immediately for empty queries
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults(null);
      return;
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(searchQuery, opts);
    }, debounceMs);
  }, [debounceMs, executeSearch, searchOptions]);

  /**
   * Update search query
   */
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (autoSearch) {
      debouncedSearch(newQuery, searchOptions);
    }
  }, [autoSearch, debouncedSearch, searchOptions]);

  /**
   * Update search options
   */
  const updateOptions = useCallback((newOptions: Partial<SearchOptions>) => {
    setSearchOptions(prev => {
      const updated = { ...prev, ...newOptions };
      if (autoSearch && query) {
        executeSearch(query, updated);
      }
      return updated;
    });
  }, [autoSearch, query, executeSearch]);

  /**
   * Manually trigger search
   */
  const search = useCallback((
    searchQuery?: string,
    opts?: SearchOptions
  ) => {
    const finalQuery = searchQuery !== undefined ? searchQuery : query;
    const finalOpts = opts || searchOptions;
    return executeSearch(finalQuery, finalOpts);
  }, [query, searchOptions, executeSearch]);

  /**
   * Refresh current search (bypass cache)
   */
  const refetch = useCallback(() => {
    if (!query || query.trim().length === 0) {
      return Promise.resolve(null);
    }

    // Clear ALL cache entries for this asset type (not just current query)
    // This ensures we get fresh data after updates
    const cachesToClear: string[] = [];
    searchCache.forEach((_, key) => {
      if (key.includes(assetType)) {
        cachesToClear.push(key);
      }
    });
    cachesToClear.forEach(key => searchCache.delete(key));

    // Re-execute search
    return executeSearch(query, searchOptions);
  }, [query, searchOptions, executeSearch, assetType]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  /**
   * Fetch search suggestions
   */
  const fetchSuggestions = useCallback(async (prefix?: string) => {
    try {
      const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const result = await api.get<{ suggestions: string[] }>(
        `/search/${assetType}/suggestions${params}`
      );
      setSuggestions(result.suggestions);
      return result.suggestions;
    } catch (err: any) {
      logger.error('Failed to fetch suggestions', {
        component: 'useEnhancedSearch',
        error: err.message,
      });
      return [];
    }
  }, [assetType]);

  /**
   * Fetch filter options
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const result = await api.get<{ filters: Record<string, string[]> }>(
        `/search/${assetType}/filters`
      );
      setFilterOptions(result.filters);
      return result.filters;
    } catch (err: any) {
      logger.error('Failed to fetch filter options', {
        component: 'useEnhancedSearch',
        error: err.message,
      });
      return {};
    }
  }, [assetType]);

  /**
   * Load filter options on mount
   */
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    query,
    results,
    isLoading,
    error,
    suggestions,
    filterOptions,
    searchOptions,

    // Actions
    updateQuery,
    updateOptions,
    search,
    refetch,
    clearSearch,
    fetchSuggestions,
    fetchFilterOptions,
  };
}

export default useEnhancedSearch;
