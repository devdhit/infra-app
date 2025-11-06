import { PrismaClient } from '../../generated/prisma';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  badRequestResponse,
  conflictResponse,
  validationErrorResponse
} from '../api-utils';
import { hasPermission, ResourceType, PermissionAction } from '../permissions';
import { validateSearchInput } from '../security';

// Only import Redis cache on the server side
let CACHE_PREFIXES: any = null;
let CACHE_TTL: any = null;
let cacheManager: any = null;

// Import logger for better error handling
let logger: any = null;
if (typeof window === 'undefined') {
  try {
    logger = require('../logger').default;
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
    const redisModule = require('../redis-cache');
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
    CACHE_TTL = redisModule.CACHE_TTL;
    
    // Import the new cache manager
    cacheManager = require('../cache-manager').default;
  } catch (error: any) {
    logger.warn('Redis cache not available, using fallback', { 
      component: 'asset-api-handler', 
      error: error.message 
    });
  }
}

/**
 * Defines the structure for asset operations with better typing
 */
export interface AssetOperations<T> {
  /** The name of the Prisma model */
  modelName: string;
  /** Required fields for the asset type */
  requiredFields?: (keyof Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'customFields'>)[];
  /** Unique field for the asset type */
  uniqueField?: keyof Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'customFields'>;
  /** Fields to search in when performing search operations */
  searchFields?: (keyof Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'customFields'>)[];
}

/**
 * Generic asset API handler with improved type safety
 * Provides CRUD operations for different asset types with proper permission checking
 */
export class BaseAssetApiHandler<T> {
  protected resourceType: ResourceType;

  /**
   * Creates a new AssetApiHandler instance
   * @param db - The Prisma database client
   * @param operations - The asset operations configuration
   */
  constructor(protected db: PrismaClient, protected operations: AssetOperations<T>) {
    // Map model names to resource types for permission checking
    const modelToResourceMap: Record<string, ResourceType> = {
      'PC': 'pc',
      'Laptop': 'laptop',
      'Printer': 'printer',
      'License': 'license',
      'WarehouseIT': 'warehouse',
      'Internet': 'internet',
      'FixedAsset': 'fixed-asset'
    };
    
    this.resourceType = modelToResourceMap[this.operations.modelName] || 'assets';
  }

  /**
   * Helper method to get the correct Prisma model name
   * @returns The Prisma model for this asset type
   */
  protected getPrismaModel() {
    // Prisma client uses lowercase 'pC' for the PC model
    return this.operations.modelName === 'PC' ? this.db.pC : (this.db as any)[this.operations.modelName];
  }

