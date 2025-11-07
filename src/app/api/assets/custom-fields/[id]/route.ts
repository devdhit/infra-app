import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse,
  badRequestResponse,
  successResponse,
  notFoundResponse,
  conflictResponse
} from '@/lib/api-utils'
import logger from '@/lib/logger'
import { checkForDuplicateBarcode, getDuplicateBarcodeInfo } from '@/lib/asset-duplicate-check'

// Import Redis cache for proper cache invalidation
let redisCache: any = null;
let CACHE_PREFIXES: any = null;
if (typeof window === 'undefined') {
  try {
    const redisModule = require('@/lib/redis-cache');
    redisCache = redisModule.default;
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'custom-fields-route', 
      error: error.message 
    });
  }
}

// Import cache manager for proper cache invalidation
let cacheManager: any = null;
if (typeof window === 'undefined') {
  try {
    const cacheModule = require('@/lib/cache-manager');
    cacheManager = cacheModule.default;
  } catch (error: any) {
    logger.warn('Cache manager not available, using fallback', { 
      component: 'custom-fields-route', 
      error: error.message 
    });
  }
}

// PUT /api/assets/custom-fields/[id] - Update custom field values for an asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    const body = await request.json()
    
    // Extract the asset type from the request headers or query params
    const assetType = request.headers.get('x-asset-type') || 
                     new URL(request.url).searchParams.get('assetType')
    
    if (!assetType) {
      return badRequestResponse('Asset type is required')
    }

    // Validate that the asset type is supported
    const supportedAssetTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet', 'FixedAsset']
    if (!supportedAssetTypes.includes(assetType)) {
      return badRequestResponse(`Unsupported asset type: ${assetType}`)
    }

    // Get the model name based on asset type
    const modelName = assetType === 'PC' ? 'PC' : 
                     assetType === 'Laptop' ? 'Laptop' : 
                     assetType === 'Printer' ? 'Printer' : 
                     assetType === 'License' ? 'License' : 
                     assetType === 'Internet' ? 'Internet' :
                     assetType === 'FixedAsset' ? 'FixedAsset' :
                     'WarehouseIT'

    logger.debug(`Updating custom fields for ${assetType} asset ${resolvedParams.id} with data:`, body);

    // Check if asset exists and belongs to user's tenant
    const existingAsset = await (db as any)[modelName].findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingAsset) {
      return notFoundResponse(`${assetType} asset not found`)
    }

    // Check for duplicate barcodes unless bypass is requested
    const bypassDuplicateCheck = body.bypassDuplicateCheck;
    logger.debug(`Bypass duplicate check flag: ${bypassDuplicateCheck}`);
    
    if (!bypassDuplicateCheck) {
      // For PC assets, check if any barcode fields are being updated
      if (assetType === 'PC') {
        const barcodeFields = ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode'];
        const updatedBarcodeFields = barcodeFields.filter(field => body[field] !== undefined);
        
        for (const field of updatedBarcodeFields) {
          const barcode = body[field];
          if (barcode) {
            const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'pc');
            if (isDuplicate) {
              const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'pc');
              const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
              return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in Warehouse IT assets`);
            }
          }
        }
      } 
      // For WarehouseIT assets, check if barcode or sapCode fields are being updated
      else if (assetType === 'WarehouseIT') {
        const barcodeFields = ['barcode', 'sapCode'];
        const updatedBarcodeFields = barcodeFields.filter(field => body[field] !== undefined);
        
        for (const field of updatedBarcodeFields) {
          const barcode = body[field];
          if (barcode) {
            const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'warehouse');
            if (isDuplicate) {
              const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'warehouse');
              const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
              return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in PC assets`);
            }
          }
        }
      }
    } else {
      logger.debug('Bypassing duplicate check, will delete duplicates if needed');
      // If bypass is requested, delete any duplicate assets
      if (assetType === 'PC') {
        const barcodeFields = ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode'];
        const updatedBarcodeFields = barcodeFields.filter(field => body[field] !== undefined);
        
        for (const field of updatedBarcodeFields) {
          const barcode = body[field];
          if (barcode) {
            try {
              // Find and delete duplicate assets in Warehouse IT
              const warehouseAssets = await db.warehouseIT.findMany({
                where: {
                  tenantId: user.tenantId,
                  OR: [
                    { barcode: barcode },
                    { sapCode: barcode }
                  ]
                }
              });

              // Delete all matching warehouse assets
              for (const asset of warehouseAssets) {
                await db.warehouseIT.delete({
                  where: { id: asset.id }
                });
                
                // Invalidate cache for the deleted warehouse asset
                if (cacheManager && CACHE_PREFIXES) {
                  try {
                    const assetCacheKey = cacheManager.createCompositeKey(
                      CACHE_PREFIXES.ASSETS,
                      'WarehouseIT',
                      user.tenantId,
                      asset.id
                    );
                    await cacheManager.del(assetCacheKey, { component: 'custom-fields-route' });
                    logger.debug(`Invalidated cache for deleted WarehouseIT asset ${asset.id}`);
                  } catch (cacheError: any) {
                    logger.warn(`Failed to invalidate cache for WarehouseIT asset ${asset.id}:`, cacheError);
                  }
                }
              }
              
              // Also invalidate list caches for WarehouseIT assets
              if (cacheManager && CACHE_PREFIXES) {
                try {
                  await cacheManager.invalidateResource(user.tenantId, 'WarehouseIT', { component: 'custom-fields-route' });
                  logger.debug(`Invalidated WarehouseIT asset list caches after deleting ${warehouseAssets.length} assets`);
                } catch (cacheError: any) {
                  logger.warn(`Failed to invalidate WarehouseIT asset list caches:`, cacheError);
                }
              }
              
              logger.debug(`Deleted ${warehouseAssets.length} warehouse assets with barcode ${barcode}`);
            } catch (error) {
              logger.error('Error deleting warehouse assets:', error);
              // Continue with the operation even if deletion fails
            }
          }
        }
      } else if (assetType === 'WarehouseIT') {
        const barcodeFields = ['barcode', 'sapCode'];
        const updatedBarcodeFields = barcodeFields.filter(field => body[field] !== undefined);
        
        for (const field of updatedBarcodeFields) {
          const barcode = body[field];
          if (barcode) {
            try {
              // Find and delete duplicate assets in PC
              const pcAssets = await db.pC.findMany({
                where: {
                  tenantId: user.tenantId,
                  OR: [
                    { cpuBarcode: barcode },
                    { cpuSapBarcode: barcode },
                    { monitorBarcode: barcode },
                    { monitorSapBarcode: barcode },
                    { upsBarcode: barcode },
                    { upsSapBarcode: barcode },
                    { cpuBarcode: barcode },
                    { cpuSapBarcode: barcode },
                    { monitorBarcode: barcode },
                    { monitorSapBarcode: barcode },
                    { upsBarcode: barcode },
                    { upsSapBarcode: barcode }
                  ]
                }
              });

              // Delete all matching PC assets
              for (const asset of pcAssets) {
                await db.pC.delete({
                  where: { id: asset.id }
                });
                
                // Invalidate cache for the deleted PC asset
                if (cacheManager && CACHE_PREFIXES) {
                  try {
                    const assetCacheKey = cacheManager.createCompositeKey(
                      CACHE_PREFIXES.ASSETS,
                      'PC',
                      user.tenantId,
                      asset.id
                    );
                    await cacheManager.del(assetCacheKey, { component: 'custom-fields-route' });
                    logger.debug(`Invalidated cache for deleted PC asset ${asset.id}`);
                  } catch (cacheError: any) {
                    logger.warn(`Failed to invalidate cache for PC asset ${asset.id}:`, cacheError);
                  }
                }
              }
              
              // Also invalidate list caches for PC assets
              if (cacheManager && CACHE_PREFIXES) {
                try {
                  await cacheManager.invalidateResource(user.tenantId, 'PC', { component: 'custom-fields-route' });
                  logger.debug(`Invalidated PC asset list caches after deleting ${pcAssets.length} assets`);
                } catch (cacheError: any) {
                  logger.warn(`Failed to invalidate PC asset list caches:`, cacheError);
                }
              }
              
              logger.debug(`Deleted ${pcAssets.length} PC assets with barcode ${barcode}`);
            } catch (error) {
              logger.error('Error deleting PC assets:', error);
              // Continue with the operation even if deletion fails
            }
          }
        }
      }
    }

    // Prepare the update data - only include valid fields for the model
    const updateData: any = {}
    
    // Handle customFields specifically
    if (body.customFields) {
      updateData.customFields = body.customFields
    }
    
    // Only include fields that are valid for this model type
    // This prevents Prisma errors when invalid fields are sent
    const validFields = {
      'PC': ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note', 'customFields'],
      'Laptop': ['dept', 'barcode', 'sapBarcode', 'dateBuy', 'userId', 'email', 'model', 'status', 'userName', 'customFields'],
      'Printer': ['dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note', 'customFields'],
      'License': ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 'customFields'],
      'WarehouseIT': ['barcode', 'sapCode', 'status', 'note', 'customFields'],
      'Internet': ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note', 'customFields'],
      'FixedAsset': ['dept', 'barcode', 'sapCode', 'name', 'place', 'inputDate', 'location', 'status', 'note', 'customFields']
    }
    
    const modelValidFields = validFields[assetType as keyof typeof validFields] || []
    
    // Handle other fields - only include valid fields for this model
    Object.keys(body).forEach(key => {
      if (key !== 'id' && key !== 'customFields' && modelValidFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    logger.debug("Update data to be sent to database:", updateData);

    // Update the asset
    const updatedAsset = await (db as any)[modelName].update({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      data: updateData
    })

    // Invalidate Redis cache for this asset and asset lists with comprehensive patterns
    if (redisCache && CACHE_PREFIXES) {
      try {
        // Create cache key for the specific asset
        const assetCacheKey = redisCache.createKey(
          CACHE_PREFIXES.ASSETS,
          modelName,
          user.tenantId,
          resolvedParams.id
        );
        
        // Remove the specific asset from cache
        await redisCache.del(assetCacheKey);
        
        // Invalidate cache entries more efficiently with comprehensive patterns
        // Use multiple patterns with different numbers of wildcards to ensure all variations are covered
        const patterns = [
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*:*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*:*:*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*:*:*:*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*:*:*:*:*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.ASSET_LIST,
            modelName,
            user.tenantId,
            '*:*:*:*:*:*'
          ),
          redisCache.createKey(
            CACHE_PREFIXES.SEARCH,
            modelName,
            user.tenantId,
            '*'
          )
        ];
        
        // Process patterns in parallel for better performance
        await Promise.all(
          patterns.map(pattern => redisCache.delByPattern(pattern))
        );
        
        logger.debug(`Invalidated cache for ${modelName} asset ${resolvedParams.id}`);
      } catch (cacheError: any) {
        logger.warn(`Failed to invalidate cache for ${modelName} asset ${resolvedParams.id}:`, cacheError);
      }
    }

    return successResponse(updatedAsset)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Asset not found')
    }
    
    logger.error('Error updating asset custom fields:', error)
    return errorResponse('Failed to update asset custom fields. Please try again later.')
  }
}

