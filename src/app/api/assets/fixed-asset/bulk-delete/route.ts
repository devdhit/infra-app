import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { fixedAssetHandler } from '@/lib/asset-api/fixed-asset-handler'
import { FixedAsset } from '@/types/asset-interfaces'

// Create API route handler for FixedAsset assets
const fixedAssetRouteHandler = new ApiRouteHandler<FixedAsset>({
  handler: fixedAssetHandler,
  resourceName: 'FixedAsset'
})

// POST /api/assets/fixed-asset/bulk-delete - Bulk delete FixedAsset assets
export async function POST(request: NextRequest) {
  return fixedAssetRouteHandler.handleBulkDelete(request)
}