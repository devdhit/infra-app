import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/dashboard/summary - Get dashboard summary statistics by asset type
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get PC summary data: total counts for CPU, Monitor, UPS
    const pcSummary = await db.pC.groupBy({
      by: ['cpuBarcode', 'monitorBarcode', 'upsBarcode'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Calculate total quantities for PC components (only totals, not per code)
    const totalPcs = await db.pC.count({
      where: { tenantId: user.tenantId }
    })
    
    // Count only non-null and non-'N/A' values
    const totalCpus = pcSummary.filter(pc => pc.cpuBarcode && pc.cpuBarcode !== 'N/A').length
    const totalMonitors = pcSummary.filter(pc => pc.monitorBarcode && pc.monitorBarcode !== 'N/A').length
    const totalUps = pcSummary.filter(pc => pc.upsBarcode && pc.upsBarcode !== 'N/A').length

    // Get Laptop summary data: total by status, by model, and custom-fields fields
    const laptopSummary = await db.laptop.groupBy({
      by: ['status', 'model'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get Printer summary data: total by color, Model, by Location, and custom-fields fields
    const printerSummary = await db.printer.groupBy({
      by: ['color', 'model', 'location'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get License summary data: total Software Name Product Type License Key and custom-fields fields
    const licenseSummary = await db.license.groupBy({
      by: ['productType', 'productKey'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get WarehouseIT summary data: total CPU Barcode CPU SAP Barcode Monitor Barcode Monitor SAPBarcode UPSBarcode UPS SAPBarcode Status custom-fields (Model,RAM,CPU,TYPE)
    const warehouseITSummary = await db.warehouseIT.groupBy({
      by: ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'status'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    // Get custom fields for all asset types
    const customFields = await db.customField.findMany({
      where: {
        tenantId: user.tenantId
      }
    })

    // Get all assets to calculate custom field statistics
    const allPcs = await db.pC.findMany({
      where: { tenantId: user.tenantId },
      select: {
        customFields: true
      }
    })

    const allLaptops = await db.laptop.findMany({
      where: { tenantId: user.tenantId },
      select: {
        customFields: true
      }
    })

    const allPrinters = await db.printer.findMany({
      where: { tenantId: user.tenantId },
      select: {
        customFields: true
      }
    })

    const allLicenses = await db.license.findMany({
      where: { tenantId: user.tenantId },
      select: {
        customFields: true
      }
    })

    const allWarehouseItems = await db.warehouseIT.findMany({
      where: { tenantId: user.tenantId },
      select: {
        customFields: true
      }
    })

    // Calculate custom field statistics
    const customFieldStats: Record<string, { count: number, values: Record<string, number> }> = {}
    
    // Get custom fields for each asset type
    const pcCustomFields = customFields.filter(field => field.modelType === 'PC')
    const laptopCustomFields = customFields.filter(field => field.modelType === 'Laptop')
    const printerCustomFields = customFields.filter(field => field.modelType === 'Printer')
    const licenseCustomFields = customFields.filter(field => field.modelType === 'License')
    const warehouseCustomFields = customFields.filter(field => field.modelType === 'WarehouseIT')
    
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
            console.error('Error parsing custom fields:', e)
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

    return new Response(JSON.stringify({
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
      customFields,
      customFieldStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching dashboard summary data:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}