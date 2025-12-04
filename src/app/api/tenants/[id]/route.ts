import { NextRequest } from 'next/server'
import { tenantService } from '@/lib/management'
import {
  checkPermission,
  parseRequestBody,
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
  apiConflict,
} from '@/lib/management/api-helpers'
import type { UpdateTenantData } from '@/types/management'
import { createHistoryRecord } from '@/lib/history'
import logger from '@/lib/logger';

// GET /api/tenants/[id] - Get a specific tenant
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await checkPermission(request, 'tenants', 'view');
  if (error) return error;

  const resolvedParams = await params;

  try {
    const result = await tenantService.getTenantById(resolvedParams.id);

    if (!result.success) {
      return apiNotFound(result.error.message);
    }

    return apiSuccess(result.data);
  } catch (error: unknown) {
    logger.error('Error fetching tenant:', error);
    return apiError('Failed to fetch tenant', 'INTERNAL_ERROR', 500);
  }
}

// PUT /api/tenants/[id] - Update a tenant (requires edit permission)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = await checkPermission(request, 'tenants', 'edit');
  if (permError) return permError;

  const resolvedParams = await params;
  const { data: body, error: parseError } = await parseRequestBody<UpdateTenantData>(request);
  if (parseError || !body) return parseError || apiBadRequest('Invalid request body');

  try {
    const result = await tenantService.updateTenant(resolvedParams.id, body);

    if (!result.success) {
      if (result.error.message.includes('not found')) {
        return apiNotFound(result.error.message);
      }
      if (result.error.message.includes('already exists')) {
        return apiConflict(result.error.message);
      }
      if (result.error.message.includes('Validation')) {
        return apiBadRequest(result.error.message);
      }
      return apiError(result.error.message, 'INTERNAL_ERROR', 500);
    }

    return apiSuccess(result.data);
  } catch (error: unknown) {
    logger.error('Error updating tenant:', error);
    return apiError('Failed to update tenant', 'INTERNAL_ERROR', 500);
  }
}

// DELETE /api/tenants/[id] - Delete a tenant (requires delete permission)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: permError } = await checkPermission(request, 'tenants', 'delete');
  if (permError) return permError;

  const resolvedParams = await params;
  
  logger.info('Received delete request for tenant ID:', resolvedParams.id);

  try {
    // Create history record before deletion
    const tenantResult = await tenantService.getTenantById(resolvedParams.id);
    if (tenantResult.success && user) {
      await createHistoryRecord({
        action: 'delete',
        modelType: 'Tenant',
        recordId: tenantResult.data.id,
        changes: tenantResult.data,
        userId: user.id,
        tenantId: user.tenantId
      });
    }

    // Delete tenant
    const result = await tenantService.deleteTenant(resolvedParams.id);

    if (!result.success) {
      if (result.error.message.includes('not found')) {
        return apiNotFound(result.error.message);
      }
      if (result.error.message.includes('associated data')) {
        return apiBadRequest(result.error.message);
      }
      return apiError(result.error.message, 'INTERNAL_ERROR', 500);
    }

    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    logger.error('Error deleting tenant:', error);
    return apiError('Failed to delete tenant', 'INTERNAL_ERROR', 500);
  }
}