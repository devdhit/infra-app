import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import XLSX from 'xlsx-populate'

// POST /api/assets/excel/import - Import assets from Excel
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const assetType = formData.get('assetType') as string

    if (!file || !assetType) {
      return new Response(JSON.stringify({ error: 'File and asset type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse Excel file using xlsx-populate
    const arrayBuffer = await file.arrayBuffer()
    const workbook = await XLSX.fromDataAsync(arrayBuffer)
    const worksheet = workbook.sheet(0) // Get the first sheet
    
    // Get the used range
    const usedRange = worksheet.usedRange()
    if (!usedRange) {
      return new Response(JSON.stringify({ error: 'Empty Excel file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get all rows as an array of arrays
    const rows = usedRange.value()
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty Excel file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // First row is headers
    const headers = rows[0]
    
    // Convert remaining rows to objects
    const jsonData: Record<string, unknown>[] = []
    for (let i = 1; i < rows.length; i++) {
      const rowObject: Record<string, unknown> = {}
      for (let j = 0; j < headers.length; j++) {
        rowObject[String(headers[j])] = rows[i][j]
      }
      jsonData.push(rowObject)
    }

    let createdCount = 0
    const errors: string[] = []

    // Process each row based on asset type
    for (const row of jsonData) {
      try {
        switch (assetType) {
          case 'pc':
            // Validate required fields for PC
            if (!row.cpuBarcode || !row.pcName || !row.dept) {
              errors.push(`Row missing required fields: CPU Barcode, PC Name, and Department`)
              continue
            }

            // Check if PC with this CPU barcode already exists
            const existingPC = await db.pC.findUnique({
              where: { cpuBarcode: String(row.cpuBarcode) }
            })

            if (existingPC) {
              errors.push(`PC with CPU Barcode ${String(row.cpuBarcode)} already exists`)
              continue
            }

            await db.pC.create({
              data: {
                ...row as any,
                tenantId: user.tenantId,
                histories: {
                  create: {
                    action: 'create',
                    modelType: 'PC',
                    changes: row,
                    userId: user.id,
                    tenantId: user.tenantId
                  }
                }
              }
            })
            break

          case 'laptop':
            // Validate required fields for Laptop
            if (!row.barcode || !row.dept) {
              errors.push(`Row missing required fields: Barcode and Department`)
              continue
            }

            // Check if Laptop with this barcode already exists
            const existingLaptop = await db.laptop.findUnique({
              where: { barcode: String(row.barcode) }
            })

            if (existingLaptop) {
              errors.push(`Laptop with Barcode ${String(row.barcode)} already exists`)
              continue
            }

            await db.laptop.create({
              data: {
                ...row as any,
                tenantId: user.tenantId,
                histories: {
                  create: {
                    action: 'create',
                    modelType: 'Laptop',
                    changes: row,
                    userId: user.id,
                    tenantId: user.tenantId
                  }
                }
              }
            })
            break

          case 'printer':
            // Validate required fields for Printer
            if (!row.barcode || !row.dept) {
              errors.push(`Row missing required fields: Barcode and Department`)
              continue
            }

            // Check if Printer with this barcode already exists
            const existingPrinter = await db.printer.findUnique({
              where: { barcode: String(row.barcode) }
            })

            if (existingPrinter) {
              errors.push(`Printer with Barcode ${String(row.barcode)} already exists`)
              continue
            }

            await db.printer.create({
              data: {
                ...row as any,
                tenantId: user.tenantId,
                histories: {
                  create: {
                    action: 'create',
                    modelType: 'Printer',
                    changes: row,
                    userId: user.id,
                    tenantId: user.tenantId
                  }
                }
              }
            })
            break

          case 'license':
            // Validate required fields for License
            if (!row.productType || !row.productKey) {
              errors.push(`Row missing required fields: Product Type and Product Key`)
              continue
            }

            await db.license.create({
              data: {
                ...row as any,
                tenantId: user.tenantId,
                histories: {
                  create: {
                    action: 'create',
                    modelType: 'License',
                    changes: row,
                    userId: user.id,
                    tenantId: user.tenantId
                  }
                }
              }
            })
            break

          case 'warehouse':
            await db.warehouseIT.create({
              data: {
                ...row as any,
                tenantId: user.tenantId,
                histories: {
                  create: {
                    action: 'create',
                    modelType: 'WarehouseIT',
                    changes: row,
                    userId: user.id,
                    tenantId: user.tenantId
                  }
                }
              }
            })
            break

          default:
            errors.push(`Unsupported asset type: ${assetType}`)
            continue
        }

        createdCount++
      } catch (error: any) {
        errors.push(`Error processing row: ${error.message}`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      createdCount,
      errors
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error importing Excel file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

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

    // Fetch data based on asset type
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
        break

      default:
        return new Response(JSON.stringify({ error: 'Unsupported asset type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    // Create Excel workbook using xlsx-populate
    const workbook = await XLSX.fromBlankAsync()
    const worksheet = workbook.sheet(0)
    
    // Add headers
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      headers.forEach((header, index) => {
        worksheet.cell(1, index + 1).value(header)
      })
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        headers.forEach((header, colIndex) => {
          worksheet.cell(rowIndex + 2, colIndex + 1).value(row[header])
        })
      })
    }
    
    // Convert to buffer
    const buffer = await workbook.outputAsync() as ArrayBuffer

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