import { exportPCToExcel, exportLaptopToExcel, exportPrinterToExcel, exportLicenseToExcel, exportWarehouseITToExcel } from '@/lib/excel'

// Mock data for testing
const mockPCData = [
  {
    id: '1',
    dept: 'IT',
    cpuBarcode: 'CPU001',
    cpuSapBarcode: 'SAP001',
    monitorBarcode: 'MON001',
    monitorSapBarcode: 'SAP002',
    upsBarcode: 'UPS001',
    upsSapBarcode: 'SAP003',
    pcName: 'PC001',
    userId: 'user1',
    status: 'active',
    note: 'Test PC',
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    dept: 'HR',
    cpuBarcode: 'CPU002',
    cpuSapBarcode: 'SAP004',
    monitorBarcode: 'MON002',
    monitorSapBarcode: 'SAP005',
    upsBarcode: 'UPS002',
    upsSapBarcode: 'SAP006',
    pcName: 'PC002',
    userId: 'user2',
    status: 'inactive',
    note: 'HR PC',
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockLaptopData = [
  {
    id: '1',
    dept: 'IT',
    barcode: 'LAP001',
    sapBarcode: 'SAP001',
    dateBuy: '2023-01-01',
    userId: 'user1',
    email: 'user1@example.com',
    model: 'Dell XPS',
    status: 'active',
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe('Excel Partial Export Functionality', () => {
  test('should export PC data to Excel', async () => {
    const buffer = await exportPCToExcel(mockPCData)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  test('should export Laptop data to Excel', async () => {
    const buffer = await exportLaptopToExcel(mockLaptopData)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  test('should export Printer data to Excel', async () => {
    const mockPrinterData = [
      {
        id: '1',
        dept: 'IT',
        location: 'Office 1',
        ip: '192.168.1.100',
        model: 'HP LaserJet',
        color: true,
        barcode: 'PRN001',
        sapCode: 'SAP001',
        date: '2023-01-01',
        note: 'Network printer',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const buffer = await exportPrinterToExcel(mockPrinterData)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  test('should export License data to Excel', async () => {
    const mockLicenseData = [
      {
        id: '1',
        deviceName: 'Windows 11',
        userName: 'John Doe',
        dept: 'IT',
        productType: 'OS',
        productKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
        model: 'Professional',
        pc: 'PC001',
        mac: '00:00:00:00:00:00',
        ip: '192.168.1.100',
        date: '2023-01-01',
        updateStatus: 'active',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const buffer = await exportLicenseToExcel(mockLicenseData)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })

  test('should export Warehouse IT data to Excel', async () => {
    const mockWarehouseData = [
      {
        id: '1',
        cpuBarcode: 'CPU001',
        cpuSapBarcode: 'SAP001',
        monitorBarcode: 'MON001',
        monitorSapBarcode: 'SAP002',
        upsBarcode: 'UPS001',
        upsSapBarcode: 'SAP003',
        status: 'available',
        note: 'Storage items',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const buffer = await exportWarehouseITToExcel(mockWarehouseData)
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})