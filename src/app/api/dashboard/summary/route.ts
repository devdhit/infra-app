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

    // Get PC summary data: total CPU, Monitor, UPS and custom-fields fields
    const pcSummary = await db.pC.groupBy({
      by: ['cpuBarcode', 'monitorBarcode', 'upsBarcode'],
      where: { tenantId: user.tenantId },
      _count: true
    })

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

    return new Response(JSON.stringify({
      pc: pcSummary,
      laptop: laptopSummary,
      printer: printerSummary,
      license: licenseSummary,
      warehouseIT: warehouseITSummary,
      customFields
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