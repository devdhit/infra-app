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
  user?: string
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
}

/**
 * Read template file from the templates directory
 */
async function readTemplateFile(templateName: string): Promise<ArrayBuffer> {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateName)
    const fileBuffer = await fs.readFile(templatePath)
    // Convert Buffer to ArrayBuffer
    return fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer
  } catch (error) {
    console.error(`Error reading template file ${templateName}:`, error)
    throw new Error(`Template file ${templateName} not found`)
  }
}

/**
 * Export PC data to Excel file with template
 */
export async function exportPCToExcel(data: PCAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the PC template
    const templateBuffer = await readTemplateFile('PC_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Find the data start row (usually row 2, but we'll look for the first empty row after headers)
    let dataStartRow = 2
    while (worksheet.cell(dataStartRow, 1).value() !== null && worksheet.cell(dataStartRow, 1).value() !== '') {
      dataStartRow++
    }
    
    // Find the footer row (look for a row after data that has content)
    let footerStartRow = dataStartRow
    // Skip data rows
    while (footerStartRow < 1000) { // Reasonable limit
      const hasData = worksheet.cell(footerStartRow, 1).value() !== null && worksheet.cell(footerStartRow, 1).value() !== ''
      if (hasData) break
      footerStartRow++
    }
    
    // If we found a footer, we need to insert rows for our data
    if (footerStartRow < 1000) {
      // Calculate how many rows we need to insert
      const rowsToInsert = data.length
      const currentFooterRow = footerStartRow
      
      // Insert rows for our data (shift footer down)
      if (rowsToInsert > 0) {
        worksheet.insertRows(dataStartRow, rowsToInsert)
      }
      
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
        worksheet.cell(currentRow, 9).value(row.user || 'N/A')
        worksheet.cell(currentRow, 10).value(row.status || 'N/A')
        worksheet.cell(currentRow, 11).value(row.note || 'N/A')
      })
    } else {
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
        worksheet.cell(currentRow, 9).value(row.user || 'N/A')
        worksheet.cell(currentRow, 10).value(row.status || 'N/A')
        worksheet.cell(currentRow, 11).value(row.note || 'N/A')
      })
    }
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    console.error('Error exporting PC to Excel:', error)
    throw error
  }
}

/**
 * Export Laptop data to Excel file with template (header and data only)
 */
export async function exportLaptopToExcel(data: LaptopAsset[]): Promise<ArrayBuffer> {
  try {
    // Read the Laptop template
    const templateBuffer = await readTemplateFile('Laptop_Template.xlsx')
    const workbook = await XLSX.fromDataAsync(templateBuffer)
    const worksheet = workbook.sheet(0)
    
    // Find the data start row
    let dataStartRow = 2
    while (worksheet.cell(dataStartRow, 1).value() !== null && worksheet.cell(dataStartRow, 1).value() !== '') {
      dataStartRow++
    }
    
    // Add data rows (no footer handling needed)
    data.forEach((row, rowIndex) => {
      const currentRow = dataStartRow + rowIndex
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
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    console.error('Error exporting Laptop to Excel:', error)
    throw error
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
    while (worksheet.cell(dataStartRow, 1).value() !== null && worksheet.cell(dataStartRow, 1).value() !== '') {
      dataStartRow++
    }
    
    // Add data rows (no footer handling needed)
    data.forEach((row, rowIndex) => {
      const currentRow = dataStartRow + rowIndex
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
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
    console.error('Error exporting Printer to Excel:', error)
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
    while (worksheet.cell(dataStartRow, 1).value() !== null && worksheet.cell(dataStartRow, 1).value() !== '') {
      dataStartRow++
    }
    
    // Add data rows (no footer handling needed)
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
      worksheet.cell(currentRow, 11).value(row.updateStatus || 'N/A')
    })
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
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
    
    // Find the data start row
    let dataStartRow = 2
    while (worksheet.cell(dataStartRow, 1).value() !== null && worksheet.cell(dataStartRow, 1).value() !== '') {
      dataStartRow++
    }
    
    // Add data rows (no footer handling needed)
    data.forEach((row, rowIndex) => {
      const currentRow = dataStartRow + rowIndex
      worksheet.cell(currentRow, 1).value(row.cpuBarcode || 'N/A')
      worksheet.cell(currentRow, 2).value(row.cpuSapBarcode || 'N/A')
      worksheet.cell(currentRow, 3).value(row.monitorBarcode || 'N/A')
      worksheet.cell(currentRow, 4).value(row.monitorSapBarcode || 'N/A')
      worksheet.cell(currentRow, 5).value(row.upsBarcode || 'N/A')
      worksheet.cell(currentRow, 6).value(row.upsSapBarcode || 'N/A')
      worksheet.cell(currentRow, 7).value(row.status || 'N/A')
      worksheet.cell(currentRow, 8).value(row.note || 'N/A')
    })
    
    // Convert to buffer and return
    return await workbook.outputAsync() as ArrayBuffer
  } catch (error) {
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
          header = columnMapping[header]
        }
        
        // Handle user field with email format (abc.xyz) - convert to string and handle empty values
        if (header === 'user') {
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
    
    return data
  } catch (error) {
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
    user: '',
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
    note: ''
  }]
}