"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPCToExcel = exportPCToExcel;
exports.exportLaptopToExcel = exportLaptopToExcel;
exports.exportPrinterToExcel = exportPrinterToExcel;
exports.exportLicenseToExcel = exportLicenseToExcel;
exports.exportWarehouseITToExcel = exportWarehouseITToExcel;
exports.importFromExcelWithTemplate = importFromExcelWithTemplate;
exports.generatePCTemplate = generatePCTemplate;
exports.generateLaptopTemplate = generateLaptopTemplate;
exports.generatePrinterTemplate = generatePrinterTemplate;
exports.generateLicenseTemplate = generateLicenseTemplate;
exports.generateWarehouseITTemplate = generateWarehouseITTemplate;
const xlsx_populate_1 = __importDefault(require("xlsx-populate"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
/**
 * Read template file from the templates directory
 */
async function readTemplateFile(templateName) {
    try {
        // Use path.resolve to ensure we get the correct absolute path
        const templatePath = path.resolve(process.cwd(), 'src', 'templates', templateName);
        console.log(`Attempting to read template file from: ${templatePath}`);
        const fileBuffer = await fs_1.promises.readFile(templatePath);
        console.log(`Successfully read template file: ${templateName}, size: ${fileBuffer.byteLength} bytes`);
        // Convert Buffer to ArrayBuffer
        const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        console.log(`Converted to ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
        return arrayBuffer;
    }
    catch (error) {
        console.error(`Error reading template file ${templateName}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Template file ${templateName} not found or could not be read: ${errorMessage}`);
    }
}
/**
 * Export PC data to Excel file with template
 */
async function exportPCToExcel(data) {
    try {
        console.log(`Starting exportPCToExcel with ${data.length} records`);
        // Read the PC template
        const templateBuffer = await readTemplateFile('PC_Template.xlsx');
        console.log('Template buffer loaded, creating workbook');
        const workbook = await xlsx_populate_1.default.fromDataAsync(templateBuffer);
        console.log('Workbook created, getting worksheet');
        const worksheet = workbook.sheet(0);
        console.log('Worksheet obtained, finding data start row');
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
            }
            catch (cellError) {
                console.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
                break;
            }
            dataStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
                dataStartRow = 3;
                break;
            }
        }
        console.log(`Data start row found at row ${dataStartRow}`);
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
                }
                catch (cellError) {
                    console.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
                }
            }
            if (hasContent)
                break;
            footerStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in footer detection, defaulting to no footer');
                footerStartRow = MAX_ROWS; // Set to MAX_ROWS to indicate no footer found
                break;
            }
        }
        console.log(`Footer start row found at row ${footerStartRow}`);
        // If we found a footer, we need to insert rows for our data
        if (footerStartRow < 1000) {
            console.log('Footer detected, inserting rows');
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
                    if (!hasContent)
                        break;
                    lastFooterRow++;
                    safetyCounter++;
                    if (safetyCounter > MAX_ROWS)
                        break;
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
                        }
                        catch (styleError) {
                            // If there's an error with styles, just continue - we still want the data
                            console.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
                        }
                    }
                }
            }
            console.log(`Shifted footer by ${rowsToInsert} rows`);
            // Add data rows
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A');
                worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A');
                worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A');
                worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A');
                worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A');
                worksheet.cell(currentRow, 8).value(row.pcName || 'N/A');
                worksheet.cell(currentRow, 9).value(row.userName || 'N/A');
                // Normalize status values to lowercase
                const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 10).value(normalizedStatus);
                worksheet.cell(currentRow, 11).value(row.note || 'N/A');
            });
            console.log('Data rows added with footer preservation');
        }
        else {
            console.log('No footer detected, adding data rows normally');
            // No footer found, just add data rows normally
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A');
                worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A');
                worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A');
                worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A');
                worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A');
                worksheet.cell(currentRow, 8).value(row.pcName || 'N/A');
                worksheet.cell(currentRow, 9).value(row.userName || 'N/A');
                // Normalize status values to lowercase
                const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 10).value(normalizedStatus);
                worksheet.cell(currentRow, 11).value(row.note || 'N/A');
            });
            console.log('Data rows added without footer preservation');
        }
        console.log('Converting workbook to buffer');
        // Convert to buffer and return
        const result = await workbook.outputAsync();
        console.log('Workbook converted to buffer successfully');
        return result;
    }
    catch (error) {
        console.error('Error exporting PC to Excel:', error);
        throw error;
    }
}
/**
 * Export Laptop data to Excel file with template (header and data only)
 */
async function exportLaptopToExcel(data) {
    try {
        console.log(`Starting exportLaptopToExcel with ${data.length} records`);
        // Read the Laptop template
        const templateBuffer = await readTemplateFile('Laptop_Template.xlsx');
        console.log('Template buffer loaded, creating workbook');
        const workbook = await xlsx_populate_1.default.fromDataAsync(templateBuffer);
        console.log('Workbook created, getting worksheet');
        const worksheet = workbook.sheet(0);
        console.log('Worksheet obtained, finding data start row');
        // Find the data start row
        let dataStartRow = 2;
        // Add a safety check to prevent infinite loop
        let safetyCounter = 0;
        const MAX_ROWS = 1000; // Reasonable limit
        console.log(`Checking cell values for data start row detection:`);
        while (dataStartRow < MAX_ROWS) {
            try {
                const cellValue = worksheet.cell(dataStartRow, 1).value();
                console.log(`Row ${dataStartRow}, Column 1 cell value:`, cellValue);
                if (cellValue === null || cellValue === undefined || cellValue === '') {
                    console.log(`Found empty cell at row ${dataStartRow}, breaking loop`);
                    break;
                }
            }
            catch (cellError) {
                console.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
                break;
            }
            dataStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
                dataStartRow = 3;
                break;
            }
        }
        console.log(`Data start row found at row ${dataStartRow}`);
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
                }
                catch (cellError) {
                    console.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
                }
            }
            if (hasContent)
                break;
            footerStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in footer detection, defaulting to no footer');
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
                        }
                        catch (styleError) {
                            // If there's an error with styles, just continue - we still want the data
                            console.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
                        }
                    }
                }
            }
            // Add data rows
            console.log('Adding data rows');
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                console.log(`Setting values for row ${currentRow}`);
                try {
                    worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                    worksheet.cell(currentRow, 2).value(row.barcode || 'N/A');
                    worksheet.cell(currentRow, 3).value(row.sapBarcode || 'N/A');
                    worksheet.cell(currentRow, 4).value(row.dateBuy || 'N/A');
                    worksheet.cell(currentRow, 5).value(row.userName || 'N/A'); // Changed from 'user' to 'userName'
                    worksheet.cell(currentRow, 6).value(row.email || 'N/A');
                    worksheet.cell(currentRow, 7).value(row.model || 'N/A');
                    // Normalize status values to lowercase
                    const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                    worksheet.cell(currentRow, 8).value(normalizedStatus);
                    console.log(`Completed setting values for row ${currentRow}`);
                }
                catch (rowError) {
                    console.error(`Error setting values for row ${currentRow}:`, rowError);
                }
            });
            console.log('Data rows added with footer preservation');
        }
        else {
            // No footer found, just add data rows normally
            console.log('Adding data rows');
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                console.log(`Setting values for row ${currentRow}`);
                try {
                    worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                    worksheet.cell(currentRow, 2).value(row.barcode || 'N/A');
                    worksheet.cell(currentRow, 3).value(row.sapBarcode || 'N/A');
                    worksheet.cell(currentRow, 4).value(row.dateBuy || 'N/A');
                    worksheet.cell(currentRow, 5).value(row.userName || 'N/A'); // Changed from 'user' to 'userName'
                    worksheet.cell(currentRow, 6).value(row.email || 'N/A');
                    worksheet.cell(currentRow, 7).value(row.model || 'N/A');
                    // Normalize status values to lowercase
                    const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                    worksheet.cell(currentRow, 8).value(normalizedStatus);
                    console.log(`Completed setting values for row ${currentRow}`);
                }
                catch (rowError) {
                    console.error(`Error setting values for row ${currentRow}:`, rowError);
                }
            });
            console.log('Data rows added without footer preservation');
        }
        console.log('Converting workbook to buffer');
        // Convert to buffer and return
        console.log('Calling workbook.outputAsync()');
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Workbook output timeout after 30 seconds')), 30000);
        });
        const result = await Promise.race([
            workbook.outputAsync(),
            timeoutPromise
        ]);
        console.log('workbook.outputAsync() completed successfully');
        console.log('Workbook converted to buffer successfully');
        return result;
    }
    catch (error) {
        console.error('Error exporting Laptop to Excel:', error);
        throw error;
    }
}
/**
 * Export Printer data to Excel file with template (header and data only)
 */
async function exportPrinterToExcel(data) {
    try {
        // Read the Printer template
        const templateBuffer = await readTemplateFile('Printer_Template.xlsx');
        const workbook = await xlsx_populate_1.default.fromDataAsync(templateBuffer);
        const worksheet = workbook.sheet(0);
        // Find the data start row
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
            }
            catch (cellError) {
                console.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
                break;
            }
            dataStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
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
                }
                catch (cellError) {
                    console.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
                }
            }
            if (hasContent)
                break;
            footerStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in footer detection, defaulting to no footer');
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
                        }
                        catch (styleError) {
                            // If there's an error with styles, just continue - we still want the data
                            console.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
                        }
                    }
                }
            }
            // Add data rows
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.location || 'N/A');
                worksheet.cell(currentRow, 3).value(row.ip || 'N/A');
                worksheet.cell(currentRow, 4).value(row.model || 'N/A');
                worksheet.cell(currentRow, 5).value(row.color || 'Black & White');
                worksheet.cell(currentRow, 6).value(row.barcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.sapCode || 'N/A');
                worksheet.cell(currentRow, 8).value(row.date || 'N/A');
                worksheet.cell(currentRow, 9).value(row.note || 'N/A');
            });
        }
        else {
            // No footer found, just add data rows normally
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.location || 'N/A');
                worksheet.cell(currentRow, 3).value(row.ip || 'N/A');
                worksheet.cell(currentRow, 4).value(row.model || 'N/A');
                worksheet.cell(currentRow, 5).value(row.color || 'Black & White');
                worksheet.cell(currentRow, 6).value(row.barcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.sapCode || 'N/A');
                worksheet.cell(currentRow, 8).value(row.date || 'N/A');
                worksheet.cell(currentRow, 9).value(row.note || 'N/A');
            });
        }
        // Convert to buffer and return
        return await workbook.outputAsync();
    }
    catch (error) {
        console.error('Error exporting Printer to Excel:', error);
        throw error;
    }
}
/**
 * Export License data to Excel file with template (header and data only)
 */
async function exportLicenseToExcel(data) {
    try {
        // Read the License template
        const templateBuffer = await readTemplateFile('Licenses_Template.xlsx');
        const workbook = await xlsx_populate_1.default.fromDataAsync(templateBuffer);
        const worksheet = workbook.sheet(0);
        // Find the data start row
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
            }
            catch (cellError) {
                console.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
                break;
            }
            dataStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
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
                }
                catch (cellError) {
                    console.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
                }
            }
            if (hasContent)
                break;
            footerStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in footer detection, defaulting to no footer');
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
                        }
                        catch (styleError) {
                            // If there's an error with styles, just continue - we still want the data
                            console.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
                        }
                    }
                }
            }
            // Add data rows
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.deviceName || 'N/A');
                worksheet.cell(currentRow, 2).value(row.userName || 'N/A');
                worksheet.cell(currentRow, 3).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 4).value(row.productType || 'N/A');
                worksheet.cell(currentRow, 5).value(row.productKey || 'N/A');
                worksheet.cell(currentRow, 6).value(row.model || 'N/A');
                worksheet.cell(currentRow, 7).value(row.pc || 'N/A');
                worksheet.cell(currentRow, 8).value(row.mac || 'N/A');
                worksheet.cell(currentRow, 9).value(row.ip || 'N/A');
                worksheet.cell(currentRow, 10).value(row.date || 'N/A');
                // Normalize updateStatus values to lowercase
                const normalizedStatus = row.updateStatus ? row.updateStatus.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 11).value(normalizedStatus);
            });
        }
        else {
            // No footer found, just add data rows normally
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.deviceName || 'N/A');
                worksheet.cell(currentRow, 2).value(row.userName || 'N/A');
                worksheet.cell(currentRow, 3).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 4).value(row.productType || 'N/A');
                worksheet.cell(currentRow, 5).value(row.productKey || 'N/A');
                worksheet.cell(currentRow, 6).value(row.model || 'N/A');
                worksheet.cell(currentRow, 7).value(row.pc || 'N/A');
                worksheet.cell(currentRow, 8).value(row.mac || 'N/A');
                worksheet.cell(currentRow, 9).value(row.ip || 'N/A');
                worksheet.cell(currentRow, 10).value(row.date || 'N/A');
                // Normalize updateStatus values to lowercase
                const normalizedStatus = row.updateStatus ? row.updateStatus.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 11).value(normalizedStatus);
            });
        }
        // Convert to buffer and return
        return await workbook.outputAsync();
    }
    catch (error) {
        console.error('Error exporting License to Excel:', error);
        throw error;
    }
}
/**
 * Export WarehouseIT data to Excel file with template (header and data only)
 */
async function exportWarehouseITToExcel(data) {
    try {
        // Read the WarehouseIT template
        const templateBuffer = await readTemplateFile('WarehouseIT_Template.xlsx');
        const workbook = await xlsx_populate_1.default.fromDataAsync(templateBuffer);
        const worksheet = workbook.sheet(0);
        // Find the data start row
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
            }
            catch (cellError) {
                console.error(`Error reading cell at row ${dataStartRow}, column 1:`, cellError);
                break;
            }
            dataStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in data start row detection, defaulting to row 3');
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
                }
                catch (cellError) {
                    console.error(`Error reading cell at row ${footerStartRow}, column ${col}:`, cellError);
                }
            }
            if (hasContent)
                break;
            footerStartRow++;
            safetyCounter++;
            if (safetyCounter > MAX_ROWS) {
                console.warn('Safety counter exceeded in footer detection, defaulting to no footer');
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
                        }
                        catch (styleError) {
                            // If there's an error with styles, just continue - we still want the data
                            console.warn(`Warning: Could not copy formatting for cell at row ${currentRow}, col ${col}:`, styleError.message);
                        }
                    }
                }
            }
            // Add data rows
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A');
                worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A');
                worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A');
                worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A');
                worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A');
                // Normalize status values to lowercase
                const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 8).value(normalizedStatus);
                worksheet.cell(currentRow, 9).value(row.note || 'N/A');
            });
        }
        else {
            // No footer found, just add data rows normally
            data.forEach((row, rowIndex) => {
                const currentRow = dataStartRow + rowIndex;
                worksheet.cell(currentRow, 1).value(row.dept || 'N/A');
                worksheet.cell(currentRow, 2).value(row.cpuBarcode || 'N/A');
                worksheet.cell(currentRow, 3).value(row.cpuSapBarcode || 'N/A');
                worksheet.cell(currentRow, 4).value(row.monitorBarcode || 'N/A');
                worksheet.cell(currentRow, 5).value(row.monitorSapBarcode || 'N/A');
                worksheet.cell(currentRow, 6).value(row.upsBarcode || 'N/A');
                worksheet.cell(currentRow, 7).value(row.upsSapBarcode || 'N/A');
                // Normalize status values to lowercase
                const normalizedStatus = row.status ? row.status.toLowerCase() : 'N/A';
                worksheet.cell(currentRow, 8).value(normalizedStatus);
                worksheet.cell(currentRow, 9).value(row.note || 'N/A');
            });
        }
        // Convert to buffer and return
        return await workbook.outputAsync();
    }
    catch (error) {
        console.error('Error exporting WarehouseIT to Excel:', error);
        throw error;
    }
}
/**
 * Import data from Excel file with template structure and column mapping
 * @param file The Excel file to import
 * @param assetType The type of asset being imported
 * @param columnMapping Optional mapping of Excel column names to database field names
 */
async function importFromExcelWithTemplate(file, assetType, columnMapping) {
    try {
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        // Load workbook from ArrayBuffer
        const workbook = await xlsx_populate_1.default.fromDataAsync(arrayBuffer);
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
        const data = [];
        for (let i = 1; i < rows.length; i++) {
            // Check if the row has data (skip empty rows)
            const hasData = rows[i].some((cell) => cell !== null && cell !== undefined && cell !== '');
            if (!hasData)
                continue;
            const rowObject = {};
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
                if (header === 'userName' || header === 'user') { // Added check for 'userName' as well
                    if (value === null || value === undefined || value === '') {
                        value = 'N/A'; // Change empty user fields to 'N/A'
                    }
                    else {
                        value = String(value); // Ensure user field is always a string
                    }
                }
                // Handle PC Name field - convert empty values to 'N/A'
                else if (header === 'pcName' && (value === null || value === undefined || value === '')) {
                    value = 'N/A';
                }
                // Handle required fields for PC assets
                else if (assetType === 'pc' && (header === 'cpuBarcode' || header === 'dept' || header === 'pcName') && (value === null || value === undefined || value === '')) {
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
                    }
                    else if (header === 'ProductKey') {
                        header = 'productKey';
                    }
                    else if (header === 'DeviceName') {
                        header = 'deviceName';
                    }
                    else if (header === 'UserName') {
                        header = 'userName';
                    }
                    else if (header === 'UpdateStatus') {
                        header = 'updateStatus';
                    }
                    else if (header === 'Date') {
                        header = 'date';
                    }
                    else if (header === 'Dept') {
                        header = 'dept';
                    }
                    else if (header === 'Model') {
                        header = 'model';
                    }
                    else if (header === 'PC') {
                        header = 'pc';
                    }
                    else if (header === 'MAC') {
                        header = 'mac';
                    }
                    else if (header === 'IP') {
                        header = 'ip';
                    }
                }
                // Handle Printer color field - keep as string value
                else if (assetType === 'printer' && header === 'color') {
                    if (typeof value === 'string') {
                        // Use the string value as is
                        value = value;
                    }
                    else if (value === null || value === undefined || value === '') {
                        // Empty values default to "Black & White"
                        value = "Black & White";
                    }
                    else {
                        // Convert any other type to string
                        value = String(value);
                    }
                }
                // Convert numeric values to strings for barcode fields to prevent Prisma validation errors
                // This is especially important for SAP barcode fields that might be interpreted as numbers
                else if (header.includes('Barcode') || header.includes('barcode') ||
                    header.includes('Sap') || header.includes('sap')) {
                    if (typeof value === 'number') {
                        value = value.toString();
                    }
                    else if (value === null || value === undefined || value === '') {
                        value = 'N/A'; // Change empty barcode fields to 'N/A'
                    }
                }
                else {
                    // For other fields, use null for empty values
                    if (value === null || value === undefined || value === '') {
                        value = null;
                    }
                }
                rowObject[header] = value;
            }
            data.push(rowObject);
        }
        return data;
    }
    catch (error) {
        console.error('Error importing from Excel:', error);
        throw error;
    }
}
/**
 * Generate template for PC assets
 */
function generatePCTemplate() {
    return [{
            dept: '',
            cpuBarcode: '',
            cpuSapBarcode: '',
            monitorBarcode: '',
            monitorSapBarcode: '',
            upsBarcode: '',
            upsSapBarcode: '',
            pcName: '',
            userName: '', // Changed from 'user' to 'userName'
            status: 'working', // Changed from 'active' to 'working'
            note: ''
        }];
}
/**
 * Generate template for Laptop assets
 */
function generateLaptopTemplate() {
    return [{
            dept: '',
            barcode: '',
            sapBarcode: '',
            dateBuy: '',
            userName: '', // Changed from 'user' to 'userName'
            email: '',
            model: '',
            status: 'working' // Changed from 'active' to 'working'
        }];
}
/**
 * Generate template for Printer assets
 */
function generatePrinterTemplate() {
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
        }];
}
/**
 * Generate template for License assets
 */
function generateLicenseTemplate() {
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
            updateStatus: 'working' // Changed from 'active' to 'working'
        }];
}
/**
 * Generate template for WarehouseIT assets
 */
function generateWarehouseITTemplate() {
    return [{
            cpuBarcode: '',
            cpuSapBarcode: '',
            monitorBarcode: '',
            monitorSapBarcode: '',
            upsBarcode: '',
            upsSapBarcode: '',
            status: 'working', // Changed from 'available' to 'working'
            note: ''
        }];
}
