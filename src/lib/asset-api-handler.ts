import { PrismaClient } from '../generated/prisma'
import { db } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  badRequestResponse,
  conflictResponse,
  validationErrorResponse,
  errorResponse as apiErrorResponse
} from './api-utils'
import { hasPermission, ResourceType, PermissionAction } from './permissions'

// Only import Redis cache on the server side
let CACHE_PREFIXES: any = null;
let CACHE_TTL: any = null;
let cacheManager: any = null;

// Import logger for better error handling
let logger: any = null;
if (typeof window === 'undefined') {
  try {
    logger = require('./logger').default;
  } catch (error) {
    // Fallback to console if logger is not available
    logger = {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log
    };
  }
}

if (typeof window === 'undefined') {
  try {
    const redisModule = require('./redis-cache');
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
    CACHE_TTL = redisModule.CACHE_TTL;
    
    // Import the new cache manager
    cacheManager = require('./cache-manager').default;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'asset-api-handler', 
      error: error.message 
    });
  }
}

// Define comprehensive asset interfaces with proper typing
export interface BaseAsset {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  customFields?: Record<string, any>;
}

export interface PCAsset extends BaseAsset {
  dept: string;
  cpuBarcode: string;
  cpuSapBarcode?: string;
  monitorBarcode?: string;
  monitorSapBarcode?: string;
  upsBarcode?: string;
  upsSapBarcode?: string;
  pcName: string;
  userName?: string;
  status: string;
  note?: string;
}

export interface LaptopAsset extends BaseAsset {
  dept: string;
  barcode: string;
  sapBarcode?: string;
  dateBuy?: string;
  userName?: string;
  email?: string;
  model?: string;
  status: string;
}

export interface PrinterAsset extends BaseAsset {
  dept: string;
  location?: string;
  ip?: string;
  model?: string;
  color: string;
  barcode: string;
  sapCode?: string;
  date?: string;
  note?: string;
}

export interface LicenseAsset extends BaseAsset {
  deviceName?: string;
  userName?: string;
  dept?: string;
  productType?: string;
  productKey?: string;
  model?: string;
  pc?: string;
  mac?: string;
  ip?: string;
  date?: string;
  updateStatus?: string;
}

export interface WarehouseITAsset extends BaseAsset {
  barcode?: string;
  sapCode?: string;
  status: string;
  note?: string;
}

export interface InternetAsset extends BaseAsset {
  dept: string;
  manager?: string;
  userName?: string;
  email?: string;
  ipAddress?: string;
  internetAccess?: string;
  status: string;
  note?: string;
}

// Union type for all asset types
export type AssetType = PCAsset | LaptopAsset | PrinterAsset | LicenseAsset | WarehouseITAsset | InternetAsset;

// Define the structure for asset operations with better typing
interface AssetOperations<T extends BaseAsset> {
  modelName: string;
  requiredFields?: (keyof Omit<T, keyof BaseAsset>)[];
  uniqueField?: keyof Omit<T, keyof BaseAsset>;
  searchFields?: (keyof Omit<T, keyof BaseAsset>)[];
}

// Generic asset API handler with improved type safety
export class AssetApiHandler<T extends BaseAsset> {
  private resourceType: ResourceType;

  constructor(private db: PrismaClient, private operations: AssetOperations<T>) {
    // Map model names to resource types for permission checking
    const modelToResourceMap: Record<string, ResourceType> = {
      'PC': 'pc',
      'Laptop': 'laptop',
      'Printer': 'printer',
      'License': 'license',
      'WarehouseIT': 'warehouse',
      'Internet': 'internet'
    };
    
    this.resourceType = modelToResourceMap[this.operations.modelName] || 'assets';
  }

