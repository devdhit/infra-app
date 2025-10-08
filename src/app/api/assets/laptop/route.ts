import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { laptopHandler } from '@/lib/asset-api/laptop-handler'
import { LaptopAsset } from '@/types/asset-interfaces'

// Create API route handler for Laptop assets
const laptopRouteHandler = new ApiRouteHandler<LaptopAsset>({
  handler: laptopHandler,
  resourceName: 'Laptop'
});

// GET /api/assets/laptop - Get all Laptop assets for the user's tenant
export async function GET(request: NextRequest) {
  return laptopRouteHandler.handleGet(request);
}

// POST /api/assets/laptop - Create a new Laptop asset
export async function POST(request: NextRequest) {
  return laptopRouteHandler.handlePost(request);
}

// DELETE /api/assets/laptop - Bulk delete Laptop assets
export async function DELETE(request: NextRequest) {
  return laptopRouteHandler.handleBulkDelete(request);
}