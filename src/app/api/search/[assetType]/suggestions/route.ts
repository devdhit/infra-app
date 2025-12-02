import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, badRequestResponse, unauthorizedResponse } from '@/lib/api-utils';
import { getCurrentUser } from '@/lib/auth';
import { getSearchSuggestions } from '@/lib/search/search-service';
import logger from '@/lib/logger';

/**
 * Search Suggestions API
 * 
 * GET /api/search/[assetType]/suggestions - Get search suggestions
 */

const suggestionsQuerySchema = z.object({
  prefix: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetType: string }> }
) {
  const context = { component: 'search-api', action: 'suggestions' };

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

    // Parse query parameters
    const url = new URL(request.url);
    const rawParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const validationResult = suggestionsQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return badRequestResponse('Invalid query parameters', validationResult.error.format());
    }

    const { prefix } = validationResult.data;

    // Get suggestions
    const suggestions = await getSearchSuggestions(
      user.tenantId,
      user.id,
      assetType,
      prefix
    );

    logger.info('Suggestions retrieved', {
      ...context,
      assetType,
      prefix,
      count: suggestions.length,
    });

    return successResponse({
      suggestions,
      assetType,
    });
  } catch (error: any) {
    logger.error('Suggestions error', {
      ...context,
      error: error.message,
      stack: error.stack,
    });
    return errorResponse('Failed to get suggestions', error.message);
  }
}
