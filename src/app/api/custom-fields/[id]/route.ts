import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import logger from '@/lib/logger'
import { successResponse, errorResponse, notFoundResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'
import { invalidateCustomFieldsCache } from '@/lib/custom-fields'
import { CustomField } from '@/types/custom-fields'

// Generate a unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/custom-fields/[id] - Get a specific custom field
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      logger.warn('Unauthorized custom field access attempt', { 
        requestId, 
        component: 'custom-fields-id' 
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    const customField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!customField) {
      return notFoundResponse('Custom field not found')
    }

    return successResponse(customField)
  } catch (error: any) {
    // We need to get user info for logging, but if getCurrentUser failed, user will be null
    let user = null;
    try {
      user = await getCurrentUser(request);
    } catch (e) {
      // If we can't get user info, that's fine, we'll just log with null values
    }
    
    logger.error('Error fetching custom field', { 
      requestId, 
      userId: user?.id, 
      tenantId: user?.tenantId, 
      error: error.message, 
      stack: error.stack, 
      component: 'custom-fields-id' 
    });
    return errorResponse('Internal server error', 500, { requestId });
  }
}

// PUT /api/custom-fields/[id] - Update a custom field
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  let user = null;
  
  try {
    user = await getCurrentUser(request)
    if (!user) {
      logger.warn('Unauthorized custom field update attempt', { 
        requestId, 
        component: 'custom-fields-id' 
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    const body = await request.json()
    
    // Check if custom field exists and belongs to user's tenant
    const existingCustomField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingCustomField) {
      logger.warn('Custom field not found during update', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldId: resolvedParams.id, 
        component: 'custom-fields-id' 
      });
      return notFoundResponse('Custom field not found')
    }

    // Validate field name format if provided
    if (body.name) {
      const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!fieldNameRegex.test(body.name)) {
        logger.warn('Invalid custom field name format in update', { 
          requestId, 
          userId: user.id, 
          tenantId: user.tenantId, 
          fieldId: resolvedParams.id, 
          fieldName: body.name, 
          component: 'custom-fields-id' 
        });
        return badRequestResponse('Field name must start with a letter or underscore and contain only letters, numbers, and underscores')
      }
      
      // Additional validation: Check field name length
      if (body.name.length > 50) {
        logger.warn('Custom field name too long in update', { 
          requestId, 
          userId: user.id, 
          tenantId: user.tenantId, 
          fieldId: resolvedParams.id, 
          fieldName: body.name, 
          length: body.name.length, 
          component: 'custom-fields-id' 
        });
        return badRequestResponse('Field name must be no more than 50 characters')
      }
    }

    // Validate field type if provided
    if (body.type) {
      const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
      if (!validTypes.includes(body.type)) {
        return badRequestResponse(`Invalid field type. Must be one of: ${validTypes.join(', ')}`)
      }
    }
    
    // Validate description length if provided
    if (body.description !== undefined && body.description !== null && body.description.length > 255) {
      return badRequestResponse('Description must be no more than 255 characters')
    }

    // Validate modelType if provided
    if (body.modelType) {
      const validModelTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet', 'FixedAsset', 'ITPurchasing']
      if (!validModelTypes.includes(body.modelType)) {
        logger.warn('Invalid custom field model type in update', { 
          requestId, 
          userId: user.id, 
          tenantId: user.tenantId, 
          modelType: body.modelType, 
          component: 'custom-fields-id' 
        });
        return badRequestResponse(`Invalid model type. Must be one of: ${validModelTypes.join(', ')}`)
      }
    }

    // Check if updating the name would create a duplicate
    // Use the new modelType if provided, otherwise use the existing one
    const targetModelType = body.modelType || existingCustomField.modelType;
    if (body.name && body.name !== existingCustomField.name) {
      const duplicateField = await db.customField.findFirst({
        where: {
          name: body.name,
          modelType: targetModelType,
          tenantId: user.tenantId,
          NOT: { id: resolvedParams.id }
        }
      })

      if (duplicateField) {
        return conflictResponse(`A custom field with name "${body.name}" already exists for ${targetModelType}`)
      }
    }
    
    // Also check for duplicate when only changing modelType (not name)
    if (body.modelType && body.modelType !== existingCustomField.modelType && !body.name) {
      const duplicateField = await db.customField.findFirst({
        where: {
          name: existingCustomField.name,
          modelType: body.modelType,
          tenantId: user.tenantId,
          NOT: { id: resolvedParams.id }
        }
      })

      if (duplicateField) {
        return conflictResponse(`A custom field with name "${existingCustomField.name}" already exists for ${body.modelType}`)
      }
    }

    const updateData: Partial<CustomField> = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type as any }),
      ...(body.modelType !== undefined && { modelType: body.modelType as any }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.required !== undefined && { required: body.required })
    };
    
    // If modelType is being changed, we need to clean up custom field data from assets of the old type
    if (body.modelType && body.modelType !== existingCustomField.modelType) {
      const oldModelType = existingCustomField.modelType;
      const fieldName = body.name || existingCustomField.name;
      
      logger.info(`Changing custom field modelType from ${oldModelType} to ${body.modelType}, cleaning up old data`, {
        requestId,
        userId: user.id,
        tenantId: user.tenantId,
        fieldId: resolvedParams.id,
        fieldName,
        component: 'custom-fields-id'
      });
      
      // Remove this field from all assets of the old model type
      try {
        const modelName = oldModelType; // Already in correct format (PC, Laptop, etc.)
        const assets = await (db as any)[modelName].findMany({
          where: {
            tenantId: user.tenantId
          },
          select: {
            id: true,
            customFields: true
          }
        });
        
        // Update each asset to remove this custom field
        for (const asset of assets) {
          if (asset.customFields && fieldName in asset.customFields) {
            const updatedCustomFields = { ...asset.customFields };
            delete updatedCustomFields[fieldName];
            
            await (db as any)[modelName].update({
              where: { id: asset.id },
              data: { customFields: updatedCustomFields }
            });
          }
        }
        
        logger.info(`Removed custom field "${fieldName}" from ${assets.length} ${oldModelType} assets`, {
          requestId,
          userId: user.id,
          tenantId: user.tenantId,
          component: 'custom-fields-id'
        });
      } catch (cleanupError: any) {
        logger.error('Error cleaning up custom field data from old model type', {
          requestId,
          userId: user.id,
          tenantId: user.tenantId,
          error: cleanupError.message,
          stack: cleanupError.stack,
          component: 'custom-fields-id'
        });
        // Don't fail the entire operation if cleanup fails, but log the error
      }
    }
    
    const customField = await db.customField.update({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      data: updateData
    })

    // Invalidate cache for both old and new model types
    await invalidateCustomFieldsCache(user.tenantId, existingCustomField.modelType)
    if (body.modelType && body.modelType !== existingCustomField.modelType) {
      await invalidateCustomFieldsCache(user.tenantId, body.modelType)
    }

    return successResponse(customField)
  } catch (error: any) {
    if (error.code === 'P2025') {
      logger.warn('Custom field not found during update', { 
        requestId, 
        userId: user?.id, 
        tenantId: user?.tenantId, 
        fieldId: (await params).id, 
        component: 'custom-fields-id' 
      });
      return notFoundResponse('Custom field not found')
    }
    
    logger.error('Error updating custom field', { 
      requestId, 
      userId: user?.id, 
      tenantId: user?.tenantId, 
      fieldId: user ? (await params).id : 'unknown',
      error: error.message, 
      stack: error.stack, 
      component: 'custom-fields-id' 
    });
    return errorResponse('Internal server error. Please try again later.', 500, { requestId });
  }
}

