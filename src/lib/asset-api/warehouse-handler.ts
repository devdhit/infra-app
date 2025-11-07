import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { WarehouseITAsset } from '@/types/asset-interfaces';
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
      component: 'warehouse-handler', 
      error: error.message 
    });
  }
}

// Define operations specific to WarehouseIT assets
const warehouseOperations: AssetOperations<WarehouseITAsset> = {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['barcode', 'sapCode', 'status', 'note']
};

// Create handler for WarehouseIT assets
export const warehouseHandler = new BaseAssetApiHandler<WarehouseITAsset>(db, warehouseOperations);

// Override create method to add duplicate checking
warehouseHandler.create = async (user: any, body: Omit<WarehouseITAsset, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> & { customFields?: Record<string, any> }) => {
  // Import logger
  const logger = require('../logger').default;
  
  logger.debug('Warehouse Handler: create called with user tenantId:', user.tenantId);
  logger.debug('Warehouse Handler: create called with body:', body);
  
  // Cast body to any to access bypassDuplicateCheck property
  const bodyWithBypass: any = body;
  logger.debug('Warehouse Handler: bypassDuplicateCheck flag:', bodyWithBypass.bypassDuplicateCheck);
  
  // Check for duplicate barcodes in PC assets unless bypass is requested
  if (!bodyWithBypass.bypassDuplicateCheck) {
    const barcodesToCheck = [
      body.barcode,
      body.sapCode
    ].filter(barcode => barcode);

    for (const barcode of barcodesToCheck) {
      if (barcode) {
        const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'warehouse');
        if (isDuplicate) {
          const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'warehouse');
          const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
          return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in PC assets`);
        }
      }
    }
  } else {
    logger.debug('Warehouse Handler: Bypassing duplicate check, will delete duplicates');
    // If bypass is requested, delete any duplicate assets in PC
    const barcodeToDelete = body.barcode;
    const sapCodeToDelete = body.sapCode;

    try {
      // Find and delete duplicate assets in PC
      const pcAssets = await db.pC.findMany({
        where: {
          tenantId: user.tenantId,
          OR: [
            { cpuBarcode: barcodeToDelete },
            { cpuSapBarcode: barcodeToDelete },
            { monitorBarcode: barcodeToDelete },
            { monitorSapBarcode: barcodeToDelete },
            { upsBarcode: barcodeToDelete },
            { upsSapBarcode: barcodeToDelete },
            { cpuBarcode: sapCodeToDelete },
            { cpuSapBarcode: sapCodeToDelete },
            { monitorBarcode: sapCodeToDelete },
            { monitorSapBarcode: sapCodeToDelete },
            { upsBarcode: sapCodeToDelete },
            { upsSapBarcode: sapCodeToDelete }
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
            await cacheManager.del(assetCacheKey, { component: 'warehouse-handler' });
            logger.debug(`Invalidated cache for deleted PC asset ${asset.id}`);
          } catch (cacheError: any) {
            logger.warn(`Failed to invalidate cache for PC asset ${asset.id}:`, cacheError);
          }
        }
      }
      
      // Also invalidate list caches for PC assets
      if (cacheManager && CACHE_PREFIXES) {
        try {
          await cacheManager.invalidateResource(user.tenantId, 'PC', { component: 'warehouse-handler' });
          logger.debug(`Invalidated PC asset list caches after deleting ${pcAssets.length} assets`);
        } catch (cacheError: any) {
          logger.warn(`Failed to invalidate PC asset list caches:`, cacheError);
        }
      }
      
      logger.debug(`Warehouse Handler: Deleted ${pcAssets.length} PC assets`);
    } catch (error) {
      logger.error('Error deleting PC assets:', error);
      // Continue with the operation even if deletion fails
    }
  }

  // Call the original create method
  logger.debug('Warehouse Handler: Creating new Warehouse IT asset');
  return BaseAssetApiHandler.prototype.create.call(warehouseHandler, user, body);
};

// Override update method to add duplicate checking for barcode fields
warehouseHandler.update = async (user: any, id: string, body: Partial<Omit<WarehouseITAsset, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>> & { customFields?: Record<string, any> }) => {
  // Import logger
  const logger = require('../logger').default;
  
  logger.debug('Warehouse Handler: update called with user tenantId:', user.tenantId);
  logger.debug('Warehouse Handler: update called with id:', id);
  logger.debug('Warehouse Handler: update called with body:', body);
  
  // Cast body to any to access bypassDuplicateCheck property
  const bodyWithBypass: any = body;
  logger.debug('Warehouse Handler: bypassDuplicateCheck flag:', bodyWithBypass.bypassDuplicateCheck);
  
  // Check for duplicate barcodes in PC assets when updating barcode fields unless bypass is requested
  if (!bodyWithBypass.bypassDuplicateCheck) {
    // Check if barcode or sapCode fields are being updated
    const barcodeFields = ['barcode', 'sapCode'];
    const updatedBarcodeFields = barcodeFields.filter(field => (body as any)[field] !== undefined);
    
    for (const field of updatedBarcodeFields) {
      const barcode = (body as any)[field];
      if (barcode) {
        const isDuplicate = await checkForDuplicateBarcode(user.tenantId, barcode, 'warehouse');
        if (isDuplicate) {
          const duplicateInfo = await getDuplicateBarcodeInfo(user.tenantId, barcode, 'warehouse');
          const deptInfo = duplicateInfo ? ` in department ${duplicateInfo.dept}` : '';
          return conflictResponse(`Barcode ${barcode}${deptInfo} already exists in PC assets`);
        }
      }
    }
  } else {
    logger.debug('Warehouse Handler: Bypassing duplicate check during update, will delete duplicates');
    // If bypass is requested, delete any duplicate assets in PC
    const barcodeFields = ['barcode', 'sapCode'];
    const updatedBarcodeFields = barcodeFields.filter(field => (body as any)[field] !== undefined);
    
    for (const field of updatedBarcodeFields) {
      const barcode = (body as any)[field];
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
                await cacheManager.del(assetCacheKey, { component: 'warehouse-handler' });
                logger.debug(`Invalidated cache for deleted PC asset ${asset.id}`);
              } catch (cacheError: any) {
                logger.warn(`Failed to invalidate cache for PC asset ${asset.id}:`, cacheError);
              }
            }
          }
          
          // Also invalidate list caches for PC assets
          if (cacheManager && CACHE_PREFIXES) {
            try {
              await cacheManager.invalidateResource(user.tenantId, 'PC', { component: 'warehouse-handler' });
              logger.debug(`Invalidated PC asset list caches after deleting ${pcAssets.length} assets`);
            } catch (cacheError: any) {
              logger.warn(`Failed to invalidate PC asset list caches:`, cacheError);
            }
          }
          
          logger.debug(`Warehouse Handler: Deleted ${pcAssets.length} PC assets with barcode ${barcode}`);
        } catch (error) {
          logger.error('Error deleting PC assets:', error);
          // Continue with the operation even if deletion fails
        }
      }
    }
  }

  // Call the original update method
  logger.debug('Warehouse Handler: Updating Warehouse IT asset');
  return BaseAssetApiHandler.prototype.update.call(warehouseHandler, user, id, body);
};