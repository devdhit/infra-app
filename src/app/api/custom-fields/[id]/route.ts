import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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

    const resolvedParams = await params;
    const customField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!customField) {
      return new Response(JSON.stringify({ error: 'Custom field not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(customField), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching custom field:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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

    const body = await request.json()
    const resolvedParams = await params;
    
    // Check if custom field exists and belongs to user's tenant
    const existingCustomField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingCustomField) {
      return new Response(JSON.stringify({ error: 'Custom field not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate field name format if provided
    if (body.name) {
      const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!fieldNameRegex.test(body.name)) {
        return new Response(JSON.stringify({ 
          error: 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Validate field type if provided
    if (body.type) {
      const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea']
      if (!validTypes.includes(body.type)) {
        return new Response(JSON.stringify({ 
          error: `Invalid field type. Must be one of: ${validTypes.join(', ')}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
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
        return new Response(JSON.stringify({ 
          error: `A custom field with name "${body.name}" already exists for ${existingCustomField.modelType}` 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
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

    return new Response(JSON.stringify(customField), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Custom field not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error updating custom field:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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

    const resolvedParams = await params;
    // Check if custom field exists and belongs to user's tenant
    const existingCustomField = await db.customField.findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingCustomField) {
      return new Response(JSON.stringify({ error: 'Custom field not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await db.customField.delete({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    return new Response(null, {
      status: 204
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Custom field not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Error deleting custom field:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}