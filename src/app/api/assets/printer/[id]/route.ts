import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  parseRequestBody,
  errorResponse
} from '@/lib/api-utils'
import { AssetApiHandler } from '@/lib/asset-api-handler'

// Define the Printer asset type
interface PrinterAsset {
  dept: string
  location?: string
  ip?: string
  model?: string
  color: boolean
  barcode: string
  sapCode?: string
  date?: string
  note?: string
}

// Create handler for Printer assets
const printerHandler = new AssetApiHandler<PrinterAsset>(db, {
  modelName: 'printer',
  include: {
    histories: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }
  }
})

// GET /api/assets/printer/[id] - Get a specific Printer asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await printerHandler.getById(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Printer GET by ID route:', error)
    return errorResponse('Internal server error')
  }
}

// PUT /api/assets/printer/[id] - Update a Printer asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await parseRequestBody<Partial<PrinterAsset>>(request)
    const resolvedParams = await params;
    return await printerHandler.update(user, resolvedParams.id, body)
  } catch (error) {
    console.error('Error in Printer PUT route:', error)
    return errorResponse('Internal server error')
  }
}

// DELETE /api/assets/printer/[id] - Delete a Printer asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const resolvedParams = await params;
    return await printerHandler.delete(user, resolvedParams.id)
  } catch (error) {
    console.error('Error in Printer DELETE route:', error)
    return errorResponse('Internal server error')
  }
}