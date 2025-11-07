import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import logger from '@/lib/logger';

/**
 * GET /api/assets/check-duplicate
 * Check for duplicate barcodes between PC and Warehouse IT assets
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const barcode = searchParams.get('barcode');
    const assetType = searchParams.get('assetType') as 'pc' | 'warehouse';

    // Validate parameters
    if (!tenantId || !barcode || !assetType) {
      return errorResponse('Missing required parameters', 400);
    }

    // Check if user has access to this tenant
    if (user.tenantId !== tenantId) {
      return errorResponse('Forbidden', 403);
    }

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
        }
      });
      
      if (warehouseAsset) {
        return successResponse({
          isDuplicate: true,
          message: `Barcode ${barcode} already exists in Warehouse IT assets`,
          duplicateInfo: {
            id: warehouseAsset.id,
            type: 'warehouse',
            dept: 'Unknown' // WarehouseIT doesn't have dept field
          }
        });
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
        return successResponse({
          isDuplicate: true,
          message: `Barcode ${barcode} already exists in PC assets`,
          duplicateInfo: {
            id: pcAsset.id,
            type: 'pc',
            dept: pcAsset.dept || 'Unknown'
          }
        });
      }
    }
    
    // No duplicate found
    return successResponse({
      isDuplicate: false,
      message: ''
    });
  } catch (error) {
    logger.error('Error checking for duplicate barcode:', error);
    return errorResponse('Internal server error', 500);
  }
}