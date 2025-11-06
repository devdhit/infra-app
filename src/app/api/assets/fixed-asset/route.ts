import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { fixedAssetHandler } from '@/lib/asset-api/fixed-asset-handler'
import { FixedAsset } from '@/types/asset-interfaces'

// Create API route handler for Fixed assets
const fixedAssetRouteHandler = new ApiRouteHandler<FixedAsset>({
  handler: fixedAssetHandler,
  resourceName: 'FixedAsset'
})

// GET /api/assets/fixed-asset - Get all Fixed assets for the user's tenant
export async function GET(request: NextRequest) {
  return fixedAssetRouteHandler.handleGet(request)
}

// POST /api/assets/fixed-asset - Create a new Fixed asset
export async function POST(request: NextRequest) {
  return fixedAssetRouteHandler.handlePost(request)
}

// DELETE /api/assets/fixed-asset - Bulk delete Fixed assets
export async function DELETE(request: NextRequest) {
  return fixedAssetRouteHandler.handleBulkDelete(request)
}