import { GET } from '@/app/api/assets/excel/export/route';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn()
}));

// Mock the database module
jest.mock('@/lib/db', () => ({
  db: {
    pC: {
      findMany: jest.fn()
    },
    laptop: {
      findMany: jest.fn()
    },
    printer: {
      findMany: jest.fn()
    },
    license: {
      findMany: jest.fn()
    },
    warehouseIT: {
      findMany: jest.fn()
    }
  }
}));

// Mock the Excel export functions
jest.mock('@/lib/excel', () => ({
  exportPCToExcel: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
  exportLaptopToExcel: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
  exportPrinterToExcel: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
  exportLicenseToExcel: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
  exportWarehouseITToExcel: jest.fn().mockResolvedValue(new ArrayBuffer(100))
}));

describe('Excel Export API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=pc');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if assetType is not provided', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });

    const request = new Request('http://localhost:3000/api/assets/excel/export');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Asset type is required' });
  });

  it('should return 400 for unsupported asset type', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });;

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=unsupported');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Unsupported asset type: unsupported' });
  });

  it('should export PC data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.pC.findMany as jest.Mock).mockResolvedValue([
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
        note: 'Test note',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=pc');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=pc-export.xlsx');
  });

  it('should export Laptop data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.laptop.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        dept: 'IT',
        barcode: 'LAP001',
        sapBarcode: 'SAP001',
        dateBuy: '2023-01-01',
        userId: 'user1',
        email: 'john@example.com',
        model: 'Dell XPS',
        status: 'active',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=laptop');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=laptop-export.xlsx');
  });

  it('should export Printer data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.printer.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        dept: 'IT',
        location: 'Office 101',
        ip: '192.168.1.100',
        model: 'HP LaserJet',
        color: true,
        barcode: 'PRN001',
        sapCode: 'SAP001',
        date: '2023-01-01',
        note: 'Test note',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=printer');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=printer-export.xlsx');
  });

  it('should export License data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.license.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
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
        updateStatus: 'active',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=license');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=license-export.xlsx');
  });

  it('should export WarehouseIT data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.warehouseIT.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        cpuBarcode: 'CPU001',
        cpuSapBarcode: 'SAP001',
        monitorBarcode: 'MON001',
        monitorSapBarcode: 'SAP002',
        upsBarcode: 'UPS001',
        upsSapBarcode: 'SAP003',
        status: 'available',
        note: 'Test note',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=warehouse');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=warehouse-export.xlsx');
  });

  it('should handle department filtering', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.pC.findMany as jest.Mock).mockResolvedValue([
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
        note: 'Test note',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=pc&dept=IT');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(db.pC.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'test-tenant',
        dept: 'IT'
      },
      select: {
        id: true,
        dept: true,
        cpuBarcode: true,
        cpuSapBarcode: true,
        monitorBarcode: true,
        monitorSapBarcode: true,
        upsBarcode: true,
        upsSapBarcode: true,
        pcName: true,
        userId: true,
        status: true,
        note: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      },
      take: 5000
    });
  });

  it('should handle selected IDs filtering', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });
    (db.pC.findMany as jest.Mock).mockResolvedValue([
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
        note: 'Test note',
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=pc&selectedIds=["1","2"]');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(db.pC.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'test-tenant',
        id: {
          in: ['1', '2']
        }
      },
      select: {
        id: true,
        dept: true,
        cpuBarcode: true,
        cpuSapBarcode: true,
        monitorBarcode: true,
        monitorSapBarcode: true,
        upsBarcode: true,
        upsSapBarcode: true,
        pcName: true,
        userId: true,
        status: true,
        note: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      },
      take: 5000
    });
  });

  it('should return 400 for invalid selected IDs format', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'test-tenant' });

    const request = new Request('http://localhost:3000/api/assets/excel/export?assetType=pc&selectedIds=invalid');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ error: 'Invalid selected IDs format' });
  });
});