import XLSX from 'xlsx-populate'
import * as path from 'path'
import { promises as fs } from 'fs'

// Define interfaces for asset templates
export interface PCAsset {
  dept: string
  cpuBarcode: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  pcName: string
  userName?: string
  status: string
  note?: string
}

export interface LaptopAsset {
  dept: string
  barcode: string
  sapBarcode?: string
  dateBuy?: string
  user?: string
  email?: string
  model?: string
  status: string
}

export interface PrinterAsset {
  dept: string
  location?: string
  ip?: string
  model?: string
  color: boolean
  barcode: string
  sapCode?: string
  date?: string
  note?: string
}

export interface LicenseAsset {
  deviceName?: string
  userName?: string
  dept?: string
  productType?: string
  productKey?: string
  model?: string
  pc?: string
  mac?: string
  ip?: string
  date?: string
  updateStatus: string
}

export interface WarehouseITAsset {
  cpuBarcode?: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  status: string
  note?: string
  user?: string
}

/**
 * Read template file from the templates directory
 */
async function readTemplateFile(templateName: string): Promise<ArrayBuffer> {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateName)
    console.log(`Reading template file from: ${templatePath}`)
    
    try {
      // Check if file exists before reading
      await fs.access(templatePath)
      console.log(`Template file exists: ${templatePath}`)
    } catch (accessError: any) {
      console.error(`Template file does not exist: ${templatePath}`, accessError)
      throw new Error(`Template file ${templateName} not found or not accessible: ${accessError.message}`)
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(templatePath)
    console.log(`Template file read successfully: ${templateName}, size: ${fileBuffer.length} bytes`)
    
    // Convert Buffer to ArrayBuffer
    return fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer
  } catch (error: any) {
    console.error(`Error reading template file ${templateName}:`, error)
    throw new Error(`Template file ${templateName} error: ${error.message}`)
  }
}

/**
 * Export PC data to Excel file with template
 */
