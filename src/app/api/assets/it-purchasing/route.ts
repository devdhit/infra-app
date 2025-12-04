import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { itPurchasingHandler } from '@/lib/asset-api/it-purchasing-handler'
import { ITPurchasingAsset } from '@/types/asset-interfaces'

// Create API route handler for IT Purchasing assets
const itPurchasingRouteHandler = new ApiRouteHandler<ITPurchasingAsset>({
  handler: itPurchasingHandler,
  resourceName: 'ITPurchasing'
});

// GET /api/assets/it-purchasing - Get all IT Purchasing assets for the user's tenant
export async function GET(request: NextRequest) {
  return itPurchasingRouteHandler.handleGet(request);
}

// POST /api/assets/it-purchasing - Create a new IT Purchasing asset
export async function POST(request: NextRequest) {
  return itPurchasingRouteHandler.handlePost(request);
}

// DELETE /api/assets/it-purchasing - Bulk delete IT Purchasing assets
export async function DELETE(request: NextRequest) {
  return itPurchasingRouteHandler.handleBulkDelete(request);
}
