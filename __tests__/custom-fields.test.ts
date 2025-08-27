import { AssetApiHandler } from '../src/lib/asset-api-handler';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockDb = {
  customField: {
    findMany: jest.fn(),
  },
  PC: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  history: {
    create: jest.fn(),
  },
};

// Mock user
const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
};

// Asset operations config
const assetOperations = {
  modelName: 'PC',
  requiredFields: ['cpuBarcode'],
  uniqueField: 'cpuBarcode',
};

describe('Custom Fields Validation', () => {
  let assetApiHandler: AssetApiHandler<any>;

  beforeEach(() => {
    assetApiHandler = new AssetApiHandler(mockDb as any, assetOperations);
    jest.clearAllMocks();
  });

  describe('Create Asset with Custom Fields', () => {
    it('should validate required custom fields', async () => {
      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'warranty', type: 'date', required: true },
        { name: 'cost', type: 'number', required: true },
      ]);

      const body = {
        cpuBarcode: 'CPU123',
        customFields: {
          warranty: '', // Empty required field
          cost: null,   // Null required field
        },
      };

      const result = await assetApiHandler.create(mockUser, body);

      expect(result).toEqual({
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          validationErrors: {
            'customFields.warranty': 'warranty is required',
            'customFields.cost': 'cost is required',
          },
        },
      });
    });

    it('should validate custom field types', async () => {
      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'warranty', type: 'date', required: false },
        { name: 'cost', type: 'number', required: false },
        { name: 'isActive', type: 'boolean', required: false },
      ]);

      const body = {
        cpuBarcode: 'CPU123',
        customFields: {
          warranty: 'invalid-date',
          cost: 'not-a-number',
          isActive: 'not-a-boolean',
        },
      };

      const result = await assetApiHandler.create(mockUser, body);

      expect(result).toEqual({
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          validationErrors: {
            'customFields.warranty': 'warranty must be a valid date',
            'customFields.cost': 'cost must be a valid number',
            'customFields.isActive': 'isActive must be a boolean value (true/false)',
          },
        },
      });
    });

    it('should pass validation for valid custom fields', async () => {
      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'warranty', type: 'date', required: false },
        { name: 'cost', type: 'number', required: false },
        { name: 'description', type: 'text', required: false },
      ]);

      // Mock successful creation
      const createdAsset = { id: 'asset-1', cpuBarcode: 'CPU123', customFields: {} };
      mockDb.PC.create.mockResolvedValue(createdAsset);
      mockDb.PC.findUnique.mockResolvedValue(null); // No existing asset

      const body = {
        cpuBarcode: 'CPU123',
        customFields: {
          warranty: '2025-12-31',
          cost: 1500,
          description: 'High-performance workstation',
        },
      };

      const result = await assetApiHandler.create(mockUser, body);

      expect(result).toEqual({
        success: true,
        data: createdAsset,
        statusCode: 201,
      });
    });
  });

  describe('Update Asset with Custom Fields', () => {
    it('should validate required custom fields on update', async () => {
      // Mock existing asset
      const existingAsset = { id: 'asset-1', cpuBarcode: 'CPU123', customFields: {} };
      mockDb.PC.findUnique.mockResolvedValue(existingAsset);

      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'warranty', type: 'date', required: true },
      ]);

      const body = {
        customFields: {
          warranty: '', // Empty required field
        },
      };

      const result = await assetApiHandler.update(mockUser, 'asset-1', body);

      expect(result).toEqual({
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          validationErrors: {
            'customFields.warranty': 'warranty is required',
          },
        },
      });
    });

    it('should validate custom field types on update', async () => {
      // Mock existing asset
      const existingAsset = { id: 'asset-1', cpuBarcode: 'CPU123', customFields: {} };
      mockDb.PC.findUnique.mockResolvedValue(existingAsset);

      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'cost', type: 'number', required: false },
      ]);

      const body = {
        customFields: {
          cost: 'not-a-number',
        },
      };

      const result = await assetApiHandler.update(mockUser, 'asset-1', body);

      expect(result).toEqual({
        success: false,
        error: {
          type: 'validation',
          message: 'Validation failed',
          validationErrors: {
            'customFields.cost': 'cost must be a valid number',
          },
        },
      });
    });

    it('should pass validation for valid custom fields on update', async () => {
      // Mock existing asset
      const existingAsset = { id: 'asset-1', cpuBarcode: 'CPU123', customFields: {} };
      mockDb.PC.findUnique.mockResolvedValue(existingAsset);

      // Mock custom fields
      mockDb.customField.findMany.mockResolvedValue([
        { name: 'cost', type: 'number', required: false },
      ]);

      // Mock successful update
      const updatedAsset = { id: 'asset-1', cpuBarcode: 'CPU123', customFields: { cost: 1500 } };
      mockDb.PC.update.mockResolvedValue(updatedAsset);

      const body = {
        customFields: {
          cost: 1500,
        },
      };

      const result = await assetApiHandler.update(mockUser, 'asset-1', body);

      expect(result).toEqual({
        success: true,
        data: updatedAsset,
      });
    });
  });
});