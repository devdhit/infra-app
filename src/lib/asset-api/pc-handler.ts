import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { PCAsset } from '@/types/asset-interfaces';
import { checkForDuplicateBarcode, getDuplicateBarcodeInfo } from '@/lib/asset-duplicate-check';
import { conflictResponse, errorResponse, notFoundResponse, successResponse } from '@/lib/api-utils';
import logger from '@/lib/logger';
import { CACHE_TTL } from '../redis-cache';

// Import cache manager for proper cache invalidation
let cacheManager: any = null;
let CACHE_PREFIXES: any = null;
if (typeof window === 'undefined') {
  try {
    const cacheModule = require('@/lib/cache-manager');
    cacheManager = cacheModule.default;
    CACHE_PREFIXES = cacheModule.CACHE_PREFIXES;
  } catch (error: any) {
    logger.warn('Cache manager not available, using fallback', { 
      component: 'pc-handler', 
      error: error.message 
    });
  }
}

// Define operations specific to PC assets
const pcOperations: AssetOperations<PCAsset> = {
  modelName: 'PC',
  requiredFields: ['dept', 'pcName', 'status'],
  searchFields: ['cpuBarcode', 'pcName', 'userName', 'dept', 'status']
};

// Create handler for PC assets
export const pcHandler = new BaseAssetApiHandler<PCAsset>(db, pcOperations);

