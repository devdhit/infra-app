import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { itPurchasingHandler } from '@/lib/asset-api/it-purchasing-handler'
import { ITPurchasingAsset } from '@/types/asset-interfaces'

// Create API route handler for IT Purchasing assets
const itPurchasingRouteHandler = new ApiRouteHandler<ITPurchasingAsset>({
  handler: itPurchasingHandler,
  resourceName: 'ITPurchasing'
});

// GET /api/assets/it-purchasing/[id] - Get a specific IT Purchasing asset by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return itPurchasingRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/it-purchasing/[id] - Update a specific IT Purchasing asset by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return itPurchasingRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/it-purchasing/[id] - Delete a specific IT Purchasing asset by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return itPurchasingRouteHandler.handleDelete(request, resolvedParams.id);
}
