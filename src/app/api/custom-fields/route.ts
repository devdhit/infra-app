import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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

    const where: any = {
      tenantId: user.tenantId
    }

    if (modelType) {
      where.modelType = modelType
    }

    const customFields = await db.customField.findMany({
      where,
      orderBy: {
        createdAt: 'asc'
      }
    })

    return new Response(JSON.stringify(customFields), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching custom fields:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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
      return new Response(JSON.stringify({ error: 'Name, type, and modelType are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate field name format (alphanumeric and underscores only)
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    if (!fieldNameRegex.test(body.name)) {
      return new Response(JSON.stringify({ 
        error: 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate field type
    const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
    if (!validTypes.includes(body.type)) {
      return new Response(JSON.stringify({ 
        error: `Invalid field type. Must be one of: ${validTypes.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate model type
    const validModelTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT']
    if (!validModelTypes.includes(body.modelType)) {
      return new Response(JSON.stringify({ 
        error: `Invalid model type. Must be one of: ${validModelTypes.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
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
      return new Response(JSON.stringify({ 
        error: `A custom field with name "${body.name}" already exists for ${body.modelType}` 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
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

    return new Response(JSON.stringify(customField), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating custom field:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}