// Override create method to add duplicate checking
pcHandler.create = async (user: any, body: Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> & { customFields?: Record<string, any> }) => {
  // Cast body to any to access bypassDuplicateCheck property
  const bodyWithBypass = body as any;
  
  logger.debug('PC Handler: create called with user tenantId:', user.tenantId);
  logger.debug('PC Handler: create called with body:', body);
  logger.debug('PC Handler: bypassDuplicateCheck flag:', bodyWithBypass.bypassDuplicateCheck);
  
  // Check for duplicate barcodes in Warehouse IT unless bypass is requested
  if (!bodyWithBypass.bypassDuplicateCheck) {
    const barcodesToCheck = [
      body.cpuBarcode,
      body.cpuSapBarcode,
      body.monitorBarcode,
      body.monitorSapBarcode,
      body.upsBarcode,
      body.upsSapBarcode
    ].filter(barcode => barcode);

    for (const barcode of barcodesToCheck) {
      if (barcode) {
        const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'pc');
        if (isDuplicate) {
          const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'pc');
          const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
          return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in Warehouse IT assets`);
        }
      }
    }
  } else {
    logger.debug('PC Handler: Bypassing duplicate check, will delete duplicates');
    // If bypass is requested, delete any duplicate assets in Warehouse IT
    const barcodesToDelete = [
      body.cpuBarcode,
      body.cpuSapBarcode,
      body.monitorBarcode,
      body.monitorSapBarcode,
      body.upsBarcode,
      body.upsSapBarcode
    ].filter(barcode => barcode);

    for (const barcode of barcodesToDelete) {
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
                await cacheManager.del(assetCacheKey, { component: 'pc-handler' });
                logger.debug(`Invalidated cache for deleted WarehouseIT asset ${asset.id}`);
              } catch (cacheError: any) {
                logger.warn(`Failed to invalidate cache for WarehouseIT asset ${asset.id}:`, cacheError);
              }
            }
          }
          
          // Also invalidate list caches for WarehouseIT assets
          if (cacheManager && CACHE_PREFIXES) {
            try {
              await cacheManager.invalidateResource(user.tenantId, 'WarehouseIT', { component: 'pc-handler' });
              logger.debug(`Invalidated WarehouseIT asset list caches after deleting ${warehouseAssets.length} assets`);
            } catch (cacheError: any) {
              logger.warn(`Failed to invalidate WarehouseIT asset list caches:`, cacheError);
            }
          }
          
          logger.debug(`PC Handler: Deleted ${warehouseAssets.length} warehouse assets`);
        } catch (error) {
          logger.error('Error deleting warehouse assets:', error);
          // Continue with the operation even if deletion fails
        }
      }
    }
  }

  // Call the original create method
  logger.debug('PC Handler: Creating new PC asset');
  return BaseAssetApiHandler.prototype.create.call(pcHandler, user, body);
};

// Override update method to add duplicate checking for barcode fields
pcHandler.update = async (user: any, id: string, body: Partial<Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>> & { customFields?: Record<string, any> }) => {
  // Cast body to any to access bypassDuplicateCheck property
  const bodyWithBypass = body as any;
  
  logger.debug('PC Handler: update called with user tenantId:', user.tenantId);
  logger.debug('PC Handler: update called with id:', id);
  logger.debug('PC Handler: update called with body:', body);
  logger.debug('PC Handler: bypassDuplicateCheck flag:', bodyWithBypass.bypassDuplicateCheck);
  
  // Check for duplicate barcodes in Warehouse IT when updating barcode fields unless bypass is requested
  if (!bodyWithBypass.bypassDuplicateCheck) {
    // Check if any barcode fields are being updated
    const barcodeFields = ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode'];
    const updatedBarcodeFields = barcodeFields.filter(field => (body as any)[field] !== undefined);
    
    for (const field of updatedBarcodeFields) {
      const barcode = (body as any)[field];
      if (barcode) {
        const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'pc');
        if (isDuplicate) {
          const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'pc');
          const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
          return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in Warehouse IT assets`);
        }
      }
    }
  } else {
    logger.debug('PC Handler: Bypassing duplicate check during update, will delete duplicates');
    // If bypass is requested, delete any duplicate assets in Warehouse IT
    const barcodeFields = ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode'];
    const updatedBarcodeFields = barcodeFields.filter(field => (body as any)[field] !== undefined);
    
    for (const field of updatedBarcodeFields) {
      const barcode = (body as any)[field];
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
                await cacheManager.del(assetCacheKey, { component: 'pc-handler' });
                logger.debug(`Invalidated cache for deleted WarehouseIT asset ${asset.id}`);
              } catch (cacheError: any) {
                logger.warn(`Failed to invalidate cache for WarehouseIT asset ${asset.id}:`, cacheError);
              }
            }
          }
          
          // Also invalidate list caches for WarehouseIT assets
          if (cacheManager && CACHE_PREFIXES) {
            try {
              await cacheManager.invalidateResource(user.tenantId, 'WarehouseIT', { component: 'pc-handler' });
              logger.debug(`Invalidated WarehouseIT asset list caches after deleting ${warehouseAssets.length} assets`);
            } catch (cacheError: any) {
              logger.warn(`Failed to invalidate WarehouseIT asset list caches:`, cacheError);
            }
          }
          
          logger.debug(`PC Handler: Deleted ${warehouseAssets.length} warehouse assets with barcode ${barcode}`);
        } catch (error) {
          logger.error('Error deleting warehouse assets:', error);
          // Continue with the operation even if deletion fails
        }
      }
    }
  }

  // Call the original update method
  logger.debug('PC Handler: Updating PC asset');
  return BaseAssetApiHandler.prototype.update.call(pcHandler, user, id, body);
};

