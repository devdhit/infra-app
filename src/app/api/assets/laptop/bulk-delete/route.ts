import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { laptopHandler } from '@/lib/asset-api/laptop-handler'
import { LaptopAsset } from '@/types/asset-interfaces'

// Create API route handler for Laptop assets
const laptopRouteHandler = new ApiRouteHandler<LaptopAsset>({
  handler: laptopHandler,
  resourceName: 'Laptop'
});

// POST /api/assets/laptop/bulk-delete - Bulk delete Laptop assets
export async function POST(request: NextRequest) {
  return laptopRouteHandler.handleBulkDelete(request);
}