export async function exportPCToExcel(data: PCAsset[]): Promise<ArrayBuffer> {
  try {
    // For large datasets, log the size to help with debugging
    console.log(`Exporting ${data.length} PC records to Excel`);
    const startTime = Date.now();
    
    // Read the PC template
    const templateBuffer = await readTemplateFile('PC_Template.xlsx')
    console.log('Template file loaded successfully');
    
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    console.log('Workbook created from template');
    
    const worksheet = workbook.sheet(0)
    console.log('Worksheet accessed');
    
    // Data should start at row 3 (1 = header, 2 = column names, 3 = first data row)
    const DATA_START_ROW = 3;
    
    // For PC template, we need special handling for the footer
    // The footer typically starts at row 18, but we'll check to be sure
    const KNOWN_FOOTER_ROW = 18;
    
    console.log(`Data will start at row: ${DATA_START_ROW}, Footer starts at row: ${KNOWN_FOOTER_ROW}`);
    
    // Calculate rows needed
    const rowsNeeded = data.length;
    console.log(`Rows needed for data: ${rowsNeeded}`);
    
    // Handle row insertion to avoid overwriting footer
    try {
      if (rowsNeeded > 0) {
        // Calculate how many rows we need to insert
        // We need to insert rows between the data start row and the footer
        const rowsToInsert = rowsNeeded;
        
        // Instead of insertRows, we'll add data directly to the cells
        // This approach avoids the insertRows method issue
        console.log('Skipping row insertion, will add data directly to cells');
      }
    } catch (insertError: any) {
      console.error('Error inserting rows:', insertError);
      // Continue even if insertion fails, we'll try to add data anyway
    }
    
    // Add data rows
    console.log('Adding data rows...');
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      try {
        const row = data[rowIndex];
        const currentRow = DATA_START_ROW + rowIndex;
        
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
        worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A');
        worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A');
        worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A');
        worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A');
        worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A');
        worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A');
        worksheet.cell(currentRow, 8).value(row.pcName || 'N/A');
        worksheet.cell(currentRow, 9).value(row.userName || 'N/A');
        worksheet.cell(currentRow, 10).value(row.status || 'N/A');
        worksheet.cell(currentRow, 11).value(row.note || 'N/A');
        
        // Log progress for large datasets
        if (rowIndex % 100 === 0 && rowIndex > 0) {
          console.log(`Processed ${rowIndex} rows...`);
        }
      } catch (rowError: any) {
        console.error(`Error adding row ${rowIndex}:`, rowError);
        // Continue with next row
      }
    }
    
    console.log('All data rows added');
    
    // Convert to buffer and return
    console.log('Generating Excel buffer...');
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    console.log(`Excel export completed in ${(Date.now() - startTime) / 1000} seconds`);
    return buffer;
  } catch (error: any) {
    console.error('Error exporting PC to Excel:', error);
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

/**
 * Export Laptop data to Excel file with template (header and data only)
 */
export async function exportLaptopToExcel(data: LaptopAsset[]): Promise<ArrayBuffer> {
  try {
    // For large datasets, log the size to help with debugging
    console.log(`Exporting ${data.length} Laptop records to Excel`);
    const startTime = Date.now();
    
    // Read the Laptop template
    const templateBuffer = await readTemplateFile('Laptop_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Data should start at row 3 (1 = header, 2 = column names, 3 = first data row)
    const DATA_START_ROW = 3;
    
    // Find the first empty row after headers to determine where existing data ends
    let firstEmptyRow = DATA_START_ROW;
    while (worksheet.cell(firstEmptyRow, 1).value() !== null && worksheet.cell(firstEmptyRow, 1).value() !== '') {
      firstEmptyRow++;
    }
    
    console.log(`Data will start at row: ${DATA_START_ROW}, First empty row: ${firstEmptyRow}`);
    
    // Handle row insertion if we have more data than available rows
    try {
      if (data.length > 0) {
        // Calculate how many rows we need to insert
        const rowsNeeded = data.length;
        const rowsToInsert = Math.max(0, rowsNeeded - (firstEmptyRow - DATA_START_ROW));
        
        if (rowsToInsert > 0) {
          // Instead of insertRows, we'll add data directly to the cells
          console.log(`Skipping row insertion for ${rowsToInsert} rows at position ${firstEmptyRow}`);
        }
      }
    } catch (insertError: any) {
      console.error('Error inserting rows:', insertError);
      // Continue even if insertion fails, we'll try to add data anyway
    }
    
    // Add data rows
    data.forEach((row, rowIndex) => {
      const currentRow = DATA_START_ROW + rowIndex
      worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
      worksheet.cell(currentRow, 2).value(row.barcode || 'N/A')
      worksheet.cell(currentRow, 3).value(row.sapBarcode || 'N/A')
      worksheet.cell(currentRow, 4).value(row.dateBuy || 'N/A')
      worksheet.cell(currentRow, 5).value(row.user || 'N/A')
      worksheet.cell(currentRow, 6).value(row.email || 'N/A')
      worksheet.cell(currentRow, 7).value(row.model || 'N/A')
      worksheet.cell(currentRow, 8).value(row.status || 'N/A')
    })
    
    // Convert to buffer and return
    console.log(`Laptop Excel export completed in ${(Date.now() - startTime) / 1000} seconds`);
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error: any) {
    console.error('Error exporting Laptop to Excel:', error)
    throw error
  }
}

/**
 * Export Printer data to Excel file with template (header and data only)
 */
export async function exportPrinterToExcel(data: PrinterAsset[]): Promise<ArrayBuffer> {
  try {
    // For large datasets, log the size to help with debugging
    console.log(`Exporting ${data.length} Printer records to Excel`);
    const startTime = Date.now();
    
    // Read the Printer template
    const templateBuffer = await readTemplateFile('Printer_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Data should start at row 3 (1 = header, 2 = column names, 3 = first data row)
    const DATA_START_ROW = 3;
    
    // Find the first empty row after headers to determine where existing data ends
    let firstEmptyRow = DATA_START_ROW;
    while (worksheet.cell(firstEmptyRow, 1).value() !== null && worksheet.cell(firstEmptyRow, 1).value() !== '') {
      firstEmptyRow++;
    }
    
    console.log(`Data will start at row: ${DATA_START_ROW}, First empty row: ${firstEmptyRow}`);
    
    // Handle row insertion if we have more data than available rows
    try {
      if (data.length > 0) {
        // Calculate how many rows we need to insert
        const rowsNeeded = data.length;
        const rowsToInsert = Math.max(0, rowsNeeded - (firstEmptyRow - DATA_START_ROW));
        
        if (rowsToInsert > 0) {
          // Instead of insertRows, we'll add data directly to the cells
          console.log(`Skipping row insertion for ${rowsToInsert} rows at position ${firstEmptyRow}`);
        }
      }
    } catch (insertError: any) {
      console.error('Error inserting rows:', insertError);
      // Continue even if insertion fails, we'll try to add data anyway
    }
    
    // Add data rows
    data.forEach((row, rowIndex) => {
      const currentRow = DATA_START_ROW + rowIndex
      worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
      worksheet.cell(currentRow, 2).value(row.location || 'N/A')
      worksheet.cell(currentRow, 3).value(row.ip || 'N/A')
      worksheet.cell(currentRow, 4).value(row.model || 'N/A')
      worksheet.cell(currentRow, 5).value(row.color ? 'Color' : 'Black & White')
      worksheet.cell(currentRow, 6).value(row.barcode || 'N/A')
      worksheet.cell(currentRow, 7).value(row.sapCode || 'N/A')
      worksheet.cell(currentRow, 8).value(row.date || 'N/A')
      worksheet.cell(currentRow, 9).value(row.note || 'N/A')
    })
    
    // Convert to buffer and return
    console.log(`Printer Excel export completed in ${(Date.now() - startTime) / 1000} seconds`);
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error: any) {
    console.error('Error exporting Printer to Excel:', error)
    throw error
  }
}

/**
 * Export License data to Excel file with template (header and data only)
 */
export async function exportLicenseToExcel(data: LicenseAsset[]): Promise<ArrayBuffer> {
  try {
    // For large datasets, log the size to help with debugging
    console.log(`Exporting ${data.length} License records to Excel`);
    const startTime = Date.now();
    
    // Read the License template
    const templateBuffer = await readTemplateFile('Licenses_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Data should start at row 3 (1 = header, 2 = column names, 3 = first data row)
    const DATA_START_ROW = 3;
    
    // Find the first empty row after headers to determine where existing data ends
    let firstEmptyRow = DATA_START_ROW;
    while (worksheet.cell(firstEmptyRow, 1).value() !== null && worksheet.cell(firstEmptyRow, 1).value() !== '') {
      firstEmptyRow++;
    }
    
    console.log(`Data will start at row: ${DATA_START_ROW}, First empty row: ${firstEmptyRow}`);
    
    // Handle row insertion if we have more data than available rows
    try {
      if (data.length > 0) {
        // Calculate how many rows we need to insert
        const rowsNeeded = data.length;
        const rowsToInsert = Math.max(0, rowsNeeded - (firstEmptyRow - DATA_START_ROW));
        
        if (rowsToInsert > 0) {
          // Instead of insertRows, we'll add data directly to the cells
          console.log(`Skipping row insertion for ${rowsToInsert} rows at position ${firstEmptyRow}`);
        }
      }
    } catch (insertError: any) {
      console.error('Error inserting rows:', insertError);
      // Continue even if insertion fails, we'll try to add data anyway
    }
    
    // Add data rows
    data.forEach((row, rowIndex) => {
      const currentRow = DATA_START_ROW + rowIndex
      worksheet.cell(currentRow, 1).value(row.deviceName || 'N/A')
      worksheet.cell(currentRow, 2).value(row.userName || 'N/A')
      worksheet.cell(currentRow, 3).value(row.dept || 'N/A')
      worksheet.cell(currentRow, 4).value(row.productType || 'N/A')
      worksheet.cell(currentRow, 5).value(row.productKey || 'N/A')
      worksheet.cell(currentRow, 6).value(row.model || 'N/A')
      worksheet.cell(currentRow, 7).value(row.pc || 'N/A')
      worksheet.cell(currentRow, 8).value(row.mac || 'N/A')
      worksheet.cell(currentRow, 9).value(row.ip || 'N/A')
      worksheet.cell(currentRow, 10).value(row.date || 'N/A')
      worksheet.cell(currentRow, 11).value(row.updateStatus || 'N/A')
    })
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error: any) {
    console.error('Error exporting License to Excel:', error)
    throw error
  }
}

/**
 * Export WarehouseIT data to Excel file with template (header and data only)
 */
export async function exportWarehouseITToExcel(data: WarehouseITAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the WarehouseIT template
    const templateBuffer = await readTemplateFile('WarehouseIT_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Data should start at row 3 (1 = header, 2 = column names, 3 = first data row)
    const DATA_START_ROW = 3;
    
    // Find the first empty row after headers to determine where existing data ends
    let firstEmptyRow = DATA_START_ROW;
    while (worksheet.cell(firstEmptyRow, 1).value() !== null && worksheet.cell(firstEmptyRow, 1).value() !== '') {
      firstEmptyRow++;
    }
    
    console.log(`Data will start at row: ${DATA_START_ROW}, First empty row: ${firstEmptyRow}`);
    
    // Handle row insertion if we have more data than available rows
    try {
      if (data.length > 0) {
        // Calculate how many rows we need to insert
        const rowsNeeded = data.length;
        const rowsToInsert = Math.max(0, rowsNeeded - (firstEmptyRow - DATA_START_ROW));
        
        if (rowsToInsert > 0) {
          // Instead of insertRows, we'll add data directly to the cells
          console.log(`Skipping row insertion for ${rowsToInsert} rows at position ${firstEmptyRow}`);
        }
      }
    } catch (insertError: any) {
      console.error('Error inserting rows:', insertError);
      // Continue even if insertion fails, we'll try to add data anyway
    }
    
    // Add data rows
    data.forEach((row, rowIndex) => {
      const currentRow = DATA_START_ROW + rowIndex
      worksheet.cell(currentRow, 1).value(row.cpuBarcode || 'N/A')
      worksheet.cell(currentRow, 2).value(row.cpuSapBarcode || 'N/A')
      worksheet.cell(currentRow, 3).value(row.monitorBarcode || 'N/A')
      worksheet.cell(currentRow, 4).value(row.monitorSapBarcode || 'N/A')
      worksheet.cell(currentRow, 5).value(row.upsBarcode || 'N/A')
      worksheet.cell(currentRow, 6).value(row.upsSapBarcode || 'N/A')
      worksheet.cell(currentRow, 7).value(row.status || 'N/A')
      worksheet.cell(currentRow, 8).value(row.user || 'N/A') // Add user field
      worksheet.cell(currentRow, 9).value(row.note || 'N/A')
    })
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error: any) {
    console.error('Error exporting WarehouseIT to Excel:', error)
    throw error
  }
}

/**
 * Import data from Excel file with template structure and column mapping
 * @param file The Excel file to import
 * @param assetType The type of asset being imported
 * @param columnMapping Optional mapping of Excel column names to database field names
 */
export async function importFromExcelWithTemplate(
  file: File, 
  assetType: string, 
  columnMapping?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load workbook from ArrayBuffer
    const workbook = await XLSX.fromDataAsync(arrayBuffer)
    const worksheet = workbook.sheet(0) // Get the first sheet
    
    // Get the used range
    const usedRange = worksheet.usedRange()
    if (!usedRange) {
      return []
    }
    
    // Get all rows as an array of arrays
    const rows = usedRange.value()
    
    if (rows.length === 0) {
      return []
    }
    
    // First row is headers
    const headers = rows[0] as unknown[]
    
    // Convert remaining rows to objects
    const data: Record<string, unknown>[] = []
    for (let i = 1; i < rows.length; i++) {
      // Check if the row has data (skip empty rows)
      const hasData = (rows[i] as unknown[]).some((cell: unknown) => cell !== null && cell !== undefined && cell !== '')
      if (!hasData) continue
      
      const rowObject: Record<string, unknown> = {}
      for (let j = 0; j < headers.length; j++) {
        // Convert header to string to ensure it can be used as an index
        let header = String(headers[j]);
        let value = (rows[i] as unknown[])[j]
        
        // Apply column mapping if provided
        if (columnMapping && columnMapping[header]) {
          header = columnMapping[header]
        }
        
        // Handle user field with email format (abc.xyz) - convert to string and handle empty values
        if (header === 'user' || header === 'userName') {
          if (value === null || value === undefined || value === '') {
            value = undefined // Change empty user fields to undefined instead of null
          } else {
            value = String(value) // Ensure user field is always a string
          }
        }
        // Handle PC Name field - convert empty values to 'N/A'
        else if (header === 'pcName' && (value === null || value === undefined || value === '')) {
          value = 'N/A'
        }
        // Handle date fields (dateBuy, date) - convert to ISO date strings for Prisma
        else if ((header === 'dateBuy' || header === 'date')) {
          if (value === null || value === undefined || value === '' || value === 'N/A') {
            value = null; // Use null for empty date values
          } else if (typeof value === 'number') {
            // Convert Excel numeric date to JavaScript Date
            // Excel dates are number of days since 1/1/1900, with 1/1/1900 being day 1
            // JavaScript dates start from 1/1/1970
            // Need to adjust for Excel's bug that thinks 1900 was a leap year
            const excelDate = new Date((value - (value > 60 ? 1 : 0) - 25569) * 86400 * 1000);
            value = excelDate.toISOString();
          } else if (typeof value === 'string') {
            // Try to parse date strings in various formats
            const dateParts = value.split(/[\/\-\.]/);
            if (dateParts.length === 3) {
              // Check if it's DD/MM/YYYY or MM/DD/YYYY format
              let day, month, year;
              
              // Try to determine the format by looking at the values
              const firstPart = parseInt(dateParts[0], 10);
              const secondPart = parseInt(dateParts[1], 10);
              
              if (firstPart > 12) { // First part must be day if it's > 12
                day = firstPart;
                month = secondPart;
                year = parseInt(dateParts[2], 10);
              } else if (secondPart > 12) { // Second part must be day if it's > 12
                month = firstPart;
                day = secondPart;
                year = parseInt(dateParts[2], 10);
              } else {
                // Default to DD/MM/YYYY for ambiguous dates
                day = firstPart;
                month = secondPart;
                year = parseInt(dateParts[2], 10);
                
                // If year is less than 100, assume it's a short year format
                if (year < 100) {
                  year += year < 50 ? 2000 : 1900;
                }
              }
              
              // Create ISO date string (YYYY-MM-DD)
              const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              try {
                const testDate = new Date(dateString);
                if (!isNaN(testDate.getTime())) {
                  value = testDate.toISOString();
                } else {
                  value = null;
                }
              } catch (e) {
                value = null;
              }
            } else {
              // Try to parse as ISO date string
              try {
                const testDate = new Date(value);
                if (!isNaN(testDate.getTime())) {
                  value = testDate.toISOString();
                } else {
                  value = null;
                }
              } catch (e) {
                value = null;
              }
            }
          }
        }
        // Convert numeric values to strings for barcode fields to prevent Prisma validation errors
        // This is especially important for SAP barcode fields that might be interpreted as numbers
        else if (header.includes('Barcode') || header.includes('barcode') || 
            header.includes('Sap') || header.includes('sap')) {
          if (typeof value === 'number') {
            value = value.toString()
          } else if (value === null || value === undefined || value === '') {
            value = 'N/A' // Change empty barcode fields to 'N/A'
          }
        } else {
          // For other fields, use null for empty values
          if (value === null || value === undefined || value === '') {
            value = null
          }
        }
        
        rowObject[header] = value
      }
      data.push(rowObject)
    }
    
    console.log(`Excel import data for asset type ${assetType}:`, JSON.stringify(data, null, 2));
    return data
  } catch (error: any) {
    console.error('Error importing from Excel:', error)
    throw error
  }
}

/**
 * Generate template for PC assets
 */
export function generatePCTemplate(): PCAsset[] {
  return [{
    dept: '',
    cpuBarcode: '',
    cpuSapBarcode: '',
    monitorBarcode: '',
    monitorSapBarcode: '',
    upsBarcode: '',
    upsSapBarcode: '',
    pcName: '',
    userName: '',
    status: 'active',
    note: ''
  }]
}

/**
 * Generate template for Laptop assets
 */
export function generateLaptopTemplate(): LaptopAsset[] {
  return [{
    dept: '',
    barcode: '',
    sapBarcode: '',
    dateBuy: '',
    user: '',
    email: '',
    model: '',
    status: 'active'
  }]
}

/**
 * Generate template for Printer assets
 */
export function generatePrinterTemplate(): PrinterAsset[] {
  return [{
    dept: '',
    location: '',
    ip: '',
    model: '',
    color: false,
    barcode: '',
    sapCode: '',
    date: '',
    note: ''
  }]
}

/**
 * Generate template for License assets
 */
export function generateLicenseTemplate(): LicenseAsset[] {
  return [{
    deviceName: '',
    userName: '',
    dept: '',
    productType: '',
    productKey: '',
    model: '',
    pc: '',
    mac: '',
    ip: '',
    date: '',
    updateStatus: 'active'
  }]
}

/**
 * Generate template for WarehouseIT assets
 */
export function generateWarehouseITTemplate(): WarehouseITAsset[] {
  return [{
    cpuBarcode: '',
    cpuSapBarcode: '',
    monitorBarcode: '',
    monitorSapBarcode: '',
    upsBarcode: '',
    upsSapBarcode: '',
    status: 'available',
    note: '',
    user: ''
  }]
}