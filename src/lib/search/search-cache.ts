import redisCache, { CACHE_PREFIXES, CACHE_TTL } from '../redis-cache';
import logger, { LogData } from '../logger';

/**
 * Search Cache Manager - Specialized caching for search operations
 */

export interface SearchCacheEntry {
  query: string;
  results: any[];
  total: number;
  filters?: Record<string, any>;
  timestamp: number;
}

export interface SearchSuggestion {
  term: string;
  count: number;
  lastUsed: number;
}

class SearchCacheManager {
  private readonly SEARCH_CACHE_TTL = CACHE_TTL.SEARCH; // 1 minute
  private readonly SUGGESTION_CACHE_TTL = 3600; // 1 hour
  private readonly HISTORY_CACHE_TTL = 86400; // 24 hours
  private readonly MAX_SUGGESTIONS = 10;
  private readonly MAX_HISTORY_ITEMS = 50;

  /**
   * Generate cache key for search results
   */
  private getSearchCacheKey(
    tenantId: string,
    assetType: string,
    query: string,
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 20
  ): string {
    const filterStr = filters ? JSON.stringify(filters) : 'no-filters';
    return redisCache.createKey(
      CACHE_PREFIXES.SEARCH,
      'results',
      tenantId,
      assetType,
      query,
      filterStr,
      page,
      limit
    );
  }

  /**
   * Generate cache key for search suggestions
   */
  private getSuggestionCacheKey(tenantId: string, assetType: string): string {
    return redisCache.createKey(
      CACHE_PREFIXES.SEARCH,
      'suggestions',
      tenantId,
      assetType
    );
  }

  /**
   * Generate cache key for search history
   */
  private getHistoryCacheKey(tenantId: string, userId: string, assetType: string): string {
    return redisCache.createKey(
      CACHE_PREFIXES.SEARCH,
      'history',
      tenantId,
      userId,
      assetType
    );
  }

