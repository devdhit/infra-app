import { exportPCToExcel, exportLaptopToExcel, exportPrinterToExcel, exportLicenseToExcel, exportWarehouseITToExcel } from '@/lib/excel';
import * as fs from 'fs';
import * as path from 'path';

// Mock the xlsx-populate library
jest.mock('xlsx-populate', () => {
  return {
    fromDataAsync: jest.fn().mockResolvedValue({
      sheet: jest.fn().mockReturnValue({
        cell: jest.fn().mockReturnValue({
          value: jest.fn().mockReturnThis()
        }),
        insertRows: jest.fn(),
        usedRange: jest.fn().mockReturnValue({
          value: jest.fn()
        })
      }),
      outputAsync: jest.fn().mockResolvedValue(new ArrayBuffer(100))
    })
  };
});

describe('Excel Export Functions', () => {
  // Mock template files
  beforeEach(() => {
    // Mock fs.promises.access to resolve successfully
    jest.spyOn(fs.promises, 'access').mockResolvedValue(undefined as any);
    
    // Mock fs.promises.readFile to return a buffer
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue({
      buffer: new ArrayBuffer(100),
      byteOffset: 0,
      byteLength: 100
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportPCToExcel', () => {
    it('should export PC data to Excel', async () => {
      const pcData = [
        {
          dept: 'IT',
          cpuBarcode: 'CPU001',
          cpuSapBarcode: 'SAP001',
          monitorBarcode: 'MON001',
          monitorSapBarcode: 'SAP002',
          upsBarcode: 'UPS001',
          upsSapBarcode: 'SAP003',
          pcName: 'PC001',
          user: 'John Doe',
          status: 'active',
          note: 'Test note'
        }
      ];

      const result = await exportPCToExcel(pcData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle empty PC data', async () => {
      const pcData: any[] = [];
      
      const result = await exportPCToExcel(pcData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('exportLaptopToExcel', () => {
    it('should export Laptop data to Excel', async () => {
      const laptopData = [
        {
          dept: 'IT',
          barcode: 'LAP001',
          sapBarcode: 'SAP001',
          dateBuy: '2023-01-01',
          user: 'John Doe',
          email: 'john@example.com',
          model: 'Dell XPS',
          status: 'active'
        }
      ];

      const result = await exportLaptopToExcel(laptopData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('exportPrinterToExcel', () => {
    it('should export Printer data to Excel', async () => {
      const printerData = [
        {
          dept: 'IT',
          location: 'Office 101',
          ip: '192.168.1.100',
          model: 'HP LaserJet',
          color: true,
          barcode: 'PRN001',
          sapCode: 'SAP001',
          date: '2023-01-01',
          note: 'Test note'
        }
      ];

      const result = await exportPrinterToExcel(printerData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('exportLicenseToExcel', () => {
    it('should export License data to Excel', async () => {
      const licenseData = [
        {
          deviceName: 'Windows 10',
          userName: 'John Doe',
          dept: 'IT',
          productType: 'OS',
          productKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          model: 'Professional',
          pc: 'PC001',
          mac: '00:00:00:00:00:00',
          ip: '192.168.1.100',
          date: '2023-01-01',
          updateStatus: 'active'
        }
      ];

      const result = await exportLicenseToExcel(licenseData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('exportWarehouseITToExcel', () => {
    it('should export WarehouseIT data to Excel', async () => {
      const warehouseData = [
        {
          cpuBarcode: 'CPU001',
          cpuSapBarcode: 'SAP001',
          monitorBarcode: 'MON001',
          monitorSapBarcode: 'SAP002',
          upsBarcode: 'UPS001',
          upsSapBarcode: 'SAP003',
          status: 'available',
          note: 'Test note'
        }
      ];

      const result = await exportWarehouseITToExcel(warehouseData);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('Template File Handling', () => {
    it('should throw error when template file is not found', async () => {
      // Mock fs.promises.access to reject with an error
      jest.spyOn(fs.promises, 'access').mockRejectedValue(new Error('File not found'));
      
      const pcData = [
        {
          dept: 'IT',
          cpuBarcode: 'CPU001',
          cpuSapBarcode: 'SAP001',
          monitorBarcode: 'MON001',
          monitorSapBarcode: 'SAP002',
          upsBarcode: 'UPS001',
          upsSapBarcode: 'SAP003',
          pcName: 'PC001',
          user: 'John Doe',
          status: 'active',
          note: 'Test note'
        }
      ];

      await expect(exportPCToExcel(pcData)).rejects.toThrow('Template file PC_Template.xlsx not found or not accessible');
    });
  });
});