import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { internetHandler } from '@/lib/asset-api/internet-handler'
import { InternetAsset } from '@/types/asset-interfaces'

// Create API route handler for Internet assets
const internetRouteHandler = new ApiRouteHandler<InternetAsset>({
  handler: internetHandler,
  resourceName: 'Internet'
});

// GET /api/assets/internet - Get all Internet assets for the user's tenant
export async function GET(request: NextRequest) {
  return internetRouteHandler.handleGet(request);
}

// POST /api/assets/internet - Create a new Internet asset
export async function POST(request: NextRequest) {
  return internetRouteHandler.handlePost(request);
}

// DELETE /api/assets/internet - Bulk delete Internet assets
export async function DELETE(request: NextRequest) {
  return internetRouteHandler.handleBulkDelete(request);
}