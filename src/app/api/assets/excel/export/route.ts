import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  exportPCToExcel, 
  exportLaptopToExcel, 
  exportPrinterToExcel, 
  exportLicenseToExcel, 
  exportWarehouseITToExcel
} from '@/lib/excel'

// Define types for our data
type AssetType = 'pc' | 'laptop' | 'printer' | 'license' | 'warehouse'

// GET /api/assets/excel/export - Export assets to Excel
export async function GET(request: NextRequest) {
  // Log that the API handler is being initialized
  console.log('Excel export API handler initialized');
  console.log('Request URL:', request.url);
  
  // Set a maximum execution time for the API call
  const RESPONSE_TIMEOUT = 120000; // 2 minutes
  let timer: NodeJS.Timeout | null = null;
  
  try {
    // Create a controller to allow aborting the fetch if it takes too long
    const controller = new AbortController();
    
    // Set a timeout to abort the request if it takes too long
    timer = setTimeout(() => {
      controller.abort();
      console.error('Excel export operation timed out after 2 minutes');
    }, RESPONSE_TIMEOUT);
    
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      })
    }

    const { searchParams } = new URL(request.url)
    const assetType = searchParams.get('assetType') as AssetType | null
    const selectedIds = searchParams.get('selectedIds')
    const department = searchParams.get('dept')

    // Debug logging
    console.log('Export API called with parameters:', { assetType, selectedIds, department })
    console.log('Full URL:', request.url)
    console.log('Search params:', Array.from(searchParams.entries()))
    
    // Log performance metrics
    const startTime = Date.now();
    console.log(`Export operation started at ${new Date().toISOString()}`);

    if (!assetType) {
      return new Response(JSON.stringify({ error: 'Asset type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let buffer: ArrayBuffer

    // Parse selected IDs if provided
    let selectedIdArray: string[] | null = null
    if (selectedIds) {
      try {
        selectedIdArray = JSON.parse(selectedIds)
      } catch (e) {
        console.error('Error parsing selected IDs:', e)
        return new Response(JSON.stringify({ error: 'Invalid selected IDs format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Set a limit on the number of records to export
    const MAX_RECORDS = 10000;
    
    // Fetch data based on asset type and export using templates
    switch (assetType) {
      case 'pc':
        console.log('Fetching PC data with filters:', { 
          tenantId: user.tenantId,
          selectedIds: selectedIdArray,
          department: department
        })
        const pcWhereClause = { 
          tenantId: user.tenantId,
          ...(selectedIdArray ? { id: { in: selectedIdArray } } : {}),
          ...(department ? { dept: department } : {})
        }
        console.log('PC where clause:', pcWhereClause)
        // Use cursor-based pagination for better performance with large datasets
        const pcData = await db.pC.findMany({
          where: pcWhereClause,
          take: MAX_RECORDS, // Limit the number of records
          orderBy: {
            createdAt: 'asc'
          }
        })
        console.log('PC data fetched:', pcData.length, 'records')
        console.log('Sample PC data:', pcData.slice(0, 2))
        
        // Convert null values to undefined to match the PCAsset interface
        const formattedPcData = pcData.map((pc: any) => {
          // Extract custom fields and add them to the formatted data
          const customFields = pc.customFields as Record<string, any> || {};
          
          return {
            dept: pc.dept,
            cpuBarcode: pc.cpuBarcode,
            cpuSapBarcode: pc.cpuSapBarcode ?? undefined,
            monitorBarcode: pc.monitorBarcode ?? undefined,
            monitorSapBarcode: pc.monitorSapBarcode ?? undefined,
            upsBarcode: pc.upsBarcode ?? undefined,
            upsSapBarcode: pc.upsSapBarcode ?? undefined,
            pcName: pc.pcName,
            userName: pc.userName ?? undefined,
            // Normalize status values to lowercase to match standardized values
            status: pc.status ? pc.status.toLowerCase() : 'working',
            note: pc.note ?? undefined,
            // Include custom fields
            ...customFields
          };
        })
        
        console.log('Starting PC Excel export...');
        const pcExportStart = Date.now();
        
        try {
          buffer = await exportPCToExcel(formattedPcData)
          console.log(`PC Excel export completed in ${(Date.now() - pcExportStart) / 1000} seconds`);
        } catch (exportError: any) {
          console.error('Error during PC export:', exportError);
          throw new Error(`PC export failed: ${exportError.message}`);
        }
        break

      case 'laptop':
        console.log('Fetching Laptop data with filters:', { 
          tenantId: user.tenantId,
          selectedIds: selectedIdArray,
          department: department
        })
        const laptopWhereClause = { 
          tenantId: user.tenantId,
          ...(selectedIdArray ? { id: { in: selectedIdArray } } : {}),
          ...(department ? { dept: department } : {})
        }
        console.log('Laptop where clause:', laptopWhereClause)
        // Use cursor-based pagination for better performance with large datasets
        const laptopData = await db.laptop.findMany({
          where: laptopWhereClause,
          select: {
            id: true,
            dept: true,
            barcode: true,
            sapBarcode: true,
            dateBuy: true,
            userName: true,
            email: true,
            model: true,
            status: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          },
          take: MAX_RECORDS, // Limit the number of records
          orderBy: {
            createdAt: 'asc'
          }
        })
        console.log('Laptop data fetched:', laptopData.length, 'records')
        console.log('Sample Laptop data:', laptopData.slice(0, 2))
        
        // Convert null values to undefined to match the LaptopAsset interface
        const formattedLaptopData = laptopData.map((laptop: any) => {
          // Extract custom fields and add them to the formatted data
          const customFields = laptop.customFields as Record<string, any> || {};
          
          return {
            dept: laptop.dept,
            barcode: laptop.barcode,
            sapBarcode: laptop.sapBarcode ?? undefined,
            dateBuy: laptop.dateBuy ? laptop.dateBuy.toISOString().split('T')[0] : undefined, // Only include date part
            userName: laptop.userName ?? undefined, // Use userName instead of user
            email: laptop.email ?? undefined,
            model: laptop.model ?? undefined,
            // Normalize status values to lowercase to match standardized values
            status: laptop.status ? laptop.status.toLowerCase() : 'working',
            // Include custom fields
            ...customFields
          };
        })
        
        console.log('Starting Laptop Excel export...');
        const laptopExportStart = Date.now();
        
        try {
          buffer = await exportLaptopToExcel(formattedLaptopData)
          console.log(`Laptop Excel export completed in ${(Date.now() - laptopExportStart) / 1000} seconds`);
        } catch (exportError: any) {
          console.error('Error during Laptop export:', exportError);
          throw new Error(`Laptop export failed: ${exportError.message}`);
        }
        break

      case 'printer':
        console.log('Fetching Printer data with filters:', { 
          tenantId: user.tenantId,
          selectedIds: selectedIdArray,
          department: department
        })
        const printerWhereClause = { 
          tenantId: user.tenantId,
          ...(selectedIdArray ? { id: { in: selectedIdArray } } : {}),
          ...(department ? { dept: department } : {})
        }
        console.log('Printer where clause:', printerWhereClause)
        // Use cursor-based pagination for better performance with large datasets
        const printerData = await db.printer.findMany({
          where: printerWhereClause,
          select: {
            id: true,
            dept: true,
            location: true,
            ip: true,
            model: true,
            color: true,
            barcode: true,
            sapCode: true,
            date: true,
            note: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          },
          take: MAX_RECORDS, // Limit the number of records
          orderBy: {
            createdAt: 'asc'
          }
        })
        console.log('Printer data fetched:', printerData.length, 'records')
        console.log('Sample Printer data:', printerData.slice(0, 2))
        
        // Convert null values to undefined to match the PrinterAsset interface
        const formattedPrinterData = printerData.map((printer: any) => {
          // Extract custom fields and add them to the formatted data
          const customFields = printer.customFields as Record<string, any> || {};
          
          return {
            dept: printer.dept,
            location: printer.location ?? undefined,
            ip: printer.ip ?? undefined,
            model: printer.model ?? undefined,
            color: printer.color,
            barcode: printer.barcode,
            sapCode: printer.sapCode ?? undefined,
            date: printer.date ? printer.date.toISOString() : undefined,
            note: printer.note ?? undefined,
            // Include custom fields
            ...customFields
          };
        })
        
        console.log('Starting Printer Excel export...');
        const printerExportStart = Date.now();
        
        try {
          buffer = await exportPrinterToExcel(formattedPrinterData)
          console.log(`Printer Excel export completed in ${(Date.now() - printerExportStart) / 1000} seconds`);
        } catch (exportError: any) {
          console.error('Error during Printer export:', exportError);
          throw new Error(`Printer export failed: ${exportError.message}`);
        }
        break

      case 'license':
        console.log('Fetching License data with filters:', { 
          tenantId: user.tenantId,
          selectedIds: selectedIdArray,
          department: department
        })
        const licenseWhereClause = { 
          tenantId: user.tenantId,
          ...(selectedIdArray ? { id: { in: selectedIdArray } } : {}),
          ...(department ? { dept: department } : {})
        }
        console.log('License where clause:', licenseWhereClause)
        // Use cursor-based pagination for better performance with large datasets
        const licenseData = await db.license.findMany({
          where: licenseWhereClause,
          select: {
            id: true,
            deviceName: true,
            userName: true,
            dept: true,
            productType: true,
            productKey: true,
            model: true,
            pc: true,
            mac: true,
            ip: true,
            date: true,
            updateStatus: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          },
          take: MAX_RECORDS, // Limit the number of records
          orderBy: {
            createdAt: 'asc'
          }
        })
        console.log('License data fetched:', licenseData.length, 'records')
        console.log('Sample License data:', licenseData.slice(0, 2))
        
        // Convert null values to undefined to match the LicenseAsset interface
        const formattedLicenseData = licenseData.map((license: any) => {
          // Extract custom fields and add them to the formatted data
          const customFields = license.customFields as Record<string, any> || {};
          
          return {
            deviceName: license.deviceName ?? undefined,
            userName: license.userName ?? undefined,
            dept: license.dept,
            productType: license.productType ?? undefined,
            productKey: license.productKey ?? undefined,
            model: license.model ?? undefined,
            pc: license.pc ?? undefined,
            // Normalize status values to lowercase to match standardized values
            updateStatus: license.updateStatus ? license.updateStatus.toLowerCase() : 'working',
            // Include custom fields
            ...customFields
          };
        })
        
        console.log('Starting License Excel export...');
        const licenseExportStart = Date.now();
        
        try {
          buffer = await exportLicenseToExcel(formattedLicenseData)
          console.log(`License Excel export completed in ${(Date.now() - licenseExportStart) / 1000} seconds`);
        } catch (exportError: any) {
          console.error('Error during License export:', exportError);
          throw new Error(`License export failed: ${exportError.message}`);
        }
        break

      case 'warehouse':
        const warehouseWhereClause = { 
          tenantId: user.tenantId,
          ...(selectedIdArray ? { id: { in: selectedIdArray } } : {})
        }
        console.log('Warehouse where clause:', warehouseWhereClause)
        // Use cursor-based pagination for better performance with large datasets
        const warehouseData = await db.warehouseIT.findMany({
          where: warehouseWhereClause,
          select: {
            id: true,
            cpuBarcode: true,
            cpuSapBarcode: true,
            monitorBarcode: true,
            monitorSapBarcode: true,
            upsBarcode: true,
            upsSapBarcode: true,
            status: true,
            note: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          },
          take: MAX_RECORDS, // Limit the number of records
          orderBy: {
            createdAt: 'asc'
          }
        })
        console.log('Warehouse data fetched:', warehouseData.length, 'records')
        console.log('Sample Warehouse data:', warehouseData.slice(0, 2))
        
        // Convert null values to undefined to match the WarehouseITAsset interface
        const formattedWarehouseData = warehouseData.map((warehouse: any) => {
          // Extract custom fields and add them to the formatted data
          const customFields = warehouse.customFields as Record<string, any> || {};
          
          return {
            dept: warehouse.dept,
            cpuBarcode: warehouse.cpuBarcode,
            cpuSapBarcode: warehouse.cpuSapBarcode ?? undefined,
            monitorBarcode: warehouse.monitorBarcode ?? undefined,
            monitorSapBarcode: warehouse.monitorSapBarcode ?? undefined,
            upsBarcode: warehouse.upsBarcode ?? undefined,
            upsSapBarcode: warehouse.upsSapBarcode ?? undefined,
            note: warehouse.note ?? undefined,
            // Normalize status values to lowercase to match standardized values
            status: warehouse.status ? warehouse.status.toLowerCase() : 'working',
            // Include custom fields
            ...customFields
          };
        })
        
        console.log('Starting Warehouse Excel export...');
        const warehouseExportStart = Date.now();
        
        try {
          buffer = await exportWarehouseITToExcel(formattedWarehouseData)
          console.log(`Warehouse Excel export completed in ${(Date.now() - warehouseExportStart) / 1000} seconds`);
        } catch (exportError: any) {
          console.error('Error during Warehouse export:', exportError);
          throw new Error(`Warehouse export failed: ${exportError.message}`);
        }
        break

      default:
        return new Response(JSON.stringify({ error: `Unsupported asset type: ${assetType}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }

    // Log performance metrics
    const endTime = Date.now();
    console.log(`Export operation completed in ${(endTime - startTime) / 1000} seconds`);
    
    // Clear the timeout since we're done
    if (timer) clearTimeout(timer);

    // Return Excel file
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${assetType}-export.xlsx`
      }
    })
  } catch (error: any) {
    // Clear the timeout if there was an error
    if (timer) clearTimeout(timer);
    
    console.error('Error exporting Excel file:', error);
    
    // Check if the error was due to an aborted request
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Export operation timed out. The data might be too large or there might be a performance issue.' }), {
        status: 504, // Gateway Timeout
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for template-related errors
    if (error.message && error.message.includes('Template file')) {
      return new Response(JSON.stringify({ error: `Template error: ${error.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return a more descriptive error message
    const errorMessage = error.message || 'Internal server error';
    return new Response(JSON.stringify({ error: `Excel export failed: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}