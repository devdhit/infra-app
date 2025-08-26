import XLSX from 'xlsx-populate'

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
 * Export data to Excel file
 */
export async function exportToExcel<T>(data: T[], fileName: string, sheetName: string = 'Sheet1'): Promise<void> {
  try {
    const workbook = await XLSX.fromBlankAsync()
    const worksheet = workbook.sheet(0)
    
    // Add headers
    if (data.length > 0) {
      const headers = Object.keys(data[0] as Record<string, unknown>)
      headers.forEach((header, index) => {
        worksheet.cell(1, index + 1).value(header)
      })
      
      // Add data rows
      data.forEach((row, rowIndex) => {
        const rowRecord = row as Record<string, unknown>
        headers.forEach((header, colIndex) => {
          // Convert the value to a valid CellValue type
          const value = rowRecord[header];
          if (value === null || value === undefined) {
            worksheet.cell(rowIndex + 2, colIndex + 1).value(null);
          } else if (typeof value === 'object') {
            worksheet.cell(rowIndex + 2, colIndex + 1).value(JSON.stringify(value));
          } else {
            worksheet.cell(rowIndex + 2, colIndex + 1).value(value as string | number | boolean | Date);
          }
        })
      })
    }
    
    // Save the workbook
    await workbook.toFileAsync(`${fileName}.xlsx`)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw error
  }
}

/**
 * Import data from Excel file
 */
export async function importFromExcel(file: File): Promise<Record<string, unknown>[]> {
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
      const rowObject: Record<string, unknown> = {}
      for (let j = 0; j < headers.length; j++) {
        // Convert header to string to ensure it can be used as an index
        const header = String(headers[j]);
        rowObject[header] = rows[i][j]
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