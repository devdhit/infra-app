import { NextRequest } from 'next/server';
import { successResponse, errorResponse, badRequestResponse, unauthorizedResponse } from '@/lib/api-utils';
import { getCurrentUser } from '@/lib/auth';
import { getFilterOptions } from '@/lib/search/search-service';
import logger from '@/lib/logger';

/**
 * Filter Options API
 * 
 * GET /api/search/[assetType]/filters - Get available filter options
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetType: string }> }
) {
  const context = { component: 'search-api', action: 'filters' };

  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { assetType } = await params;

    // Validate asset type
    const validAssetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet', 'fixed-asset', 'it-purchasing'];
    if (!validAssetTypes.includes(assetType)) {
      return badRequestResponse('Invalid asset type');
    }

    // Get filter options
    const filterOptions = await getFilterOptions(assetType, user.tenantId);

    logger.info('Filter options retrieved', {
      ...context,
      assetType,
    });

    return successResponse({
      filters: filterOptions,
      assetType,
    });
  } catch (error: any) {
    logger.error('Filter options error', {
      ...context,
      error: error.message,
      stack: error.stack,
    });
    return errorResponse('Failed to get filter options', error.message);
  }
}