  // Helper method to get optimized select fields based on asset type
  private getSelectFieldsForAssetType() {
    // Base fields vary by model type as not all models have the same fields
    const getBaseFieldsForModel = (modelName: string) => {
      // Default base fields for all models
      const defaultBaseFields = {
        dept: true,
      };
      
      // Add status field for models that have it
      if (modelName === 'PC' || modelName === 'Laptop' || modelName === 'WarehouseIT' || modelName === 'Internet') {
        return {
          ...defaultBaseFields,
          status: true,
          userName: modelName !== 'WarehouseIT' ? true : undefined
        };
      } else if (modelName === 'License') {
        return {
          ...defaultBaseFields,
          updateStatus: true,
          userName: true
        };
      }
      
      // Printer doesn't have status or userName fields
      return defaultBaseFields;
    };

    // Special handling for WarehouseIT which doesn't have dept field
    if (this.operations.modelName === 'WarehouseIT') {
      const baseFields = {
        status: true,
      };

      return {
        ...baseFields,
        barcode: true,
        sapCode: true,
        note: true,
        customFields: true // Include custom fields
      };
    }

    const baseFields = getBaseFieldsForModel(this.operations.modelName);

    // Remove undefined fields from baseFields to prevent Prisma errors
    const cleanBaseFields = Object.fromEntries(
      Object.entries(baseFields).filter(([_, value]) => value !== undefined)
    );

    switch (this.operations.modelName) {
      case 'PC':
        return {
          ...cleanBaseFields,
          cpuBarcode: true,
          cpuSapBarcode: true,
          monitorBarcode: true,
          monitorSapBarcode: true,
          upsBarcode: true,
          upsSapBarcode: true,
          pcName: true,
          userName: true,
          note: true,
          customFields: true // Include custom fields
        };
      case 'Laptop':
        return {
          ...cleanBaseFields,
          barcode: true,
          sapBarcode: true,
          model: true,
          dateBuy: true,
          userName: true,
          email: true,
          customFields: true // Include custom fields
        };
      case 'Printer':
        return {
          ...cleanBaseFields,
          barcode: true,
          model: true,
          location: true,
          color: true,
          ip: true,
          sapCode: true,
          date: true,
          note: true,
          customFields: true // Include custom fields
        };
      case 'License':
        return {
          ...cleanBaseFields,
          deviceName: true,
          productType: true,
          productKey: true,
          model: true,
          pc: true,
          mac: true,
          ip: true,
          date: true,
          updateStatus: true,
          customFields: true // Include custom fields
        };
      case 'WarehouseIT':
        return {
          ...cleanBaseFields,
          barcode: true,
          sapCode: true,
          status: true,
          note: true,
          customFields: true // Include custom fields
        };
      case 'Internet':
        return {
          ...cleanBaseFields,
          manager: true,
          userName: true,
          email: true,
          ipAddress: true,
          internetAccess: true,
          note: true,
          customFields: true // Include custom fields
        };
      default:
        return {
          ...cleanBaseFields,
          customFields: true // Include custom fields by default
        };
    }
  }

  // Check if user has permission for an action
  private async checkPermission(user: any, action: PermissionAction) {
    // Handle case where role is null
    if (!user.role?.id) {
      return false;
    }
    
    return await hasPermission(
      user.role.id,
      user.tenantId,
      this.resourceType,
      action
    );
  }

