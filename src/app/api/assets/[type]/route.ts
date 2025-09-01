import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { CacheManager } from '@/lib/performance'

// Define strong TypeScript types with Zod for request validation
const assetQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

// Valid asset types
const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse'] as const;
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
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60, stale-while-revalidate=59'
        }
      });
    }

    // Optimize database query with proper indexing and select
    const whereClause: any = {
      tenantId: user.tenantId
    };

    // Add search condition if provided
    if (search) {
      whereClause.OR = [
        { barcode: { contains: search, mode: 'insensitive' } },
        { pcName: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { dept: { contains: search, mode: 'insensitive' } }
      ];
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
    
    switch (assetType) {
      case 'pc':
        [totalCount, assets] = await Promise.all([
          db.pC.count({ where: whereClause }),
          db.pC.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
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
            orderBy: { updatedAt: 'desc' },
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
            orderBy: { updatedAt: 'desc' },
            // Select only necessary fields to reduce payload size
            select: {
              id: true,
              barcode: true,
              dept: true,
              // Printer model doesn't have status field
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
            orderBy: { updatedAt: 'desc' },
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
              // WarehouseIT model doesn't have status field
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error(`Error fetching ${params.type} assets:`, error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}