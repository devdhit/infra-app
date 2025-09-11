import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getCustomFieldsForModel, invalidateCustomFieldsCache } from '@/lib/custom-fields'
import { successResponse, errorResponse, badRequestResponse, conflictResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// GET /api/custom-fields - Get all custom fields for the user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = new URL(request.url)
    const modelType = searchParams.get('modelType')

    if (modelType) {
      // Use cached version for specific model type
      const customFields = await getCustomFieldsForModel(user.tenantId, modelType)
      return successResponse(customFields)
    } else {
      // Get all custom fields without caching when no model type is specified
      const customFields = await db.customField.findMany({
        where: {
          tenantId: user.tenantId
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
      return successResponse(customFields)
    }
  } catch (error) {
    logger.error('Error fetching custom fields:', error)
    return errorResponse('Internal server error')
  }
}

// POST /api/custom-fields - Create a new custom field
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type || !body.modelType) {
      return badRequestResponse('Name, type, and modelType are required')
    }

    // Validate field name format (alphanumeric and underscores only)
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    if (!fieldNameRegex.test(body.name)) {
      return badRequestResponse('Field name must start with a letter or underscore and contain only letters, numbers, and underscores')
    }

    // Validate field type
    const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
    if (!validTypes.includes(body.type)) {
      return badRequestResponse(`Invalid field type. Must be one of: ${validTypes.join(', ')}`)
    }

    // Validate model type
    const validModelTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT']
    if (!validModelTypes.includes(body.modelType)) {
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

    return successResponse(customField, 201)
  } catch (error) {
    logger.error('Error creating custom field:', error)
    return errorResponse('Internal server error')
  }
}