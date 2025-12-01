import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { itPurchasingHandler } from '@/lib/asset-api/it-purchasing-handler'
import { ITPurchasingAsset } from '@/types/asset-interfaces'

// Create API route handler for IT Purchasing assets
const itPurchasingRouteHandler = new ApiRouteHandler<ITPurchasingAsset>({
  handler: itPurchasingHandler,
  resourceName: 'ITPurchasing'
})

// POST /api/assets/it-purchasing/bulk-delete - Bulk delete IT Purchasing assets
export async function POST(request: NextRequest) {
  return itPurchasingRouteHandler.handleBulkDelete(request)
}
