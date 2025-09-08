import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  unauthorizedResponse, 
  errorResponse,
  badRequestResponse,
  successResponse,
  notFoundResponse
} from '@/lib/api-utils'

// PUT /api/assets/custom-fields/[id] - Update custom field values for an asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // Await params before using
    const resolvedParams = await params;

    const body = await request.json()
    
    // Extract the asset type from the request headers or query params
    const assetType = request.headers.get('x-asset-type') || 
                     new URL(request.url).searchParams.get('assetType')
    
    if (!assetType) {
      return badRequestResponse('Asset type is required')
    }

    // Validate that the asset type is supported
    const supportedAssetTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT']
    if (!supportedAssetTypes.includes(assetType)) {
      return badRequestResponse(`Unsupported asset type: ${assetType}`)
    }

    // Get the model name based on asset type
    const modelName = assetType === 'PC' ? 'PC' : 
                     assetType === 'Laptop' ? 'Laptop' : 
                     assetType === 'Printer' ? 'Printer' : 
                     assetType === 'License' ? 'License' : 
                     'WarehouseIT'

    console.log(`Updating custom fields for ${assetType} asset ${resolvedParams.id} with data:`, body);

    // Check if asset exists and belongs to user's tenant
    const existingAsset = await (db as any)[modelName].findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      }
    })

    if (!existingAsset) {
      return notFoundResponse(`${assetType} asset not found`)
    }

    // Prepare the update data - only include valid fields for the model
    const updateData: any = {}
    
    // Handle customFields specifically
    if (body.customFields) {
      updateData.customFields = body.customFields
    }
    
    // Only include fields that are valid for this model type
    // This prevents Prisma errors when invalid fields are sent
    const validFields = {
      'PC': ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note', 'customFields'],
      'Laptop': ['dept', 'barcode', 'sapBarcode', 'dateBuy', 'userId', 'email', 'model', 'status', 'customFields'],
      'Printer': ['dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note', 'customFields'],
      'License': ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 'customFields'],
      'WarehouseIT': ['barcode', 'sapCode', 'status', 'note', 'customFields']
    }
    
    const modelValidFields = validFields[assetType as keyof typeof validFields] || []
    
    // Handle other fields - only include valid fields for this model
    Object.keys(body).forEach(key => {
      if (key !== 'id' && key !== 'customFields' && modelValidFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    console.log("Update data to be sent to database:", updateData);

    // Update the asset
    const updatedAsset = await (db as any)[modelName].update({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      data: updateData
    })

    return successResponse(updatedAsset)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Asset not found')
    }
    
    console.error('Error updating asset custom fields:', error)
    return errorResponse('Failed to update asset custom fields. Please try again later.')
  }
}

// GET /api/assets/custom-fields/[id] - Get custom field values for an asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return unauthorizedResponse()
    }
    
    // Await params before using
    const resolvedParams = await params;
    
    // Extract the asset type from the request headers or query params
    const assetType = request.headers.get('x-asset-type') || 
                     new URL(request.url).searchParams.get('assetType')
    
    if (!assetType) {
      return badRequestResponse('Asset type is required')
    }

    // Validate that the asset type is supported
    const supportedAssetTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT']
    if (!supportedAssetTypes.includes(assetType)) {
      return badRequestResponse(`Unsupported asset type: ${assetType}`)
    }

    // Get the model name based on asset type
    const modelName = assetType === 'PC' ? 'PC' : 
                     assetType === 'Laptop' ? 'Laptop' : 
                     assetType === 'Printer' ? 'Printer' : 
                     assetType === 'License' ? 'License' : 
                     'WarehouseIT'

    // Get the asset with custom fields
    const asset = await (db as any)[modelName].findUnique({
      where: { 
        id: resolvedParams.id,
        tenantId: user.tenantId 
      },
      select: {
        id: true,
        customFields: true
      }
    })

    if (!asset) {
      return notFoundResponse(`${assetType} asset not found`)
    }

    return successResponse(asset)
  } catch (error) {
    console.error('Error fetching asset custom fields:', error)
    return errorResponse('Failed to fetch asset custom fields. Please try again later.')
  }
}