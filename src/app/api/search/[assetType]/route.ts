import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, badRequestResponse, unauthorizedResponse } from '@/lib/api-utils';
import { getCurrentUser } from '@/lib/auth';
import { executeEnhancedSearch, SearchOptions } from '@/lib/search/search-service';
import logger from '@/lib/logger';

/**
 * Enhanced Search API
 * 
 * Features:
 * - Full-text search with PostgreSQL tsvector
 * - Advanced filtering (status, dept, date range, custom fields)
 * - Result caching with Redis
 * - Search suggestions and history
 * - Pagination and sorting
 */

// Validation schema for search query parameters
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  // Filters
  status: z.string().optional(),
  dept: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Additional filter fields can be passed as JSON
  filters: z.string().optional(),
});

/**
 * GET /api/search/[assetType] - Enhanced search endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetType: string }> }
) {
  const context = { component: 'search-api', action: 'search' };

  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { assetType } = await params;

    // Validate asset type
    const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet', 'fixed-asset', 'it-purchasing'];
    if (!validAssetTypes.includes(assetType)) {
      return badRequestResponse('Invalid asset type');
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const validationResult = searchQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return badRequestResponse('Invalid query parameters', validationResult.error.format());
    }

    const { q, page, limit, sortBy, sortOrder, status, dept, dateFrom, dateTo, filters: filtersJson } = validationResult.data;

    // Parse additional filters
    let additionalFilters = {};
    if (filtersJson) {
      try {
        additionalFilters = JSON.parse(filtersJson);
      } catch (error) {
        return badRequestResponse('Invalid filters JSON format');
      }
    }

    // Build search options
    const searchOptions: SearchOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        status,
        dept,
        dateFrom,
        dateTo,
        ...additionalFilters,
      },
    };

    // Execute search
    const result = await executeEnhancedSearch(
      assetType,
      q,
      user.tenantId,
      user.id,
      searchOptions
    );

    logger.info('Search completed', {
      ...context,
      assetType,
      query: q,
      resultsCount: result.data.length,
      total: result.total,
    });

    return successResponse({
      ...result,
      query: q,
      assetType,
    });
  } catch (error: any) {
    logger.error('Search error', {
      ...context,
      error: error.message,
      stack: error.stack,
    });
    return errorResponse('Search failed', error.message);
  }
}
