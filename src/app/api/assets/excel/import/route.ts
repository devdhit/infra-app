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
            let pcUserName = undefined;
            // Check if user field exists and is not empty before trying to find the user
            if (row.user) {
              pcUserName = String(row.user);
            } else if (row.userName) {
              pcUserName = String(row.userName);
            }

            // Remove the user field from row data since it's not a direct field in the database
            const { user: userField, userName: pcUserNameField, ...pcRowData } = row as any;

            // Create the PC record first
            const createdPC = await db.pC.create({
              data: {
                ...pcRowData,
                userName: pcUserName, // Use the user name instead of user ID
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
            if (row.dept === null || row.dept === undefined) {
              errors.push(`Row missing required field: Department`)
              continue
            }

            // Check if Laptop with this barcode already exists (unless it's "No Barcode")
            if (row.barcode && row.barcode !== 'No Barcode' && row.barcode !== 'N/A') {
              const existingLaptop = await db.laptop.findUnique({
                where: { barcode: String(row.barcode) }
              })

              if (existingLaptop) {
                errors.push(`Laptop with Barcode ${String(row.barcode)} already exists`)
                continue
              }
            }

            // Handle user field mapping - if user field exists, store it as userName
            let laptopUserName = undefined;
            // Check if user field exists and is not empty
            if (row.user) {
              laptopUserName = String(row.user);
            } else if (row.userName) {
              laptopUserName = String(row.userName);
            }

            // Process date fields
            let dateBuyValue = null;
            if (row.dateBuy && typeof row.dateBuy === 'string' && row.dateBuy !== 'N/A') {
              try {
                // The date should already be in ISO format from the importFromExcelWithTemplate function
                dateBuyValue = new Date(row.dateBuy);
                if (isNaN(dateBuyValue.getTime())) {
                  dateBuyValue = null;
                }
              } catch (e) {
                console.error('Error parsing date:', e);
                dateBuyValue = null;
              }
            }

            // Handle case sensitivity for status field
            let statusValue = 'working'; // default value
            if (row.status) {
              statusValue = String(row.status);
            } else if (row.Status) {
              statusValue = String(row.Status);
            }

            // Remove the user and status fields from row data since we're handling them separately
            const { user: laptopUserField, userName: laptopUserNameField, Status, status, dateBuy, ...laptopRowData } = row as any;

            // Create the Laptop record first
            const createdLaptop = await db.laptop.create({
              data: {
                ...laptopRowData,
                userName: laptopUserName, // Use userName instead of userId
                dateBuy: dateBuyValue,
                status: statusValue, // Use the properly cased status value
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

            // Process date field if present
            let printerDateValue = null;
            if (row.date && typeof row.date === 'string' && row.date !== 'N/A') {
              try {
                // The date should already be in ISO format from the importFromExcelWithTemplate function
                printerDateValue = new Date(row.date);
                if (isNaN(printerDateValue.getTime())) {
                  printerDateValue = null;
                }
              } catch (e) {
                console.error('Error parsing date:', e);
                printerDateValue = null;
              }
            }

            // Remove date from row data to handle it separately
            const { date: printerDate, ...printerRowData } = row as any;
            
            // Convert barcode to string
            let barcodeValue = String(row.barcode);
            
            // Ensure color field is properly handled as string
            if (printerRowData.color !== undefined && printerRowData.color !== null) {
              if (typeof printerRowData.color !== 'string') {
                // Convert any non-string value to string
                printerRowData.color = String(printerRowData.color);
              }
            } else {
              // Default to "Black & White" if color is not provided
              printerRowData.color = "Black & White";
            }
            
            // Debug logging
            console.log(`Processing printer row with barcode: ${barcodeValue}`);
            console.log(`Original row data:`, JSON.stringify(row, null, 2));
            console.log(`Processed row data (printerRowData):`, JSON.stringify(printerRowData, null, 2));

            try {
              // For "No Barcode" printers, we need to generate unique barcodes to avoid unique constraint violations
              if (barcodeValue === 'No Barcode' || barcodeValue === 'N/A') {
                // Check if a printer with this exact barcode already exists
                const existingNoBarcodePrinter = await db.printer.findFirst({
                  where: {
                    barcode: barcodeValue,
                    tenantId: user.tenantId
                  }
                });
                
                // If a printer with "No Barcode" or "N/A" already exists, generate a unique barcode
                if (existingNoBarcodePrinter) {
                  // Generate a unique barcode by appending a timestamp
                  barcodeValue = `${barcodeValue}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                  console.log(`Generated unique barcode for No Barcode printer: ${barcodeValue}`);
                }
                
                console.log(`Creating printer with generated unique barcode: ${barcodeValue}`);
                // Create the Printer record first
                const createdPrinter = await db.printer.create({
                  data: {
                    ...printerRowData,
                    barcode: barcodeValue,
                    date: printerDateValue,
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
              } else {
                console.log(`Checking for existing printer with barcode: ${barcodeValue}`);
                // For printers with actual barcodes, first check if one already exists in the database
                const existingPrinter = await db.printer.findFirst({
                  where: {
                    barcode: barcodeValue,
                    tenantId: user.tenantId
                  }
                });

                if (existingPrinter) {
                  // Printer already exists in database, skip this row
                  console.log(`Printer with barcode ${barcodeValue} already exists in database:`, existingPrinter);
                  errors.push(`Printer with Barcode ${barcodeValue} already exists in database (ID: ${existingPrinter.id})`)
                  continue
                }

                // Check if we've already processed a printer with this barcode in this import batch
                // This prevents duplicate creation within the same import operation
                const isDuplicateInBatch = jsonData.slice(0, jsonData.indexOf(row)).some(
                  (prevRow: any) => {
                    // Make sure we're comparing the same barcode field
                    const prevBarcode = prevRow.barcode !== undefined && prevRow.barcode !== null ? String(prevRow.barcode) : '';
                    const isMatch = prevBarcode === barcodeValue && prevRow !== row;
                    if (isMatch) {
                      console.log(`Found duplicate in batch: ${barcodeValue}`);
                    }
                    return isMatch;
                  }
                );

                if (isDuplicateInBatch) {
                  errors.push(`Printer with Barcode ${barcodeValue} already exists in this import batch`)
                  continue
                }

                console.log(`Creating new printer with barcode: ${barcodeValue}`);
                // Printer doesn't exist, create it
                  console.log(`Printer data to create:`, JSON.stringify({
                    ...printerRowData,
                    barcode: barcodeValue,
                    date: printerDateValue,
                    tenantId: user.tenantId
                  }, null, 2));
                
                const createdPrinter = await db.printer.create({
                  data: {
                    ...printerRowData,
                    barcode: barcodeValue,
                    date: printerDateValue,
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
              }
            } catch (printerError: any) {
              // More detailed error handling
              console.error(`Error processing printer row with barcode ${barcodeValue}:`, printerError);
              if (printerError.code === 'P2002') {
                // Prisma unique constraint error
                errors.push(`Unique constraint error for barcode ${barcodeValue}: A printer with this barcode already exists`)
              } else if (printerError.code) {
                errors.push(`Database error for barcode ${barcodeValue} (code: ${printerError.code}): ${printerError.message}`)
              } else {
                errors.push(`Error processing row with barcode ${barcodeValue}: ${printerError.message || 'Unknown error'}`)
              }
              continue
            }
            break

          case 'license':
            // Validate required fields for License
            // Check if fields exist and are not null
            if (row.productType === null || row.productType === undefined ||
                row.productKey === null || row.productKey === undefined) {
              errors.push(`Row missing required fields: Product Type and Product Key`)
              continue
            }

            // Process date field if present
            let licenseDateValue = null;
            if (row.date && typeof row.date === 'string' && row.date !== 'N/A') {
              try {
                // The date should already be in ISO format from the importFromExcelWithTemplate function
                licenseDateValue = new Date(row.date);
                if (isNaN(licenseDateValue.getTime())) {
                  licenseDateValue = null;
                }
              } catch (e) {
                console.error('Error parsing date:', e);
                licenseDateValue = null;
              }
            }

            // Remove date from row data to handle it separately
            const { date: licenseDate, ...licenseRowData } = row as any;

            // Create the License record first
            const createdLicense = await db.license.create({
              data: {
                ...licenseRowData,
                date: licenseDateValue,
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