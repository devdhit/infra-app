import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { internetHandler } from '@/lib/asset-api/internet-handler'
import { InternetAsset } from '@/types/asset-interfaces'

// Create API route handler for Internet assets
const internetRouteHandler = new ApiRouteHandler<InternetAsset>({
  handler: internetHandler,
  resourceName: 'Internet'
});

// GET /api/assets/internet/[id] - Get a specific Internet asset by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return internetRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/internet/[id] - Update a specific Internet asset by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return internetRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/internet/[id] - Delete a specific Internet asset by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return internetRouteHandler.handleDelete(request, resolvedParams.id);
}