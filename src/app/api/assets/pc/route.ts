import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { pcHandler } from '@/lib/asset-api/pc-handler'
import { PCAsset } from '@/types/asset-interfaces'

// Create API route handler for PC assets
const pcRouteHandler = new ApiRouteHandler<PCAsset>({
  handler: pcHandler,
  resourceName: 'PC'
});

// GET /api/assets/pc - Get all PC assets for the user's tenant
export async function GET(request: NextRequest) {
  return pcRouteHandler.handleGet(request);
}

// POST /api/assets/pc - Create a new PC asset
export async function POST(request: NextRequest) {
  return pcRouteHandler.handlePost(request);
}