// GET /api/assets/custom-fields/[id] - Get custom field values for an asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }
    
    // Await params before using
    const resolvedParams = await params;
    
    // Extract the asset type from the request headers or query params
    const assetType = request.headers.get('x-asset-type') || 
                     new URL(request.url).searchParams.get('assetType')
    
    if (!assetType) {
      return badRequestResponse('Asset type is required')
    }

    // Validate that the asset type is supported
    const supportedAssetTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet', 'FixedAsset']
    if (!supportedAssetTypes.includes(assetType)) {
      return badRequestResponse(`Unsupported asset type: ${assetType}`)
    }

    // Get the model name based on asset type
    const modelName = assetType === 'PC' ? 'PC' : 
                     assetType === 'Laptop' ? 'Laptop' : 
                     assetType === 'Printer' ? 'Printer' : 
                     assetType === 'License' ? 'License' : 
                     assetType === 'Internet' ? 'Internet' :
                     assetType === 'FixedAsset' ? 'FixedAsset' :
                     'WarehouseIT'

    // Get the asset with custom fields
    const asset = await (db as any)[modelName].findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      select: {
        id: true,
        customFields: true
      }
    })

    if (!asset) {
      return notFoundResponse(`${assetType} asset not found`)
    }

    return successResponse(asset)
  } catch (error) {
    logger.error('Error fetching asset custom fields:', error)
    return errorResponse('Failed to fetch asset custom fields. Please try again later.')
  }
}