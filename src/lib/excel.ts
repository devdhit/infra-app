import XLSX from 'xlsx-populate'
import * as path from 'path'
import { promises as fs } from 'fs'
import logger from '@/lib/logger'

// Define interfaces for asset templates
export interface PCAsset {
  dept: string;
  cpuBarcode: string;
  cpuSapBarcode?: string;
  monitorBarcode?: string;
  monitorSapBarcode?: string;
  upsBarcode?: string;
  upsSapBarcode?: string;
  pcName: string;
  userName?: string;  // Changed from 'user' to 'userName' to match the database field
  status: string;
  note?: string;
}

export interface LaptopAsset {
  dept: string;
  barcode: string;
  sapBarcode?: string;
  dateBuy?: string;
  userName?: string;  // Changed from 'user' to 'userName' to match the database field
  email?: string;
  model?: string;
  status: string;
}

export interface PrinterAsset {
  dept: string;
  location?: string;
  ip?: string;
  model?: string;
  color: string;
  barcode: string;
  sapCode?: string;
  date?: string;
  note?: string;
}

export interface LicenseAsset {
  deviceName?: string;
  userName?: string;
  dept?: string;
  productType?: string;
  productKey?: string;
  model?: string;
  pc?: string;
  mac?: string;
  ip?: string;
  date?: string;
  updateStatus: string;
}

export interface WarehouseITAsset {
  barcode?: string;
  sapCode?: string;
  status: string;
  note?: string;
}

// Add InternetAsset interface
export interface InternetAsset {
  dept: string;
  manager?: string;
  userName?: string;
  email?: string;
  ipAddress?: string;
  internetAccess?: string;
  status: string;
  note?: string;
}

/**
 * Read template file from the templates directory
 */
async function readTemplateFile(templateName: string): Promise<ArrayBuffer> {
  try {
    // Use path.resolve to ensure we get the correct absolute path
    const templatePath = path.resolve(process.cwd(), 'src', 'templates', templateName);
    logger.debug(`Attempting to read template file from: ${templatePath}`);
    const fileBuffer = await fs.readFile(templatePath);
    logger.debug(`Successfully read template file: ${templateName}, size: ${fileBuffer.byteLength} bytes`);
    // Convert Buffer to ArrayBuffer
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
    logger.debug(`Converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    logger.error(`Error reading template file ${templateName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Template file ${templateName} not found or could not be read: ${errorMessage}`);
  }
}

/**
 * Export PC data to Excel file with template
 */
export async function exportPCToExcel(data: PCAsset[]): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportPCToExcel with ${data.length} records`);
    // Read the PC template
    const templateBuffer = await readTemplateFile('PC_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');
    
    // Find the data start row (usually row 2, but we'll look for the first empty row after headers)
    let dataStartRow = 2;
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    logger.debug(`Data start row found at row ${dataStartRow}`);
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 11; col++) { // Check columns 1-11 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    logger.debug(`Footer start row found at row ${footerStartRow}`);
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < 1000) {
      logger.debug('Footer detected, inserting rows');
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // Find the last row with content in the footer section
        let lastFooterRow = footerStartRow;
        let safetyCounter = 0;
        const MAX_ROWS = 1000;
        while (lastFooterRow < MAX_ROWS) {
          let hasContent = false;
          for (let col = 1; col <= 11; col++) {
            const cellValue = worksheet.cell(lastFooterRow, col).value();
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              hasContent = true;
              break;
            }
          }
          if (!hasContent) break;
          lastFooterRow++;
          safetyCounter++;
          if (safetyCounter > MAX_ROWS) break;
        }
        
        // Now shift all footer rows down by rowsToInsert positions
        // Work backwards to avoid overwriting data
        for (let row = lastFooterRow; row >= footerStartRow; row--) {
          for (let col = 1; col <= 11; col++) {
            const cellValue = worksheet.cell(row, col).value();
            worksheet.cell(row + rowsToInsert, col).value(cellValue);
            // Clear the original cell
            worksheet.cell(row, col).value('');
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 11; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      logger.debug(`Shifted footer by ${rowsToInsert} rows`);
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A')
        worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A')
        worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A')
        worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A')
        worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A')
        worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A')
        worksheet.cell(currentRow, 8).value(row.pcName || 'N/A')
        worksheet.cell(currentRow, 9).value(row.userName || 'N/A')
        // For PC assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 10).value(statusValue)
        worksheet.cell(currentRow, 11).value(row.note || 'N/A')
      });
      logger.debug('Data rows added with footer preservation');
    } else {
      logger.debug('No footer detected, adding data rows normally');
      // No footer found, just add data rows normally
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A')
        worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A')
        worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A')
        worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A')
        worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A')
        worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A')
        worksheet.cell(currentRow, 8).value(row.pcName || 'N/A')
        worksheet.cell(currentRow, 9).value(row.userName || 'N/A')
        // For PC assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 10).value(statusValue)
        worksheet.cell(currentRow, 11).value(row.note || 'N/A')
      });
      logger.debug('Data rows added without footer preservation');
    }
    
    logger.debug('Converting workbook to buffer');
    // Convert to buffer and return
    const result = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('Workbook converted to buffer successfully');
    return result;
  } catch (error) {
    logger.error('Error exporting PC to Excel:', error);
    throw error;
  }
}

