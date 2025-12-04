import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { fixedAssetHandler } from '@/lib/asset-api/fixed-asset-handler'
import { FixedAsset } from '@/types/asset-interfaces'

// Create API route handler for Fixed assets
const fixedAssetRouteHandler = new ApiRouteHandler<FixedAsset>({
  handler: fixedAssetHandler,
  resourceName: 'FixedAsset'
});

// GET /api/assets/fixed-asset/[id] - Get a specific Fixed asset by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return fixedAssetRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/fixed-asset/[id] - Update a specific Fixed asset by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return fixedAssetRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/fixed-asset/[id] - Delete a specific Fixed asset by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return fixedAssetRouteHandler.handleDelete(request, resolvedParams.id);
}