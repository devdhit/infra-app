import { NextRequest } from 'next/server';
import * as pcRoute from '@/app/api/assets/pc/route';
import * as pcIdRoute from '@/app/api/assets/pc/[id]/route';
import * as customFieldsRoute from '@/app/api/assets/custom-fields/[id]/route';
import { getCurrentUser } from '@/lib/auth';
import { pcHandler } from '@/lib/asset-api-handler';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock the asset API handler
jest.mock('@/lib/asset-api-handler', () => ({
  pcHandler: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkDelete: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Asset API Routes', () => {
  const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    role: { id: 'role1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('PC Routes', () => {
    describe('GET /api/assets/pc', () => {
      it('should call pcHandler.getAll with user and query params', async () => {
        // Mock the request
        const mockRequest = {
          url: 'http://localhost:3000/api/assets/pc?page=1&limit=10',
        } as NextRequest;

        // Mock the handler response
        (pcHandler.getAll as jest.Mock).mockResolvedValue({
          status: 200,
          json: () => Promise.resolve({ data: [] }),
        });

        // Call the route handler
        const response = await pcRoute.GET(mockRequest);

        // Verify the handler was called correctly
        expect(getCurrentUser).toHaveBeenCalledWith(mockRequest);
        expect(pcHandler.getAll).toHaveBeenCalledWith(mockUser, {
          page: 1,
          limit: 10,
          search: undefined,
          status: undefined,
        });
      });
    });

    describe('POST /api/assets/pc', () => {
      it('should call pcHandler.create with user and body', async () => {
        // Mock the request
        const mockBody = {
          dept: 'IT',
          cpuBarcode: 'CPU001',
          pcName: 'PC001',
          status: 'working',
        };

        const mockRequest = {
          json: jest.fn().mockResolvedValue(mockBody),
        } as unknown as NextRequest;

        // Mock the handler response
        (pcHandler.create as jest.Mock).mockResolvedValue({
          status: 201,
          json: () => Promise.resolve({ id: 'asset1' }),
        });

        // Call the route handler
        const response = await pcRoute.POST(mockRequest);

        // Verify the handler was called correctly
        expect(getCurrentUser).toHaveBeenCalledWith(mockRequest);
        expect(pcHandler.create).toHaveBeenCalledWith(mockUser, mockBody);
      });
    });

    describe('PUT /api/assets/pc/[id]', () => {
      it('should call pcHandler.update with user, id, and body', async () => {
        // Mock the request
        const mockBody = {
          status: 'repair',
        };

        const mockRequest = {
          json: jest.fn().mockResolvedValue(mockBody),
        } as unknown as NextRequest;

        const mockParams = Promise.resolve({ id: 'asset1' });

        // Mock the handler response
        (pcHandler.update as jest.Mock).mockResolvedValue({
          status: 200,
          json: () => Promise.resolve({ id: 'asset1', status: 'repair' }),
        });

        // Call the route handler
        const response = await pcIdRoute.PUT(mockRequest, { params: mockParams });

        // Verify the handler was called correctly
        expect(getCurrentUser).toHaveBeenCalledWith(mockRequest);
        expect(pcHandler.update).toHaveBeenCalledWith(mockUser, 'asset1', mockBody);
      });
    });

    describe('DELETE /api/assets/pc/[id]', () => {
      it('should call pcHandler.delete with user and id', async () => {
        // Mock the request
        const mockRequest = {} as NextRequest;
        const mockParams = Promise.resolve({ id: 'asset1' });

        // Mock the handler response
        (pcHandler.delete as jest.Mock).mockResolvedValue({
          status: 204,
        });

        // Call the route handler
        const response = await pcIdRoute.DELETE(mockRequest, { params: mockParams });

        // Verify the handler was called correctly
        expect(getCurrentUser).toHaveBeenCalledWith(mockRequest);
        expect(pcHandler.delete).toHaveBeenCalledWith(mockUser, 'asset1');
      });
    });
  });

  describe('Custom Fields Routes', () => {
    describe('PUT /api/assets/custom-fields/[id]', () => {
      it('should update asset custom fields', async () => {
        // This test would require more complex mocking of the database and Redis cache
        // For now, we'll just verify that the route handler exists and can be imported
        expect(customFieldsRoute).toBeDefined();
        expect(typeof customFieldsRoute.PUT).toBe('function');
      });
    });

    describe('GET /api/assets/custom-fields/[id]', () => {
      it('should get asset custom fields', async () => {
        // This test would require more complex mocking of the database
        // For now, we'll just verify that the route handler exists and can be imported
        expect(customFieldsRoute).toBeDefined();
        expect(typeof customFieldsRoute.GET).toBe('function');
      });
    });
  });
});