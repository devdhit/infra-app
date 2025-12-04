'use client';

import React from 'react';
import { Loader2, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchResults Component
 * 
 * Features:
 * - Display search results with custom renderer
 * - Loading state
 * - Empty state
 * - Error state
 * - Result count display
 */

export interface SearchResultsProps<T = any> {
  results: T[] | null;
  total?: number;
  query?: string;
  isLoading?: boolean;
  error?: Error | null;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function SearchResults<T = any>({
  results,
  total,
  query,
  isLoading = false,
  error = null,
  renderItem,
  renderEmpty,
  renderError,
  className,
  itemClassName,
}: SearchResultsProps<T>) {
  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    if (renderError) {
      return <div className={className}>{renderError(error)}</div>;
    }

    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Search Error</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message || 'An error occurred while searching'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render empty state (no results or no query)
   */
  if (!results || results.length === 0) {
    if (renderEmpty) {
      return <div className={className}>{renderEmpty()}</div>;
    }

    // Default empty state
    if (!query || query.trim().length === 0) {
      return (
        <div className={cn('flex items-center justify-center py-12', className)}>
          <div className="flex flex-col items-center gap-2 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium">No search query</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter a search term to find results
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-medium">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {query && (
                <>
                  No results found for &quot;<strong>{query}</strong>&quot;
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search terms or filters
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render results
   */
  return (
    <div className={cn('space-y-2', className)}>
      {/* Results count */}
      {total !== undefined && query && (
        <div className="text-sm text-muted-foreground">
          Found {total} result{total !== 1 ? 's' : ''} for &quot;<strong>{query}</strong>&quot;
        </div>
      )}

      {/* Results list */}
      <div className="space-y-1">
        {results.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
