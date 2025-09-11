import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import logger from '@/lib/logger'
import { successResponse, errorResponse, notFoundResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'
import { invalidateCustomFieldsCache } from '@/lib/custom-fields'

// GET /api/custom-fields/[id] - Get a specific custom field
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
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
  } catch (error) {
    logger.error('Error fetching custom field:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/custom-fields/[id] - Update a custom field
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
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
      return notFoundResponse('Custom field not found')
    }

    // Validate field name format if provided
    if (body.name) {
      const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!fieldNameRegex.test(body.name)) {
        return badRequestResponse('Field name must start with a letter or underscore and contain only letters, numbers, and underscores')
      }
    }

    // Validate field type if provided
    if (body.type) {
      const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
      if (!validTypes.includes(body.type)) {
        return badRequestResponse(`Invalid field type. Must be one of: ${validTypes.join(', ')}`)
      }
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

    const customField = await db.customField.update({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      data: {
        name: body.name,
        type: body.type,
        description: body.description !== undefined ? body.description : existingCustomField.description,
        required: body.required
      }
    })

    // Invalidate cache for this model type
    await invalidateCustomFieldsCache(user.tenantId, existingCustomField.modelType)

    return successResponse(customField)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Custom field not found')
    }
    
    logger.error('Error updating custom field:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/custom-fields/[id] - Delete a custom field
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
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
      return notFoundResponse('Custom field not found')
    }
    
    logger.error('Error deleting custom field:', error)
    return errorResponse('Internal server error')
  }
}