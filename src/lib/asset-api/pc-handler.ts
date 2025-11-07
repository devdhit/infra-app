import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { PCAsset } from '@/types/asset-interfaces';
import { checkForDuplicateBarcode, getDuplicateBarcodeInfo } from '@/lib/asset-duplicate-check';
import { conflictResponse } from '@/lib/api-utils';
import logger from '@/lib/logger';

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