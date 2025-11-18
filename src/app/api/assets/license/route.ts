import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { licenseHandler } from '@/lib/asset-api/license-handler'
import { LicenseAsset } from '@/types/asset-interfaces'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, getQueryParams } from '@/lib/api-utils'

// Create API route handler for License assets
const licenseRouteHandler = new ApiRouteHandler<LicenseAsset>({
  handler: licenseHandler,
  resourceName: 'License'
});

// GET /api/assets/license - Get all License assets for the user's tenant
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  // Check if we're filtering by IP address
  const ip = url.searchParams.get('ip');
  if (ip) {
    // Handle filtering by IP address
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }
      
      // Use the handler's getAll method with custom filtering
      const queryParams = getQueryParams(request);
      // Add IP to search query
      const customQueryParams = {
        ...queryParams,
        search: ip
      };
      
      return await licenseHandler.getAll(user, customQueryParams);
    } catch (error: any) {
      return licenseRouteHandler['handleError'](error, 'fetch', 'License');
    }
  }
  
  // Check if we're filtering by userName
  const userName = url.searchParams.get('userName');
  if (userName) {
    // Handle filtering by userName
    try {
      const user = await getCurrentUser(request);
      if (!user) {
        return unauthorizedResponse();
      }
      
      // Use the handler's getAll method with custom filtering
      const queryParams = getQueryParams(request);
      // Add userName to search query
      const customQueryParams = {
        ...queryParams,
        search: userName
      };
      
      return await licenseHandler.getAll(user, customQueryParams);
    } catch (error: any) {
      return licenseRouteHandler['handleError'](error, 'fetch', 'License');
    }
  }
  
  // Default behavior
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