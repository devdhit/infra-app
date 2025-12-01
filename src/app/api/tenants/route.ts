import { NextRequest } from 'next/server'
import { tenantService } from '@/lib/management'
import {
  checkPermission,
  parseRequestBody,
  apiSuccess,
  apiError,
  apiBadRequest,
  apiConflict,
} from '@/lib/management/api-helpers'
import type { CreateTenantData } from '@/types/management'
import logger from '@/lib/logger';

// GET /api/tenants - Get all tenants (requires view permission)
export async function GET(request: NextRequest) {
  const {  error } = await checkPermission(request, 'tenants', 'view');
  if (error) return error;

  try {
    const result = await tenantService.getAllTenants();

    if (!result.success) {
      return apiError(result.error.message, 'INTERNAL_ERROR', 500);
    }

    // Return paginated response
    return apiSuccess({
      data: result.data,
      pagination: {
        page: 1,
        limit: result.data.length,
        total: result.data.length,
        totalPages: 1,
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching tenants:', error);
    return apiError('Failed to fetch tenants', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/tenants - Create a new tenant (requires create permission)
export async function POST(request: NextRequest) {
  const { error: permError } = await checkPermission(request, 'tenants', 'create');
  if (permError) return permError;

  const { data: body, error: parseError } = await parseRequestBody<CreateTenantData>(request);
  if (parseError || !body) return parseError || apiBadRequest('Invalid request body');

  try {
    const result = await tenantService.createTenant(body);

    if (!result.success) {
      // Check for specific error types
      if (result.error.message.includes('already exists')) {
        return apiConflict(result.error.message);
      }
      if (result.error.message.includes('Validation')) {
        return apiBadRequest(result.error.message);
      }
      return apiError(result.error.message, 'INTERNAL_ERROR', 500);
    }

    return apiSuccess(result.data, 201);
  } catch (error: unknown) {
    logger.error('Error creating tenant:', error);
    return apiError('Failed to create tenant', 'INTERNAL_ERROR', 500);
  }
}