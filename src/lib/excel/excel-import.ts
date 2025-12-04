import XLSX from 'xlsx-populate';
import logger from '@/lib/logger';

/**
 * Import data from Excel file with template
 * @param file - The Excel file to import
 * @param assetType - The type of asset being imported
 * @param columnMapping - Optional mapping of column names
 * @returns Promise resolving to array of record objects
 */
export async function importFromExcelWithTemplate(
  file: File, 
  assetType: string, 
  columnMapping?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load workbook from ArrayBuffer
    const workbook = await XLSX.fromDataAsync(arrayBuffer);
    const worksheet = workbook.sheet(0); // Get the first sheet

    // Get the used range
    const usedRange = worksheet.usedRange();
    if (!usedRange) {
      return [];
    }

    // Get all rows as an array of arrays
    const rows = usedRange.value();

    if (rows.length === 0) {
      return [];
    }

    // First row is headers
    const headers = rows[0];

    // Convert remaining rows to objects
    const data: Record<string, unknown>[] = [];
    for (let i = 1; i < rows.length; i++) {
      // Check if the row has data (skip empty rows)
      const hasData = (rows[i] as unknown[]).some((cell: unknown) => cell !== null && cell !== undefined && cell !== '');
      if (!hasData) continue;

      const rowObject: Record<string, unknown> = {};
      for (let j = 0; j < headers.length; j++) {
        // Convert header to string to ensure it can be used as an index
        let header = String(headers[j]);
        let value = rows[i][j];

        // Apply column mapping if provided
        if (columnMapping && columnMapping[header]) {
          const mappedHeader = columnMapping[header];
          if (mappedHeader !== undefined) {
            header = mappedHeader;
          }
        }

        // Handle user field with email format (abc.xyz) - convert to string and handle empty values
        if (header === 'userName' || header === 'user') {  // Added check for 'userName' as well
          if (value === null || value === undefined || value === '') {
            value = 'N/A'; // Change empty user fields to 'N/A'
          } else {
            value = String(value); // Ensure user field is always a string
          }
        }
        // Handle PC Name field - convert empty values to 'N/A'
        else if (header === 'pcName' && (value === null || value === undefined || value === '')) {
          value = 'N/A';
        }
        // Handle PC barcode fields - convert empty values to 'N/A' instead of null
        else if (assetType === 'pc' && (
          header === 'cpuBarcode' || 
          header === 'cpuSapBarcode' || 
          header === 'monitorBarcode' || 
          header === 'monitorSapBarcode' ||
          header === 'upsBarcode' || 
          header === 'upsSapBarcode'
        ) && (value === null || value === undefined || value === '')) {
          // For PC barcode assets, we need to allow empty values and convert them to 'N/A'
          value = 'N/A';
        }
        // Handle "no barcode" values for PC CPU barcode specifically
        else if (assetType === 'pc' && header === 'cpuBarcode' && typeof value === 'string' && value.toLowerCase() === 'no barcode') {
          // Keep "no barcode" as is for special handling in the import route
          value = value;
        }
        // Handle required fields for PC assets (dept and pcName only)
        else if (assetType === 'pc' && (header === 'dept' || header === 'pcName') && (value === null || value === undefined || value === '')) {
          // For PC assets, we need to allow empty values for required fields during import
          // The validation will be handled in the API route
          value = null; // Keep as null for proper validation in the API
        }
        // Handle required fields for Laptop assets
        else if (assetType === 'laptop' && header === 'dept' && (value === null || value === undefined || value === '')) {
          // For Laptop assets, we need to allow empty values for required fields during import
          // The validation will be handled in the API route
          value = null; // Keep as null for proper validation in the API
        }
        // Handle date fields for Laptop assets
        else if (assetType === 'laptop' && header === 'dateBuy') {
          if (value === null || value === undefined || value === '') {
            value = null;
          } else {
            // Try to parse the date value
            try {
              // If it's already a string representation of a date, keep it
              if (typeof value === 'string') {
                // Check if it's a valid date string
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  // Ensure the date is reasonable (between 1900 and 2100)
                  if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                    value = value;
                  } else {
                    value = null;
                  }
                } else {
                  value = null;
                }
              } else if (typeof value === 'number') {
                // Handle Excel serial date numbers
                if (value > 1000 && value < 100000) {
                  // Convert Excel serial date to JavaScript Date
                  const date = new Date((value - 25569) * 86400 * 1000);
                  if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                    value = date.toISOString();
                  } else {
                    value = null;
                  }
                } else {
                  value = null;
                }
              } else {
                value = String(value);
              }
            } catch (e) {
              logger.warn(`Could not parse date value for ${header}:`, value);
              value = null;
            }
          }
        }
        // Handle required fields for License assets
        else if (assetType === 'license' && (header === 'productType' || header === 'productKey' || header === 'ProductType' || header === 'ProductKey') && (value === null || value === undefined || value === '')) {
          // For License assets, we need to allow empty values for required fields during import
          // The validation will be handled in the API route
          value = null; // Keep as null for proper validation in the API
        }
        // Fix case sensitivity issues in column names for License assets
        if (assetType === 'license') {
          // Map column names with case insensitivity
          if (header === 'ProductType') {
            header = 'productType';
          } else if (header === 'ProductKey') {
            header = 'productKey';
          } else if (header === 'DeviceName') {
            header = 'deviceName';
          } else if (header === 'UserName') {
            header = 'userName';
          } else if (header === 'UpdateStatus') {
            header = 'status';
          } else if (header === 'Date') {
            header = 'date';
          } else if (header === 'Dept') {
            header = 'dept';
          } else if (header === 'Model') {
            header = 'model';
          } else if (header === 'PC') {
            header = 'pc';
          } else if (header === 'MAC') {
            header = 'mac';
          } else if (header === 'IP') {
            header = 'ip';
          }
        }
        // Handle Printer color field - keep as string value
        else if (assetType === 'printer' && header === 'color') {
          if (typeof value === 'string') {
            // Use the string value as is
            value = value;
          } else if (value === null || value === undefined || value === '') {
            // Empty values default to "Black & White"
            value = "Black & White";
          } else {
            // Convert any other type to string
            value = String(value);
          }
        }
        // Handle FixedAsset date fields
        else if (assetType === 'fixed-asset' && header === 'inputDate') {
          if (value === null || value === undefined || value === '') {
            value = null;
          } else {
            // Try to parse the date value
            try {
              // If it's already a string representation of a date, keep it
              if (typeof value === 'string') {
                // Check if it's a valid date string
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  // Ensure the date is reasonable (between 1900 and 2100)
                  if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                    value = value;
                  } else {
                    value = null;
                  }
                } else {
                  value = null;
                }
              } else if (typeof value === 'number') {
                // Handle Excel serial date numbers
                if (value > 1000 && value < 100000) {
                  // Convert Excel serial date to JavaScript Date
                  const date = new Date((value - 25569) * 86400 * 1000);
                  if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                    value = date.toISOString();
                  } else {
                    value = null;
                  }
                } else {
                  value = null;
                }
              } else {
                value = String(value);
              }
            } catch (e) {
              logger.warn(`Could not parse date value for ${header}:`, value);
              value = null;
            }
          }
        }
        // Convert numeric values to strings for barcode fields to prevent Prisma validation errors
        // This is especially important for SAP barcode fields that might be interpreted as numbers
        else if (header.includes('Barcode') || header.includes('barcode') || 
            header.includes('Sap') || header.includes('sap')) {
          if (typeof value === 'number') {
            value = value.toString();
          } else if (value === null || value === undefined || value === '') {
            value = 'N/A'; // Change empty barcode fields to 'N/A'
          }
        } else {
          // For other fields, use null for empty values
          // Special handling for note fields to preserve Chinese characters
          if (header === 'note' && (value === null || value === undefined)) {
            value = null;
          } else if (value === null || value === undefined || value === '') {
            value = null;
          } else {
            // Ensure all values are properly converted to strings to preserve encoding
            value = String(value);
          }
        }

        rowObject[header] = value;
      }
      data.push(rowObject);
    }

    return data;
  } catch (error) {
    logger.error('Error importing from Excel:', error);
    throw error;
  }
}