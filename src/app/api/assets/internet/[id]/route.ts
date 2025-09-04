import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse,
  badRequestResponse
} from '@/lib/api-utils'
import { internetHandler } from '@/lib/asset-api-handler'

// Define the Internet asset type based on the Prisma schema
interface InternetAsset {
  dept: string
  manager?: string
  userName?: string
  email?: string
  ipAddress?: string
  internetAccess?: string
  status: string
  note?: string
}

// GET /api/assets/internet/[id] - Get a specific Internet asset by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await internetHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Internet GET by ID route:', error)
    return errorResponse('Failed to fetch Internet asset. Please try again later.')
  }
}

// PUT /api/assets/internet/[id] - Update a specific Internet asset by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<Partial<InternetAsset>>(request)
    const resolvedParams = await params;
    return await internetHandler.update(user, resolvedParams.id, body)
  } catch (error: any) {
    console.error('Error in Internet PUT route:', error)
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to update Internet asset. Please try again later.')
  }
}

// DELETE /api/assets/internet/[id] - Delete a specific Internet asset by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await internetHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Internet DELETE route:', error)
    return errorResponse('Failed to delete Internet asset. Please try again later.')
  }
}