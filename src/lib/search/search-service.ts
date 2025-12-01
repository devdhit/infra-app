import { db } from '../db';
import { validateSearchInput } from '../security';
import logger, { LogData } from '../logger';
import searchCacheManager from './search-cache';

/**
 * Search Service - Advanced search utilities and query builders
 */

export interface SearchFilters {
  status?: string;
  dept?: string;
  dateFrom?: string;
  dateTo?: string;
  customFields?: Record<string, any>;
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
}

/**
 * Asset type configurations for search
 */
const ASSET_TYPE_CONFIG: Record<string, {
  tableName: string;
  searchFields: string[];
  filterFields: string[];
  columns: string[]; // All columns except search_vector
}> = {
  'pc': {
    tableName: 'PC',
    searchFields: ['cpuBarcode', 'pcName', 'userName', 'dept', 'status'],
    filterFields: ['status', 'dept', 'userName'],
    columns: ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'laptop': {
    tableName: 'Laptop',
    searchFields: ['barcode', 'userName', 'email', 'model', 'dept', 'status'],
    filterFields: ['status', 'dept', 'model'],
    columns: ['id', 'dept', 'barcode', 'sapBarcode', 'dateBuy', 'userName', 'email', 'model', 'status', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'printer': {
    tableName: 'Printer',
    searchFields: ['barcode', 'location', 'ip', 'model', 'dept'],
    filterFields: ['dept', 'location', 'model', 'color'],
    columns: ['id', 'dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'license': {
    tableName: 'License',
    searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey'],
    filterFields: ['updateStatus', 'dept', 'productType'],
    columns: ['id', 'deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'warehouse': {
    tableName: 'WarehouseIT',
    searchFields: ['barcode', 'sapCode', 'status', 'note'],
    filterFields: ['status'],
    columns: ['id', 'barcode', 'sapCode', 'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'internet': {
    tableName: 'Internet',
    searchFields: ['userName', 'email', 'ipAddress', 'dept', 'manager'],
    filterFields: ['status', 'dept', 'internetAccess'],
    columns: ['id', 'dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  },
  'fixedasset': {
    tableName: 'FixedAsset',
    searchFields: ['assetName', 'assetNumber', 'dept', 'location'],
    filterFields: ['status', 'dept', 'category'],
    columns: ['id', 'assetNumber', 'assetName', 'category', 'purchaseDate', 'purchasePrice', 'currentValue', 'dept', 'location', 'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt']
  }
};

/**
 * Build full-text search query
 */
export function buildSearchQuery(
  assetType: string,
  searchTerm: string,
  tenantId: string,
  options: SearchOptions = {}
): { query: string; countQuery: string; params: any[] } {
  const config = ASSET_TYPE_CONFIG[assetType];
  if (!config) {
    throw new Error(`Unsupported asset type: ${assetType}`);
  }

  const { tableName, columns } = config;
  const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc', filters = {} } = options;

  // Sanitize search input
  const sanitizedSearch = validateSearchInput(searchTerm);

  // Initialize params array
  const params: any[] = [tenantId];
  let paramIndex = 1;

  // Build column list (exclude search_vector)
  const columnList = columns.map(col => `"${col}"`).join(', ');

  // Base query with full-text search (explicitly exclude search_vector)
  let baseQuery = `
    SELECT 
      ${columnList},
      ts_rank(search_vector, websearch_to_tsquery('english', $${++paramIndex})) +
      ts_rank(search_vector, plainto_tsquery('english', $${paramIndex})) as rank
    FROM "${tableName}"
    WHERE "tenantId" = $1
    AND (
      search_vector @@ websearch_to_tsquery('english', $${paramIndex})
      OR search_vector @@ plainto_tsquery('english', $${paramIndex})
    )
  `;
  
  let countQuery = `
    SELECT COUNT(*) as count
    FROM "${tableName}"
    WHERE "tenantId" = $1
    AND (
      search_vector @@ websearch_to_tsquery('english', $${paramIndex})
      OR search_vector @@ plainto_tsquery('english', $${paramIndex})
    )
  `;
  
  params.push(sanitizedSearch);

  // Add filters
  if (filters.status) {
    const statusField = assetType === 'license' ? 'updateStatus' : 'status';
    baseQuery += ` AND "${statusField}" = $${++paramIndex}`;
    countQuery += ` AND "${statusField}" = $${paramIndex}`;
    params.push(validateSearchInput(filters.status));
  }

  if (filters.dept) {
    baseQuery += ` AND "dept" = $${++paramIndex}`;
    countQuery += ` AND "dept" = $${paramIndex}`;
    params.push(validateSearchInput(filters.dept));
  }

  if (filters.dateFrom) {
    baseQuery += ` AND "createdAt" >= $${++paramIndex}`;
    countQuery += ` AND "createdAt" >= $${paramIndex}`;
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    baseQuery += ` AND "createdAt" <= $${++paramIndex}`;
    countQuery += ` AND "createdAt" <= $${paramIndex}`;
    params.push(filters.dateTo);
  }

  // Add ordering
  const validSortFields = [...config.searchFields, 'createdAt', 'updatedAt', 'rank'];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  if (safeSortBy === 'rank') {
    baseQuery += ` ORDER BY rank DESC, "updatedAt" DESC`;
  } else {
    baseQuery += ` ORDER BY "${safeSortBy}" ${safeSortOrder}`;
  }

  // Add pagination
  const offset = (page - 1) * limit;
  baseQuery += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
  params.push(limit, offset);

  return { query: baseQuery, countQuery, params };
}

/**
 * Execute enhanced search with caching
 */
export async function executeEnhancedSearch<T = any>(
  assetType: string,
  searchTerm: string,
  tenantId: string,
  userId: string,
  options: SearchOptions = {}
): Promise<SearchResult<T>> {
  const context: LogData = { 
    component: 'search-service', 
    action: 'enhanced-search',
    assetType,
    searchTerm
  };

  try {
    const { page = 1, limit = 20, filters } = options;

    // Check cache first
    const cached = await searchCacheManager.getCachedSearch(
      tenantId,
      assetType,
      searchTerm,
      filters,
      page,
      limit
    );

    if (cached) {
      logger.debug('Returning cached search results', context);
      
      const totalPages = Math.ceil(cached.total / limit);
      return {
        data: cached.results,
        total: cached.total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      };
    }

    // Build and execute query
    const { query, countQuery, params } = buildSearchQuery(assetType, searchTerm, tenantId, options);

    logger.debug('Executing search query', { ...context, query, params });

    // Execute queries in parallel
    const [results, countResult] = await Promise.all([
      db.$queryRawUnsafe<T[]>(query, ...params),
      db.$queryRawUnsafe<[{ count: bigint }]>(countQuery, ...params.slice(0, -2))
    ]);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Cache the results
    await searchCacheManager.cacheSearchResults(
      tenantId,
      assetType,
      searchTerm,
      results,
      total,
      filters,
      page,
      limit
    );

    // Update search history and suggestions
    await Promise.all([
      searchCacheManager.addToSearchHistory(tenantId, userId, assetType, searchTerm),
      searchCacheManager.updateSearchSuggestions(tenantId, assetType, searchTerm)
    ]);

    logger.info('Search completed successfully', { 
      ...context, 
      resultsCount: results.length,
      total 
    });

    return {
      data: results,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    };
  } catch (error: any) {
    logger.error('Error executing enhanced search', { 
      ...context, 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Get search suggestions based on database matches, user history and popular searches
 */
export async function getSearchSuggestions(
  tenantId: string,
  userId: string,
  assetType: string,
  prefix?: string
): Promise<string[]> {
  const context: LogData = { 
    component: 'search-service', 
    action: 'get-suggestions',
    assetType 
  };

  try {
    const config = ASSET_TYPE_CONFIG[assetType];
    if (!config) {
      logger.error('Unsupported asset type', context);
      return [];
    }

    const { tableName, searchFields } = config;
    const suggestions: string[] = [];

    // If prefix is provided and >= 2 chars, search database for matching values
    if (prefix && prefix.trim().length >= 2) {
      const sanitizedPrefix = prefix.trim().toLowerCase();
      
      // Query each searchable field for matches
      for (const field of searchFields) {
        try {
          const query = `
            SELECT DISTINCT "${field}" as value, COUNT(*) as count
            FROM "${tableName}"
            WHERE "tenantId" = $1 
              AND "${field}" IS NOT NULL
              AND LOWER("${field}") LIKE $2
            GROUP BY "${field}"
            ORDER BY count DESC, "${field}"
            LIMIT 5
          `;
          
          const results = await db.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
            query,
            tenantId,
            `%${sanitizedPrefix}%`
          );
          
          // Add matching values to suggestions
          results.forEach(r => {
            if (r.value && r.value.trim().length > 0 && !suggestions.includes(r.value)) {
              suggestions.push(r.value);
            }
          });
        } catch (error: any) {
          logger.debug(`Error querying field ${field}`, { ...context, error: error.message });
          // Continue with other fields even if one fails
        }
      }
    }

    // If we have enough suggestions from database, return them
    if (suggestions.length >= 5) {
      return suggestions.slice(0, 10);
    }

    // Otherwise, supplement with history and popular searches
    const [history, popularSuggestions] = await Promise.all([
      searchCacheManager.getSearchHistory(tenantId, userId, assetType),
      searchCacheManager.getSearchSuggestions(tenantId, assetType)
    ]);

    // Add history and popular suggestions
    const additionalSuggestions = [
      ...history,
      ...popularSuggestions.map(s => s.term)
    ];

    // Filter by prefix if provided
    const filteredAdditional = prefix && prefix.trim().length > 0
      ? additionalSuggestions.filter(s => 
          s.toLowerCase().includes(prefix.toLowerCase())
        )
      : additionalSuggestions;

    // Combine database suggestions with filtered history/popular
    const combinedSuggestions = [
      ...suggestions,
      ...filteredAdditional.filter(s => !suggestions.includes(s))
    ];

    // Remove duplicates and return top 10
    return Array.from(new Set(combinedSuggestions)).slice(0, 10);
  } catch (error: any) {
    logger.error('Error getting search suggestions', { 
      ...context, 
      error: error.message 
    });
    return [];
  }
}

/**
 * Get available filter options for an asset type
 */
export async function getFilterOptions(
  assetType: string,
  tenantId: string
): Promise<Record<string, string[]>> {
  const context: LogData = { 
    component: 'search-service', 
    action: 'get-filter-options',
    assetType 
  };

  const config = ASSET_TYPE_CONFIG[assetType];
  if (!config) {
    logger.error('Unsupported asset type', context);
    return {};
  }

  try {
    const { tableName, filterFields } = config;
    const options: Record<string, string[]> = {};

    // Get distinct values for each filter field
    for (const field of filterFields) {
      const query = `
        SELECT DISTINCT "${field}" as value
        FROM "${tableName}"
        WHERE "tenantId" = $1 AND "${field}" IS NOT NULL
        ORDER BY "${field}"
        LIMIT 100
      `;

      const results = await db.$queryRawUnsafe<Array<{ value: string }>>(query, tenantId);
      options[field] = results.map(r => r.value).filter(v => v && v.trim().length > 0);
    }

    logger.debug('Retrieved filter options', { ...context, options });
    return options;
  } catch (error: any) {
    logger.error('Error getting filter options', { 
      ...context, 
      error: error.message 
    });
    return {};
  }
}

/**
 * Clear search cache for an asset type
 */
export async function clearSearchCache(tenantId: string, assetType: string): Promise<boolean> {
  return searchCacheManager.invalidateSearchCache(tenantId, assetType);
}

export { ASSET_TYPE_CONFIG };
