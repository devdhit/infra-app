import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { internetHandler } from '@/lib/asset-api/internet-handler'
import { InternetAsset } from '@/types/asset-interfaces'
import { getCurrentUser } from '@/lib/auth'
import { unauthorizedResponse, getQueryParams } from '@/lib/api-utils'

// Create API route handler for Internet assets
const internetRouteHandler = new ApiRouteHandler<InternetAsset>({
  handler: internetHandler,
  resourceName: 'Internet'
});

// GET /api/assets/internet - Get all Internet assets for the user's tenant
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
      
      return await internetHandler.getAll(user, customQueryParams);
    } catch (error: any) {
      return internetRouteHandler['handleError'](error, 'fetch', 'Internet');
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
      
      return await internetHandler.getAll(user, customQueryParams);
    } catch (error: any) {
      return internetRouteHandler['handleError'](error, 'fetch', 'Internet');
    }
  }
  
  // Default behavior
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