import XLSX from 'xlsx-populate';
import * as path from 'path';
import { promises as fs } from 'fs';
import logger from '@/lib/logger';
import { PCAsset, LaptopAsset, PrinterAsset, LicenseAsset, WarehouseITAsset, InternetAsset, FixedAsset } from '@/types/asset-interfaces';

/**
 * Read template file from the templates directory
 * @param templateName - Name of the template file
 * @returns Promise resolving to ArrayBuffer of the template
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
 * @param data - Array of PC assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportPCToExcel(data: PCAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportPCToExcel with ${data.length} records`);
    // Read the PC template
    const templateBuffer = await readTemplateFile('PC_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    // Find the cell containing "INVENTORY PC INFORMATION DAIHOA" and update it
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'PC'; // This is PC export
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) { // Check first 20 columns for the header
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY PC INFORMATION DAIHOA')) {
          // Replace with dynamic information (uppercase assets and tenant)
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        // Continue to next column if there's an error reading this cell
        continue;
      }
    }

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
          // Check if this row has content in any of the columns
          let hasContent = false;
          for (let col = 1; col <= 11; col++) { // Check columns 1-11 (our data columns)
            try {
              const cellValue = worksheet.cell(lastFooterRow, col).value();
              if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                hasContent = true;
                break;
              }
            } catch (cellError) {
              logger.error(`Error reading cell at row ${lastFooterRow}, column ${col}:`, cellError);
            }
          }
          if (!hasContent) break;
          lastFooterRow++;
          safetyCounter++;
          if (safetyCounter > MAX_ROWS) {
            logger.warn('Safety counter exceeded in last footer row detection, defaulting to current row');
            break;
          }
        }
        logger.debug(`Last footer row found at row ${lastFooterRow}`);

        // Insert rows for our data
        worksheet.insertRows(dataStartRow, rowsToInsert);

        // Write data to the inserted rows
        for (let i = 0; i < data.length; i++) {
          const rowIndex = dataStartRow + i;
          const pc = data[i];
          
          // Write PC data to cells
          worksheet.cell(rowIndex, 1).value(pc?.dept || '');
          worksheet.cell(rowIndex, 2).value(pc?.cpuBarcode || '');
          worksheet.cell(rowIndex, 3).value(pc?.cpuSapBarcode || '');
          worksheet.cell(rowIndex, 4).value(pc?.monitorBarcode || '');
          worksheet.cell(rowIndex, 5).value(pc?.monitorSapBarcode || '');
          worksheet.cell(rowIndex, 6).value(pc?.upsBarcode || '');
          worksheet.cell(rowIndex, 7).value(pc?.upsSapBarcode || '');
          worksheet.cell(rowIndex, 8).value(pc?.pcName || '');
          worksheet.cell(rowIndex, 9).value(pc?.userName || '');
          worksheet.cell(rowIndex, 10).value(pc?.status || '');
          worksheet.cell(rowIndex, 11).value(pc?.note || '');
        }

        // Shift footer rows down by the number of inserted rows
        if (lastFooterRow > footerStartRow) {
          const footerRowsToMove = lastFooterRow - footerStartRow;
          worksheet.insertRows(footerStartRow + rowsToInsert, footerRowsToMove);
          
          // Copy footer content to new positions
          for (let i = 0; i < footerRowsToMove; i++) {
            for (let col = 1; col <= 11; col++) { // Copy columns 1-11
              try {
                const cellValue = worksheet.cell(footerStartRow + rowsToInsert + i, col).value();
                worksheet.cell(footerStartRow + rowsToInsert + i, col).value(cellValue);
              } catch (cellError) {
                logger.error(`Error copying footer cell at row ${footerStartRow + i}, column ${col}:`, cellError);
              }
            }
          }
        }
      }
    } else {
      // No footer found, just write data starting from dataStartRow
      logger.debug('No footer detected, writing data directly');
      
      // Write data to rows
      for (let i = 0; i < data.length; i++) {
        const rowIndex = dataStartRow + i;
        const pc = data[i];
        
        // Write PC data to cells
        worksheet.cell(rowIndex, 1).value(pc?.dept || '');
        worksheet.cell(rowIndex, 2).value(pc?.cpuBarcode || '');
        worksheet.cell(rowIndex, 3).value(pc?.cpuSapBarcode || '');
        worksheet.cell(rowIndex, 4).value(pc?.monitorBarcode || '');
        worksheet.cell(rowIndex, 5).value(pc?.monitorSapBarcode || '');
        worksheet.cell(rowIndex, 6).value(pc?.upsBarcode || '');
        worksheet.cell(rowIndex, 7).value(pc?.upsSapBarcode || '');
        worksheet.cell(rowIndex, 8).value(pc?.pcName || '');
        worksheet.cell(rowIndex, 9).value(pc?.userName || '');
        worksheet.cell(rowIndex, 10).value(pc?.status || '');
        worksheet.cell(rowIndex, 11).value(pc?.note || '');
      }
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('PC export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting PC data to Excel:', error);
    throw error;
  }
}

/**
 * Export Laptop data to Excel file with template
 * @param data - Array of Laptop assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportLaptopToExcel(data: LaptopAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportLaptopToExcel with ${data.length} records`);
    // Read the Laptop template
    const templateBuffer = await readTemplateFile('Laptop_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'Laptop';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) {
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY LAPTOP INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Find the data start row
    let dataStartRow = 2;
    let safetyCounter = 0;
    const MAX_ROWS = 1000;
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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const laptop = data[i];
      
      // Write Laptop data to cells
      worksheet.cell(rowIndex, 1).value(laptop?.dept || '');
      worksheet.cell(rowIndex, 2).value(laptop?.barcode || '');
      worksheet.cell(rowIndex, 3).value(laptop?.sapBarcode || '');
      worksheet.cell(rowIndex, 4).value(laptop?.dateBuy || '');
      worksheet.cell(rowIndex, 5).value(laptop?.userName || '');
      worksheet.cell(rowIndex, 6).value(laptop?.email || '');
      worksheet.cell(rowIndex, 7).value(laptop?.model || '');
      worksheet.cell(rowIndex, 8).value(laptop?.status || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('Laptop export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting Laptop data to Excel:', error);
    throw error;
  }
}

/**
 * Export Printer data to Excel file with template
 * @param data - Array of Printer assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportPrinterToExcel(data: PrinterAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportPrinterToExcel with ${data.length} records`);
    // Read the Printer template
    const templateBuffer = await readTemplateFile('Printer_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'Printer';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) {
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY PRINTER INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Find the data start row
    let dataStartRow = 2;
    let safetyCounter = 0;
    const MAX_ROWS = 1000;
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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const printer = data[i];
      
      // Write Printer data to cells
      worksheet.cell(rowIndex, 1).value(printer?.dept || '');
      worksheet.cell(rowIndex, 2).value(printer?.location || '');
      worksheet.cell(rowIndex, 3).value(printer?.ip || '');
      worksheet.cell(rowIndex, 4).value(printer?.model || '');
      worksheet.cell(rowIndex, 5).value(printer?.color || '');
      worksheet.cell(rowIndex, 6).value(printer?.barcode || '');
      worksheet.cell(rowIndex, 7).value(printer?.sapCode || '');
      worksheet.cell(rowIndex, 8).value(printer?.date || '');
      worksheet.cell(rowIndex, 9).value(printer?.note || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('Printer export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting Printer data to Excel:', error);
    throw error;
  }
}

/**
 * Export License data to Excel file with template
 * @param data - Array of License assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportLicenseToExcel(data: LicenseAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportLicenseToExcel with ${data.length} records`);
    // Read the License template
    const templateBuffer = await readTemplateFile('License_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'License';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) {
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY LICENSE INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Find the data start row
    let dataStartRow = 2;
    let safetyCounter = 0;
    const MAX_ROWS = 1000;
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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const license = data[i];
      
      // Write License data to cells
      worksheet.cell(rowIndex, 1).value(license?.deviceName || '');
      worksheet.cell(rowIndex, 2).value(license?.userName || '');
      worksheet.cell(rowIndex, 3).value(license?.dept || '');
      worksheet.cell(rowIndex, 4).value(license?.productType || '');
      worksheet.cell(rowIndex, 5).value(license?.productKey || '');
      worksheet.cell(rowIndex, 6).value(license?.model || '');
      worksheet.cell(rowIndex, 7).value(license?.pc || '');
      worksheet.cell(rowIndex, 8).value(license?.mac || '');
      worksheet.cell(rowIndex, 9).value(license?.ip || '');
      worksheet.cell(rowIndex, 10).value(license?.date || '');
      worksheet.cell(rowIndex, 11).value(license?.updateStatus || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('License export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting License data to Excel:', error);
    throw error;
  }
}

/**
 * Export WarehouseIT data to Excel file with template
 * @param data - Array of WarehouseIT assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportWarehouseToExcel(data: WarehouseITAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportWarehouseToExcel with ${data.length} records`);
    // Read the Warehouse template
    const templateBuffer = await readTemplateFile('Warehouse_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'Warehouse';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) {
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY WAREHOUSE INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Find the data start row
    let dataStartRow = 2;
    let safetyCounter = 0;
    const MAX_ROWS = 1000;
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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const warehouse = data[i];
      
      // Write Warehouse data to cells
      worksheet.cell(rowIndex, 1).value(warehouse?.barcode || '');
      worksheet.cell(rowIndex, 2).value(warehouse?.sapCode || '');
      worksheet.cell(rowIndex, 3).value(warehouse?.status || '');
      worksheet.cell(rowIndex, 4).value(warehouse?.note || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('Warehouse export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting Warehouse data to Excel:', error);
    throw error;
  }
}

/**
 * Export Internet data to Excel file with template
 * @param data - Array of Internet assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportInternetToExcel(data: InternetAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportInternetToExcel with ${data.length} records`);
    // Read the Internet template
    const templateBuffer = await readTemplateFile('Internet_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'Internet';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) {
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY INTERNET INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Find the data start row
    let dataStartRow = 2;
    let safetyCounter = 0;
    const MAX_ROWS = 1000;
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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const internet = data[i];
      
      // Write Internet data to cells
      worksheet.cell(rowIndex, 1).value(internet?.dept || '');
      worksheet.cell(rowIndex, 2).value(internet?.manager || '');
      worksheet.cell(rowIndex, 3).value(internet?.userName || '');
      worksheet.cell(rowIndex, 4).value(internet?.email || '');
      worksheet.cell(rowIndex, 5).value(internet?.ipAddress || '');
      worksheet.cell(rowIndex, 6).value(internet?.internetAccess || '');
      worksheet.cell(rowIndex, 7).value(internet?.status || '');
      worksheet.cell(rowIndex, 8).value(internet?.note || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('Internet export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting Internet data to Excel:', error);
    throw error;
  }
}

/**
 * Export FixedAsset data to Excel file with template
 * @param data - Array of FixedAsset assets to export
 * @param tenantName - Optional tenant name for the header
 * @returns Promise resolving to ArrayBuffer of the Excel file
 */
