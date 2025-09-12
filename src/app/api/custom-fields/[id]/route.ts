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

    // Check if updating the name would create a duplicate
    if (body.name && body.name !== existingCustomField.name) {
      const duplicateField = await db.customField.findFirst({
        where: {
          name: body.name,
          modelType: existingCustomField.modelType,
          tenantId: user.tenantId,
          NOT: { id: resolvedParams.id }
        }
      })

      if (duplicateField) {
        return conflictResponse(`A custom field with name "${body.name}" already exists for ${existingCustomField.modelType}`)
      }
    }

    const updateData: Partial<CustomField> = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type as any }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.required !== undefined && { required: body.required })
    };
    
    const customField = await db.customField.update({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      data: updateData
    })

    // Invalidate cache for this model type
    await invalidateCustomFieldsCache(user.tenantId, existingCustomField.modelType)

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