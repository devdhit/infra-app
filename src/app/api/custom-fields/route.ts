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

    const customField = await db.customField.create({
      data: {
        name: body.name,
        type: body.type,
        modelType: body.modelType,
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