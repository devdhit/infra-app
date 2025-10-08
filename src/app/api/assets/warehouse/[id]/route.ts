import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { warehouseHandler } from '@/lib/asset-api/warehouse-handler'
import { WarehouseITAsset } from '@/types/asset-interfaces'

// Create API route handler for WarehouseIT assets
const warehouseRouteHandler = new ApiRouteHandler<WarehouseITAsset>({
  handler: warehouseHandler,
  resourceName: 'Warehouse'
});

// GET /api/assets/warehouse/[id] - Get a specific WarehouseIT asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return warehouseRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/warehouse/[id] - Update a WarehouseIT asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return warehouseRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/warehouse/[id] - Delete a WarehouseIT asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return warehouseRouteHandler.handleDelete(request, resolvedParams.id);
}