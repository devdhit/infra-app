import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the PC asset type
interface PCAsset {
  dept: string
  cpuBarcode: string
  cpuSapBarcode?: string
  monitorBarcode?: string
  monitorSapBarcode?: string
  upsBarcode?: string
  upsSapBarcode?: string
  pcName: string
  user?: string
  status: string
  note?: string
}

// Create handler for PC assets
const pcHandler = new AssetApiHandler<PCAsset>(db, {
  modelName: 'pC',
  requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
  uniqueField: 'cpuBarcode',
  searchFields: ['cpuBarcode', 'pcName', 'user'],
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    histories: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }
  }
})

// GET /api/assets/pc/[id] - Get a specific PC asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await pcHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in PC GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/pc/[id] - Update a PC asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<Partial<PCAsset>>(request)
    const resolvedParams = await params;
    return await pcHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in PC PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/pc/[id] - Delete a PC asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await pcHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in PC DELETE route:', error)
    return errorResponse('Internal server error')
  }
}