import { AssetApiHandler } from '@/lib/asset-api-handler';
import { PrismaClient } from '@prisma/client';
import cacheManager from '@/lib/cache-manager';
import { CACHE_PREFIXES } from '@/lib/redis-cache';

// Mock the Prisma client
const mockPrismaClient = {
  pC: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  customField: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock the cache manager
jest.mock('@/lib/cache-manager', () => ({
  __esModule: true,
  default: {
    createCompositeKey: jest.fn((...args) => args.join(':')),
    del: jest.fn(),
    invalidateResource: jest.fn(),
    batchInvalidate: jest.fn(),
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

describe('AssetApiHandler Cache Invalidation', () => {
  let pcHandler: AssetApiHandler<any>;
  const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    role: { id: 'role1' },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new handler for each test
    pcHandler = new AssetApiHandler(mockPrismaClient, {
      modelName: 'PC',
      requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
      uniqueField: 'cpuBarcode',
      searchFields: ['cpuBarcode', 'pcName', 'userName', 'dept', 'status']
    });
  });

  describe('create method', () => {
    it('should invalidate cache after creating an asset', async () => {
      // Mock the Prisma create method
      const mockAsset = {
        id: 'asset1',
        tenantId: 'tenant1',
        dept: 'IT',
        cpuBarcode: 'CPU001',
        pcName: 'PC001',
        status: 'working',
      };
      
      (mockPrismaClient.pC.create as jest.Mock).mockResolvedValue(mockAsset);
      (mockPrismaClient.customField.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock the cache manager methods
      (cacheManager.invalidateResource as jest.Mock).mockResolvedValue(undefined);
      (cacheManager.batchInvalidate as jest.Mock).mockResolvedValue(0);
      
      // Execute the create method
      await pcHandler.create(mockUser, {
        dept: 'IT',
        cpuBarcode: 'CPU001',
        pcName: 'PC001',
        status: 'working',
      });
      
      // Verify that cache invalidation was called
      expect(cacheManager.invalidateResource).toHaveBeenCalledWith(
        'tenant1',
        'PC',
        { component: 'asset-api-handler' }
      );
      
      // Verify that search cache invalidation was called
      expect(cacheManager.batchInvalidate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('search:PC:tenant1:')
        ]),
        { component: 'asset-api-handler' }
      );
    });
  });

  describe('update method', () => {
    it('should invalidate cache after updating an asset', async () => {
      // Mock the Prisma update method
      const mockAsset = {
        id: 'asset1',
        tenantId: 'tenant1',
        dept: 'IT',
        cpuBarcode: 'CPU001',
        pcName: 'PC001',
        status: 'working',
      };
      
      (mockPrismaClient.pC.findUnique as jest.Mock).mockResolvedValue(mockAsset);
      (mockPrismaClient.pC.update as jest.Mock).mockResolvedValue(mockAsset);
      (mockPrismaClient.customField.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock the cache manager methods
      (cacheManager.del as jest.Mock).mockResolvedValue(true);
      (cacheManager.invalidateResource as jest.Mock).mockResolvedValue(undefined);
      (cacheManager.batchInvalidate as jest.Mock).mockResolvedValue(0);
      
      // Execute the update method
      await pcHandler.update(mockUser, 'asset1', {
        status: 'repair',
      });
      
      // Verify that specific asset cache was deleted
      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('assets:PC:tenant1:asset1'),
        { component: 'asset-api-handler' }
      );
      
      // Verify that cache invalidation was called
      expect(cacheManager.invalidateResource).toHaveBeenCalledWith(
        'tenant1',
        'PC',
        { component: 'asset-api-handler' }
      );
      
      // Verify that search cache invalidation was called
      expect(cacheManager.batchInvalidate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('search:PC:tenant1:')
        ]),
        { component: 'asset-api-handler' }
      );
    });
  });

  describe('delete method', () => {
    it('should invalidate cache after deleting an asset', async () => {
      // Mock the Prisma delete method
      const mockAsset = {
        id: 'asset1',
        tenantId: 'tenant1',
        dept: 'IT',
        cpuBarcode: 'CPU001',
        pcName: 'PC001',
        status: 'working',
      };
      
      (mockPrismaClient.pC.findUnique as jest.Mock).mockResolvedValue(mockAsset);
      (mockPrismaClient.pC.delete as jest.Mock).mockResolvedValue(undefined);
      (mockPrismaClient.customField.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock the cache manager methods
      (cacheManager.del as jest.Mock).mockResolvedValue(true);
      (cacheManager.invalidateResource as jest.Mock).mockResolvedValue(undefined);
      (cacheManager.batchInvalidate as jest.Mock).mockResolvedValue(0);
      
      // Execute the delete method
      await pcHandler.delete(mockUser, 'asset1');
      
      // Verify that specific asset cache was deleted
      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('assets:PC:tenant1:asset1'),
        { component: 'asset-api-handler' }
      );
      
      // Verify that cache invalidation was called
      expect(cacheManager.invalidateResource).toHaveBeenCalledWith(
        'tenant1',
        'PC',
        { component: 'asset-api-handler' }
      );
      
      // Verify that search cache invalidation was called
      expect(cacheManager.batchInvalidate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('search:PC:tenant1:')
        ]),
        { component: 'asset-api-handler' }
      );
    });
  });

  describe('bulkDelete method', () => {
    it('should invalidate cache after bulk deleting assets', async () => {
      // Mock the Prisma bulk delete method
      const mockAssets = [
        { id: 'asset1', tenantId: 'tenant1' },
        { id: 'asset2', tenantId: 'tenant1' },
      ];
      
      (mockPrismaClient.pC.findMany as jest.Mock).mockResolvedValue(mockAssets);
      (mockPrismaClient.pC.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (mockPrismaClient.customField.findMany as jest.Mock).mockResolvedValue([]);
      
      // Mock the cache manager methods
      (cacheManager.del as jest.Mock).mockResolvedValue(true);
      (cacheManager.invalidateResource as jest.Mock).mockResolvedValue(undefined);
      (cacheManager.batchInvalidate as jest.Mock).mockResolvedValue(0);
      
      // Execute the bulk delete method
      await pcHandler.bulkDelete(mockUser, ['asset1', 'asset2']);
      
      // Verify that specific asset caches were deleted
      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('assets:PC:tenant1:asset1'),
        { component: 'asset-api-handler' }
      );
      
      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('assets:PC:tenant1:asset2'),
        { component: 'asset-api-handler' }
      );
      
      // Verify that cache invalidation was called
      expect(cacheManager.invalidateResource).toHaveBeenCalledWith(
        'tenant1',
        'PC',
        { component: 'asset-api-handler' }
      );
      
      // Verify that search cache invalidation was called
      expect(cacheManager.batchInvalidate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('search:PC:tenant1:')
        ]),
        { component: 'asset-api-handler' }
      );
    });
  });
});