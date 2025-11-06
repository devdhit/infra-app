import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  exportPCToExcel, 
  exportLaptopToExcel, 
  exportPrinterToExcel, 
  exportLicenseToExcel, 
  exportWarehouseToExcel,
  exportFixedAssetToExcel
} from '@/lib/excel/excel-export';
import { z } from 'zod';
import { calculateOptimalBatchSize, processArrayInChunks } from '@/lib/performance';
import logger from '@/lib/logger';

// Define strong TypeScript types with Zod for request validation
const exportRequestSchema = z.object({
  ids: z.string().optional(),
  filter: z.string().optional(),
  all: z.boolean().optional().default(false),
});

// Constants for batch processing
const BATCH_SIZE = 500;

// Valid asset types
const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'fixed-asset'] as const;
type AssetType = typeof validAssetTypes[number];

// Type guard for asset types
function isValidAssetType(type: string): type is AssetType {
  return validAssetTypes.includes(type as AssetType);
}

// Implement batch processing for large datasets with performance optimizations
async function fetchAssetsInBatches(assetType: string, tenantId: string, options: {
  ids?: string[],
  filter?: Record<string, any>,
  batchSize: number
}) {
  const { ids, filter = {}, batchSize } = options;
  
  // Validate asset type
  if (!isValidAssetType(assetType)) {
    throw new Error(`Invalid asset type: ${assetType}`);
  }
  
  // Base where clause includes tenant
  const baseWhereClause = { 
    tenantId,
    ...filter
  };
  
  // Specific query for selected IDs
  const whereClause = ids?.length 
    ? { ...baseWhereClause, id: { in: ids } }
    : baseWhereClause;
  
  // Get total count for progress tracking
  let totalCount: number;
  switch (assetType) {
    case 'pc':
      totalCount = await db.pC.count({ where: whereClause });
      break;
    case 'laptop':
      totalCount = await db.laptop.count({ where: whereClause });
      break;
    case 'printer':
      totalCount = await db.printer.count({ where: whereClause });
      break;
    case 'license':
      totalCount = await db.license.count({ where: whereClause });
      break;
    case 'warehouse':
      totalCount = await db.warehouseIT.count({ where: whereClause });
      break;
    case 'fixed-asset':
      totalCount = await db.fixedAsset.count({ where: whereClause });
      break;
    default:
      throw new Error(`Unsupported asset type: ${assetType}`);
  }
  
  // If dataset is small, fetch all at once
  if (totalCount <= batchSize) {
    switch (assetType) {
      case 'pc':
        return await db.pC.findMany({
          where: whereClause
        });
      case 'laptop':
        return await db.laptop.findMany({
          where: whereClause
        });
      case 'printer':
        return await db.printer.findMany({
          where: whereClause
        });
      case 'license':
        return await db.license.findMany({
          where: whereClause
        });
      case 'warehouse':
        return await db.warehouseIT.findMany({
          where: whereClause
        });
      case 'fixed-asset':
        return await db.fixedAsset.findMany({
          where: whereClause
        });
      default:
        throw new Error(`Unsupported asset type: ${assetType}`);
    }
  }
  
  // For large datasets, process in batches with optimized chunking
  const optimalBatchSize = calculateOptimalBatchSize(totalCount, 5); // Medium complexity
  
  // Process in chunks using the performance utility
  const batchProcessor = async (chunk: [number, number][]) => {
    const results: any[] = [];
    
    for (const [skip, take] of chunk) {
      switch (assetType) {
        case 'pc':
          results.push(...await db.pC.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        case 'laptop':
          results.push(...await db.laptop.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        case 'printer':
          results.push(...await db.printer.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        case 'license':
          results.push(...await db.license.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        case 'warehouse':
          results.push(...await db.warehouseIT.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        case 'fixed-asset':
          results.push(...await db.fixedAsset.findMany({
            where: whereClause,
            skip,
            take
          }));
          break;
        default:
          throw new Error(`Unsupported asset type: ${assetType}`);
      }
    }
    
    return [results];
  };
  
  // Create chunks of skip/take values
  const chunks: [number, number][] = [];
  let processedCount = 0;
  
  while (processedCount < totalCount) {
    chunks.push([processedCount, Math.min(optimalBatchSize, totalCount - processedCount)]);
    processedCount += optimalBatchSize;
  }
  
  // Process all chunks in parallel for better performance
  const results = await processArrayInChunks(chunks, 5, batchProcessor);
  
  // Flatten results
  return results.flat();
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    // Set a longer timeout for large exports
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    const user = await getCurrentUser(request);
    if (!user) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get tenant name for header information
    let tenantName = 'Tenant';
    try {
      const tenant = await db.tenant.findUnique({
        where: { id: user.tenantId }
      });
      if (tenant) {
        tenantName = tenant.name;
      }
    } catch (error) {
      logger.warn('Could not fetch tenant name for export header', error);
    }

    // Map asset types to their corresponding export functions
    const exportFunctions: Record<string, Function> = {
      pc: (data: any[]) => exportPCToExcel(data, tenantName),
      laptop: (data: any[]) => exportLaptopToExcel(data, tenantName),
      printer: (data: any[]) => exportPrinterToExcel(data, tenantName),
      license: (data: any[]) => exportLicenseToExcel(data, tenantName),
      warehouse: (data: any[]) => exportWarehouseToExcel(data, tenantName),
      'fixed-asset': (data: any[]) => exportFixedAssetToExcel(data, tenantName)
    };

    // Get the asset type from the URL parameter
    const assetType = params.type;
    if (!assetType) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: 'Asset type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = exportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ 
        error: 'Invalid request parameters',
        details: validationResult.error.format() 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { ids, filter } = validationResult.data;
    
    // Process selected IDs if provided
    const selectedIds = ids ? ids.split(',') : undefined;
    
    // Process filter if provided
    const filterObj = filter ? JSON.parse(filter) : {};
    
    // Fetch assets in optimized batches
    const assets = await fetchAssetsInBatches(assetType, user.tenantId, {
      ids: selectedIds,
      filter: filterObj,
      batchSize: BATCH_SIZE
    });

    // Get the appropriate export function
    const exportFunction = exportFunctions[assetType];
    if (!exportFunction) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ error: `Export function not found for asset type: ${assetType}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate Excel file using the appropriate export function
    const buffer = await exportFunction(assets);
    
    clearTimeout(timeoutId);
    
    // Return the Excel file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${assetType}_export_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });
  } catch (error) {
    logger.error(`Error exporting ${params.type} assets:`, error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}