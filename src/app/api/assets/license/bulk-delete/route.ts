import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { licenseHandler } from '@/lib/asset-api/license-handler'
import { LicenseAsset } from '@/types/asset-interfaces'

// Create API route handler for License assets
const licenseRouteHandler = new ApiRouteHandler<LicenseAsset>({
  handler: licenseHandler,
  resourceName: 'License'
});

// POST /api/assets/license/bulk-delete - Bulk delete License assets
export async function POST(request: NextRequest) {
  return licenseRouteHandler.handleBulkDelete(request);
}