export async function exportFixedAssetToExcel(data: FixedAsset[], tenantName?: string): Promise<ArrayBuffer> {
  try {
    logger.debug(`Starting exportFixedAssetToExcel with ${data.length} records`);
    // Read the FixedAsset template
    const templateBuffer = await readTemplateFile('FixedAsset_Template.xlsx');
    logger.debug('Template buffer loaded, creating workbook');
    const workbook = await XLSX.fromDataAsync(templateBuffer);
    logger.debug('Workbook created, getting worksheet');
    const worksheet = workbook.sheet(0);
    logger.debug('Worksheet obtained, finding data start row');

    // Update the header row (row 1) with dynamic information
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const assetsName = 'Fixed Asset';
    
    // Search for the header cell in row 1 and update it
    for (let col = 1; col <= 20; col++) { // Check first 20 columns for the header
      try {
        const cellValue = worksheet.cell(1, col).value();
        if (typeof cellValue === 'string' && cellValue.includes('INVENTORY FIXED ASSET INFORMATION DAIHOA')) {
          const newValue = `INVENTORY ${assetsName.toUpperCase()} INFORMATION ${tenantName ? tenantName.toUpperCase() : 'TENANT'} ${month}/${year}`;
          worksheet.cell(1, col).value(newValue);
          break;
        }
      } catch (error) {
        // Continue to next column if there's an error reading this cell
        continue;
      }
    }

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

    // Write data to rows
    for (let i = 0; i < data.length; i++) {
      const rowIndex = dataStartRow + i;
      const fixedAsset = data[i];
      
      // Write FixedAsset data to cells
      worksheet.cell(rowIndex, 1).value(fixedAsset?.dept || '');
      worksheet.cell(rowIndex, 2).value(fixedAsset?.barcode || '');
      worksheet.cell(rowIndex, 3).value(fixedAsset?.sapCode || '');
      worksheet.cell(rowIndex, 4).value(fixedAsset?.name || '');
      worksheet.cell(rowIndex, 5).value(fixedAsset?.place || '');
      worksheet.cell(rowIndex, 6).value(fixedAsset?.inputDate || '');
      worksheet.cell(rowIndex, 7).value(fixedAsset?.location || '');
      worksheet.cell(rowIndex, 8).value(fixedAsset?.status || '');
      worksheet.cell(rowIndex, 9).value(fixedAsset?.note || '');
    }

    // Return the workbook as ArrayBuffer
    const buffer = await workbook.outputAsync() as ArrayBuffer;
    logger.debug('FixedAsset export completed successfully');
    return buffer;
  } catch (error) {
    logger.error('Error exporting FixedAsset data to Excel:', error);
    throw error;
  }
}