  /**
   * Helper method to get optimized select fields based on asset type
   * @returns Object with fields to select for database queries
   */
  protected getSelectFieldsForAssetType() {
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
      case 'FixedAsset':
        return {
          ...cleanBaseFields,
          barcode: true,
          sapCode: true,
          name: true,
          place: true,
          inputDate: true,
          location: true,
          status: true,
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

  /**
   * Check if user has permission for an action
   * @param user - The user object
   * @param action - The action to check permission for
   * @returns Promise that resolves to true if user has permission, false otherwise
   */
  protected async checkPermission(user: any, action: PermissionAction) {
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

  /**
   * Get all assets with pagination and filtering
   * @param user - The user object
   * @param queryParams - Query parameters for pagination and filtering
   * @returns Promise that resolves to a response with assets and pagination info
   */
  async getAll(
    user: any, 
    queryParams: { page: number; limit: number; search: string | undefined; status: string | undefined }
  ) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return errorResponse('Forbidden: Insufficient permissions to view assets', 403);
      }

      const { page, limit, search, status } = queryParams;

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
        // Sanitize search input to prevent injection
        const sanitizedSearch = validateSearchInput(search);
        
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
          'Internet': 'Internet',
          'FixedAsset': 'FixedAsset'
        };
        
        const actualTableName = tableNames[tableName] || tableName;
        
        // Build the search query using websearch_to_tsquery for better search experience
        const searchQuery = sanitizedSearch.trim();
        
        // Status filter
        let statusCondition = '';
        let statusValue = '';
        if (status) {
          // Sanitize status input
          const sanitizedStatus = validateSearchInput(status);
          if (this.operations.modelName === 'License') {
            statusCondition = `AND "updateStatus" = $3`;
            statusValue = sanitizedStatus;
          } else if (this.operations.modelName !== 'Printer') {
            statusCondition = `AND "status" = $3`;
            statusValue = sanitizedStatus;
          }
        }
        
        // Get select fields for this asset type
        const selectFields = this.getSelectFieldsForAssetType();
        const fieldList = ['id', 'createdAt', 'updatedAt', ...Object.keys(selectFields)].map(field => `"${field}"`).join(', ');
        
        let assetsResult, countResult;
        
        if (statusValue) {
          // With status filter - 6 parameters: tenantId, searchQuery, statusValue, limit, offset
          
          // Validate status value before using in query
          const validatedStatus = statusValue ? validateSearchInput(statusValue.toString()) : null;
          
          // Use validated parameters in the query
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
          
          // Prepare query arguments with validation
          const queryArgs = [
            user.tenantId,
            searchQuery,
            validatedStatus, // Only include if status filtering is used
            limit,
            offset
          ].filter(arg => arg !== undefined);
          
          const countQueryArgs = [
            user.tenantId,
            searchQuery,
            validatedStatus // Only include if status filtering is used
          ].filter(arg => arg !== undefined);
          
          [assetsResult, countResult] = await Promise.all([
            this.db.$queryRawUnsafe(assetsQuery, ...queryArgs),
            this.db.$queryRawUnsafe(countQuery, ...countQueryArgs)
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
          this.getPrismaModel().findMany({
            where,
            select: selectFields,
            skip: (page - 1) * limit,
            take: Math.min(limit, 100), // Limit maximum page size
            orderBy: {
              createdAt: 'desc'
            }
          }),
          this.getPrismaModel().count({ where })
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
      logger.error(`Error fetching ${this.operations.modelName} assets:`, error);
      return errorResponse('Failed to fetch assets. Please try again later.');
    }
  }

  /**
   * Get a specific asset by ID
   * @param user - The user object
   * @param id - The ID of the asset to retrieve
   * @returns Promise that resolves to a response with the asset data
   */
  async getById(user: any, id: string) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return errorResponse('Forbidden: Insufficient permissions to view asset', 403);
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
      
      const asset = await this.getPrismaModel().findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        select: selectFields
      });