/**
 * Export Laptop data to Excel file with template (header and data only)
 */
export async function exportLaptopToExcel(data: LaptopAsset[]): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportLaptopToExcel with ${data.length} records`);
    // Read the Laptop template
    const templateBuffer = await readTemplateFile('Laptop_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');
    
    // Find the data start row
    let dataStartRow = 2;
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    logger.debug(`Checking cell values for data start row detection:`);
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        logger.debug(`Row ${dataStartRow}, Column 1 cell value:`, cellValue);
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          logger.debug(`Found empty cell at row ${dataStartRow}, breaking loop`);
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    logger.debug(`Data start row found at row ${dataStartRow}`);
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 8; col++) { // Check columns 1-8 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < MAX_ROWS) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // For each row we need to insert, shift existing rows down
        // We'll do this by iterating backwards from the footer to the data start row
        for (let i = 0; i < rowsToInsert; i++) {
          // Shift footer rows down by one
          for (let row = footerStartRow + rowsToInsert - i - 1; row >= dataStartRow; row--) {
            for (let col = 1; col <= 8; col++) { // Assuming 8 columns for Laptop template
              const cellValue = worksheet.cell(row, col).value();
              worksheet.cell(row + 1, col).value(cellValue);
              // Clear the original cell
              worksheet.cell(row, col).value('');
            }
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 8; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      
      // Add data rows
      logger.debug('Adding data rows');
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex;
        logger.debug(`Setting values for row ${currentRow}`);
        try {
          worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
          worksheet.cell(currentRow, 2).value(row.barcode || 'N/A');
          worksheet.cell(currentRow, 3).value(row.sapBarcode || 'N/A');
          // Format dateBuy for export without time component
          let dateBuyValue = row.dateBuy || 'N/A';
          if (row.dateBuy && typeof row.dateBuy === 'string') {
            try {
              const dateObj = new Date(row.dateBuy);
              if (!isNaN(dateObj.getTime())) {
                // Format as DD/MM/YYYY for export
                dateBuyValue = new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).format(dateObj);
              }
            } catch (e) {
              // If date parsing fails, keep original value
              dateBuyValue = row.dateBuy;
            }
          }
          worksheet.cell(currentRow, 4).value(dateBuyValue);
          worksheet.cell(currentRow, 5).value(row.userName || 'N/A');  // Changed from 'user' to 'userName'
          worksheet.cell(currentRow, 6).value(row.email || 'N/A');
          worksheet.cell(currentRow, 7).value(row.model || 'N/A');
          // For Laptop assets, preserve the original status value (including Chinese characters)
          const statusValue = row.status ? row.status : 'N/A';
          worksheet.cell(currentRow, 8).value(statusValue)
        } catch (rowError) {
          logger.error(`Error setting values for row ${currentRow}:`, rowError);
        }
      });
      logger.debug('Data rows added with footer preservation');
    } else {
      // No footer found, just add data rows normally
      logger.debug('Adding data rows');
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex;
        logger.debug(`Setting values for row ${currentRow}`);
        try {
          worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
          worksheet.cell(currentRow, 2).value(row.barcode || 'N/A');
          worksheet.cell(currentRow, 3).value(row.sapBarcode || 'N/A');
          // Format dateBuy for export without time component
          let dateBuyValue = row.dateBuy || 'N/A';
          if (row.dateBuy && typeof row.dateBuy === 'string') {
            try {
              const dateObj = new Date(row.dateBuy);
              if (!isNaN(dateObj.getTime())) {
                // Format as DD/MM/YYYY for export
                dateBuyValue = new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).format(dateObj);
              }
            } catch (e) {
              // If date parsing fails, keep original value
              dateBuyValue = row.dateBuy;
            }
          }
          worksheet.cell(currentRow, 4).value(dateBuyValue);
          worksheet.cell(currentRow, 5).value(row.userName || 'N/A');  // Changed from 'user' to 'userName'
          worksheet.cell(currentRow, 6).value(row.email || 'N/A');
          worksheet.cell(currentRow, 7).value(row.model || 'N/A');
          // For Laptop assets, preserve the original status value (including Chinese characters)
          const statusValue = row.status ? row.status : 'N/A';
          worksheet.cell(currentRow, 8).value(statusValue)
        } catch (rowError) {
          logger.error(`Error setting values for row ${currentRow}:`, rowError);
        }
      });
      logger.debug('Data rows added without footer preservation');
    }
    
    logger.debug('Converting workbook to buffer');
    // Convert to buffer and return
    logger.debug('Calling workbook.outputAsync()');
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Workbook output timeout after 30 seconds')), 30000);
    });
    
    const result = await Promise.race([
      workbook.outputAsync() as Promise<ArrayBuffer>,
      timeoutPromise
    ]);
    logger.debug('workbook.outputAsync() completed successfully');
    logger.debug('Workbook converted to buffer successfully');
    return result;
  } catch (error) {
    logger.error('Error exporting Laptop to Excel:', error);
    throw error;
  }
}

/**
 * Export Printer data to Excel file with template (header and data only)
 */
export async function exportPrinterToExcel(data: PrinterAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the Printer template
    const templateBuffer = await readTemplateFile('Printer_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Find the data start row
    let dataStartRow = 2
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 9; col++) { // Check columns 1-9 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < MAX_ROWS) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // For each row we need to insert, shift existing rows down
        // We'll do this by iterating backwards from the footer to the data start row
        for (let i = 0; i < rowsToInsert; i++) {
          // Shift footer rows down by one
          for (let row = footerStartRow + rowsToInsert - i - 1; row >= dataStartRow; row--) {
            for (let col = 1; col <= 9; col++) { // Assuming 9 columns for Printer template
              const cellValue = worksheet.cell(row, col).value();
              worksheet.cell(row + 1, col).value(cellValue);
              // Clear the original cell
              worksheet.cell(row, col).value('');
            }
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 9; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.location || 'N/A')
        worksheet.cell(currentRow, 3).value(row.ip || 'N/A')
        worksheet.cell(currentRow, 4).value(row.model || 'N/A')
        worksheet.cell(currentRow, 5).value(row.color || 'Black & White')
        worksheet.cell(currentRow, 6).value(row.barcode || 'N/A')
        worksheet.cell(currentRow, 7).value(row.sapCode || 'N/A')
        worksheet.cell(currentRow, 8).value(row.date || 'N/A')
        worksheet.cell(currentRow, 9).value(row.note || 'N/A')
      });
    } else {
      // No footer found, just add data rows normally
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.location || 'N/A')
        worksheet.cell(currentRow, 3).value(row.ip || 'N/A')
        worksheet.cell(currentRow, 4).value(row.model || 'N/A')
        worksheet.cell(currentRow, 5).value(row.color || 'Black & White')
        worksheet.cell(currentRow, 6).value(row.barcode || 'N/A')
        worksheet.cell(currentRow, 7).value(row.sapCode || 'N/A')
        worksheet.cell(currentRow, 8).value(row.date || 'N/A')
        worksheet.cell(currentRow, 9).value(row.note || 'N/A')
      });
    }
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    logger.error('Error exporting Printer to Excel:', error)
    throw error
  }
}

/**
 * Export License data to Excel file with template (header and data only)
 */
export async function exportLicenseToExcel(data: LicenseAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the License template
    const templateBuffer = await readTemplateFile('Licenses_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Find the data start row
    let dataStartRow = 2
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 11; col++) { // Check columns 1-11 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < MAX_ROWS) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // For each row we need to insert, shift existing rows down
        // We'll do this by iterating backwards from the footer to the data start row
        for (let i = 0; i < rowsToInsert; i++) {
          // Shift footer rows down by one
          for (let row = footerStartRow + rowsToInsert - i - 1; row >= dataStartRow; row--) {
            for (let col = 1; col <= 11; col++) { // Assuming 11 columns for License template
              const cellValue = worksheet.cell(row, col).value();
              worksheet.cell(row + 1, col).value(cellValue);
              // Clear the original cell
              worksheet.cell(row, col).value('');
            }
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 11; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
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
        // For License assets, preserve the original updateStatus value (including Chinese characters)
        const statusValue = row.updateStatus ? row.updateStatus : 'N/A';
        worksheet.cell(currentRow, 11).value(statusValue)
      });
    } else {
      // No footer found, just add data rows normally
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
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
        // For License assets, preserve the original updateStatus value (including Chinese characters)
        const statusValue = row.updateStatus ? row.updateStatus : 'N/A';
        worksheet.cell(currentRow, 11).value(statusValue)
      });
    }
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    logger.error('Error exporting License to Excel:', error)
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
    
    // Find the data start row
    let dataStartRow = 2
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 8; col++) { // Check columns 1-8 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < MAX_ROWS) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // For each row we need to insert, shift existing rows down
        // We'll do this by iterating backwards from the footer to the data start row
        for (let i = 0; i < rowsToInsert; i++) {
          // Shift footer rows down by one
          for (let row = footerStartRow + rowsToInsert - i - 1; row >= dataStartRow; row--) {
            for (let col = 1; col <= 8; col++) { // Assuming 8 columns for WarehouseIT template
              const cellValue = worksheet.cell(row, col).value();
              worksheet.cell(row + 1, col).value(cellValue);
              // Clear the original cell
              worksheet.cell(row, col).value('');
            }
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 8; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.barcode || 'N/A')
        worksheet.cell(currentRow, 2).value(row.sapCode || 'N/A')
        // For WarehouseIT assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 3).value(statusValue)
        worksheet.cell(currentRow, 4).value(row.note || 'N/A')
      });
    } else {
      // No footer found, just add data rows normally
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.barcode || 'N/A')
        worksheet.cell(currentRow, 2).value(row.sapCode || 'N/A')
        // For WarehouseIT assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 3).value(statusValue)
        worksheet.cell(currentRow, 4).value(row.note || 'N/A')
      });
    }
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    logger.error('Error exporting WarehouseIT to Excel:', error)
    throw error
  }
}

/**
 * Export Internet data to Excel file with template (header and data only)
 */
export async function exportInternetToExcel(data: InternetAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the Internet template
    const templateBuffer = await readTemplateFile('Internet_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Find the data start row
    let dataStartRow = 2
    // Add a safety check to prevent infinite loop
    let safetyCounter = 0;
    const MAX_ROWS = 1000; // Reasonable limit
    while (dataStartRow < MAX_ROWS) {
      try {
        const cellValue = worksheet.cell(dataStartRow, 1).value();
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          break;
        }
      } catch (cellError) {
        logger.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
        break;
      }
      dataStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
        dataStartRow = 3;
        break;
      }
    }
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow;
    // Skip data rows - look for the first row with content after the data start row
    safetyCounter = 0; // Reset safety counter
    while (footerStartRow < MAX_ROWS) { // Reasonable limit
      // Check if this row has content in any of the columns
      let hasContent = false;
      for (let col = 1; col <= 8; col++) { // Check columns 1-8 (our data columns)
        try {
          const cellValue = worksheet.cell(footerStartRow, col).value();
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasContent = true;
            break;
          }
        } catch (cellError) {
          logger.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
        }
      }
      if (hasContent) break;
      footerStartRow++;
      safetyCounter++;
      if (safetyCounter > MAX_ROWS) {
        logger.warn('Safety counter exceeded in footer detection, defaulting to no footer');
        footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
        break;
      }
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < MAX_ROWS) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length;
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        // For each row we need to insert, shift existing rows down
        // We'll do this by iterating backwards from the footer to the data start row
        for (let i = 0; i < rowsToInsert; i++) {
          // Shift footer rows down by one
          for (let row = footerStartRow + rowsToInsert - i - 1; row >= dataStartRow; row--) {
            for (let col = 1; col <= 8; col++) { // Assuming 8 columns for Internet template
              const cellValue = worksheet.cell(row, col).value();
              worksheet.cell(row + 1, col).value(cellValue);
              // Clear the original cell
              worksheet.cell(row, col).value('');
            }
          }
        }
        
        // Copy formatting from the template row (dataStartRow - 1) to all new data rows
        const templateRow = dataStartRow - 1;
        for (let i = 0; i < rowsToInsert; i++) {
          const currentRow = dataStartRow + i;
          // Get all style properties from the template cell and apply to the current cell
          for (let col = 1; col <= 8; col++) {
            try {
              const templateCell = worksheet.cell(templateRow, col);
              const currentCell = worksheet.cell(currentRow, col);
              
              // Get all available styles from template cell
              const allStyles = templateCell.style([
                "bold", "italic", "underline", "strikethrough", "fontSize", "fontFamily", "fontColor",
                "horizontalAlignment", "verticalAlignment", "indent", "wrapText", "shrinkToFit",
                "textDirection", "textRotation", "angleTextCounterclockwise", "angleTextClockwise",
                "rotateTextUp", "rotateTextDown", "verticalText", "fill", "border", "borderColor",
                "borderStyle", "numberFormat"
              ]);
              
              // Apply all styles to current cell
              currentCell.style(allStyles);
            } catch (styleError: any) {
              // If there's an error with styles, just continue - we still want the data
              logger.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
            }
          }
        }
      }
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.manager || 'N/A')
        worksheet.cell(currentRow, 3).value(row.userName || 'N/A')
        worksheet.cell(currentRow, 4).value(row.email || 'N/A')
        worksheet.cell(currentRow, 5).value(row.ipAddress || 'N/A')
        worksheet.cell(currentRow, 6).value(row.internetAccess || 'N/A')
        // For Internet assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 7).value(statusValue)
        worksheet.cell(currentRow, 8).value(row.note || 'N/A')
      });
    } else {
      // No footer found, just add data rows normally
      data.forEach((row, rowIndex) => {
        const currentRow = dataStartRow + rowIndex
        worksheet.cell(currentRow, 1).value(row.dept || 'N/A')
        worksheet.cell(currentRow, 2).value(row.manager || 'N/A')
        worksheet.cell(currentRow, 3).value(row.userName || 'N/A')
        worksheet.cell(currentRow, 4).value(row.email || 'N/A')
        worksheet.cell(currentRow, 5).value(row.ipAddress || 'N/A')
        worksheet.cell(currentRow, 6).value(row.internetAccess || 'N/A')
        // For Internet assets, preserve the original status value (including Chinese characters)
        const statusValue = row.status ? row.status : 'N/A';
        worksheet.cell(currentRow, 7).value(statusValue)
        worksheet.cell(currentRow, 8).value(row.note || 'N/A')
      });
    }
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    logger.error('Error exporting Internet to Excel:', error)
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
    const headers = rows[0]
    
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
        let value = rows[i][j]
        
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
            value = 'N/A' // Change empty user fields to 'N/A'
          } else {
            value = String(value) // Ensure user field is always a string
          }
        }
        // Handle PC Name field - convert empty values to 'N/A'
        else if (header === 'pcName' && (value === null || value === undefined || value === '')) {
          value = 'N/A'
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
            header = 'updateStatus';
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
        
        rowObject[header] = value
      }
      data.push(rowObject)
    }
    
    return data
  } catch (error) {
    logger.error('Error importing from Excel:', error)
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
    userName: '',  // Changed from 'user' to 'userName'
    status: 'working',  // Changed from 'active' to 'working'
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
    dateBuy: undefined,  // Changed from empty string to undefined for proper date handling
    userName: '',  // Changed from 'user' to 'userName'
    email: '',
    model: '',
    status: 'working'  // Changed from 'active' to 'working'
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
    color: 'Black & White',
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
    updateStatus: 'working'  // Changed from 'active' to 'working'
  }]
}

/**
 * Generate template for WarehouseIT assets
 */
export function generateWarehouseITTemplate(): WarehouseITAsset[] {
  return [{
    barcode: '',
    sapCode: '',
    status: 'working',  // Changed from 'available' to 'working'
    note: ''
  }]
}

/**
 * Generate template for Internet assets
 */
export function generateInternetTemplate(): InternetAsset[] {
  return [{
    dept: '',
    manager: '',
    userName: '',
    email: '',
    ipAddress: '',
    internetAccess: '',
    status: '有異動',
    note: ''
  }]
}