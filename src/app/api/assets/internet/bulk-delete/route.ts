import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { internetHandler } from '@/lib/asset-api/internet-handler'
import { InternetAsset } from '@/types/asset-interfaces'

// Create API route handler for Internet assets
const internetRouteHandler = new ApiRouteHandler<InternetAsset>({
  handler: internetHandler,
  resourceName: 'Internet'
});

// POST /api/assets/internet/bulk-delete - Bulk delete Internet assets
export async function POST(request: NextRequest) {
  return internetRouteHandler.handleBulkDelete(request);
}