import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import logger from '@/lib/logger'

// Add better error handling utility
function createErrorResponse(message: string, status: number = 500, details?: any) {
  const errorResponse = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

// Add success response utility
function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      // Add caching headers for better performance
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      // Add CORS headers for better security
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Simple in-memory cache for dashboard data
const dashboardCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 60 seconds

// GET /api/dashboard/summary - Get dashboard summary statistics by asset type with optimized performance
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check if user has permission to view assets dashboard
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'assets',
      'view'
    )
    
    if (!hasViewPermission) {
      return createErrorResponse('Forbidden: Insufficient permissions', 403);
    }

    // Check cache first
    const cacheKey = `${user.tenantId}-dashboard-summary`
    const cached = dashboardCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Return cached data
      return createSuccessResponse(cached.data);
    }

    // Get PC summary data: total counts for CPU, Monitor, UPS
    const pcSummary = await db.pC.groupBy({
      by: ['cpuBarcode', 'monitorBarcode', 'upsBarcode'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching PC summary data:', error);
      throw new Error('Failed to fetch PC data');
    });

    // Calculate total quantities for PC components (only totals, not per code)
    const totalPcs = await db.pC.count({
      where: { tenantId: user.tenantId }
    }).catch(error => {
      logger.error('Error counting PCs:', error);
      throw new Error('Failed to count PCs');
    });
    
    // Count only non-null and non-'N/A' values
    const totalCpus = pcSummary.filter((pc: any) => 
      pc.cpuBarcode && 
      pc.cpuBarcode !== 'N/A' && 
      String(pc.cpuBarcode).trim() !== ''
    ).length;
    
    const totalMonitors = pcSummary.filter((pc: any) => 
      pc.monitorBarcode && 
      pc.monitorBarcode !== 'N/A' && 
      String(pc.monitorBarcode).trim() !== ''
    ).length;
    
    const totalUps = pcSummary.filter((pc: any) => 
      pc.upsBarcode && 
      pc.upsBarcode !== 'N/A' && 
      String(pc.upsBarcode).trim() !== ''
    ).length;

    // Get Laptop summary data: total by status, by model, and custom-fields fields
    const laptopSummary = await db.laptop.groupBy({
      by: ['status', 'model'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching laptop summary data:', error);
      throw new Error('Failed to fetch laptop data');
    });

    // Get Printer summary data: total by color, Model, by Location, and custom-fields fields
    const printerSummary = await db.printer.groupBy({
      by: ['color', 'model', 'location'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching printer summary data:', error);
      throw new Error('Failed to fetch printer data');
    });

    // Get License summary data: total Software Name Product Type License Key and custom-fields fields
    const licenseSummary = await db.license.groupBy({
      by: ['productType', 'productKey'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching license summary data:', error);
      throw new Error('Failed to fetch license data');
    });

    // Get WarehouseIT summary data: total by barcode, sapCode, status
    const warehouseITSummary = await db.warehouseIT.groupBy({
      by: ['barcode', 'sapCode', 'status'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching warehouse IT summary data:', error);
      throw new Error('Failed to fetch warehouse IT data');
    });

    // Get Internet summary data: total by department, manager, status
    const internetSummary = await db.internet.groupBy({
      by: ['dept', 'manager', 'status'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching internet summary data:', error);
      throw new Error('Failed to fetch internet data');
    });

    // Get FixedAsset summary data: total by department, status
    const fixedAssetSummary = await db.fixedAsset.groupBy({
      by: ['dept', 'status'],
      where: { tenantId: user.tenantId },
      _count: true
    }).catch(error => {
      logger.error('Error fetching fixed asset summary data:', error);
      throw new Error('Failed to fetch fixed asset data');
    });

    // Get custom fields for all asset types
    const customFields = await db.customField.findMany({
      where: {
        tenantId: user.tenantId
      }
    }).catch(error => {
      logger.error('Error fetching custom fields:', error);
      throw new Error('Failed to fetch custom fields');
    });

    // Get all assets to calculate custom field statistics with optimized queries
    // Only fetch customFields column to reduce data transfer
    const [allPcs, allLaptops, allPrinters, allLicenses, allWarehouseItems, allInternetItems, allFixedAssets] = await Promise.all([
      db.pC.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching PCs for custom field stats:', error);
        throw new Error('Failed to fetch PCs for custom field statistics');
      }),
      db.laptop.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching laptops for custom field stats:', error);
        throw new Error('Failed to fetch laptops for custom field statistics');
      }),
      db.printer.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching printers for custom field stats:', error);
        throw new Error('Failed to fetch printers for custom field statistics');
      }),
      db.license.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching licenses for custom field stats:', error);
        throw new Error('Failed to fetch licenses for custom field statistics');
      }),
      db.warehouseIT.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching warehouse items for custom field stats:', error);
        throw new Error('Failed to fetch warehouse items for custom field statistics');
      }),
      db.internet.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching internet items for custom field stats:', error);
        throw new Error('Failed to fetch internet items for custom field statistics');
      }),
      db.fixedAsset.findMany({
        where: { tenantId: user.tenantId },
        select: { customFields: true }
      }).catch(error => {
        logger.error('Error fetching fixed assets for custom field stats:', error);
        throw new Error('Failed to fetch fixed assets for custom field statistics');
      })
    ]);

    // Calculate custom field statistics
    const customFieldStats: Record<string, { count: number, values: Record<string, number> }> = {}
    
    // Get custom fields for each asset type (type assertion to match our interface)
    const pcCustomFields = customFields.filter((field: any) => field.modelType === 'PC')
    const laptopCustomFields = customFields.filter((field: any) => field.modelType === 'Laptop')
    const printerCustomFields = customFields.filter((field: any) => field.modelType === 'Printer')
    const licenseCustomFields = customFields.filter((field: any) => field.modelType === 'License')
    const warehouseCustomFields = customFields.filter((field: any) => field.modelType === 'WarehouseIT')
    const internetCustomFields = customFields.filter((field: any) => field.modelType === 'Internet')
    const fixedAssetCustomFields = customFields.filter((field: any) => field.modelType === 'FixedAsset')
    
    // Create a map to track which asset type each custom field belongs to
    const customFieldAssetMap: Record<string, string> = {}
    
    // Populate the asset type map
    const populateAssetMap = (fields: any[], assetType: string) => {
      fields.forEach(field => {
        customFieldAssetMap[field.name] = assetType
        // Initialize stats with asset type prefix to avoid conflicts
        const key = `${assetType}_${field.name}`
        customFieldStats[key] = {
          count: 0,
          values: {}
        }
      })
    }
    
    // Populate for all asset types
    populateAssetMap(pcCustomFields, 'PC')
    populateAssetMap(laptopCustomFields, 'Laptop')
    populateAssetMap(printerCustomFields, 'Printer')
    populateAssetMap(licenseCustomFields, 'License')
    populateAssetMap(warehouseCustomFields, 'WarehouseIT')
    populateAssetMap(internetCustomFields, 'Internet')
    populateAssetMap(fixedAssetCustomFields, 'FixedAsset')
    
    // Helper function to process custom fields for any asset type
    const processCustomFields = (assets: any[], customFieldsConfig: any[], assetType: string) => {
      assets.forEach(asset => {
        if (asset.customFields) {
          try {
            const customFieldsData = typeof asset.customFields === 'string' 
              ? JSON.parse(asset.customFields) 
              : asset.customFields
            
            customFieldsConfig.forEach(field => {
              if (customFieldsData[field.name] !== undefined && customFieldsData[field.name] !== null) {
                const value = String(customFieldsData[field.name])
                // Use asset type prefixed key to avoid conflicts
                const key = `${assetType}_${field.name}`
                customFieldStats[key]!.count++
                
                if (value !== 'N/A' && value !== '') {
                  // Ensure the values object exists
                  if (!customFieldStats[key]!.values) {
                    customFieldStats[key]!.values = {}
                  }
                  customFieldStats[key]!.values[value] = 
                    (customFieldStats[key]!.values[value] || 0) + 1
                }
              }
            })
          } catch (e) {
            logger.error('Error parsing custom fields:', e)
          }
        }
      })
    }
    
    // Process custom fields for each asset type
    processCustomFields(allPcs, pcCustomFields, 'PC')
    processCustomFields(allLaptops, laptopCustomFields, 'Laptop')
    processCustomFields(allPrinters, printerCustomFields, 'Printer')
    processCustomFields(allLicenses, licenseCustomFields, 'License')
    processCustomFields(allWarehouseItems, warehouseCustomFields, 'WarehouseIT')
    processCustomFields(allInternetItems, internetCustomFields, 'Internet')
    processCustomFields(allFixedAssets, fixedAssetCustomFields, 'FixedAsset')

    // Get total FixedAsset count
    const totalFixedAssets = await db.fixedAsset.count({
      where: { tenantId: user.tenantId }
    }).catch(error => {
      logger.error('Error counting FixedAssets:', error);
      throw new Error('Failed to count FixedAssets');
    });

    // Prepare response data with optimized structure
    const responseData = {
      pc: {
        total: totalPcs,
        totalCpus,
        totalMonitors,
        totalUps,
        details: pcSummary
      },
      laptop: laptopSummary,
      printer: printerSummary,
      license: licenseSummary,
      warehouseIT: warehouseITSummary,
      internet: internetSummary,
      fixedAsset: {
        total: totalFixedAssets,
        details: fixedAssetSummary
      },
      customFields,
      customFieldStats
    }

    // Cache the response data
    dashboardCache.set(cacheKey, {
      data: responseData,
      timestamp: now
    })

    return createSuccessResponse(responseData);
  } catch (error: any) {
    logger.error('Error fetching dashboard summary data:', error)
    return createErrorResponse(
      'Internal server error', 
      500, 
      { 
        message: error.message || 'Unknown error occurred',
        // Don't expose sensitive information in production
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}