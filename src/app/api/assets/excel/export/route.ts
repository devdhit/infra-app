import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  exportPCToExcel, 
  exportLaptopToExcel, 
  exportPrinterToExcel, 
  exportLicenseToExcel, 
  exportWarehouseITToExcel
} from '@/lib/excel'

// GET /api/assets/excel/export - Export assets to Excel
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get('assetType')

    if (!assetType) {
      return new Response(JSON.stringify({ error: 'Asset type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let data: any[] = []
    let buffer: ArrayBuffer

    // Fetch data based on asset type and export using templates
    switch (assetType) {
      case 'pc':
        data = await db.pC.findMany({
          where: { tenantId: user.tenantId },
          select: {
            dept: true,
            cpuBarcode: true,
            cpuSapBarcode: true,
            monitorBarcode: true,
            monitorSapBarcode: true,
            upsBarcode: true,
            upsSapBarcode: true,
            pcName: true,
            userId: true,
            status: true,
            note: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        })
        buffer = await exportPCToExcel(data)
        break

      case 'laptop':
        data = await db.laptop.findMany({
          where: { tenantId: user.tenantId },
          select: {
            dept: true,
            barcode: true,
            sapBarcode: true,
            dateBuy: true,
            userId: true,
            email: true,
            model: true,
            status: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        })
        buffer = await exportLaptopToExcel(data)
        break

      case 'printer':
        data = await db.printer.findMany({
          where: { tenantId: user.tenantId },
          select: {
            dept: true,
            location: true,
            ip: true,
            model: true,
            color: true,
            barcode: true,
            sapCode: true,
            date: true,
            note: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        })
        buffer = await exportPrinterToExcel(data)
        break

      case 'license':
        data = await db.license.findMany({
          where: { tenantId: user.tenantId },
          select: {
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
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        })
        buffer = await exportLicenseToExcel(data)
        break

      case 'warehouse':
        data = await db.warehouseIT.findMany({
          where: { tenantId: user.tenantId },
          select: {
            cpuBarcode: true,
            cpuSapBarcode: true,
            monitorBarcode: true,
            monitorSapBarcode: true,
            upsBarcode: true,
            upsSapBarcode: true,
            status: true,
            note: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        })
        buffer = await exportWarehouseITToExcel(data)
        break

      default:
        return new Response(JSON.stringify({ error: 'Unsupported asset type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    // Return Excel file
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${assetType}-export.xlsx`
      }
    })
  } catch (error: any) {
    console.error('Error exporting Excel file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}