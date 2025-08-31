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
            // Check if fields exist and are not null or undefined (but allow 'N/A')
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
            
            // Extract custom fields from row data
            let pcCustomFields: Record<string, any> | undefined;
            
            // Get custom fields for this asset type and tenant
            const pcCustomFieldsConfig = await db.customField.findMany({
              where: {
                tenantId: user.tenantId,
                modelType: 'PC'
              }
            });
            
            // Extract custom field values from row data
            if (pcCustomFieldsConfig.length > 0) {
              pcCustomFields = {};
              for (const customField of pcCustomFieldsConfig) {
                if (pcRowData[customField.name] !== undefined && pcRowData[customField.name] !== null) {
                  // Handle different custom field types
                  switch (customField.type) {
                    case 'number':
                      const numValue = Number(pcRowData[customField.name]);
                      pcCustomFields[customField.name] = isNaN(numValue) ? pcRowData[customField.name] : numValue;
                      break;
                    case 'boolean':
                      // Convert string values to boolean
                      if (typeof pcRowData[customField.name] === 'string') {
                        const strValue = (pcRowData[customField.name] as string).toLowerCase();
                        pcCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                      } else {
                        pcCustomFields[customField.name] = Boolean(pcRowData[customField.name]);
                      }
                      break;
                    case 'date':
                      // Try to parse date values
                      if (typeof pcRowData[customField.name] === 'string') {
                        const dateValue = new Date(pcRowData[customField.name]);
                        pcCustomFields[customField.name] = isNaN(dateValue.getTime()) ? pcRowData[customField.name] : dateValue.toISOString();
                      } else {
                        pcCustomFields[customField.name] = pcRowData[customField.name];
                      }
                      break;
                    default:
                      pcCustomFields[customField.name] = pcRowData[customField.name];
                  }
                  // Remove custom field from row data
                  delete pcRowData[customField.name];
                }
              }
            }

            // Create the PC record first
            const createdPC = await db.pC.create({
              data: {
                ...pcRowData,
                userName: pcUserName, // Use the user name instead of user ID
                ...(pcCustomFields ? { customFields: pcCustomFields } : {}),
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
            // Check if fields exist and are not null or undefined (but allow 'N/A')
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
            
            // Extract custom fields from row data
            let laptopCustomFields: Record<string, any> | undefined;
            
            // Get custom fields for this asset type and tenant
            const laptopCustomFieldsConfig = await db.customField.findMany({
              where: {
                tenantId: user.tenantId,
                modelType: 'Laptop'
              }
            });
            
            // Extract custom field values from row data
            if (laptopCustomFieldsConfig.length > 0) {
              laptopCustomFields = {};
              for (const customField of laptopCustomFieldsConfig) {
                if (laptopRowData[customField.name] !== undefined && laptopRowData[customField.name] !== null) {
                  // Handle different custom field types
                  switch (customField.type) {
                    case 'number':
                      const numValue = Number(laptopRowData[customField.name]);
                      laptopCustomFields[customField.name] = isNaN(numValue) ? laptopRowData[customField.name] : numValue;
                      break;
                    case 'boolean':
                      // Convert string values to boolean
                      if (typeof laptopRowData[customField.name] === 'string') {
                        const strValue = (laptopRowData[customField.name] as string).toLowerCase();
                        laptopCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                      } else {
                        laptopCustomFields[customField.name] = Boolean(laptopRowData[customField.name]);
                      }
                      break;
                    case 'date':
                      // Try to parse date values
                      if (typeof laptopRowData[customField.name] === 'string') {
                        const dateValue = new Date(laptopRowData[customField.name]);
                        laptopCustomFields[customField.name] = isNaN(dateValue.getTime()) ? laptopRowData[customField.name] : dateValue.toISOString();
                      } else {
                        laptopCustomFields[customField.name] = laptopRowData[customField.name];
                      }
                      break;
                    default:
                      laptopCustomFields[customField.name] = laptopRowData[customField.name];
                  }
                  // Remove custom field from row data
                  delete laptopRowData[customField.name];
                }
              }
            }

            // Create the Laptop record first
            const createdLaptop = await db.laptop.create({
              data: {
                ...laptopRowData,
                userName: laptopUserName, // Use userName instead of userId
                dateBuy: dateBuyValue,
                status: statusValue, // Use the properly cased status value
                ...(laptopCustomFields ? { customFields: laptopCustomFields } : {}),
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
            // Check if fields exist and are not null or undefined (but allow 'N/A')
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
            
            // Extract custom fields from row data
            let printerCustomFields: Record<string, any> | undefined;
            
            // Get custom fields for this asset type and tenant
            const printerCustomFieldsConfig = await db.customField.findMany({
              where: {
                tenantId: user.tenantId,
                modelType: 'Printer'
              }
            });
            
            // Extract custom field values from row data
            if (printerCustomFieldsConfig.length > 0) {
              printerCustomFields = {};
              for (const customField of printerCustomFieldsConfig) {
                if (printerRowData[customField.name] !== undefined && printerRowData[customField.name] !== null) {
                  // Handle different custom field types
                  switch (customField.type) {
                    case 'number':
                      const numValue = Number(printerRowData[customField.name]);
                      printerCustomFields[customField.name] = isNaN(numValue) ? printerRowData[customField.name] : numValue;
                      break;
                    case 'boolean':
                      // Convert string values to boolean
                      if (typeof printerRowData[customField.name] === 'string') {
                        const strValue = (printerRowData[customField.name] as string).toLowerCase();
                        printerCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                      } else {
                        printerCustomFields[customField.name] = Boolean(printerRowData[customField.name]);
                      }
                      break;
                    case 'date':
                      // Try to parse date values
                      if (typeof printerRowData[customField.name] === 'string') {
                        const dateValue = new Date(printerRowData[customField.name]);
                        printerCustomFields[customField.name] = isNaN(dateValue.getTime()) ? printerRowData[customField.name] : dateValue.toISOString();
                      } else {
                        printerCustomFields[customField.name] = printerRowData[customField.name];
                      }
                      break;
                    default:
                      printerCustomFields[customField.name] = printerRowData[customField.name];
                  }
                  // Remove custom field from row data
                  delete printerRowData[customField.name];
                }
              }
            }
            
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
                    ...(printerCustomFields ? { customFields: printerCustomFields } : {}),
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
            // Normalize field names to handle case sensitivity
            if (row.ProductType && !row.productType) {
              row.productType = row.ProductType;
            }
            if (row.ProductKey && !row.productKey) {
              row.productKey = row.ProductKey;
            }
            if (row.DeviceName && !row.deviceName) {
              row.deviceName = row.DeviceName;
            }
            if (row.UpdateStatus && !row.updateStatus) {
              row.updateStatus = row.UpdateStatus;
            }
            if (row.Date && !row.date) {
              row.date = row.Date;
              // Remove the uppercase Date field to avoid Prisma errors
              delete row.Date;
            }
            if (row.Dept && !row.dept) {
              row.dept = row.Dept;
              delete row.Dept;
            }
            if (row.Model && !row.model) {
              row.model = row.Model;
              delete row.Model;
            }
            if (row.PC && !row.pc) {
              row.pc = row.PC;
              delete row.PC;
            }
            if (row.MAC && !row.mac) {
              row.mac = row.MAC;
              delete row.MAC;
            }
            if (row.IP && !row.ip) {
              row.ip = row.IP;
              delete row.IP;
            }
            
            // Handle updateStatus field - convert ON to working, OFF to leave
            if (row.updateStatus) {
              const status = String(row.updateStatus).toUpperCase();
              if (status === 'ON') {
                row.updateStatus = 'working';
              } else if (status === 'OFF') {
                row.updateStatus = 'leave';
              }
            }
            
            // Validate required fields for License
            // Check if fields exist and are not null, undefined, empty strings, or 'N/A'
            const isProductTypeValid = row.productType !== null && 
                                      row.productType !== undefined && 
                                      row.productType !== '' && 
                                      String(row.productType).toLowerCase() !== 'n/a';
            
            const isProductKeyValid = row.productKey !== null && 
                                     row.productKey !== undefined && 
                                     row.productKey !== '' && 
                                     String(row.productKey).toLowerCase() !== 'n/a';
            
            if (!isProductTypeValid || !isProductKeyValid) {
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
            const { 
              date: licenseDate, 
              Date: upperCaseDateField, 
              Dept: deptField, 
              Model: modelField, 
              PC: pcField, 
              MAC: macField, 
              IP: ipField, 
              ...licenseRowData 
            } = row as any;
            
            // Extract custom fields from row data
            let licenseCustomFields: Record<string, any> | undefined;
            
            // Get custom fields for this asset type and tenant
            const licenseCustomFieldsConfig = await db.customField.findMany({
              where: {
                tenantId: user.tenantId,
                modelType: 'License'
              }
            });
            
            // Extract custom field values from row data
            if (licenseCustomFieldsConfig.length > 0) {
              licenseCustomFields = {};
              for (const customField of licenseCustomFieldsConfig) {
                if (licenseRowData[customField.name] !== undefined && licenseRowData[customField.name] !== null) {
                  // Handle different custom field types
                  switch (customField.type) {
                    case 'number':
                      const numValue = Number(licenseRowData[customField.name]);
                      licenseCustomFields[customField.name] = isNaN(numValue) ? licenseRowData[customField.name] : numValue;
                      break;
                    case 'boolean':
                      // Convert string values to boolean
                      if (typeof licenseRowData[customField.name] === 'string') {
                        const strValue = (licenseRowData[customField.name] as string).toLowerCase();
                        licenseCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                      } else {
                        licenseCustomFields[customField.name] = Boolean(licenseRowData[customField.name]);
                      }
                      break;
                    case 'date':
                      // Try to parse date values
                      if (typeof licenseRowData[customField.name] === 'string') {
                        const dateValue = new Date(licenseRowData[customField.name]);
                        licenseCustomFields[customField.name] = isNaN(dateValue.getTime()) ? licenseRowData[customField.name] : dateValue.toISOString();
                      } else {
                        licenseCustomFields[customField.name] = licenseRowData[customField.name];
                      }
                      break;
                    default:
                      licenseCustomFields[customField.name] = licenseRowData[customField.name];
                  }
                  // Remove custom field from row data
                  delete licenseRowData[customField.name];
                }
              }
            }

            // Create the License record first
            const createdLicense = await db.license.create({
              data: {
                ...licenseRowData,
                date: licenseDateValue,
                ...(licenseCustomFields ? { customFields: licenseCustomFields } : {}),
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
            // Extract custom fields from row data
            let warehouseCustomFields: Record<string, any> | undefined;
            
            // Destructure to only keep valid WarehouseIT fields
            const { 
              Dept: warehouseDeptField, 
              Model: warehouseModelField, 
              PC: warehousePCField, 
              MAC: warehouseMACField, 
              IP: warehouseIPField, 
              DeviceName: warehouseDeviceNameField,
              ProductType: warehouseProductTypeField,
              ProductKey: warehouseProductKeyField,
              Date: warehouseDateField,
              updateStatus: warehouseUpdateStatusField,
              barcode: warehouseBarcodeField,
              sapBarcode: warehouseSapBarcodeField,
              dateBuy: warehouseDateBuyField,
              userId: warehouseUserIdField,
              email: warehouseEmailField,
              location: warehouseLocationField,
              color: warehouseColorField,
              sapCode: warehouseSapCodeField,
              ...warehouseRowData 
            } = row as any;
            
            // Get custom fields for this asset type and tenant
            const warehouseCustomFieldsConfig = await db.customField.findMany({
              where: {
                tenantId: user.tenantId,
                modelType: 'WarehouseIT'
              }
            });
            
            // Extract custom field values from row data
            if (warehouseCustomFieldsConfig.length > 0) {
              warehouseCustomFields = {};
              for (const customField of warehouseCustomFieldsConfig) {
                if (warehouseRowData[customField.name] !== undefined && warehouseRowData[customField.name] !== null) {
                  // Handle different custom field types
                  switch (customField.type) {
                    case 'number':
                      const numValue = Number(warehouseRowData[customField.name]);
                      warehouseCustomFields[customField.name] = isNaN(numValue) ? warehouseRowData[customField.name] : numValue;
                      break;
                    case 'boolean':
                      // Convert string values to boolean
                      if (typeof warehouseRowData[customField.name] === 'string') {
                        const strValue = (warehouseRowData[customField.name] as string).toLowerCase();
                        warehouseCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                      } else {
                        warehouseCustomFields[customField.name] = Boolean(warehouseRowData[customField.name]);
                      }
                      break;
                    case 'date':
                      // Try to parse date values
                      if (typeof warehouseRowData[customField.name] === 'string') {
                        const dateValue = new Date(warehouseRowData[customField.name]);
                        warehouseCustomFields[customField.name] = isNaN(dateValue.getTime()) ? warehouseRowData[customField.name] : dateValue.toISOString();
                      } else {
                        warehouseCustomFields[customField.name] = warehouseRowData[customField.name];
                      }
                      break;
                    default:
                      warehouseCustomFields[customField.name] = warehouseRowData[customField.name];
                  }
                  // Remove custom field from row data
                  delete warehouseRowData[customField.name];
                }
              }
            }

            // Create the WarehouseIT record first
            const createdWarehouseIT = await db.warehouseIT.create({
              data: {
                ...warehouseRowData,
                ...(warehouseCustomFields ? { customFields: warehouseCustomFields } : {}),
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