  /**
   * Get cached search results
   */
  async getCachedSearch(
    tenantId: string,
    assetType: string,
    query: string,
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchCacheEntry | null> {
    const key = this.getSearchCacheKey(tenantId, assetType, query, filters, page, limit);
    const context: LogData = { component: 'search-cache', action: 'get-cached-search' };
    
    try {
      const cached = await redisCache.get<SearchCacheEntry>(key);
      if (cached) {
        logger.debug(`Search cache HIT for query: ${query}`, context);
      } else {
        logger.debug(`Search cache MISS for query: ${query}`, context);
      }
      return cached;
    } catch (error: any) {
      logger.error('Error getting cached search', { 
        ...context, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    tenantId: string,
    assetType: string,
    query: string,
    results: any[],
    total: number,
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 20
  ): Promise<boolean> {
    const key = this.getSearchCacheKey(tenantId, assetType, query, filters, page, limit);
    const context: LogData = { component: 'search-cache', action: 'cache-results' };
    
    const cacheEntry: SearchCacheEntry = {
      query,
      results,
      total,
      filters,
      timestamp: Date.now()
    };

    try {
      await redisCache.set(key, cacheEntry, this.SEARCH_CACHE_TTL);
      logger.debug(`Cached search results for query: ${query}`, context);
      return true;
    } catch (error: any) {
      logger.error('Error caching search results', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(
    tenantId: string,
    assetType: string
  ): Promise<SearchSuggestion[]> {
    const key = this.getSuggestionCacheKey(tenantId, assetType);
    const context: LogData = { component: 'search-cache', action: 'get-suggestions' };
    
    try {
      const suggestions = await redisCache.get<SearchSuggestion[]>(key);
      return suggestions || [];
    } catch (error: any) {
      logger.error('Error getting search suggestions', { 
        ...context, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Update search suggestions
   */
  async updateSearchSuggestions(
    tenantId: string,
    assetType: string,
    term: string
  ): Promise<boolean> {
    const key = this.getSuggestionCacheKey(tenantId, assetType);
    const context: LogData = { component: 'search-cache', action: 'update-suggestions' };
    
    try {
      // Get current suggestions
      const suggestions = await this.getSearchSuggestions(tenantId, assetType);
      
      // Find existing suggestion or create new one
      const existingIndex = suggestions.findIndex(s => s.term.toLowerCase() === term.toLowerCase());
      
      if (existingIndex >= 0) {
        // Update existing suggestion
        const existing = suggestions[existingIndex];
        if (existing) {
          existing.count++;
          existing.lastUsed = Date.now();
        }
      } else {
        // Add new suggestion
        suggestions.push({
          term,
          count: 1,
          lastUsed: Date.now()
        });
      }

      // Sort by count and last used, keep top MAX_SUGGESTIONS
      const sortedSuggestions = suggestions
        .sort((a, b) => {
          if (b.count === a.count) {
            return b.lastUsed - a.lastUsed;
          }
          return b.count - a.count;
        })
        .slice(0, this.MAX_SUGGESTIONS);

      // Cache updated suggestions
      await redisCache.set(key, sortedSuggestions, this.SUGGESTION_CACHE_TTL);
      logger.debug(`Updated search suggestions for term: ${term}`, context);
      return true;
    } catch (error: any) {
      logger.error('Error updating search suggestions', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(
    tenantId: string,
    userId: string,
    assetType: string
  ): Promise<string[]> {
    const key = this.getHistoryCacheKey(tenantId, userId, assetType);
    const context: LogData = { component: 'search-cache', action: 'get-history' };
    
    try {
      const history = await redisCache.get<string[]>(key);
      return history || [];
    } catch (error: any) {
      logger.error('Error getting search history', { 
        ...context, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Add search query to history (only complete searches with 3+ chars)
   */
  async addToSearchHistory(
    tenantId: string,
    userId: string,
    assetType: string,
    query: string
  ): Promise<boolean> {
    // Only save complete searches (3+ characters)
    if (!query || query.trim().length < 3) {
      return false;
    }

    const key = this.getHistoryCacheKey(tenantId, userId, assetType);
    const context: LogData = { component: 'search-cache', action: 'add-to-history' };
    
    try {
      // Get current history
      const history = await this.getSearchHistory(tenantId, userId, assetType);
      
      // Remove duplicates and add new query at the beginning
      const updatedHistory = [
        query.trim(),
        ...history.filter(h => h !== query.trim())
      ].slice(0, this.MAX_HISTORY_ITEMS);

      // Cache updated history
      await redisCache.set(key, updatedHistory, this.HISTORY_CACHE_TTL);
      logger.debug(`Added query to search history: ${query}`, context);
      return true;
    } catch (error: any) {
      logger.error('Error adding to search history', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Remove specific search term from history
   */
  async removeFromSearchHistory(
    tenantId: string,
    userId: string,
    assetType: string,
    query: string
  ): Promise<boolean> {
    const key = this.getHistoryCacheKey(tenantId, userId, assetType);
    const context: LogData = { component: 'search-cache', action: 'remove-from-history' };
    
    try {
      // Get current history
      const history = await this.getSearchHistory(tenantId, userId, assetType);
      
      // Remove the specific query
      const updatedHistory = history.filter(h => h !== query);

      // Cache updated history
      await redisCache.set(key, updatedHistory, this.HISTORY_CACHE_TTL);
      logger.debug(`Removed query from search history: ${query}`, context);
      return true;
    } catch (error: any) {
      logger.error('Error removing from search history', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(
    tenantId: string,
    userId: string,
    assetType: string
  ): Promise<boolean> {
    const key = this.getHistoryCacheKey(tenantId, userId, assetType);
    const context: LogData = { component: 'search-cache', action: 'clear-history' };
    
    try {
      await redisCache.del(key);
      logger.debug('Cleared search history', context);
      return true;
    } catch (error: any) {
      logger.error('Error clearing search history', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Invalidate all search caches for an asset type
   */
  async invalidateSearchCache(tenantId: string, assetType: string): Promise<boolean> {
    const context: LogData = { component: 'search-cache', action: 'invalidate' };
    
    try {
      const pattern = redisCache.createKey(
        CACHE_PREFIXES.SEARCH,
        'results',
        tenantId,
        assetType,
        '*'
      );
      
      await redisCache.delByPattern(pattern);
      logger.info(`Invalidated search cache for ${assetType}`, context);
      return true;
    } catch (error: any) {
      logger.error('Error invalidating search cache', { 
        ...context, 
        error: error.message 
      });
      return false;
    }
  }
}

// Create singleton instance
const searchCacheManager = new SearchCacheManager();

export default searchCacheManager;
export { SearchCacheManager };
