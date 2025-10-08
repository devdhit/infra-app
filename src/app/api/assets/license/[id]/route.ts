import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { licenseHandler } from '@/lib/asset-api/license-handler'
import { LicenseAsset } from '@/types/asset-interfaces'

// Create API route handler for License assets
const licenseRouteHandler = new ApiRouteHandler<LicenseAsset>({
  handler: licenseHandler,
  resourceName: 'License'
});

// GET /api/assets/license/[id] - Get a specific License asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return licenseRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/license/[id] - Update a License asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return licenseRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/license/[id] - Delete a License asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return licenseRouteHandler.handleDelete(request, resolvedParams.id);
}