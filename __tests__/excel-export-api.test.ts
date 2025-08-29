import { GET } from '@/app/api/assets/excel/export/route'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// Mock the dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/db')

describe('Excel Export API', () => {
  const mockRequest = (url: string) => {
    return {
      url: `http://localhost:3000${url}`
    } as any
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return 401 if user is not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null)
    
    const request = mockRequest('/api/assets/excel/export?assetType=pc')
    const response = await GET(request)
    
    expect(response.status).toBe(401)
    const responseBody = await response.json()
    expect(responseBody.error).toBe('Unauthorized')
  })

  test('should return 400 if assetType is not provided', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'tenant1' })
    
    const request = mockRequest('/api/assets/excel/export')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const responseBody = await response.json()
    expect(responseBody.error).toBe('Asset type is required')
  })

  test('should return 400 for unsupported asset type', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'tenant1' })
    
    const request = mockRequest('/api/assets/excel/export?assetType=unsupported')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const responseBody = await response.json()
    expect(responseBody.error).toBe('Unsupported asset type')
  })

  test('should export PC data successfully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'tenant1' })
    ;(db.pC.findMany as jest.Mock).mockResolvedValue([
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
      }
    ])
    
    const request = mockRequest('/api/assets/excel/export?assetType=pc')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=pc-export.xlsx')
  })

  test('should export selected PC data when selectedIds are provided', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'tenant1' })
    ;(db.pC.findMany as jest.Mock).mockResolvedValue([
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
      }
    ])
    
    const request = mockRequest('/api/assets/excel/export?assetType=pc&selectedIds=["1","2"]')
    const response = await GET(request)
    
    expect(db.pC.findMany).toHaveBeenCalledWith({
      where: { 
        tenantId: 'tenant1',
        id: { in: ['1', '2'] }
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
      }
    })
    
    expect(response.status).toBe(200)
  })

  test('should handle export errors gracefully', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ tenantId: 'tenant1' })
    ;(db.pC.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))
    
    const request = mockRequest('/api/assets/excel/export?assetType=pc')
    const response = await GET(request)
    
    expect(response.status).toBe(500)
    const responseBody = await response.json()
    expect(responseBody.error).toBe('Internal server error')
  })
})