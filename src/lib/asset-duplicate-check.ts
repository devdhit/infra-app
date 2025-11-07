import { db } from './db';
import logger from './logger';

/**
 * Check for duplicate barcodes between PC and Warehouse IT assets
 * @param tenantId - The tenant ID to check within
 * @param barcode - The barcode to check for duplicates
 * @param assetType - The type of asset being checked ('pc' or 'warehouse')
 * @returns Promise that resolves to true if duplicate found, false otherwise
 */
export async function checkForDuplicateBarcode(
  tenantId: string,
  barcode: string,
  assetType: 'pc' | 'warehouse'
): Promise<boolean> {
  if (!barcode) return false;

  try {
    if (assetType === 'pc') {
      // Check if this barcode exists in any Warehouse IT asset
      const warehouseAsset = await db.warehouseIT.findFirst({
        where: {
          tenantId,
          OR: [
            { barcode: barcode },
            { sapCode: barcode }
          ]
        }
      });
      
      return !!warehouseAsset;
    } else {
      // Check if this barcode exists in any PC asset
      const pcAsset = await db.pC.findFirst({
        where: {
          tenantId,
          OR: [
            { cpuBarcode: barcode },
            { cpuSapBarcode: barcode },
            { monitorBarcode: barcode },
            { monitorSapBarcode: barcode },
            { upsBarcode: barcode },
            { upsSapBarcode: barcode }
          ]
        }
      });
      
      return !!pcAsset;
    }
  } catch (error) {
    logger.error('Error checking for duplicate barcode:', error);
    return false;
  }
}

/**
 * Get detailed information about duplicate barcodes
 * @param tenantId - The tenant ID to check within
 * @param barcode - The barcode to check for duplicates
 * @param assetType - The type of asset being checked ('pc' or 'warehouse')
 * @returns Promise that resolves to information about the duplicate asset or null
 */
export async function getDuplicateBarcodeInfo(
  tenantId: string,
  barcode: string,
  assetType: 'pc' | 'warehouse'
): Promise<{ id: string; type: string; dept: string } | null> {
  if (!barcode) return null;

  try {
    if (assetType === 'pc') {
      // Check if this barcode exists in any Warehouse IT asset
      const warehouseAsset = await db.warehouseIT.findFirst({
        where: {
          tenantId,
          OR: [
            { barcode: barcode },
            { sapCode: barcode }
          ]
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          barcode: true,
          sapCode: true,
          note: true,
          customFields: true
          // WarehouseIT doesn't have dept field
        }
      });
      
      if (warehouseAsset) {
        return {
          id: warehouseAsset.id,
          type: 'warehouse',
          dept: 'Unknown' // WarehouseIT doesn't have dept field
        };
      }
    } else {
      // Check if this barcode exists in any PC asset
      const pcAsset = await db.pC.findFirst({
        where: {
          tenantId,
          OR: [
            { cpuBarcode: barcode },
            { cpuSapBarcode: barcode },
            { monitorBarcode: barcode },
            { monitorSapBarcode: barcode },
            { upsBarcode: barcode },
            { upsSapBarcode: barcode }
          ]
        },
        select: {
          id: true,
          dept: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          cpuBarcode: true,
          cpuSapBarcode: true,
          monitorBarcode: true,
          monitorSapBarcode: true,
          upsBarcode: true,
          upsSapBarcode: true,
          pcName: true,
          userName: true,
          note: true,
          customFields: true
        }
      });
      
      if (pcAsset) {
        return {
          id: pcAsset.id,
          type: 'pc',
          dept: pcAsset.dept || 'Unknown'
        };
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting duplicate barcode info:', error);
    return null;
  }
}