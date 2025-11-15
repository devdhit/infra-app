import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getCustomFieldsForModel, invalidateCustomFieldsCache } from '@/lib/custom-fields'
import { successResponse, errorResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'
import { CustomField } from '@/types/custom-fields'

// Generate a unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/custom-fields - Get all custom fields for the user's tenant
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      logger.warn('Unauthorized custom fields access attempt', { 
        requestId, 
        component: 'custom-fields' 
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url)
    const modelType = searchParams.get('modelType')

    let customFields: CustomField[] = [];
    
    try {
      if (modelType) {
        // Use cached version for specific model type
        customFields = await getCustomFieldsForModel(user.tenantId, modelType)
      } else {
        // Get all custom fields without caching when no model type is specified
        const dbFields = await db.customField.findMany({
          where: {
            tenantId: user.tenantId
          },
          orderBy: {
            createdAt: 'asc'
          }
        })
        
        // Convert database fields to CustomField type
        customFields = dbFields.map((field: any) => ({
          ...field,
          type: field.type as CustomField['type'],
          modelType: field.modelType as CustomField['modelType'],
          description: field.description === null ? undefined : field.description,
          createdAt: field.createdAt.toISOString(),
          updatedAt: field.updatedAt.toISOString()
        }))
      }
      
      // Add cache headers for better performance
      const headers = {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'Content-Type': 'application/json'
      };
      
      return new Response(JSON.stringify(customFields), {
        status: 200,
        headers
      });
    } catch (dbError: any) {
      logger.error('Database error fetching custom fields', { 
        requestId,
        userId: user.id, 
        tenantId: user.tenantId, 
        error: dbError.message, 
        stack: dbError.stack, 
        component: 'custom-fields' 
      });
      return errorResponse('Failed to fetch custom fields. Please try again later.', 503, { requestId });
    }
  } catch (error: any) {
    // We need to get user info for logging, but if getCurrentUser failed, user will be null
    let user = null;
    try {
      user = await getCurrentUser(request);
    } catch (e) {
      // If we can't get user info, that's fine, we'll just log with null values
    }
    
    logger.error('Unexpected error fetching custom fields', { 
      requestId, 
      userId: user?.id, 
      tenantId: user?.tenantId, 
      error: error.message, 
      stack: error.stack, 
      component: 'custom-fields' 
    });
    return errorResponse('Internal server error. Please try again later.', 500, { requestId });
  }
}

// POST /api/custom-fields - Create a new custom field
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let user = null;
  
  try {
    user = await getCurrentUser(request)
    if (!user) {
      logger.warn('Unauthorized custom fields create attempt', { 
        requestId, 
        component: 'custom-fields' 
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.modelType) {
      logger.warn('Missing required fields in custom field creation', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        component: 'custom-fields' 
      });
      return badRequestResponse('Name, type, and modelType are required')
    }

    // Validate field name format (alphanumeric and underscores only)
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    if (!fieldNameRegex.test(body.name)) {
      logger.warn('Invalid custom field name format', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldName: body.name, 
        component: 'custom-fields' 
      });
      return badRequestResponse('Field name must start with a letter or underscore and contain only letters, numbers, and underscores')
    }
    
    // Additional validation: Check field name length
    if (body.name.length > 50) {
      logger.warn('Custom field name too long', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldName: body.name, 
        length: body.name.length, 
        component: 'custom-fields' 
      });
      return badRequestResponse('Field name must be no more than 50 characters')
    }

    // Validate field type
    const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
    if (!validTypes.includes(body.type)) {
      logger.warn('Invalid custom field type', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldType: body.type, 
        component: 'custom-fields' 
      });
      return badRequestResponse(`Invalid field type. Must be one of: ${validTypes.join(', ')}`)
    }
    
    // Validate description length if provided
    if (body.description && body.description.length > 255) {
      logger.warn('Custom field description too long', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        descriptionLength: body.description.length, 
        component: 'custom-fields' 
      });
      return badRequestResponse('Description must be no more than 255 characters')
    }

    // Validate model type
    const validModelTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet', 'FixedAsset']
    if (!validModelTypes.includes(body.modelType)) {
      logger.warn('Invalid custom field model type', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        modelType: body.modelType, 
        component: 'custom-fields' 
      });
      return badRequestResponse(`Invalid model type. Must be one of: ${validModelTypes.join(', ')}`)
    }

    // Check if a custom field with the same name already exists for this model type
    const existingField = await db.customField.findFirst({
      where: {
        name: body.name,
        modelType: body.modelType,
        tenantId: user.tenantId
      }
    })

    if (existingField) {
      logger.warn('Custom field with this name already exists', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldName: body.name,
        modelType: body.modelType,
        component: 'custom-fields' 
      });
      return conflictResponse(`A custom field with name "${body.name}" already exists for ${body.modelType}`)
    }

    const customField = await db.customField.create({
      data: {
        name: body.name,
        type: body.type,
        modelType: body.modelType,
        description: body.description || null,
        required: body.required || false,
        tenantId: user.tenantId
      }
    })

    // Invalidate cache for this model type
    await invalidateCustomFieldsCache(user.tenantId, body.modelType)

    // Convert to CustomField type
    const resultField: CustomField = {
      ...customField,
      type: customField.type as CustomField['type'],
      modelType: customField.modelType as CustomField['modelType'],
      description: customField.description === null ? undefined : customField.description,
      createdAt: customField.createdAt.toISOString(),
      updatedAt: customField.updatedAt.toISOString()
    };

    return successResponse(resultField, 201)
  } catch (error: any) {
    logger.error('Unexpected error creating custom field', { 
      requestId, 
      userId: user?.id, 
      tenantId: user?.tenantId, 
      error: error.message, 
      stack: error.stack, 
      component: 'custom-fields' 
    });
    return errorResponse('Internal server error. Please try again later.', 500, { requestId });
  }
}