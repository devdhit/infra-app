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
import { emitAssetChange } from '@/lib/realtime'
import { hasPermission, ResourceType, PermissionAction } from './permissions'
import { User } from '@/types/users'
import { createAuditLog } from '@/lib/audit-logs'

// Define the asset types based on the Prisma schema and route files
interface PCAsset {
  dept: string
  cpuBarcode: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  pcName: string
  userName?: string
  status: string
  note?: string
  customFields?: any
}

interface LaptopAsset {
  dept: string
  barcode: string
  sapBarcode?: string
  dateBuy?: string
  userName?: string
  email?: string
  model?: string
  status: string
  customFields?: any
}

interface PrinterAsset {
  dept: string
  location?: string
  ip?: string
  model?: string
  color: string
  barcode: string
  sapCode?: string
  date?: string
  note?: string
  customFields?: any
}

interface LicenseAsset {
  deviceName?: string
  userName?: string
  dept?: string
  productType?: string
  productKey?: string
  model?: string
  pc?: string
  mac?: string
  ip?: string
  date?: string
  updateStatus?: string
  customFields?: any
}

interface WarehouseITAsset {
  barcode?: string
  sapCode?: string
  status: string
  note?: string
  createdAt?: string
  updatedAt?: string
  customFields?: any
}

// Add the InternetAsset interface
interface InternetAsset {
  dept: string
  manager?: string
  userName?: string
  email?: string
  ipAddress?: string
  internetAccess?: string
  status: string
  note?: string
  customFields?: any
}

// Define the structure for asset operations
interface AssetOperations<T> {
  modelName: string
  requiredFields?: (keyof T)[]
  uniqueField?: keyof T
  searchFields?: (keyof T)[]
  include?: any
}

