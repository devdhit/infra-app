import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { importFromExcelWithTemplate } from '@/lib/excel'

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
    const columnMappingJson = formData.get('columnMapping') as string

    if (!file || !assetType) {
      return new Response(JSON.stringify({ error: 'File and asset type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse column mapping if provided
    let columnMapping: Record<string, string> | undefined
    if (columnMappingJson) {
      try {
        columnMapping = JSON.parse(columnMappingJson)
      } catch (error) {
        console.error('Error parsing column mapping:', error)
      }
    }

    // Parse Excel file using the new template-based import function
    const jsonData = await importFromExcelWithTemplate(file, assetType, columnMapping)

    let createdCount = 0
    const errors: string[] = []

    // Process each row based on asset type
    for (const row of jsonData) {
      try {
        switch (assetType) {
          case 'pc':
            // Validate required fields for PC
            // Check if fields exist and are not null
            if (row.cpuBarcode === null || row.cpuBarcode === undefined ||
                row.pcName === null || row.pcName === undefined ||
                row.dept === null || row.dept === undefined) {
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

            // Handle user field mapping - if user field exists, we need to find the user ID
            let pcUserId = null;
            // Check if user field is not 'N/A' before trying to find the user
            if (row.user && row.user !== 'N/A') {
              // Try to find user by email or name
              const foundUser = await db.user.findFirst({
                where: {
                  OR: [
                    { email: String(row.user) },
                    { name: String(row.user) }
                  ],
                  tenantId: user.tenantId
                }
              });
              
              if (foundUser) {
                pcUserId = foundUser.id;
              }
            }

            // Remove the user field from row data since it's not a direct field in the database
            const { user: userField, ...pcRowData } = row as any;

            // Create the PC record first
            const createdPC = await db.pC.create({
              data: {
                ...pcRowData,
                userId: pcUserId, // Use the resolved userId instead of the user field
                tenantId: user.tenantId
              }
            });

            // Then create the history record separately
            await db.history.create({
              data: {
                action: 'create',
                modelType: 'PC',
                recordId: createdPC.id,
                changes: JSON.stringify(row),
                userId: user.id,
                tenantId: user.tenantId
              }
            });
            break

          case 'laptop':
            // Validate required fields for Laptop
            // Check if fields exist and are not null
            if (row.barcode === null || row.barcode === undefined ||
                row.dept === null || row.dept === undefined) {
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

            // Handle user field mapping - if user field exists, we need to find the user ID
            let laptopUserId = null;
            // Check if user field is not 'N/A' before trying to find the user
            if (row.user && row.user !== 'N/A') {
              // Try to find user by email or name
              const foundUser = await db.user.findFirst({
                where: {
                  OR: [
                    { email: String(row.user) },
                    { name: String(row.user) }
                  ],
                  tenantId: user.tenantId
                }
              });
              
              if (foundUser) {
                laptopUserId = foundUser.id;
              }
            }

            // Remove the user field from row data since it's not a direct field in the database
            const { user: laptopUserField, ...laptopRowData } = row as any;

            // Create the Laptop record first
            const createdLaptop = await db.laptop.create({
              data: {
                ...laptopRowData,
                userId: laptopUserId, // Use the resolved userId instead of the user field
                tenantId: user.tenantId
              }
            });

            // Then create the history record separately
            await db.history.create({
              data: {
                action: 'create',
                modelType: 'Laptop',
                recordId: createdLaptop.id,
                changes: JSON.stringify(row),
                userId: user.id,
                tenantId: user.tenantId
              }
            });
            break

          case 'printer':
            // Validate required fields for Printer
            // Check if fields exist and are not null
            if (row.barcode === null || row.barcode === undefined ||
                row.dept === null || row.dept === undefined) {
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

            // Create the Printer record first
            const createdPrinter = await db.printer.create({
              data: {
                ...row as any,
                tenantId: user.tenantId
              }
            });

            // Then create the history record separately
            await db.history.create({
              data: {
                action: 'create',
                modelType: 'Printer',
                recordId: createdPrinter.id,
                changes: JSON.stringify(row),
                userId: user.id,
                tenantId: user.tenantId
              }
            });
            break

          case 'license':
            // Validate required fields for License
            // Check if fields exist and are not null
            if (row.productType === null || row.productType === undefined ||
                row.productKey === null || row.productKey === undefined) {
              errors.push(`Row missing required fields: Product Type and Product Key`)
              continue
            }

            // Create the License record first
            const createdLicense = await db.license.create({
              data: {
                ...row as any,
                tenantId: user.tenantId
              }
            });

            // Then create the history record separately
            await db.history.create({
              data: {
                action: 'create',
                modelType: 'License',
                recordId: createdLicense.id,
                changes: JSON.stringify(row),
                userId: user.id,
                tenantId: user.tenantId
              }
            });
            break

          case 'warehouse':
            // Create the WarehouseIT record first
            const createdWarehouseIT = await db.warehouseIT.create({
              data: {
                ...row as any,
                tenantId: user.tenantId
              }
            });

            // Then create the history record separately
            await db.history.create({
              data: {
                action: 'create',
                modelType: 'WarehouseIT',
                recordId: createdWarehouseIT.id,
                changes: JSON.stringify(row),
                userId: user.id,
                tenantId: user.tenantId
              }
            });
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