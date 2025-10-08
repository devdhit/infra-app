import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { pcHandler } from '@/lib/asset-api/pc-handler'
import { PCAsset } from '@/types/asset-interfaces'

// Create API route handler for PC assets
const pcRouteHandler = new ApiRouteHandler<PCAsset>({
  handler: pcHandler,
  resourceName: 'PC'
});

// GET /api/assets/pc/[id] - Get a specific PC asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return pcRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/pc/[id] - Update a PC asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return pcRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/pc/[id] - Delete a PC asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return pcRouteHandler.handleDelete(request, resolvedParams.id);
}