import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { importFromExcelWithTemplate } from '@/lib/excel'
import { createAuditLog } from '@/lib/audit-logs'
import logger from '@/lib/logger';

// Import Redis cache for proper cache invalidation
let redisCache: any = null;
let CACHE_PREFIXES: any = null;
if (typeof window === 'undefined') {
  try {
    const redisModule = require('@/lib/redis-cache');
    redisCache = redisModule.default;
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'excel-import-route', 
      error: error.message 
    });
  }
}

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
        logger.error('Error parsing column mapping:', error)
      }
    }

    // Parse Excel file using the new template-based import function
    const jsonData = await importFromExcelWithTemplate(file, assetType, columnMapping)

    let createdCount = 0
    const errors: string[] = []
    const totalRows = jsonData.length

    // Process data in batches to avoid "Maximum call stack size exceeded" error
    const batchSize = 100; // Increase batch size from 50 to 100 to reduce overhead
    for (let i = 0; i < jsonData.length; i += batchSize) {
      // Get a batch of rows
      const batch = jsonData.slice(i, i + batchSize);
      
      // Fetch custom fields once per batch for each asset type to optimize database queries
      let pcCustomFieldsConfig: any[] = [];
      let laptopCustomFieldsConfig: any[] = [];
      let printerCustomFieldsConfig: any[] = [];
      let licenseCustomFieldsConfig: any[] = [];
      let warehouseCustomFieldsConfig: any[] = [];
      let internetCustomFieldsConfig: any[] = [];
      
      // Use a single transaction for fetching all custom fields to reduce connection usage
      if (['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet'].includes(assetType)) {
        const customFieldModelType = assetType === 'pc' ? 'PC' : 
                                    assetType === 'laptop' ? 'Laptop' : 
                                    assetType === 'printer' ? 'Printer' : 
                                    assetType === 'license' ? 'License' : 
                                    assetType === 'warehouse' ? 'WarehouseIT' : 'Internet';
        
        const customFields = await db.customField.findMany({
          where: {
            tenantId: user.tenantId,
            modelType: customFieldModelType
          }
        });
        
        // Assign to the appropriate variable based on asset type
        if (assetType === 'pc') pcCustomFieldsConfig = customFields;
        else if (assetType === 'laptop') laptopCustomFieldsConfig = customFields;
        else if (assetType === 'printer') printerCustomFieldsConfig = customFields;
        else if (assetType === 'license') licenseCustomFieldsConfig = customFields;
        else if (assetType === 'warehouse') warehouseCustomFieldsConfig = customFields;
        else if (assetType === 'internet') internetCustomFieldsConfig = customFields;
      }
      
      // Process each row in the batch
      for (const row of batch) {
        try {
          switch (assetType) {
            case 'pc':
              // For PC assets, we don't check required fields for barcode columns
              // Only check required fields for dept, pcName
              if (row.pcName === null || row.pcName === undefined ||
                  row.dept === null || row.dept === undefined) {
                errors.push(`Row missing required fields: PC Name, and Department`)
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
              
              // Extract custom fields from row data using pre-fetched config
              let pcCustomFields: Record<string, any> | undefined;
              
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
              
              // Also check for any remaining fields in pcRowData that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              const pcModelFields = ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 
                'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 
                'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
                
              // Check if there are any fields in pcRowData that are not part of the PC model
              // and treat them as custom fields
              for (const [key, value] of Object.entries(pcRowData)) {
                if (!pcModelFields.includes(key)) {
                  // Initialize pcCustomFields if not already done
                  if (!pcCustomFields) {
                    pcCustomFields = {};
                  }
                  pcCustomFields[key] = value;
                  // Remove the field from pcRowData
                  delete pcRowData[key];
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
              await createAuditLog(user.tenantId, {
                action: 'import',
                modelType: 'PC',
                recordId: createdPC.id,
                changes: {
                  ...row,
                  id: createdPC.id
                },
                userId: user.id,
                tenantId: user.tenantId
              }, 'import');
              
              // Increment createdCount after successful creation
              createdCount++;
              
              // Real-time event emission removed
              
              // Invalidate Redis cache for PC assets
              if (redisCache && CACHE_PREFIXES) {
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:PC:${user.tenantId}:*`);
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:PC:${user.tenantId}:*`);
                
                // Remove the artificial delay that was causing performance issues
                // await new Promise(resolve => setTimeout(resolve, 1500));
              }
              break;

            case 'laptop':
              // Validate required fields for Laptop
              // Check if fields exist and are not null or undefined (but allow 'N/A')
              if (row.dept === null || row.dept === undefined) {
                errors.push(`Row missing required field: Department`)
                continue
              }

              // Check if Laptop with this barcode already exists (only if barcode is provided)
              if (row.barcode && row.barcode !== 'No Barcode' && row.barcode !== 'N/A') {
                const existingLaptop = await db.laptop.findFirst({
                  where: { 
                    barcode: String(row.barcode),
                    tenantId: user.tenantId
                  }
                })

                if (existingLaptop) {
                  errors.push(`Laptop with Barcode ${String(row.barcode)} already exists`)
                  continue
                }
                
                // Also check if we've already processed a laptop with this barcode in this import batch
                const isDuplicateInBatch = jsonData.slice(0, jsonData.indexOf(row)).some(
                  (prevRow: any) => {
                    const prevBarcode = prevRow.barcode !== undefined && prevRow.barcode !== null ? String(prevRow.barcode) : '';
                    return prevBarcode === String(row.barcode) && prevRow !== row;
                  }
                );

                if (isDuplicateInBatch) {
                  errors.push(`Laptop with Barcode ${String(row.barcode)} already exists in this import batch`)
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
                  // Handle various date formats
                  const dateStr = row.dateBuy;
                  
                  // If it's already an ISO string, use it directly but remove time component
                  if (dateStr.includes('T') && dateStr.includes('Z')) {
                    const dateObj = new Date(dateStr);
                    // Set time to midnight and format as ISO string without time component
                    dateObj.setUTCHours(0, 0, 0, 0);
                    // Store as ISO string without time component
                    dateBuyValue = dateObj.toISOString().split('T')[0];
                  } else {
                    // Try to parse different date formats
                    // Handle Excel serial date numbers
                    if (!isNaN(Number(dateStr)) && Number(dateStr) > 1000) {
                      // Convert Excel serial date to JavaScript Date
                      const dateObj = new Date((Number(dateStr) - 25569) * 86400 * 1000);
                      // Set time to midnight and format as ISO string without time component
                      dateObj.setUTCHours(0, 0, 0, 0);
                      dateBuyValue = dateObj.toISOString().split('T')[0];
                    } else {
                      // Try common date formats
                      // const formats = [
                      //   'MM/DD/YYYY',
                      //   'DD/MM/YYYY',
                      //   'YYYY-MM-DD',
                      //   'MM-DD-YYYY',
                      //   'DD-MM-YYYY'
                      // ];
                      
                      // Try to parse with Date constructor first
                      let dateObj = new Date(dateStr);
                      
                      // If that fails, try with specific formats
                      if (isNaN(dateObj.getTime())) {
                        // Handle DD/MM/YYYY or MM/DD/YYYY ambiguity
                        const parts = dateStr.split(/[/\-]/);
                        if (parts.length === 3) {
                          const [part1, part2, part3] = parts;
                          // Assume YYYY-MM-DD if first part is 4 digits
                          if (part1 && part1.length === 4) {
                            dateObj = new Date(`${part1}-${part2}-${part3}`);
                          } else if (part1 && part2 && part3) {
                            // Try MM/DD/YYYY first, then DD/MM/YYYY
                            dateObj = new Date(`${part3}-${part1}-${part2}`);
                            if (isNaN(dateObj.getTime())) {
                              dateObj = new Date(`${part3}-${part2}-${part1}`);
                            }
                          }
                        }
                      }
                      
                      // Validate the date
                      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1900 || dateObj.getFullYear() > 2100) {
                        dateBuyValue = null;
                      } else {
                        // Set time to midnight and format as ISO string without time component
                        dateObj.setUTCHours(0, 0, 0, 0);
                        dateBuyValue = dateObj.toISOString().split('T')[0];
                      }
                    }
                  }
                } catch (e) {
                  logger.error(`Error parsing date: ${e}`);
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
              const { user: laptopUserField, userName: laptopUserNameField, Status: statusFieldUpper, status: statusFieldLower, dateBuy, ...laptopRowData } = row as any;
              
              // Extract custom fields from row data using pre-fetched config
              let laptopCustomFields: Record<string, any> | undefined;
              
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
              
              // Also check for any remaining fields in laptopRowData that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              const laptopModelFields = ['id', 'dept', 'barcode', 'sapBarcode', 'dateBuy', 
                'userName', 'email', 'model', 'status', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
                
              // Check if there are any fields in laptopRowData that are not part of the Laptop model
              // and treat them as custom fields
              for (const [key, value] of Object.entries(laptopRowData)) {
                if (!laptopModelFields.includes(key)) {
                  // Initialize laptopCustomFields if not already done
                  if (!laptopCustomFields) {
                    laptopCustomFields = {};
                  }
                  laptopCustomFields[key] = value;
                  // Remove the field from laptopRowData
                  delete laptopRowData[key];
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
              await createAuditLog(user.tenantId, {
                action: 'import',
                modelType: 'Laptop',
                recordId: createdLaptop.id,
                changes: {
                  ...row,
                  id: createdLaptop.id
                },
                userId: user.id,
                tenantId: user.tenantId
              }, 'import');
              
              // Increment createdCount after successful creation
              createdCount++;
              
              // Real-time event emission removed
              
              // Invalidate Redis cache for Laptop assets
              if (redisCache && CACHE_PREFIXES) {
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:Laptop:${user.tenantId}:*`);
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:Laptop:${user.tenantId}:*`);
                
                // Remove the artificial delay that was causing performance issues
                // await new Promise(resolve => setTimeout(resolve, 1500));
              }
              break;

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
                  logger.error('Error parsing date:', e);
                  printerDateValue = null;
                }
              }

              // Remove date from row data to handle it separately
              const { date: printerDate, ...printerRowData } = row as any;
              
              // Extract custom fields from row data using pre-fetched config
              let printerCustomFields: Record<string, any> | undefined;
              
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
              
              // Also check for any remaining fields in printerRowData that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              const printerModelFields = ['id', 'dept', 'location', 'ip', 'model', 'color', 
                'barcode', 'sapCode', 'date', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
                
              // Check if there are any fields in printerRowData that are not part of the Printer model
              // and treat them as custom fields
              for (const [key, value] of Object.entries(printerRowData)) {
                if (!printerModelFields.includes(key)) {
                  // Initialize printerCustomFields if not already done
                  if (!printerCustomFields) {
                    printerCustomFields = {};
                  }
                  printerCustomFields[key] = value;
                  // Remove the field from printerRowData
                  delete printerRowData[key];
                }
              }
              
              // Convert barcode to string
              const barcodeValue = String(row.barcode);
              
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
              logger.debug(`Processing printer row with barcode: ${barcodeValue}`);
              logger.debug(`Original row data:`, JSON.stringify(row, null, 2));
              logger.debug(`Processed row data (printerRowData):`, JSON.stringify(printerRowData, null, 2));

              try {
                // For "No Barcode" or "N/A" printers, create without barcode instead of generating unique barcode
                if (barcodeValue === 'No Barcode' || barcodeValue === 'N/A') {
                  logger.debug(`Creating printer without barcode (was: ${barcodeValue})`);
                  
                  const createdPrinter = await db.printer.create({
                    data: {
                      ...printerRowData,
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
                  
                  // Increment createdCount after successful creation
                  createdCount++;
                  
                  // Real-time event emission removed
                  
                  // Invalidate Redis cache for Printer assets
                  if (redisCache && CACHE_PREFIXES) {
                    await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:Printer:${user.tenantId}:*`);
                    await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:Printer:${user.tenantId}:*`);
                  }
                } else if (barcodeValue) {
                  logger.debug(`Checking for existing printer with barcode: ${barcodeValue}`);
                  // For printers with actual barcodes, first check if one already exists in the database
                  const existingPrinter = await db.printer.findFirst({
                    where: {
                      barcode: barcodeValue,
                      tenantId: user.tenantId
                    }
                  });

                  if (existingPrinter) {
                    // Printer already exists in database, skip this row
                    logger.debug(`Printer with barcode ${barcodeValue} already exists in database:`, existingPrinter);
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
                        logger.debug(`Found duplicate in batch: ${barcodeValue}`);
                      }
                      return isMatch;
                    }
                  );

                  if (isDuplicateInBatch) {
                    errors.push(`Printer with Barcode ${barcodeValue} already exists in this import batch`)
                    continue
                  }

                  logger.debug(`Creating new printer with barcode: ${barcodeValue}`);
                  // Printer doesn't exist, create it
                    logger.debug(`Printer data to create:`, JSON.stringify({
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
                  
                  // Increment createdCount after successful creation
                  createdCount++;
                } else {
                  // No barcode provided, create printer without barcode
                  logger.debug(`Creating new printer without barcode`);
                  
                  const createdPrinter = await db.printer.create({
                    data: {
                      ...printerRowData,
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
                  
                  // Increment createdCount after successful creation
                  createdCount++;
                }
              } catch (printerError: any) {
                // More detailed error handling
                logger.error(`Error processing printer row with barcode ${barcodeValue}:`, printerError);
                if (printerError.code === 'P2002') {
                  // Prisma unique constraint error
                  errors.push(`Unique constraint error for barcode ${barcodeValue}: A printer with this barcode already exists`)
                } else if (printerError.code) {
                  errors.push(`Database error for barcode ${barcodeValue} (code: ${printerError.code}): ${printerError.message}`)
                } else {
                  errors.push(`Error processing row: ${printerError.message || 'Unknown error'}`)
                }
                continue
              }
              break;

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
              
              // Handle status field - convert ON to working, OFF to leave
              if (row.status) {
                const status = String(row.status).toUpperCase();
                if (status === 'ON') {
                  row.status = 'working';
                } else if (status === 'OFF') {
                  row.status = 'leave';
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
                  logger.error('Error parsing date:', e);
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
              
              // Extract custom fields from row data using pre-fetched config
              let licenseCustomFields: Record<string, any> | undefined;
              
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
              
              // Also check for any remaining fields in licenseRowData that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              const licenseModelFields = ['id', 'deviceName', 'userName', 'dept', 'productType', 
                'productKey', 'model', 'pc', 'mac', 'ip', 'dateBuy', 'updateStatus', 
                'tenantId', 'customFields', 'createdAt', 'updatedAt'];
                
              // Check if there are any fields in licenseRowData that are not part of the License model
              // and treat them as custom fields
              for (const [key, value] of Object.entries(licenseRowData)) {
                if (!licenseModelFields.includes(key)) {
                  // Initialize licenseCustomFields if not already done
                  if (!licenseCustomFields) {
                    licenseCustomFields = {};
                  }
                  licenseCustomFields[key] = value;
                  // Remove the field from licenseRowData
                  delete licenseRowData[key];
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
              
              // Increment createdCount after successful creation
              createdCount++;
              
              // Real-time event emission removed
              
              // Invalidate Redis cache for License assets
              if (redisCache && CACHE_PREFIXES) {
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:License:${user.tenantId}:*`);
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:License:${user.tenantId}:*`);
                
                // Add a more substantial delay to ensure cache invalidation is complete
                // and allow time for any ongoing requests to complete
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Removed to improve performance
              }
              break;

            case 'warehouse':
              // Extract custom fields from row data using pre-fetched config
              let warehouseCustomFields: Record<string, any> | undefined;
              
              // Define valid WarehouseIT model fields
              const validWarehouseFields = ['barcode', 'sapCode', 'status', 'note'];
              
              // Create warehouseRowData with only valid WarehouseIT fields
              const warehouseRowData: Record<string, any> = {};
              
              // Explicitly set the valid WarehouseIT fields
              for (const field of validWarehouseFields) {
                if (row[field] !== undefined) {
                  warehouseRowData[field] = row[field];
                }
              }
              
              // If status was not provided in the row data, use a default value
              if (!warehouseRowData.status) {
                warehouseRowData.status = 'working';
              }
              
              // Use pre-fetched custom fields config
              if (warehouseCustomFieldsConfig.length > 0) {
                warehouseCustomFields = {};
                for (const customField of warehouseCustomFieldsConfig) {
                  if (row[customField.name] !== undefined && row[customField.name] !== null) {
                    // Handle different custom field types
                    switch (customField.type) {
                      case 'number':
                        const numValue = Number(row[customField.name]);
                        warehouseCustomFields[customField.name] = isNaN(numValue) ? row[customField.name] : numValue;
                        break;
                      case 'boolean':
                        // Convert string values to boolean
                        if (typeof row[customField.name] === 'string') {
                          const strValue = (row[customField.name] as string).toLowerCase();
                          warehouseCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                        } else {
                          warehouseCustomFields[customField.name] = Boolean(row[customField.name]);
                        }
                        break;
                      case 'date':
                        // Try to parse date values
                        if (typeof row[customField.name] === 'string') {
                          const dateValue = new Date(row[customField.name] as string);
                          warehouseCustomFields[customField.name] = isNaN(dateValue.getTime()) ? row[customField.name] : dateValue.toISOString();
                        } else {
                          warehouseCustomFields[customField.name] = row[customField.name];
                        }
                        break;
                      default:
                        warehouseCustomFields[customField.name] = row[customField.name];
                    }
                  }
                }
              }
              
              // Check for any remaining fields that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              for (const [key, value] of Object.entries(row)) {
                // Skip valid WarehouseIT model fields and fields we've already processed
                if (validWarehouseFields.includes(key)) {
                  continue;
                }
                
                // Skip fields that are already identified as custom fields
                if (warehouseCustomFieldsConfig.some(cf => cf.name === key)) {
                  continue;
                }
                
                // If it's not a valid field and not a known custom field, treat it as a custom field
                if (!['id', 'tenantId', 'customFields', 'createdAt', 'updatedAt'].includes(key)) {
                  // Initialize warehouseCustomFields if not already done
                  if (!warehouseCustomFields) {
                    warehouseCustomFields = {};
                  }
                  warehouseCustomFields[key] = value;
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
              
              // Increment createdCount after successful creation
              createdCount++;
              
              // Real-time event emission removed
              
              // Invalidate Redis cache for WarehouseIT assets
              if (redisCache && CACHE_PREFIXES) {
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:WarehouseIT:${user.tenantId}:*`);
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:WarehouseIT:${user.tenantId}:*`);
                
                // Add a more substantial delay to ensure cache invalidation is complete
                // and allow time for any ongoing requests to complete
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Removed to improve performance
              }
              break;

            case 'internet':
              // Validate required fields for Internet
              // Check if fields exist and are not null or undefined (but allow 'N/A')
              if (row.dept === null || row.dept === undefined) {
                errors.push(`Row missing required field: Department`)
                continue
              }

              // Handle user field mapping - if user field exists, store it as userName
              let internetUserName = undefined;
              // Check if user field exists and is not empty
              if (row.user) {
                internetUserName = String(row.user);
              } else if (row.userName) {
                internetUserName = String(row.userName);
              }

              // Handle case sensitivity for status field and convert to 有異動
              let internetStatusValue = '有異動'; // default value changed to 有異動
              if (row.status) {
                const status = String(row.status).toLowerCase();
                // Convert all current statuses to 有異動
                if (['working', 'leave', 'repair'].includes(status)) {
                  internetStatusValue = '有異動';
                } else {
                  internetStatusValue = status;
                }
              } else if (row.Status) {
                const status = String(row.Status).toLowerCase();
                // Convert all current statuses to 有異動
                if (['working', 'leave', 'repair'].includes(status)) {
                  internetStatusValue = '有異動';
                } else {
                  internetStatusValue = status;
                }
              }

              // Remove the user and status fields from row data since we're handling them separately
              const { user: internetUserField, userName: internetUserNameField, Status, status, ...internetRowData } = row as any;
              
              // Extract custom fields from row data
              let internetCustomFields: Record<string, any> | undefined;
              
              // Use pre-fetched custom fields config
              if (internetCustomFieldsConfig.length > 0) {
                internetCustomFields = {};
                for (const customField of internetCustomFieldsConfig) {
                  if (internetRowData[customField.name] !== undefined && internetRowData[customField.name] !== null) {
                    // Handle different custom field types
                    switch (customField.type) {
                      case 'number':
                        const numValue = Number(internetRowData[customField.name]);
                        internetCustomFields[customField.name] = isNaN(numValue) ? internetRowData[customField.name] : numValue;
                        break;
                      case 'boolean':
                        // Convert string values to boolean
                        if (typeof internetRowData[customField.name] === 'string') {
                          const strValue = (internetRowData[customField.name] as string).toLowerCase();
                          internetCustomFields[customField.name] = strValue === 'true' || strValue === 'yes' || strValue === '1';
                        } else {
                          internetCustomFields[customField.name] = Boolean(internetRowData[customField.name]);
                        }
                        break;
                      case 'date':
                        // Try to parse date values
                        if (typeof internetRowData[customField.name] === 'string') {
                          const dateValue = new Date(internetRowData[customField.name]);
                          internetCustomFields[customField.name] = isNaN(dateValue.getTime()) ? internetRowData[customField.name] : dateValue.toISOString();
                        } else {
                          internetCustomFields[customField.name] = internetRowData[customField.name];
                        }
                        break;
                      default:
                        internetCustomFields[customField.name] = internetRowData[customField.name];
                    }
                    // Remove custom field from row data
                    delete internetRowData[customField.name];
                  }
                }
              }
              
              // Also check for any remaining fields in internetRowData that might be custom fields
              // but are not defined in the database yet (could be from Excel column mapping)
              const internetModelFields = ['id', 'dept', 'manager', 'userName', 'email', 'ipAddress', 
                'internetAccess', 'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
                
              // Check if there are any fields in internetRowData that are not part of the Internet model
              // and treat them as custom fields
              for (const [key, value] of Object.entries(internetRowData)) {
                if (!internetModelFields.includes(key)) {
                  // Initialize internetCustomFields if not already done
                  if (!internetCustomFields) {
                    internetCustomFields = {};
                  }
                  internetCustomFields[key] = value;
                  // Remove the field from internetRowData
                  delete internetRowData[key];
                }
              }

              // Create the Internet record first
              const createdInternet = await db.internet.create({
                data: {
                  ...internetRowData,
                  userName: internetUserName, // Use userName instead of userId
                  status: internetStatusValue, // Use the properly cased status value (converted to 有異動)
                  ...(internetCustomFields ? { customFields: internetCustomFields } : {}),
                  tenantId: user.tenantId
                }
              });

              // Then create the history record separately
              await db.history.create({
                data: {
                  action: 'create',
                  modelType: 'Internet',
                  recordId: createdInternet.id,
                  changes: JSON.stringify(row),
                  userId: user.id,
                  tenantId: user.tenantId
                }
              });
              
              // Increment createdCount after successful creation
              createdCount++;
              
              // Real-time event emission removed
              
              // Invalidate Redis cache for Internet assets
              if (redisCache && CACHE_PREFIXES) {
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSETS}:Internet:${user.tenantId}:*`);
                await redisCache.delByPattern(`${CACHE_PREFIXES.ASSET_LIST}:Internet:${user.tenantId}:*`);
                
                // Add a more substantial delay to ensure cache invalidation is complete
                // and allow time for any ongoing requests to complete
                // await new Promise(resolve => setTimeout(resolve, 1000)); // Removed to improve performance
              }
              break;

            default:
              errors.push(`Unsupported asset type: ${assetType}`)
              continue
          }

          // Remove the global createdCount++ since we're incrementing in each case
        } catch (error: any) {
          errors.push(`Error processing row: ${error.message}`)
        }
      }
      
      // Remove the global createdCount++ that was here
      // Add a small delay between batches to prevent overwhelming the server and database connection pool
      // Removed delay to improve performance for large imports
      // if (i + batchSize < jsonData.length) {
      //   await new Promise(resolve => setTimeout(resolve, 1));
      // }
    }

    return new Response(JSON.stringify({
      success: true,
      createdCount,
      errors,
      totalRows // Include total rows for progress tracking
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' 
    }})
  } catch (error: any) {
    logger.error('Error importing Excel file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