      if (!asset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`);
      }

      // Cache the asset if Redis is available
      if (cacheManager && cacheKey) {
        await cacheManager.set(cacheKey, asset, CACHE_TTL ? CACHE_TTL.ASSETS : 300, { component: 'asset-api-handler' });
      }

      return successResponse(asset);
    } catch (error) {
      logger.error(`Error fetching ${this.operations.modelName} asset:`, error);
      return errorResponse('Failed to fetch asset details. Please try again later.');
    }
  }

  /**
   * Create a new asset
   * @param user - The user object
   * @param body - The asset data to create
   * @returns Promise that resolves to a response with the created asset
   */
  async create(user: any, body: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> & { customFields?: Record<string, any> }) {
    try {
      // Check permissions
      const hasCreatePermission = await this.checkPermission(user, 'create');
      if (!hasCreatePermission) {
        return errorResponse('Forbidden: Insufficient permissions to create asset', 403);
      }

      // Get custom fields for this asset type and tenant to identify custom field names
      const customFields = await this.db.customField.findMany({
        where: {
          tenantId: user.tenantId,
          modelType: this.operations.modelName
        }
      });

      // Create a set of custom field names for quick lookup
      const customFieldNames = new Set(customFields.map(cf => cf.name));

      // Separate custom fields from standard fields
      const standardFieldsBody: any = {};
      const customFieldsData: Record<string, any> = body.customFields || {};

      // Process each field in the body
      Object.entries(body).forEach(([key, value]) => {
        // Skip base asset fields and the customFields object itself
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'tenantId' || key === 'customFields') {
          return;
        }

        // If this is a custom field name, add it to customFieldsData
        if (customFieldNames.has(key)) {
          customFieldsData[key] = value;
        } else {
          // Otherwise, it's a standard field
          standardFieldsBody[key] = value;
        }
      });

      // Add customFields to standardFieldsBody if we have any custom fields
      if (Object.keys(customFieldsData).length > 0) {
        standardFieldsBody.customFields = customFieldsData;
      }

      // Validate required fields using the standard fields body
      const validationErrors: Record<string, string> = {};
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          if (standardFieldsBody[field] === undefined || standardFieldsBody[field] === null || standardFieldsBody[field] === "") {
            validationErrors[String(field)] = `${String(field)} is required`;
          }
        }
      }

      // Validate custom fields if they exist
      if (customFieldsData) {
        // Create a map for faster lookup
        const customFieldsMap = new Map(customFields.map(cf => [cf.name, cf]));

        // Validate each custom field
        for (const [fieldName, fieldValue] of Object.entries(customFieldsData)) {
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
              case 'dateBuy':
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
        return validationErrorResponse(validationErrors);
      }

      // Check if asset with unique field already exists
      if (this.operations.uniqueField && standardFieldsBody[this.operations.uniqueField]) {
        // For Printer and PC models, we use findFirst instead of findUnique since we removed the @unique constraint
        let existingAsset;
        if (this.operations.modelName === 'Printer' || this.operations.modelName === 'PC') {
          existingAsset = await this.getPrismaModel().findFirst({
            where: { 
              [this.operations.uniqueField]: standardFieldsBody[this.operations.uniqueField],
              tenantId: user.tenantId
            }
          });
        } else {
          existingAsset = await this.getPrismaModel().findUnique({
            where: { [this.operations.uniqueField]: standardFieldsBody[this.operations.uniqueField] }
          });
        }

        if (existingAsset) {
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
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
        'Internet': ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note', 'customFields'],
        'FixedAsset': ['dept', 'barcode', 'sapCode', 'name', 'place', 'inputDate', 'location', 'status', 'note', 'customFields']
      };

      const modelValidFields = validFields[this.operations.modelName as keyof typeof validFields] || [];
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Valid fields for ${this.operations.modelName}:`, modelValidFields);
      }

      // Define date fields for each asset type
      const dateFields: Record<string, string[]> = {
        'PC': [],
        'Laptop': ['dateBuy'],
        'Printer': ['date'],
        'License': ['date'],
        'WarehouseIT': [],
        'Internet': [],
        'FixedAsset': ['inputDate']
      };

      const modelDateFields = dateFields[this.operations.modelName as keyof typeof dateFields] || [];

      const createData = Object.keys(standardFieldsBody || {}).reduce((acc, key) => {
        // Allow both direct fields and customFields to be created
        if ((modelValidFields.includes(key) || key === 'customFields') && standardFieldsBody[key] !== undefined) {
          // Handle date field conversion
          if (modelDateFields.includes(key) && typeof standardFieldsBody[key] === 'string') {
            try {
              const dateValue = new Date(standardFieldsBody[key]);
              if (!isNaN(dateValue.getTime())) {
                (acc as any)[key] = dateValue;
              } else {
                // If date parsing fails, keep original value
                (acc as any)[key] = standardFieldsBody[key];
              }
            } catch (e) {
              // If date parsing fails, keep original value
              (acc as any)[key] = standardFieldsBody[key];
            }
          } else {
            (acc as any)[key] = standardFieldsBody[key];
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`Skipping field ${key} - not valid or undefined`, { 
              component: 'asset-api-handler', 
              field: key 
            });
          }
        }
        return acc;
      }, {} as Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>);

      const asset = await this.getPrismaModel().create({
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
      });

      // Create audit log entry after asset creation
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('../audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'create',
          modelType: this.operations.modelName,
          recordId: asset.id,
          changes: standardFieldsBody as any,
          userId: user.id,
          tenantId: user.tenantId
        }, 'create');
      } catch (auditLogError) {
        logger.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError);
        // Continue with the operation even if audit log creation fails
      }

      // Use comprehensive cache invalidation strategy for better performance and consistency
      if (cacheManager && CACHE_PREFIXES) {
        try {
          // Invalidate all asset list caches for this tenant and model type
          await cacheManager.invalidateResource(user.tenantId, this.operations.modelName, { component: 'asset-api-handler' });
          
          // Also invalidate any potential search result caches
          const searchPatterns = [
            cacheManager.createCompositeKey(
              CACHE_PREFIXES.SEARCH,
              this.operations.modelName,
              user.tenantId,
              '*'
            )
          ];
          
          await cacheManager.batchInvalidate(searchPatterns, { component: 'asset-api-handler' });
          
          logger.debug(`Cache invalidated after creating ${this.operations.modelName} asset ${asset.id}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate cache after creating ${this.operations.modelName} asset:`, error);
        }
      }

      return successResponse(asset, 201);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Error creating ${this.operations.modelName} asset:`, { 
          error: error.message, 
          stack: error.stack,
          modelName: this.operations.modelName,
          body: body
        });
      }
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.');
      }
      
      // Handle validation errors
      if (error.message && error.message.includes('Validation')) {
        return errorResponse(error.message, 400);
      }
      
      return errorResponse('Failed to create asset. Please try again later.');
    }
  }

  /**
   * Update an existing asset
   * @param user - The user object
   * @param id - The ID of the asset to update
   * @param body - The asset data to update
   * @returns Promise that resolves to a response with the updated asset
   */
  async update(user: any, id: string, body: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>> & { customFields?: Record<string, any> }) {
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
        return errorResponse('Forbidden: Insufficient permissions to edit asset', 403);
      }

      // Check if asset exists and belongs to user's tenant
      const existingAsset = await this.getPrismaModel().findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      });

      if (!existingAsset) {
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Asset ${id} not found for tenant ${user.tenantId}`, { 
            component: 'asset-api-handler', 
            assetId: id, 
            tenantId: user.tenantId 
          });
        }
        return notFoundResponse(`${this.operations.modelName} asset not found`);
      }

      // Get custom fields for this asset type and tenant to identify custom field names
      const customFields = await this.db.customField.findMany({
        where: {
          tenantId: user.tenantId,
          modelType: this.operations.modelName
        }
      });

      // Create a set of custom field names for quick lookup
      const customFieldNames = new Set(customFields.map(cf => cf.name));

      // Separate custom fields from standard fields
      const standardFieldsBody: any = {};
      const customFieldsData: Record<string, any> = body.customFields || {};

      // Process each field in the body
      Object.entries(body).forEach(([key, value]) => {
        // Skip base asset fields and the customFields object itself
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'tenantId' || key === 'customFields') {
          return;
        }

        // If this is a custom field name, add it to customFieldsData
        if (customFieldNames.has(key)) {
          customFieldsData[key] = value;
        } else {
          // Otherwise, it's a standard field
          standardFieldsBody[key] = value;
        }
      });

      // Add customFields to standardFieldsBody if we have any custom fields
      if (Object.keys(customFieldsData).length > 0) {
        standardFieldsBody.customFields = customFieldsData;
      }

      // Validate required fields if they're being updated
      const validationErrors: Record<string, string> = {};
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          // Only validate if the field is being updated
          if (field in standardFieldsBody && (standardFieldsBody[field] === undefined || standardFieldsBody[field] === null || standardFieldsBody[field] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`;
          }
          // If field is not being updated, ensure it exists in the existing asset
          if (!(field in standardFieldsBody) && (existingAsset[field as keyof typeof existingAsset] === undefined || existingAsset[field as keyof typeof existingAsset] === null || existingAsset[field as keyof typeof existingAsset] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`;
          }
        }
      }

      // Validate custom fields if they exist
      if (customFieldsData) {
        // Create a map for faster lookup
        const customFieldsMap = new Map(customFields.map(cf => [cf.name, cf]));

        // Validate each custom field
        for (const [fieldName, fieldValue] of Object.entries(customFieldsData)) {
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
              case 'dateBuy':
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
        return validationErrorResponse(validationErrors);
      }

      // Check if unique field is being updated and already exists for another asset
      if (this.operations.uniqueField && standardFieldsBody[this.operations.uniqueField] && 
          standardFieldsBody[this.operations.uniqueField] !== (existingAsset as any)[this.operations.uniqueField]) {
        // For Printer and PC models, we use findFirst instead of findUnique since we removed the @unique constraint
        let existingAssetWithUniqueField;
        if (this.operations.modelName === 'Printer' || this.operations.modelName === 'PC') {
          existingAssetWithUniqueField = await this.getPrismaModel().findFirst({
            where: { 
              [this.operations.uniqueField]: body[this.operations.uniqueField as keyof typeof body],
              tenantId: user.tenantId,
              NOT: { id: id }
            }
          });
        } else {
          existingAssetWithUniqueField = await this.getPrismaModel().findUnique({
            where: { 
              [this.operations.uniqueField]: body[this.operations.uniqueField as keyof typeof body],
              NOT: { id: id }
            }
          });
        }

        if (existingAssetWithUniqueField) {
          if (process.env.NODE_ENV === 'development') {
            logger.info(`Asset with ${String(this.operations.uniqueField)} ${(body[this.operations.uniqueField as keyof typeof body])} already exists`);
          }
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
        }
      }

      // Create history record for changes
      const changes: Record<string, { from: any; to: any }> = {};
      Object.keys(standardFieldsBody).forEach(key => {
        // Skip undefined values to avoid setting fields to undefined
        if (standardFieldsBody[key] !== undefined && 
            standardFieldsBody[key] !== (existingAsset as any)[key]) {
          changes[key] = {
            from: (existingAsset as any)[key],
            to: standardFieldsBody[key]
          };
        }
      });

      // Also track changes in custom fields
      if (standardFieldsBody.customFields) {
        const existingCustomFields = existingAsset.customFields || {};
        Object.entries(standardFieldsBody.customFields).forEach(([key, value]) => {
          if (value !== undefined && 
              value !== (existingCustomFields as any)[key]) {
            changes[`customFields.${key}`] = {
              from: (existingCustomFields as any)[key],
              to: value
            };
          }
        });
      }

      if (Object.keys(changes).length > 0) {
        try {
          // Import audit logs dynamically to avoid circular dependencies
          const { createAuditLog } = await import('../audit-logs');
          await createAuditLog(user.tenantId, {
            action: 'update',
            modelType: this.operations.modelName,
            recordId: id,
            changes,
            userId: user.id,
            tenantId: user.tenantId
          }, 'update');
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
        'Internet': ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note', 'customFields'],
        'FixedAsset': ['dept', 'barcode', 'sapCode', 'name', 'place', 'inputDate', 'location', 'status', 'note', 'customFields']
      };

      const modelValidFields = validFields[this.operations.modelName as keyof typeof validFields] || [];
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Valid fields for ${this.operations.modelName}:`, modelValidFields);
      }

      // Define date fields for each asset type (same as in create method)
      const dateFields: Record<string, string[]> = {
        'PC': [],
        'Laptop': ['dateBuy'],
        'Printer': ['date'],
        'License': ['date'],
        'WarehouseIT': [],
        'Internet': [],
        'FixedAsset': ['inputDate']
      };

      const modelDateFields = dateFields[this.operations.modelName as keyof typeof dateFields] || [];

      const updateData = Object.keys(standardFieldsBody || {}).reduce((acc, key) => {
        // Allow both direct fields and customFields to be updated
        if ((modelValidFields.includes(key) || key === 'customFields') && standardFieldsBody[key] !== undefined) {
          // Handle date field conversion
          if (modelDateFields.includes(key) && typeof standardFieldsBody[key] === 'string') {
            try {
              const dateValue = new Date(standardFieldsBody[key]);
              if (!isNaN(dateValue.getTime())) {
                (acc as any)[key] = dateValue;
              } else {
                // If date parsing fails, keep original value
                (acc as any)[key] = standardFieldsBody[key];
              }
            } catch (e) {
              // If date parsing fails, keep original value
              (acc as any)[key] = standardFieldsBody[key];
            }
          } else {
            (acc as any)[key] = standardFieldsBody[key];
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`Skipping field ${key} - not valid or undefined`, { 
              component: 'asset-api-handler', 
              field: key 
            });
          }
        }
        return acc;
      }, {} as Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>);
      
      logger.debug("Update data to be sent to database", { 
        component: 'asset-api-handler', 
        data: updateData 
      });

      const asset = await this.getPrismaModel().update({
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
      });

      // Use comprehensive cache invalidation strategy for better performance and consistency
      if (cacheManager && CACHE_PREFIXES) {
        try {
          // Invalidate the specific asset cache
          const assetCacheKey = cacheManager.createCompositeKey(
            CACHE_PREFIXES.ASSETS,
            this.operations.modelName,
            user.tenantId,
            id
          );
          
          await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
          
          // Invalidate all asset list caches for this tenant and model type
          await cacheManager.invalidateResource(user.tenantId, this.operations.modelName, { component: 'asset-api-handler' });
          
          // Also invalidate any potential search result caches
          const searchPatterns = [
            cacheManager.createCompositeKey(
              CACHE_PREFIXES.SEARCH,
              this.operations.modelName,
              user.tenantId,
              '*'
            )
          ];
          
          await cacheManager.batchInvalidate(searchPatterns, { component: 'asset-api-handler' });
          
          logger.debug(`Cache invalidated after updating ${this.operations.modelName} asset ${id}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate cache after updating ${this.operations.modelName} asset:`, error);
        }
      }

      return successResponse(asset);
    } catch (error: any) {
      if (error.code === 'P2025') {
        logger.debug(`Asset ${id} not found during update`);
        return notFoundResponse(`${this.operations.modelName} asset not found`);
      }
      
      logger.error(`Error updating ${this.operations.modelName} asset:`, { 
        error: error.message, 
        stack: error.stack,
        modelName: this.operations.modelName,
        assetId: id,
        body: body
      });
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.');
      }
      
      // Handle validation errors
      if (error.message && error.message.includes('Validation')) {
        return errorResponse(error.message, 400);
      }
      
      return errorResponse('Failed to update asset. Please try again later.');
    }
  }

  /**
   * Delete an asset by ID
   * @param user - The user object
   * @param id - The ID of the asset to delete
   * @returns Promise that resolves to a response indicating success or failure
   */
  async delete(user: any, id: string) {
    try {
      // Check permissions
      const hasDeletePermission = await this.checkPermission(user, 'delete');
      if (!hasDeletePermission) {
        return errorResponse('Forbidden: Insufficient permissions to delete asset', 403);
      }

      // Check if asset exists and belongs to user's tenant
      const existingAsset = await this.getPrismaModel().findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      });

      // Create audit log entry
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('../audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'delete',
          modelType: this.operations.modelName,
          recordId: id,
          changes: existingAsset || { id }, // Include at least the ID if asset doesn't exist
          userId: user.id,
          tenantId: user.tenantId
        }, 'delete');
      } catch (auditLogError) {
        logger.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError);
        // Continue with the operation even if audit log creation fails
      }

      // Delete the asset if it exists
      if (existingAsset) {
        await this.getPrismaModel().delete({
          where: { 
            id,
            tenantId: user.tenantId 
          }
        });
      } else {
        logger.warn(`${this.operations.modelName} asset ${id} not found during delete operation`);
      }

      // Use comprehensive cache invalidation strategy for better performance and consistency
      if (cacheManager && CACHE_PREFIXES) {
        try {
          // Invalidate the specific asset cache (whether it existed or not)
          const assetCacheKey = cacheManager.createCompositeKey(
            CACHE_PREFIXES.ASSETS,
            this.operations.modelName,
            user.tenantId,
            id
          );
          
          await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
          
          // Invalidate all asset list caches for this tenant and model type
          await cacheManager.invalidateResource(user.tenantId, this.operations.modelName, { component: 'asset-api-handler' });
          
          // Also invalidate any potential search result caches
          const searchPatterns = [
            cacheManager.createCompositeKey(
              CACHE_PREFIXES.SEARCH,
              this.operations.modelName,
              user.tenantId,
              '*'
            )
          ];
          
          await cacheManager.batchInvalidate(searchPatterns, { component: 'asset-api-handler' });
          
          logger.debug(`Cache invalidated after deleting ${this.operations.modelName} asset ${id}`);
        } catch (error: any) {
          logger.error(`Failed to invalidate cache after deleting ${this.operations.modelName} asset:`, error);
        }
      }

      return successResponse<null>(null, 204);
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Even if Prisma reports not found, we still want to invalidate cache
        // to handle cases where cache exists but DB record doesn't
        if (cacheManager && CACHE_PREFIXES) {
          const assetCacheKey = cacheManager.createCompositeKey(
            CACHE_PREFIXES.ASSETS,
            this.operations.modelName,
            user.tenantId,
            id
          );
          
          try {
            await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
          } catch (cacheError: any) {
            logger.warn(`Failed to delete asset cache key ${assetCacheKey} after Prisma error:`, cacheError);
          }
        }
        
        return notFoundResponse(`${this.operations.modelName} asset not found`);
      }
      
      logger.error(`Error deleting ${this.operations.modelName} asset:`, { 
        error: error.message, 
        stack: error.stack,
        modelName: this.operations.modelName,
        assetId: id
      });
      return errorResponse('Failed to delete asset. Please try again later.');
    }
  }

  /**
   * Bulk delete multiple assets by IDs
   * @param user - The user object
   * @param ids - Array of asset IDs to delete
   * @returns Promise that resolves to a response indicating success or failure
   */
  async bulkDelete(user: any, ids: string[]) {
    try {
      // Check permissions
      const hasBulkDeletePermission = await this.checkPermission(user, 'bulkDelete');
      if (!hasBulkDeletePermission) {
        return errorResponse('Forbidden: Insufficient permissions to bulk delete assets', 403);
      }

      // Validate input
      if (!ids || ids.length === 0) {
        return badRequestResponse('No asset IDs provided');
      }

      // Process in batches to avoid memory issues with large datasets
      const batchSize = 100;
      let totalDeleted = 0;
      let totalNotFound = 0;

      // Process IDs in batches
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);
        
        // Check if all assets in batch exist and belong to user's tenant
        // Use findMany with explicit tenantId check to ensure we only get assets belonging to the current tenant
        const existingAssets = await this.getPrismaModel().findMany({
          where: { 
            id: { in: batchIds },
            tenantId: user.tenantId 
          },
          select: {
            id: true,
            tenantId: true
          }
        });

        // Log detailed information about the found assets for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`Found ${existingAssets.length} assets out of ${batchIds.length} requested for tenant ${user.tenantId}`, {
            component: 'asset-api-handler',
            foundAssets: existingAssets.map((a: any) => a.id),
            requestedIds: batchIds,
            tenantId: user.tenantId
          });
        }

        // Check if all requested assets were found
        const foundIds = existingAssets.map((asset: any) => asset.id);
        const missingIds = batchIds.filter(id => !foundIds.includes(id));
        
        // Track missing assets
        totalNotFound += missingIds.length;
        
        // Log missing assets
        if (missingIds.length > 0) {
          logger.warn(`Some ${this.operations.modelName} assets not found during bulk delete: ${missingIds.join(', ')}`);
        }

        // Only create audit logs for assets that actually exist
        if (existingAssets.length > 0) {
          // Create audit log entries for each asset in batch
          // Use Promise.all for parallel processing
          const auditLogPromises = existingAssets.map((asset: any) => 
            // Import audit logs dynamically to avoid circular dependencies
            import('../audit-logs').then(({ createAuditLog }) => 
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
          const deleteResult = await this.getPrismaModel().deleteMany({
            where: { 
              id: { in: foundIds }, // Only delete assets that were found
              tenantId: user.tenantId 
            }
          });

          totalDeleted += deleteResult.count;
        }
        
        // IMPORTANT: Even if assets don't exist in DB, we still need to invalidate their cache
        // This handles the case where cached assets no longer exist in the database
        if (batchIds.length > 0 && cacheManager && CACHE_PREFIXES) {
          // Invalidate cache for all requested IDs, not just found ones
          for (const id of batchIds) {
            const assetCacheKey = cacheManager.createCompositeKey(
              CACHE_PREFIXES.ASSETS,
              this.operations.modelName,
              user.tenantId,
              id
            );
            
            try {
              await cacheManager.del(assetCacheKey, { component: 'asset-api-handler' });
              logger.debug(`Invalidated cache for asset ID ${id} (may or may not have existed in DB)`);
            } catch (error: any) {
              logger.warn(`Failed to invalidate cache for asset ID ${id}:`, error);
            }
          }
        }
      }

      // Log the number of deleted assets
      logger.debug(`Deleted ${totalDeleted} ${this.operations.modelName} assets in ${Math.ceil(ids.length/batchSize)} batches`);
      if (totalNotFound > 0) {
        logger.debug(`NotFound ${totalNotFound} ${this.operations.modelName} assets during bulk delete`);
      }

      // Create audit log entry for the bulk delete operation itself
      try {
        // Import audit logs dynamically to avoid circular dependencies
        const { createAuditLog } = await import('../audit-logs');
        await createAuditLog(user.tenantId, {
          action: 'bulkDelete',
          modelType: this.operations.modelName,
          recordId: 'bulk-operation',
          changes: {
            count: totalDeleted,
            notFound: totalNotFound,
            ids: ids.slice(0, 10), // Only log first 10 IDs for privacy
            totalIds: ids.length
          },
          userId: user.id,
          tenantId: user.tenantId
        }, 'bulkDelete');
      } catch (auditLogError) {
        logger.error(`Failed to create bulk delete audit log for ${this.operations.modelName}:`, auditLogError);
        // Continue with the operation even if audit log creation fails
      }

      // Use comprehensive cache invalidation strategy for better performance and consistency
      if (cacheManager && CACHE_PREFIXES) {
        try {
          // Invalidate all asset list caches for this tenant and model type
          await cacheManager.invalidateResource(user.tenantId, this.operations.modelName, { component: 'asset-api-handler' });
          
          // Also invalidate any potential search result caches
          const searchPatterns = [
            cacheManager.createCompositeKey(
              CACHE_PREFIXES.SEARCH,
              this.operations.modelName,
              user.tenantId,
              '*'
            )
          ];
          
          await cacheManager.batchInvalidate(searchPatterns, { component: 'asset-api-handler' });
          
          logger.debug(`Cache invalidated after bulk deleting ${this.operations.modelName} assets`);
        } catch (error: any) {
          logger.error(`Failed to invalidate cache after bulk deleting ${this.operations.modelName} assets:`, error);
        }
      }

      // Log completion of bulk delete operation
      logger.info(`Bulk delete operation completed for ${this.operations.modelName}: ${totalDeleted} deleted, ${totalNotFound} not found out of ${ids.length} requested`);

      return successResponse<null>(null, 204);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Error bulk deleting ${this.operations.modelName} assets:`, error);
      }
      
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} assets not found`);
      }
      
      return errorResponse('Failed to delete assets. Please try again later.');
    }
  }
}