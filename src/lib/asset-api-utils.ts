import { validateSearchInput } from '@/lib/security';

/**
 * Builds search fields array based on asset type
 * @param assetType - The type of asset
 * @returns Array of field names to search in
 */
export function buildSearchFields(assetType: string): string[] {
  switch (assetType) {
    case 'pc':
      return [
        'cpuBarcode',
        'pcName',
        'userName',
        'dept',
        'status'
      ];
    case 'laptop':
      return [
        'barcode',
        'userName',
        'dept',
        'model',
        'status'
      ];
    case 'printer':
      return [
        'barcode',
        'dept',
        'location',
        'ip',
        'model'
      ];
    case 'license':
      return [
        'deviceName',
        'userName',
        'dept',
        'productType',
        'productKey',
        'model',
        'pc',
        'mac',
        'ip',
        'updateStatus'
      ];
    case 'warehouse':
      return [
        'barcode',
        'sapCode',
        'status'
      ];
    case 'internet':
      return [
        'dept',
        'manager',
        'userName',
        'email',
        'ipAddress',
        'internetAccess',
        'status'
      ];
    default:
      return [
        'barcode',
        'pcName',
        'userName',
        'dept',
        'ip',
      ];
  }
}

/**
 * Builds where clause for database queries
 * @param tenantId - The tenant ID
 * @param search - Search term (optional)
 * @param status - Status filter (optional)
 * @param assetType - The type of asset
 * @returns Where clause object for Prisma queries
 */
export function buildWhereClause(
  tenantId: string,
  search: string | undefined,
  status: string | undefined,
  assetType: string
) {
  const whereClause: any = {
    tenantId: tenantId
  };

  // Add search condition if provided
  if (search) {
    const searchFields = buildSearchFields(assetType);
    const sanitizedSearch = validateSearchInput(search);
    
    // Create search conditions for indexed fields
    whereClause.OR = searchFields.map(field => ({
      [field]: { contains: sanitizedSearch, mode: 'insensitive' }
    }));
    
    // Also search in custom fields using proper JSON search
    whereClause.OR.push({
      customFields: {
        path: [],
        string_contains: sanitizedSearch
      }
    });
  }

  // Add status filter if provided
  if (status) {
    if (assetType === 'license') {
      whereClause.updateStatus = status;
    } else if (assetType !== 'printer') {
      whereClause.status = status;
    }
  }

  return whereClause;
}

/**
 * Builds select fields object based on asset type
 * @param assetType - The type of asset
 * @returns Select fields object for Prisma queries
 */
export function buildSelectFields(assetType: string) {
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
  if (assetType === 'warehouse') {
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

  const baseFields = getBaseFieldsForModel(assetType);

  // Remove undefined fields from baseFields to prevent Prisma errors
  const cleanBaseFields = Object.fromEntries(
    Object.entries(baseFields).filter(([_, value]) => value !== undefined)
  );

  switch (assetType) {
    case 'pc':
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
    case 'laptop':
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
    case 'printer':
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
    case 'license':
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
    case 'warehouse':
      return {
        ...cleanBaseFields,
        barcode: true,
        sapCode: true,
        status: true,
        note: true,
        customFields: true // Include custom fields
      };
    case 'internet':
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

/**
 * Builds raw SQL queries for search operations
 * @param assetType - The type of asset
 * @param tenantId - The tenant ID
 * @param search - Search term
 * @param status - Status filter (optional)
 * @param limit - Number of records to return
 * @param skip - Number of records to skip
 * @returns Object containing base query, count query, and query arguments
 */
export function buildSearchQueries(
  assetType: string,
  tenantId: string,
  search: string,
  status: string | undefined,
  limit: number,
  skip: number
) {
  let baseQuery = '';
  let countQuery = '';
  const queryArgs: any[] = [tenantId];
  
  // Map model names to actual table names

  
  switch (assetType) {
    case 'pc':
      baseQuery = `
        SELECT id, "cpuBarcode", "pcName", "userName", "dept", "status", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "PC"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "PC"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    case 'laptop':
      baseQuery = `
        SELECT id, "barcode", "userName", "dept", "status", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "Laptop"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "Laptop"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    case 'printer':
      baseQuery = `
        SELECT id, "barcode", "dept", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "Printer"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "Printer"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    case 'license':
      baseQuery = `
        SELECT id, "userName", "dept", "updateStatus", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "License"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "License"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    case 'warehouse':
      baseQuery = `
        SELECT id, "barcode", "sapCode", "status", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "WarehouseIT"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "WarehouseIT"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    case 'internet':
      baseQuery = `
        SELECT id, "dept", "manager", "userName", "email", "ipAddress", "internetAccess", "status", "updatedAt", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
        FROM "Internet"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      countQuery = `
        SELECT COUNT(*) as count
        FROM "Internet"
        WHERE "tenantId" = $1
        AND (
          "search_vector" @@ websearch_to_tsquery('english', $2)
          OR
          "search_vector" @@ plainto_tsquery('english', $2)
        )
      `;
      break;
    default:
      throw new Error(`Unsupported asset type: ${assetType}`);
  }
  
  // Sanitize search input to prevent injection
  const sanitizedSearch = validateSearchInput(search);
  
  // Add search parameter to args
  queryArgs.push(sanitizedSearch);
  
  // Add status filter if provided
  if (status) {
    // Sanitize status input using enhanced validation
    const sanitizedStatus = validateSearchInput(status);
    queryArgs.push(sanitizedStatus);
    const statusField = assetType === 'license' ? 'updateStatus' : 'status';
    baseQuery += ` AND "${statusField}" = $${queryArgs.length}`;
    countQuery += ` AND "${statusField}" = $${queryArgs.length}`;
  }
  
  // Add ordering by rank and then by update time
  baseQuery += ' ORDER BY rank DESC, "updatedAt" DESC';
  
  // Add limit and skip to the query string
  const limitIndex = queryArgs.length + 1;
  const offsetIndex = queryArgs.length + 2;
  baseQuery += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
  
  // Add limit and skip parameters to queryArgs
  queryArgs.push(limit, skip);
  
  return { baseQuery, countQuery, queryArgs };
}

/**
 * Processes search results to remove rank field
 * @param assetsResult - Array of assets from database query
 * @returns Cleaned array of assets without rank field
 */
export function processSearchResults(assetsResult: any[]) {
  return assetsResult.map(asset => {
    const { rank, ...cleanAsset } = asset;
    return cleanAsset;
  });
}