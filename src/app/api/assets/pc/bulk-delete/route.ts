import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { pcHandler } from '@/lib/asset-api/pc-handler'
import { PCAsset } from '@/types/asset-interfaces'

// Create API route handler for PC assets
const pcRouteHandler = new ApiRouteHandler<PCAsset>({
  handler: pcHandler,
  resourceName: 'PC'
});

// POST /api/assets/pc/bulk-delete - Bulk delete PC assets
export async function POST(request: NextRequest) {
  return pcRouteHandler.handleBulkDelete(request);
}