// Utility functions for custom field handling

/**
 * Map asset type to model type for custom fields
 * Asset types in pages are lowercase (e.g., "pc", "laptop") 
 * but model types in custom fields are PascalCase (e.g., "PC", "Laptop")
 */
export const getModelType = (assetType: string): string => {
  const modelTypeMap: Record<string, string> = {
    pc: "PC",
    laptop: "Laptop",
    printer: "Printer",
    license: "License",
    warehouse: "WarehouseIT",
    internet: "Internet"
  };
  
  return modelTypeMap[assetType] || assetType;
};

/**
 * Determine if a field is a custom field
 * @param fieldName - The name of the field
 * @param asset - The asset object
 * @param customFieldsData - The custom fields data from the API
 * @returns boolean indicating if the field is a custom field
 */
export const isCustomField = (
  fieldName: string, 
  asset: any, 
  customFieldsData?: any[]
): boolean => {
  // Check if the field exists in customFieldsData - this is the primary way to determine if a field is custom
  if (customFieldsData) {
    return customFieldsData.some((cf: any) => cf.name === fieldName);
  }
  
  // Fallback: check if field exists in asset.customFields but not directly on asset
  // This is a more reliable check than just checking if the field exists in customFields
  return asset.customFields && 
         fieldName in asset.customFields && 
         !(fieldName in asset);
};

/**
 * Get the value of a field, handling both standard and custom fields
 * @param fieldName - The name of the field
 * @param asset - The asset object
 * @param isCustom - Whether the field is a custom field (optional, will be determined if not provided)
 * @returns The value of the field
 */
export const getFieldValue = (
  fieldName: string, 
  asset: any, 
  isCustom?: boolean
): any => {
  // If explicitly specified as custom field, get from customFields
  if (isCustom === true) {
    return asset.customFields?.[fieldName] ?? null;
  }
  
  // If explicitly specified as standard field, get directly from asset
  if (isCustom === false) {
    return asset[fieldName];
  }
  
  // If not specified, determine based on field existence
  if (asset.customFields && fieldName in asset.customFields) {
    return asset.customFields[fieldName];
  }
  
  return asset[fieldName];
};

/**
 * Create update data structure for API requests
 * @param fieldName - The name of the field being updated
 * @param value - The new value
 * @param isCustom - Whether the field is a custom field
 * @param asset - The asset object (needed for custom fields to preserve existing custom fields)
 * @returns The data structure for the API request
 */
export const createUpdateData = (
  fieldName: string,
  value: any,
  isCustom: boolean,
  asset?: any
): Record<string, any> => {
  if (isCustom) {
    // For custom fields, we need to send the customFields object
    const currentCustomFields = asset?.customFields || {};
    return {
      customFields: {
        ...currentCustomFields,
        [fieldName]: value
      }
    };
  } else {
    // For standard fields, send the field directly
    return { [fieldName]: value };
  }
};

// Conditional imports for server-side only functionality
let redisCache: any = null;
let CACHE_PREFIXES: any = null;
let CACHE_TTL: any = null;
let db: any = null;

// Only import and use Redis cache on the server side
if (typeof window === 'undefined') {
  try {
    // Server-side only imports
    const redisModule = require('./redis-cache');
    redisCache = redisModule.default;
    CACHE_PREFIXES = redisModule.CACHE_PREFIXES;
    CACHE_TTL = redisModule.CACHE_TTL;
    
    const dbModule = require('./db');
    db = dbModule.db;
  } catch (error) {
    console.warn('Server-side modules not available:', error);
  }
}

/**
 * Get custom fields for a specific tenant and model type with caching
 * @param tenantId - The tenant ID
 * @param modelType - The model type (e.g., "PC", "Laptop")
 * @returns Array of custom fields
 */
export const getCustomFieldsForModel = async (tenantId: string, modelType: string) => {
  // Check if we're on the server side and have the required modules
  if (typeof window !== 'undefined' || !redisCache || !db) {
    // This should never be called on the client side, but we need to provide a fallback
    console.warn('getCustomFieldsForModel called on client side or missing modules');
    return [];
  }
  
  // Create cache key
  const cacheKey = redisCache.createKey(CACHE_PREFIXES.CUSTOM_FIELDS, tenantId, modelType);
  
  // Try to get from cache first
  const cachedFields = await redisCache.get(cacheKey);
  if (cachedFields) {
    return cachedFields;
  }
  
  // Fetch from database if not in cache
  const customFields = await db.customField.findMany({
    where: {
      tenantId,
      modelType
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  // Cache the result
  await redisCache.set(cacheKey, customFields, CACHE_TTL.CUSTOM_FIELDS);
  
  return customFields;
};

/**
 * Invalidate custom fields cache for a tenant and model type
 * @param tenantId - The tenant ID
 * @param modelType - The model type (e.g., "PC", "Laptop")
 */
export const invalidateCustomFieldsCache = async (tenantId: string, modelType: string) => {
  // Check if we're on the server side and have the required modules
  if (typeof window !== 'undefined' || !redisCache) {
    // This should never be called on the client side, but we need to provide a fallback
    console.warn('invalidateCustomFieldsCache called on client side or missing modules');
    return;
  }
  
  const cacheKey = redisCache.createKey(CACHE_PREFIXES.CUSTOM_FIELDS, tenantId, modelType);
  await redisCache.del(cacheKey);
};