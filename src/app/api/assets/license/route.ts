import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { licenseHandler } from '@/lib/asset-api/license-handler'
import { LicenseAsset } from '@/types/asset-interfaces'

// Create API route handler for License assets
const licenseRouteHandler = new ApiRouteHandler<LicenseAsset>({
  handler: licenseHandler,
  resourceName: 'License'
});

// GET /api/assets/license - Get all License assets for the user's tenant
export async function GET(request: NextRequest) {
  return licenseRouteHandler.handleGet(request);
}

// POST /api/assets/license - Create a new License asset
export async function POST(request: NextRequest) {
  return licenseRouteHandler.handlePost(request);
}

// DELETE /api/assets/license - Bulk delete License assets
export async function DELETE(request: NextRequest) {
  return licenseRouteHandler.handleBulkDelete(request);
}