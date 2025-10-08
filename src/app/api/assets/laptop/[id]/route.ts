import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { laptopHandler } from '@/lib/asset-api/laptop-handler'
import { LaptopAsset } from '@/types/asset-interfaces'

// Create API route handler for Laptop assets
const laptopRouteHandler = new ApiRouteHandler<LaptopAsset>({
  handler: laptopHandler,
  resourceName: 'Laptop'
});

// GET /api/assets/laptop/[id] - Get a specific Laptop asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return laptopRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/laptop/[id] - Update a Laptop asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return laptopRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/laptop/[id] - Delete a Laptop asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return laptopRouteHandler.handleDelete(request, resolvedParams.id);
}