// Generic asset API handler
export class AssetApiHandler<T> {
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
  private async checkPermission(user: User, action: PermissionAction) {
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
    user: User, 
    queryParams: { page: number; limit: number; search: string; status: string }
  ) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to view assets', 403);
      }

      const { page, limit, search, status } = queryParams

      const where: any = {
        tenantId: user.tenantId
      }

      // Add search filter with optimized indexing
      if (search && this.operations.searchFields) {
        // Get indexed fields appropriate for this model
        const modelAppropriateSearchFields = (field: any) => {
          // Handle model-specific field availability
          if (this.operations.modelName === 'Printer' && field === 'status') {
            return false;
          }
          
          // Handle License model which uses updateStatus instead of status
          if (this.operations.modelName === 'License' && field === 'status') {
            return false;
          }
          
          // Map of indexed fields by model
          const indexedFieldsByModel: Record<string, string[]> = {
            'PC': ['userName', 'dept', 'status', 'cpuBarcode'],
            'Laptop': ['userName', 'dept', 'status', 'barcode'],
            'Printer': ['dept', 'barcode'],
            'License': ['userName', 'dept', 'updateStatus', 'productKey'],
            'WarehouseIT': ['status', 'barcode', 'sapCode'],
            'Internet': ['userName', 'dept', 'status', 'ipAddress']  // Add indexed fields for Internet
          };
          
          // Get indexed fields for this model
          const modelIndexedFields = indexedFieldsByModel[this.operations.modelName] || ['status'];  // Changed default to 'status'
          
          return modelIndexedFields.includes(field as string);
        };
        
        // Use indexed fields for better performance
        const indexedSearchFields = this.operations.searchFields.filter(modelAppropriateSearchFields);
        
        // Create search conditions for standard fields
        const standardFieldConditions = indexedSearchFields.map((field: any) => ({
          [field]: { contains: search, mode: 'insensitive' }
        }));
        
        // Create search condition for custom fields
        const customFieldCondition = {
          customFields: {
            path: [],
            string_contains: search
          }
        };
        
        // Combine all search conditions
        where.OR = [...standardFieldConditions, customFieldCondition];
      }

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
      ])

      return successResponse({
        data: assets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error(`Error fetching ${this.operations.modelName} assets:`, error)
      return errorResponse('Failed to fetch assets. Please try again later.')
    }
  }

  // Get a specific asset by ID
  async getById(user: User, id: string) {
    try {
      // Check permissions
      const hasViewPermission = await this.checkPermission(user, 'view');
      if (!hasViewPermission) {
        return apiErrorResponse('Forbidden: Insufficient permissions to view asset', 403);
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

      return successResponse(asset)
    } catch (error) {
      console.error(`Error fetching ${this.operations.modelName} asset:`, error)
      return errorResponse('Failed to fetch asset details. Please try again later.')
    }
  }

  // Create a new asset
  async create(user: User, body: T & { customFields?: Record<string, any> }) {
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

        // Validate each custom field
        for (const customField of customFields) {
          const fieldValue = body.customFields[customField.name];
          
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
        if (body[key as keyof T] !== undefined) {
          (acc as any)[key] = body[key as keyof T];
        }
        return acc;
      }, {} as Partial<T>);

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
        await createAuditLog(user.tenantId, {
          action: 'create',
          modelType: this.operations.modelName,
          recordId: asset.id,
          changes: body as any,
          userId: user.id,
          tenantId: user.tenantId
        }, 'create')
      } catch (auditLogError) {
        console.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      // Emit real-time event
      try {
        emitAssetChange(user.tenantId, this.operations.modelName.toLowerCase(), 'create', asset);
      } catch (emitError) {
        console.error('Failed to emit real-time event:', emitError);
      }

      return successResponse(asset, 201)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error creating ${this.operations.modelName} asset:`, error);
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
  async update(user: User, id: string, body: Partial<T> & { customFields?: Record<string, any> }) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating ${this.operations.modelName} asset ${id} with data:`, body);
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
          console.log(`Asset ${id} not found for tenant ${user.tenantId}`);
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

        // Validate each custom field
        for (const customField of customFields) {
          const fieldValue = body.customFields[customField.name];
          
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
          console.log("Validation errors:", validationErrors);
        }
        return validationErrorResponse(validationErrors)
      }

      // Check if unique field is being updated and already exists for another asset
      if (this.operations.uniqueField && body[this.operations.uniqueField] && 
          body[this.operations.uniqueField] !== existingAsset[this.operations.uniqueField as keyof typeof existingAsset]) {
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
            console.log(`Asset with ${String(this.operations.uniqueField)} ${body[this.operations.uniqueField]} already exists`);
          }
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
        }
      }

      // Create history record for changes
      const changes: Record<string, { from: any; to: any }> = {}
      Object.keys(body).forEach(key => {
        // Skip undefined values to avoid setting fields to undefined
        if (body[key as keyof T] !== undefined && 
            body[key as keyof T] !== existingAsset[key as keyof typeof existingAsset]) {
          changes[key] = {
            from: existingAsset[key as keyof typeof existingAsset],
            to: body[key as keyof T]
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        try {
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
            console.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError);
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
        console.log(`Valid fields for ${this.operations.modelName}:`, modelValidFields);
      }

      const updateData = Object.keys(body || {}).reduce((acc, key) => {
        // Only include valid fields for this model and non-undefined values
        // Allow both direct fields and customFields to be updated
        if ((modelValidFields.includes(key) || key === 'customFields') && body[key as keyof T] !== undefined) {
          (acc as any)[key] = body[key as keyof T];
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Skipping field ${key} - not valid or undefined`);
          }
        }
        return acc;
      }, {} as Partial<T>);
      
      console.log("Update data to be sent to database:", updateData);

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

      // Emit real-time event
      try {
        emitAssetChange(user.tenantId, this.operations.modelName.toLowerCase(), 'update', asset);
      } catch (emitError) {
        console.error('Failed to emit real-time event:', emitError);
      }

      return successResponse(asset)
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log(`Asset ${id} not found during update`);
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      console.error(`Error updating ${this.operations.modelName} asset:`, error)
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.')
      }
      
      return errorResponse('Failed to update asset. Please try again later.')
    }
  }

  // Delete an asset
  async delete(user: User, id: string) {
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
        await createAuditLog(user.tenantId, {
          action: 'delete',
          modelType: this.operations.modelName,
          recordId: id,
          changes: existingAsset,
          userId: user.id,
          tenantId: user.tenantId
        }, 'delete')
      } catch (auditLogError) {
        console.error(`Failed to create audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      await (this.db as any)[this.operations.modelName].delete({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      // Emit real-time event
      try {
        emitAssetChange(user.tenantId, this.operations.modelName.toLowerCase(), 'delete', { id });
      } catch (emitError) {
        console.error('Failed to emit real-time event:', emitError);
      }

      return successResponse<null>(null, 204)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error deleting ${this.operations.modelName} asset:`, error);
      }
      return errorResponse('Failed to delete asset. Please try again later.')
    }
  }

  // Bulk delete assets with optimized batch processing
  async bulkDelete(user: User, ids: string[]) {
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
        
        if (missingIds.length > 0) {
          return notFoundResponse(`Some ${this.operations.modelName} assets not found: ${missingIds.join(', ')}`)
        }

        // Create audit log entries for each asset in batch
        // Use Promise.all for parallel processing
        const auditLogPromises = existingAssets.map((asset: any) => 
          createAuditLog(user.tenantId, {
            action: 'delete',
            modelType: this.operations.modelName,
            recordId: asset.id,
            changes: asset,
            userId: user.id,
            tenantId: user.tenantId
          }, 'bulkDelete').catch((auditLogError: any) => {
            if (process.env.NODE_ENV === 'development') {
              console.error(`Failed to create audit log for asset ${asset.id}:`, auditLogError);
            }
            // Continue with deletion even if audit log creation fails
          })
        );
        
        // Wait for all audit log entries to be created
        await Promise.all(auditLogPromises);

        // Delete all assets in batch
        const deleteResult = await (this.db as any)[this.operations.modelName].deleteMany({
          where: { 
            id: { in: batchIds },
            tenantId: user.tenantId 
          }
        })

        totalDeleted += deleteResult.count;
      }

      // Log the number of deleted assets
      if (process.env.NODE_ENV === 'development') {
        console.log(`Deleted ${totalDeleted} ${this.operations.modelName} assets in ${Math.ceil(ids.length/batchSize)} batches`);
      }

      // Create audit log entry for the bulk delete operation itself
      try {
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
        console.error(`Failed to create bulk delete audit log for ${this.operations.modelName}:`, auditLogError)
        // Continue with the operation even if audit log creation fails
      }

      // Emit real-time events for each deleted asset
      try {
        ids.forEach(id => {
          emitAssetChange(user.tenantId, this.operations.modelName.toLowerCase(), 'delete', { id });
        });
      } catch (emitError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to emit real-time events:', emitError);
        }
      }

      return successResponse<null>(null, 204)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error bulk deleting ${this.operations.modelName} assets:`, error);
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
  searchFields: ['cpuBarcode', 'pcName', 'dept', 'note']
  // Remove the include option as customFields is a scalar field, not a relation
})

// Create handler for Laptop assets
export const laptopHandler = new AssetApiHandler<LaptopAsset>(db, {
  modelName: 'Laptop',
  requiredFields: ['dept', 'barcode', 'status'],
  uniqueField: 'barcode',
  searchFields: ['barcode', 'userName', 'dept', 'model']
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