// DELETE /api/custom-fields/[id] - Delete a custom field
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = generateRequestId();
  let user = null;
  
  try {
    user = await getCurrentUser(request)
    if (!user) {
      logger.warn('Unauthorized custom field delete attempt', { 
        requestId, 
        component: 'custom-fields-id' 
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Await params before using
    const resolvedParams = await params;

    // Check if custom field exists and belongs to user's tenant
    const existingCustomField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingCustomField) {
      logger.warn('Custom field not found during delete', { 
        requestId, 
        userId: user.id, 
        tenantId: user.tenantId, 
        fieldId: resolvedParams.id, 
        component: 'custom-fields-id' 
      });
      return notFoundResponse('Custom field not found')
    }

    await db.customField.delete({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    // Invalidate cache for this model type
    await invalidateCustomFieldsCache(user.tenantId, existingCustomField.modelType)

    return successResponse(null, 204)
  } catch (error: any) {
    if (error.code === 'P2025') {
      logger.warn('Custom field not found during delete', { 
        requestId, 
        userId: user?.id, 
        tenantId: user?.tenantId, 
        fieldId: (await params).id, 
        component: 'custom-fields-id' 
      });
      return notFoundResponse('Custom field not found')
    }
    
    logger.error('Error deleting custom field', { 
      requestId, 
      userId: user?.id, 
      tenantId: user?.tenantId, 
      fieldId: user ? (await params).id : 'unknown',
      error: error.message, 
      stack: error.stack, 
      component: 'custom-fields-id' 
    });
    return errorResponse('Internal server error. Please try again later.', 500, { requestId });
  }
}