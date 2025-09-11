import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { CacheManager } from '@/lib/performance'
import logger from '@/lib/logger';

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

// Create a cache manager for asset data with 5 minute TTL
const assetCache = new CacheManager<string, any>(5 * 60 * 1000);

// Optimize database query with select and pagination
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });
    
    const validationResult = assetQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid query parameters',
        details: validationResult.error.format() 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { page, limit, search, status } = validationResult.data;
    
    // Get the asset type from the URL parameter
    const assetType = params.type;
    if (!assetType) {
      return new Response(JSON.stringify({ error: 'Asset type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate asset type
    if (!isValidAssetType(assetType)) {
      return new Response(JSON.stringify({ error: `Invalid asset type: ${assetType}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a cache key based on parameters
    const cacheKey = `${assetType}-${user.tenantId}-${page}-${limit}-${search || 'no-search'}-${status || 'no-status'}`;
    
    // Try to get data from cache first
    const cachedData = assetCache.get(cacheKey);
    if (cachedData) {
      logger.debug(`Returning cached data for key: ${cacheKey}`);
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': search || status ? 'no-cache' : 'max-age=60, stale-while-revalidate=59'
        }
      });
    }

    // Optimize database query with proper indexing and select
    const whereClause: any = {
      tenantId: user.tenantId
    };

    // Define search fields for both Prisma and raw SQL queries
    // Create asset-type-specific search fields
    let searchFields: string[] = [];
    switch (assetType) {
      case 'pc':
        searchFields = [
          'cpuBarcode',
          'pcName',
          'userName',
          'dept',
          'status'
        ];
        break;
      case 'laptop':
        searchFields = [
          'barcode',
          'userName',
          'dept',
          'model',
          'status'
        ];
        break;
      case 'printer':
        searchFields = [
          'barcode',
          'dept',
          'location',
          'ip',
          'model'
        ];
        break;
      case 'license':
        searchFields = [
          'deviceName',
          'userName',
          'dept',
          'productType',
          'productKey',
          'model',
          'pc',
          'mac',
          'ip',
          'updateStatus'
        ];
        break;
      case 'warehouse':
        searchFields = [
          'barcode',
          'sapCode',
          'status'
        ];
        break;
      case 'internet':
        searchFields = [
          'dept',
          'manager',
          'userName',
          'email',
          'ipAddress',
          'internetAccess',
          'status'
        ];
        break;
      default:
        searchFields = [
          'barcode',
          'pcName',
          'userName',
          'dept',
          'ip',
        ];
    }

    // Add search condition if provided with optimized indexing
    if (search) {
      // Create search conditions for indexed fields
      whereClause.OR = searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' }
      }));
      
      // Also search in custom fields using proper JSON search
      whereClause.OR.push({
        customFields: {
          path: [],
          string_contains: search
        }
      });
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute count query and data query in parallel for better performance
    let totalCount: number;
    let assets: any[];
    
    // For search queries, we need to use raw SQL to properly search within custom field values
    if (search) {
      // Build the raw SQL query with proper custom field searching
      let baseQuery = '';
      let countQuery = '';
      const queryArgs: any[] = [user.tenantId];
      
      switch (assetType) {
        case 'pc':
          baseQuery = `
            SELECT id, "cpuBarcode", "pcName", "userName", "dept", "status", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "PC"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "PC"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        case 'laptop':
          baseQuery = `
            SELECT id, "barcode", "userName", "dept", "status", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "Laptop"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "Laptop"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        case 'printer':
          baseQuery = `
            SELECT id, "barcode", "dept", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "Printer"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "Printer"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        case 'license':
          baseQuery = `
            SELECT id, "userName", "dept", "updateStatus", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "License"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "License"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        case 'warehouse':
          baseQuery = `
            SELECT id, "barcode", "sapCode", "status", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "WarehouseIT"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "WarehouseIT"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        case 'internet':
          baseQuery = `
            SELECT id, "dept", "manager", "userName", "email", "ipAddress", "internetAccess", "status", "updatedAt", "customFields",
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "Internet"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          countQuery = `
            SELECT COUNT(*) as count
            FROM "Internet"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          break;
        default:
          return new Response(JSON.stringify({ error: `Unsupported asset type: ${assetType}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
      
      // Add search parameter to args
      queryArgs.push(search);
      
      // Add status filter if provided
      if (status) {
        queryArgs.push(status);
        const statusField = assetType === 'license' ? 'updateStatus' : 'status';
        baseQuery += ` AND "${statusField}" = $${queryArgs.length}`;
        countQuery += ` AND "${statusField}" = $${queryArgs.length}`;
      }
      
      // Add ordering by rank and then by update time
      baseQuery += ' ORDER BY rank DESC, "updatedAt" DESC';
      
      // Add limit and skip to the query string
      const limitIndex = queryArgs.length + 1;
      const offsetIndex = queryArgs.length + 2;
      baseQuery += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
      
      // Add limit and skip parameters to queryArgs
      queryArgs.push(limit, skip);
      
      // Execute queries
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
      assets = assetsResult as any[];
      
      // Remove rank from results before sending to client
      assets = assets.map(asset => {
        const { rank, ...cleanAsset } = asset;
        return cleanAsset;
      });

    } else {
      // For non-search queries, use the existing Prisma queries
      switch (assetType) {
        case 'pc':
          [totalCount, assets] = await Promise.all([
            db.pC.count({ where: whereClause }),
            db.pC.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy: { dept: 'asc' },
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                cpuBarcode: true,
                pcName: true,
                userName: true,
                dept: true,
                status: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
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
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                barcode: true,
                userName: true,
                dept: true,
                status: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
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
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                barcode: true,
                dept: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
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
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                userName: true,
                dept: true,
                // License model uses updateStatus instead of status
                updateStatus: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
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
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                barcode: true,
                sapCode: true,
                status: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
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
              // Select only necessary fields to reduce payload size
              select: {
                id: true,
                dept: true,
                manager: true,
                userName: true,
                email: true,
                ipAddress: true,
                internetAccess: true,
                status: true,
                updatedAt: true,
                customFields: true // Include custom fields
              }
            })
          ]);
          break;
        default:
          return new Response(JSON.stringify({ error: `Unsupported asset type: ${assetType}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
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

    // Cache the result
    assetCache.set(cacheKey, result);
    logger.debug(`Caching data for key: ${cacheKey}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': search || status ? 'no-cache' : 'max-age=60, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    logger.error(`Error fetching ${params.type} assets:`, error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}