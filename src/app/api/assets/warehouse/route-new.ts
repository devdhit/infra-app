import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { warehouseHandler } from '@/lib/asset-api/warehouse-handler'
import { WarehouseITAsset } from '@/types/asset-interfaces'

// Create API route handler for WarehouseIT assets
const warehouseRouteHandler = new ApiRouteHandler<WarehouseITAsset>({
  handler: warehouseHandler,
  resourceName: 'Warehouse'
});

// GET /api/assets/warehouse - Get all WarehouseIT assets for the user's tenant
export async function GET(request: NextRequest) {
  return warehouseRouteHandler.handleGet(request);
}

// POST /api/assets/warehouse - Create a new WarehouseIT asset
export async function POST(request: NextRequest) {
  return warehouseRouteHandler.handlePost(request);
}

// DELETE /api/assets/warehouse - Bulk delete WarehouseIT assets
export async function DELETE(request: NextRequest) {
  return warehouseRouteHandler.handleBulkDelete(request);
}