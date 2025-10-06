import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
// Remove the CacheManager import as we'll use Redis instead
import logger from '@/lib/logger';
import { 
  successResponse, 
  errorResponse, 
  badRequestResponse,
  unauthorizedResponse
} from '@/lib/api-utils';
import {
  buildWhereClause,
  buildSelectFields,
  buildSearchQueries,
  processSearchResults
} from '@/lib/asset-api-utils';

// Only import Redis cache on the server side
let redisCache: any = null;
let CACHE_PREFIXES: any = null;
let CACHE_TTL: any = null;

if (typeof window === 'undefined') {
  try {
    const redisModule = require('@/lib/redis-cache');
    redisCache = redisModule.default;
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
    CACHE_TTL = redisModule.CACHE_TTL;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'assets-list-route', 
      error: error.message 
    });
  }
}

// Define strong TypeScript types with Zod for request validation
const assetQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(), // Allow undefined/null
  status: z.string().optional(), // Allow undefined/null
});

// Valid asset types
const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet'] as const;
type AssetType = typeof validAssetTypes[number];

// Type guard for asset types
function isValidAssetType(type: string): type is AssetType {
  return validAssetTypes.includes(type as AssetType);
}

// Optimize database query with select and pagination
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });
    
    const validationResult = assetQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return badRequestResponse('Invalid query parameters', validationResult.error.format());
    }
    
    const { page, limit, search, status } = validationResult.data;
    
    // Get the asset type from the URL parameter
    const assetType = params.type;
    if (!assetType) {
      return badRequestResponse('Asset type is required');
    }

    // Validate asset type
    if (!isValidAssetType(assetType)) {
      return badRequestResponse(`Invalid asset type: ${assetType}`);
    }

    // Create a cache key based on parameters using Redis cache if available
    let cacheKey: string | null = null;
    if (redisCache && CACHE_PREFIXES) {
      cacheKey = redisCache.createKey(
        CACHE_PREFIXES.ASSET_LIST,
        assetType,
        user.tenantId,
        page,
        limit,
        search || 'no-search',
        status || 'no-status'
      );
    }
    
    // Try to get data from Redis cache first if available
    if (redisCache && cacheKey) {
      const cachedData = await redisCache.get(cacheKey);
      if (cachedData) {
        logger.debug(`Returning cached data for key: ${cacheKey}`);
        return successResponse(cachedData);
      }
    }

    // Build where clause for database queries
    const whereClause = buildWhereClause(user.tenantId, search, status, assetType);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute count query and data query in parallel for better performance
    let totalCount: number;
    let assets: any[];
    
    // For search queries, we need to use raw SQL to properly search within custom field values
    if (search) {
      // Build search queries
      const { baseQuery, countQuery, queryArgs } = buildSearchQueries(
        assetType,
        user.tenantId,
        search,
        status,
        limit,
        skip
      );
      
      // For count query, we need to remove limit and skip parameters
      const countQueryArgs = [...queryArgs];
      countQueryArgs.pop(); // Remove skip
      countQueryArgs.pop(); // Remove limit
      
      const [countResult, assetsResult] = await Promise.all([
        db.$queryRawUnsafe(countQuery, ...countQueryArgs),
        db.$queryRawUnsafe(baseQuery, ...queryArgs)
      ]);
      
      // Better type safety for countResult with proper undefined checking
      const countArray = countResult as Array<{count: string | number}>;
      totalCount = countArray && countArray.length > 0 && countArray[0] ? 
        parseInt(countArray[0].count.toString()) : 0;
      assets = processSearchResults(assetsResult as any[]);

    } else {
      // For non-search queries, use the existing Prisma queries
      const selectFields = buildSelectFields(assetType);
      
      switch (assetType) {
        case 'pc':
          [totalCount, assets] = await Promise.all([
            db.pC.count({ where: whereClause }),
            db.pC.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { dept: 'asc' },
              select: selectFields
            })
          ]);
          break;
        case 'laptop':
          [totalCount, assets] = await Promise.all([
            db.laptop.count({ where: whereClause }),
            db.laptop.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { dept: 'asc' },
              select: selectFields
            })
          ]);
          break;
        case 'printer':
          [totalCount, assets] = await Promise.all([
            db.printer.count({ where: whereClause }),
            db.printer.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { dept: 'asc' },
              select: selectFields
            })
          ]);
          break;
        case 'license':
          [totalCount, assets] = await Promise.all([
            db.license.count({ where: whereClause }),
            db.license.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { dept: 'asc' },
              select: selectFields
            })
          ]);
          break;
        case 'warehouse':
          [totalCount, assets] = await Promise.all([
            db.warehouseIT.count({ where: whereClause }),
            db.warehouseIT.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { updatedAt: 'desc' },
              select: selectFields
            })
          ]);
          break;
        case 'internet':
          [totalCount, assets] = await Promise.all([
            db.internet.count({ where: whereClause }),
            db.internet.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { updatedAt: 'desc' },
              select: selectFields
            })
          ]);
          break;
        default:
          return badRequestResponse(`Unsupported asset type: ${assetType}`);
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      data: assets,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    };

    // Cache the result in Redis if available
    if (redisCache && cacheKey) {
      await redisCache.set(cacheKey, result, CACHE_TTL ? CACHE_TTL.ASSET_LIST : 120);
      logger.debug(`Caching data for key: ${cacheKey}`);
    }

    return successResponse(result);
  } catch (error) {
    logger.error(`Error fetching ${params.type} assets:`, error);
    return errorResponse('Internal server error');
  }
}