// Override getById method to include related Internet access and License information
pcHandler.getById = async (user: any, id: string) => {
  try {
    // Check permissions
    const hasViewPermission = await pcHandler['checkPermission'](user, 'view');
    if (!hasViewPermission) {
      return errorResponse('Forbidden: Insufficient permissions to view asset', 403);
    }

    // Create cache key for this specific asset if Redis is available
    let cacheKey: string | null = null;
    if (cacheManager && CACHE_PREFIXES) {
      cacheKey = cacheManager.createCompositeKey(
        CACHE_PREFIXES.ASSETS,
        pcHandler['operations'].modelName,
        user.tenantId,
        id
      );
    }

    // Try to get cached result first if Redis is available
    if (cacheManager && cacheKey) {
      const cachedAsset = await cacheManager.get(cacheKey, { component: 'pc-handler' });
      if (cachedAsset) {
        return successResponse(cachedAsset);
      }
    }

    // Get select fields for this asset type
    const selectFields = {
      id: true,
      createdAt: true,
      updatedAt: true,
      tenantId: true,
      // Add other commonly used fields based on asset type
      ...pcHandler['getSelectFieldsForAssetType']()
    };
    
    const asset = await pcHandler['getPrismaModel']().findUnique({
      where: { 
        id,
        tenantId: user.tenantId 
      },
      select: selectFields
    });

    if (!asset) {
      return notFoundResponse(`${pcHandler['operations'].modelName} asset not found`);
    }

    // If the PC asset has a userName, fetch related Internet access information
    let internetAccessInfo = null;
    let hasInternetAccess = false;
    if (asset.userName) {
      try {
        // Find Internet assets with the same userName
        const internetAssets = await db.internet.findMany({
          where: {
            tenantId: user.tenantId,
            userName: asset.userName
          },
          select: {
            id: true,
            dept: true,
            manager: true,
            userName: true,
            email: true,
            ipAddress: true,
            internetAccess: true,
            status: true,
            note: true,
            createdAt: true,
            updatedAt: true
          }
        });

        // If we found Internet assets, include the first one (or all if there are multiple)
        if (internetAssets.length > 0) {
          internetAccessInfo = internetAssets.length === 1 ? internetAssets[0] : internetAssets;
          hasInternetAccess = true;
        }
      } catch (error) {
        logger.warn('Failed to fetch Internet access information for PC asset:', { 
          error: error instanceof Error ? error.message : String(error),
          pcAssetId: id,
          userName: asset.userName
        });
        // Continue without Internet access info if there's an error
      }
    }

    // Fetch related License information based on IP address or userName
    let licenseInfo = null;
    let hasLicense = false;
    
    // First, try to find licenses by IP address if available in custom fields
    if (asset.customFields?.IP) {
      try {
        const licenseAssets = await db.license.findMany({
          where: {
            tenantId: user.tenantId,
            ip: asset.customFields.IP
          },
          select: {
            id: true,
            deviceName: true,
            userName: true,
            dept: true,
            productType: true,
            productKey: true,
            model: true,
            pc: true,
            mac: true,
            ip: true,
            date: true,
            updateStatus: true,
            createdAt: true,
            updatedAt: true
          }
        });

        // If we found License assets, include them
        if (licenseAssets.length > 0) {
          licenseInfo = licenseAssets.length === 1 ? licenseAssets[0] : licenseAssets;
          hasLicense = true;
        }
      } catch (error) {
        logger.warn('Failed to fetch License information for PC asset by IP:', { 
          error: error instanceof Error ? error.message : String(error),
          pcAssetId: id,
          ipAddress: asset.customFields.IP
        });
        // Continue without License info if there's an error
      }
    }
    
    // If no licenses found by IP, try to find by userName
    if (!hasLicense && asset.userName) {
      try {
        const licenseAssets = await db.license.findMany({
          where: {
            tenantId: user.tenantId,
            userName: asset.userName
          },
          select: {
            id: true,
            deviceName: true,
            userName: true,
            dept: true,
            productType: true,
            productKey: true,
            model: true,
            pc: true,
            mac: true,
            ip: true,
            date: true,
            updateStatus: true,
            createdAt: true,
            updatedAt: true
          }
        });

        // If we found License assets, include them
        if (licenseAssets.length > 0) {
          licenseInfo = licenseAssets.length === 1 ? licenseAssets[0] : licenseAssets;
          hasLicense = true;
        }
      } catch (error) {
        logger.warn('Failed to fetch License information for PC asset by userName:', { 
          error: error instanceof Error ? error.message : String(error),
          pcAssetId: id,
          userName: asset.userName
        });
        // Continue without License info if there's an error
      }
    }

    // Add Internet access and License information to the asset object
    const assetWithAdditionalInfo = {
      ...asset,
      internetAccessInfo,
      hasInternetAccess,
      licenseInfo,
      hasLicense
    };

    // Cache the asset if Redis is available
    if (cacheManager && cacheKey) {
      await cacheManager.set(cacheKey, assetWithAdditionalInfo, CACHE_TTL ? CACHE_TTL.ASSETS : 300, { component: 'pc-handler' });
    }

    return successResponse(assetWithAdditionalInfo);
  } catch (error) {
    logger.error(`Error fetching ${pcHandler['operations'].modelName} asset:`, error);
    return errorResponse('Failed to fetch asset details. Please try again later.');
  }
};