  // Get all assets with pagination and filtering
  async getAll(
    user: any, 
    queryParams: { page: number; limit: number; search: string | undefined; status: string | undefined }
  ) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to view assets', 403);
      }

      const { page, limit, search, status } = queryParams

      // Create cache key for this specific query if Redis is available
      let cacheKey: string | null = null;
      if (cacheManager && CACHE_PREFIXES) {
        cacheKey = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSET_LIST,
          this.operations.modelName,
          user.tenantId,
          page,
          limit,
          search || 'no-search',
          status || 'no-status'
        );
      }

      // Try to get cached result first if Redis is available
      if (cacheManager && cacheKey) {
        const cachedResult = await cacheManager.get(cacheKey, { component: 'asset-api-handler' });
        if (cachedResult) {
          return successResponse(cachedResult);
        }
      }

      // For full-text search, we need to use raw SQL queries
      if (search && this.operations.searchFields) {
        // Use raw SQL for full-text search with search_vector
        const offset = (page - 1) * limit;
        const tableName = this.operations.modelName;
        
        // Map model names to actual table names
        const tableNames: Record<string, string> = {
          'PC': 'PC',
          'Laptop': 'Laptop',
          'Printer': 'Printer',
          'License': 'License',
          'WarehouseIT': 'WarehouseIT',
          'Internet': 'Internet'
        };
        
        const actualTableName = tableNames[tableName] || tableName;
        
        // Build the search query using websearch_to_tsquery for better search experience
        const searchQuery = search.trim();
        
        // Status filter
        let statusCondition = '';
        let statusValue = '';
        if (status) {
          if (this.operations.modelName === 'License') {
            statusCondition = `AND "updateStatus" = $3`;
            statusValue = status;
          } else if (this.operations.modelName !== 'Printer') {
            statusCondition = `AND "status" = $3`;
            statusValue = status;
          }
        }
        
        // Get select fields for this asset type
        const selectFields = this.getSelectFieldsForAssetType();
        const fieldList = ['id', 'createdAt', 'updatedAt', ...Object.keys(selectFields)].map(field => `"${field}"`).join(', ');
        
        let assetsResult, countResult;
        
        if (statusValue) {
          // With status filter - 6 parameters: tenantId, searchQuery, statusValue, limit, offset
          const assetsQuery = `
            SELECT ${fieldList},
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "${actualTableName}"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
            ${statusCondition}
            ORDER BY rank DESC, "createdAt" DESC
            LIMIT $4 OFFSET $5
          `;
          
          const countQuery = `
            SELECT COUNT(*) as count
            FROM "${actualTableName}"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
            ${statusCondition}
          `;
          
          [assetsResult, countResult] = await Promise.all([
            this.db.$queryRawUnsafe(assetsQuery, user.tenantId, searchQuery, statusValue, limit, offset),
            this.db.$queryRawUnsafe(countQuery, user.tenantId, searchQuery, statusValue)
          ]);
        } else {
          // Without status filter - 5 parameters: tenantId, searchQuery, limit, offset
          const assetsQuery = `
            SELECT ${fieldList},
                   ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
            FROM "${actualTableName}"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
            ORDER BY rank DESC, "createdAt" DESC
            LIMIT $3 OFFSET $4
          `;
          
          const countQuery = `
            SELECT COUNT(*) as count
            FROM "${actualTableName}"
            WHERE "tenantId" = $1
            AND (
              "search_vector" @@ websearch_to_tsquery('english', $2)
              OR
              "search_vector" @@ plainto_tsquery('english', $2)
            )
          `;
          
          [assetsResult, countResult] = await Promise.all([
            this.db.$queryRawUnsafe(assetsQuery, user.tenantId, searchQuery, limit, offset),
            this.db.$queryRawUnsafe(countQuery, user.tenantId, searchQuery)
          ]);
        }
        
        // Remove rank from results before sending to client
        const cleanAssetsResult = (assetsResult as any[]).map(asset => {
          const { rank, ...cleanAsset } = asset;
          return cleanAsset;
        });
        
        const total = parseInt((countResult as any)[0].count, 10);
        
        const result = {
          data: cleanAssetsResult,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
        
        // Cache the result if Redis is available
        if (cacheManager && cacheKey) {
          await cacheManager.set(cacheKey, result, CACHE_TTL ? CACHE_TTL.ASSET_LIST : 120, { component: 'asset-api-handler' });
        }
        
        return successResponse(result);
      } else {
        // Standard query without search
        const where: any = {
          tenantId: user.tenantId
        };

        // Add status filter based on model-specific status fields
        if (status) {
          if (this.operations.modelName === 'License') {
            where.updateStatus = status; // License uses updateStatus instead of status
          } else if (this.operations.modelName !== 'Printer') {
            where.status = status; // Other models use status (except Printer which has no status)
          }
        }

        // Optimize query by only selecting necessary fields
        const selectFields = {
          id: true,
          createdAt: true,
          updatedAt: true,
          // Add other commonly used fields based on asset type
          ...this.getSelectFieldsForAssetType()
        };

        const [assets, total] = await Promise.all([
          (this.db as any)[this.operations.modelName].findMany({
            where,
            select: selectFields,
            skip: (page - 1) * limit,
            take: Math.min(limit, 100), // Limit maximum page size
            orderBy: {
              createdAt: 'desc'
            }
          }),
          (this.db as any)[this.operations.modelName].count({ where })
        ]);

        const result = {
          data: assets,
          pagination: {
            page,
            limit,
            total: total !== undefined ? total : 0,
            pages: Math.ceil((total !== undefined ? total : 0) / limit)
          }
        };
        
        // Cache the result if Redis is available
        if (cacheManager && cacheKey) {
          await cacheManager.set(cacheKey, result, CACHE_TTL ? CACHE_TTL.ASSET_LIST : 120, { component: 'asset-api-handler' });
        }

        return successResponse(result);
      }
    } catch (error) {
      console.error(`Error fetching ${this.operations.modelName} assets:`, error);
      return errorResponse('Failed to fetch assets. Please try again later.');
    }
  }

  // Get a specific asset by ID
  async getById(user: any, id: string) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to view asset', 403);
      }

      // Create cache key for this specific asset if Redis is available
      let cacheKey: string | null = null;
      if (cacheManager && CACHE_PREFIXES) {
        cacheKey = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSETS,
          this.operations.modelName,
          user.tenantId,
          id
        );
      }

      // Try to get cached result first if Redis is available
      if (cacheManager && cacheKey) {
        const cachedAsset = await cacheManager.get(cacheKey, { component: 'asset-api-handler' });
        if (cachedAsset) {
          return successResponse(cachedAsset);
        }
      }

      // Get select fields for this asset type
      const selectFields = {
        id: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        // Add other commonly used fields based on asset type
        ...this.getSelectFieldsForAssetType()
      };
      
      const asset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        select: selectFields
      })

      if (!asset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      // Cache the asset if Redis is available
      if (cacheManager && cacheKey) {
        await cacheManager.set(cacheKey, asset, CACHE_TTL ? CACHE_TTL.ASSETS : 300, { component: 'asset-api-handler' });
      }

      return successResponse(asset)
    } catch (error) {
      logger.error(`Error fetching ${this.operations.modelName} asset:`, error)
      return errorResponse('Failed to fetch asset details. Please try again later.')
    }
  }

  // Create a new asset
  async create(user: any, body: Omit<T, keyof BaseAsset> & { customFields?: Record<string, any> }) {
    try {
      // Check permissions
      const hasCreatePermission = await this.checkPermission(user, 'create');
      if (!hasCreatePermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to create asset', 403);
      }

      // Validate required fields
      const validationErrors: Record<string, string> = {}
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          if (body[field] === undefined || body[field] === null || body[field] === "") {
            validationErrors[String(field)] = `${String(field)} is required`
          }
        }
      }

      // Validate custom fields if they exist
      if (body.customFields) {
        // Get custom fields for this asset type and tenant
        const customFields = await this.db.customField.findMany({
          where: {
            tenantId: user.tenantId,
            modelType: this.operations.modelName
          }
        });

        // Create a map for faster lookup
        const customFieldsMap = new Map(customFields.map(cf => [cf.name, cf]));

        // Validate each custom field
        for (const [fieldName, fieldValue] of Object.entries(body.customFields)) {
          const customField = customFieldsMap.get(fieldName);
          
          // Skip validation for fields that don't exist in the custom fields config
          if (!customField) continue;
          
          // Check required fields
          if (customField.required && (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
            validationErrors[`customFields.${customField.name}`] = `${customField.name} is required`;
          }
          
          // Type validation for non-empty values
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
            switch (customField.type) {
              case 'number':
                const numValue = Number(fieldValue);
                if (isNaN(numValue)) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid number`;
                }
                break;
              case 'date':
                // Handle both date strings and Date objects
                const dateValue = new Date(fieldValue as string);
                if (isNaN(dateValue.getTime())) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid date`;
                }
                break;
              case 'boolean':
                // Accept boolean values, 'true' and 'false' strings
                if (typeof fieldValue !== 'boolean' && fieldValue !== 'true' && fieldValue !== 'false') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a boolean value (true/false)`;
                }
                break;
              case 'text':
              case 'textarea':
                // For text fields, just ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a text value`;
                }
                // Check max length for text fields
                if (typeof fieldValue === 'string' && fieldValue.length > 1000) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be no more than 1000 characters`;
                }
                break;
              case 'select':
                // For select fields, ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid selection`;
                }
                break;
              default:
                // For any other field type, ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid text value`;
                }
                break;
            }
          }
        }
      }

      // Return validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        return validationErrorResponse(validationErrors)
      }

      // Check if asset with unique field already exists
      if (this.operations.uniqueField && body[this.operations.uniqueField]) {
        // For Printer model, we use findFirst instead of findUnique since we removed the @unique constraint
        let existingAsset;
        if (this.operations.modelName === 'Printer') {
          existingAsset = await (this.db as any)[this.operations.modelName].findFirst({
            where: { 
              [this.operations.uniqueField]: body[this.operations.uniqueField],
              tenantId: user.tenantId
            }
          });
        } else {
          existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
            where: { [this.operations.uniqueField]: body[this.operations.uniqueField] }
          });
        }

        if (existingAsset) {
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
        }
      }

      // Filter out undefined values to prevent setting fields to undefined
      const createData = Object.keys(body || {}).reduce((acc, key) => {
        if (body[key as keyof typeof body] !== undefined) {
          (acc as any)[key] = body[key as keyof typeof body];
        }
        return acc;
      }, {} as Partial<Omit<T, keyof BaseAsset>>);

      const asset = await (this.db as any)[this.operations.modelName].create({
        data: {
          ...createData as any,
          tenantId: user.tenantId
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          // Add other commonly used fields based on asset type
          ...this.getSelectFieldsForAssetType()
        }
      })

      // Create audit log entry after asset creation
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('./audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'create',
          modelType: this.operations.modelName,
          recordId: asset.id,
          changes: body as any,
          userId: user.id,
          tenantId: user.tenantId
        }, 'create')
      } catch (auditLogError) {
        logger.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      // Use cache invalidation strategy for better performance
      if (cacheManager && CACHE_PREFIXES) {
        // Asset is new, so no need to delete it from cache
        // Just invalidate ALL lists so they will fetch fresh data on next request
        const assetListPattern = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSET_LIST,
          this.operations.modelName,
          user.tenantId,
          '*'
        );
        
        try {
          const deletedCount = await cacheManager.invalidateByPattern(assetListPattern, { component: 'asset-api-handler' });
          logger.debug(`Invalidated ${deletedCount} asset list cache entries for ${this.operations.modelName}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate asset list cache for ${this.operations.modelName}:`, error);
        }
      }

      return successResponse(asset, 201)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Error creating ${this.operations.modelName} asset:`, error);
      }
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.')
      }
      
      return errorResponse('Failed to create asset. Please try again later.')
    }
  }

  // Update an existing asset
  async update(user: any, id: string, body: Partial<Omit<T, keyof BaseAsset>> & { customFields?: Record<string, any> }) {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Updating ${this.operations.modelName} asset ${id} with data`, { 
          component: 'asset-api-handler', 
          assetId: id, 
          data: body 
        });
      }
      
      // Check permissions
      const hasEditPermission = await this.checkPermission(user, 'edit');
      if (!hasEditPermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to edit asset', 403);
      }

      // Check if asset exists and belongs to user's tenant
      const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      if (!existingAsset) {
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Asset ${id} not found for tenant ${user.tenantId}`, { 
            component: 'asset-api-handler', 
            assetId: id, 
            tenantId: user.tenantId 
          });
        }
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      // Validate required fields if they're being updated
      const validationErrors: Record<string, string> = {}
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          // Only validate if the field is being updated
          if (field in body && (body[field] === undefined || body[field] === null || body[field] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`
          }
          // If field is not being updated, ensure it exists in the existing asset
          if (!(field in body) && (existingAsset[field as keyof typeof existingAsset] === undefined || existingAsset[field as keyof typeof existingAsset] === null || existingAsset[field as keyof typeof existingAsset] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`
          }
        }
      }

      // Validate custom fields if they exist
      if (body.customFields) {
        // Get custom fields for this asset type and tenant
        const customFields = await this.db.customField.findMany({
          where: {
            tenantId: user.tenantId,
            modelType: this.operations.modelName
          }
        });

        // Create a map for faster lookup
        const customFieldsMap = new Map(customFields.map(cf => [cf.name, cf]));

        // Validate each custom field
        for (const [fieldName, fieldValue] of Object.entries(body.customFields)) {
          const customField = customFieldsMap.get(fieldName);
          
          // Skip validation for fields that don't exist in the custom fields config
          if (!customField) continue;
          
          // Check required fields
          if (customField.required && (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
            validationErrors[`customFields.${customField.name}`] = `${customField.name} is required`;
          }
          
          // Type validation for non-empty values
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
            switch (customField.type) {
              case 'number':
                const numValue = Number(fieldValue);
                if (isNaN(numValue)) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid number`;
                }
                break;
              case 'date':
                // Handle both date strings and Date objects
                const dateValue = new Date(fieldValue as string);
                if (isNaN(dateValue.getTime())) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid date`;
                }
                break;
              case 'boolean':
                // Accept boolean values, 'true' and 'false' strings
                if (typeof fieldValue !== 'boolean' && fieldValue !== 'true' && fieldValue !== 'false') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a boolean value (true/false)`;
                }
                break;
              case 'text':
              case 'textarea':
                // For text fields, just ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a text value`;
                }
                // Check max length for text fields
                if (typeof fieldValue === 'string' && fieldValue.length > 1000) {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be no more than 1000 characters`;
                }
                break;
              case 'select':
                // For select fields, ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid selection`;
                }
                break;
              default:
                // For any other field type, ensure it's a string
                if (typeof fieldValue !== 'string') {
                  validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid text value`;
                }
                break;
            }
          }
        }
      }

      // Return validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        if (process.env.NODE_ENV === 'development') {
          logger.info("Validation errors", { 
            component: 'asset-api-handler', 
            errors: validationErrors 
          });
        }
        return validationErrorResponse(validationErrors)
      }

      // Check if unique field is being updated and already exists for another asset
      if (this.operations.uniqueField && body[this.operations.uniqueField] && 
          body[this.operations.uniqueField] !== existingAsset[this.operations.uniqueField]) {
        // For Printer model, we use findFirst instead of findUnique since we removed the @unique constraint
        let existingAssetWithUniqueField;
        if (this.operations.modelName === 'Printer') {
          existingAssetWithUniqueField = await (this.db as any)[this.operations.modelName].findFirst({
            where: { 
              [this.operations.uniqueField]: body[this.operations.uniqueField],
              tenantId: user.tenantId,
              NOT: { id: id }
            }
          });
        } else {
          existingAssetWithUniqueField = await (this.db as any)[this.operations.modelName].findUnique({
            where: { 
              [this.operations.uniqueField]: body[this.operations.uniqueField],
              NOT: { id: id }
            }
          });
        }

        if (existingAssetWithUniqueField) {
          if (process.env.NODE_ENV === 'development') {
            logger.info(`Asset with ${String(this.operations.uniqueField)} ${body[this.operations.uniqueField]} already exists`);
          }
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
        }
      }

      // Create history record for changes
      const changes: Record<string, { from: any; to: any }> = {}
      Object.keys(body).forEach(key => {
        // Skip undefined values to avoid setting fields to undefined
        if (body[key as keyof typeof body] !== undefined && 
            body[key as keyof typeof body] !== existingAsset[key as keyof typeof existingAsset]) {
          changes[key] = {
            from: existingAsset[key as keyof typeof existingAsset],
            to: body[key as keyof typeof body]
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        try {
          // Import audit logs dynamically to avoid circular dependencies
          const { createAuditLog } = await import('./audit-logs');
          await createAuditLog(user.tenantId, {
            action: 'update',
            modelType: this.operations.modelName,
            recordId: id,
            changes,
            userId: user.id,
            tenantId: user.tenantId
          }, 'update')
        } catch (auditLogError) {
          if (process.env.NODE_ENV === 'development') {
            logger.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError);
          }
          // Continue with the operation even if audit log creation fails
        }
      }

      // Filter out undefined values to prevent setting fields to undefined
      // Also filter out invalid fields that don't exist in the model
      const validFields = {
        'PC': ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note', 'customFields'],
        'Laptop': ['dept', 'barcode', 'sapBarcode', 'dateBuy', 'email', 'model', 'status', 'userName', 'customFields'],
        'Printer': ['dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note', 'customFields'],
        'License': ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 'customFields'],
        'WarehouseIT': ['barcode', 'sapCode', 'status', 'note', 'customFields'],
        'Internet': ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note', 'customFields']
      }

      const modelValidFields = validFields[this.operations.modelName as keyof typeof validFields] || []
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Valid fields for ${this.operations.modelName}:`, modelValidFields);
      }

      const updateData = Object.keys(body || {}).reduce((acc, key) => {
        // Allow both direct fields and customFields to be updated
        if ((modelValidFields.includes(key) || key === 'customFields') && body[key as keyof typeof body] !== undefined) {
          (acc as any)[key] = body[key as keyof typeof body];
        } else {
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`Skipping field ${key} - not valid or undefined`, { 
              component: 'asset-api-handler', 
              field: key 
            });
          }
        }
        return acc;
      }, {} as Partial<Omit<T, keyof BaseAsset>>);
      
      logger.debug("Update data to be sent to database", { 
      component: 'asset-api-handler', 
      data: updateData 
    });

      const asset = await (this.db as any)[this.operations.modelName].update({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        data: updateData as any,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          // Add other commonly used fields based on asset type
          ...this.getSelectFieldsForAssetType()
        }
      })

      // Use cache invalidation strategy for better performance
      if (cacheManager && CACHE_PREFIXES) {
        // Create cache key for the updated asset
        const assetCacheKey = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSETS,
          this.operations.modelName,
          user.tenantId,
          id
        );
        
        // Remove the specific asset from cache (will be reloaded on next request)
        try {
          await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
        } catch (error: any) {
          logger.warn(`Failed to delete asset cache key ${assetCacheKey}:`, error);
        }
        
        // Invalidate cache entries more efficiently
        const assetListPattern = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSET_LIST,
          this.operations.modelName,
          user.tenantId,
          '*'
        );
        
        try {
          const deletedCount = await cacheManager.invalidateByPattern(assetListPattern, { component: 'asset-api-handler' });
          logger.debug(`Invalidated ${deletedCount} asset list cache entries for ${this.operations.modelName}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate asset list cache for ${this.operations.modelName}:`, error);
        }
      }

      return successResponse(asset)
    } catch (error: any) {
      if (error.code === 'P2025') {
        logger.debug(`Asset ${id} not found during update`);
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      logger.error(`Error updating ${this.operations.modelName} asset:`, error)
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.')
      }
      
      return errorResponse('Failed to update asset. Please try again later.')
    }
  }

  // Delete an asset
  async delete(user: any, id: string) {
    try {
      // Check permissions
      const hasDeletePermission = await this.checkPermission(user, 'delete');
      if (!hasDeletePermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to delete asset', 403);
      }

      // Check if asset exists and belongs to user's tenant
      const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      if (!existingAsset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      // Create audit log entry
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('./audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'delete',
          modelType: this.operations.modelName,
          recordId: id,
          changes: existingAsset,
          userId: user.id,
          tenantId: user.tenantId
        }, 'delete')
      } catch (auditLogError) {
        logger.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      await (this.db as any)[this.operations.modelName].delete({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      // Use cache invalidation strategy for better performance
      if (cacheManager && CACHE_PREFIXES) {
        // Create cache key for the deleted asset
        const assetCacheKey = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSETS,
          this.operations.modelName,
          user.tenantId,
          id
        );
        
        // Remove the asset from cache
        try {
          await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
        } catch (error: any) {
          logger.warn(`Failed to delete asset cache key ${assetCacheKey}:`, error);
        }
        
        // Invalidate cache entries more efficiently
        const assetListPattern = cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSET_LIST,
          this.operations.modelName,
          user.tenantId,
          '*'
        );
        
        try {
          const deletedCount = await cacheManager.invalidateByPattern(assetListPattern, { component: 'asset-api-handler' });
          logger.debug(`Invalidated ${deletedCount} asset list cache entries for ${this.operations.modelName}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate asset list cache for ${this.operations.modelName}:`, error);
        }
      }

      return successResponse<null>(null, 204)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      logger.error(`Error deleting ${this.operations.modelName} asset:`, error);
      return errorResponse('Failed to delete asset. Please try again later.')
    }
  }

  // Bulk delete assets with optimized batch processing
  async bulkDelete(user: any, ids: string[]) {
    try {
      // Check permissions
      const hasBulkDeletePermission = await this.checkPermission(user, 'bulkDelete');
      if (!hasBulkDeletePermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to bulk delete assets', 403);
      }

      // Validate input
      if (!ids || ids.length === 0) {
        return badRequestResponse('No asset IDs provided')
      }

      // Process in batches to avoid memory issues with large datasets
      const batchSize = 100;
      let totalDeleted = 0;

      // Process IDs in batches
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);
        
        // Check if all assets in batch exist and belong to user's tenant
        const existingAssets = await (this.db as any)[this.operations.modelName].findMany({
          where: { 
            id: { in: batchIds },
            tenantId: user.tenantId 
          },
          select: {
            id: true,
            tenantId: true
          }
        })

        // Check if all requested assets were found
        const foundIds = existingAssets.map((asset: any) => asset.id)
        const missingIds = batchIds.filter(id => !foundIds.includes(id))
        
        // If some assets are missing, we should still delete the ones that exist
        // rather than failing the entire operation
        if (missingIds.length > 0) {
          logger.warn(`Some ${this.operations.modelName} assets not found during bulk delete: ${missingIds.join(', ')}`);
          // Continue with deletion of found assets rather than returning error
        }

        // Only create audit logs for assets that actually exist
        if (existingAssets.length > 0) {
          // Create audit log entries for each asset in batch
          // Use Promise.all for parallel processing
          const auditLogPromises = existingAssets.map((asset: any) => 
            // Import audit logs dynamically to avoid circular dependencies
            import('./audit-logs').then(({ createAuditLog }) => 
              createAuditLog(user.tenantId, {
                action: 'delete',
                modelType: this.operations.modelName,
                recordId: asset.id,
                changes: asset,
                userId: user.id,
                tenantId: user.tenantId
              }, 'bulkDelete').catch((auditLogError: any) => {
                logger.error(`Failed to create audit log for asset ${asset.id}:`, auditLogError);
                // Continue with deletion even if audit log creation fails
              })
            )
          );
          
          // Wait for all audit log entries to be created
          await Promise.all(auditLogPromises);

          // Delete only the assets that exist
          const deleteResult = await (this.db as any)[this.operations.modelName].deleteMany({
            where: { 
              id: { in: foundIds }, // Only delete assets that were found
              tenantId: user.tenantId 
            }
          })

          totalDeleted += deleteResult.count;
        }
      }

      // Log the number of deleted assets
      logger.debug(`Deleted ${totalDeleted} ${this.operations.modelName} assets in ${Math.ceil(ids.length/batchSize)} batches`);

      // Create audit log entry for the bulk delete operation itself
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('./audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'bulkDelete',
          modelType: this.operations.modelName,
          recordId: 'bulk-operation',
          changes: {
            count: totalDeleted,
            ids: ids.slice(0, 10), // Only log first 10 IDs for privacy
            totalIds: ids.length
          },
          userId: user.id,
          tenantId: user.tenantId
        }, 'bulkDelete')
      } catch (auditLogError) {
        logger.error(`Failed to create bulk delete audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      // Use cache invalidation strategy for better performance
      if (cacheManager && CACHE_PREFIXES) {
        // More efficient cache invalidation for bulk operations
        // Instead of multiple pattern deletions, use a single comprehensive pattern
        const comprehensivePattern = cacheManager.createCompositeKey(
          '*',
          this.operations.modelName,
          user.tenantId,
          '*'
        );
        
        try {
          const deletedCount = await cacheManager.invalidateByPattern(comprehensivePattern, { component: 'asset-api-handler' });
          logger.debug(`Invalidated ${deletedCount} cache entries for bulk delete operation on ${this.operations.modelName}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate cache for bulk delete on ${this.operations.modelName}:`, error);
        }
      }

      // React Query cache invalidation removed - relying solely on Redis cache

      return successResponse<null>(null, 204)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Error bulk deleting ${this.operations.modelName} assets:`, error);
      }
      
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} assets not found`)
      }
      
      return errorResponse('Failed to delete assets. Please try again later.')
    }
  }
}

// Create handler for PC assets
export const pcHandler = new AssetApiHandler<PCAsset>(db, {
  modelName: 'PC',
  requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
  uniqueField: 'cpuBarcode',
  searchFields: ['cpuBarcode', 'pcName', 'userName', 'dept', 'status']
  // Remove the include option as customFields is a scalar field, not a relation
})

// Create handler for Laptop assets
export const laptopHandler = new AssetApiHandler<LaptopAsset>(db, {
  modelName: 'Laptop',
  requiredFields: ['dept', 'barcode', 'status'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'userName', 'dept', 'model', 'status']
})

// Create handler for Printer assets
export const printerHandler = new AssetApiHandler<PrinterAsset>(db, {
  modelName: 'Printer',
  requiredFields: ['dept', 'barcode', 'color'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'dept', 'model', 'ip', 'note']
})

// Create handler for License assets
export const licenseHandler = new AssetApiHandler<LicenseAsset>(db, {
  modelName: 'License',
  requiredFields: ['productKey'],
  searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'updateStatus']
})

// Create handler for WarehouseIT assets
export const warehouseHandler = new AssetApiHandler<WarehouseITAsset>(db, {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['barcode', 'sapCode', 'status', 'note']
})

// Create handler for Internet assets
export const internetHandler = new AssetApiHandler<InternetAsset>(db, {
  modelName: 'Internet',
  requiredFields: ['dept', 'status'],
  searchFields: ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note']
})