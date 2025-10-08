import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { warehouseHandler } from '@/lib/asset-api/warehouse-handler'
import { WarehouseITAsset } from '@/types/asset-interfaces'

// Create API route handler for WarehouseIT assets
const warehouseRouteHandler = new ApiRouteHandler<WarehouseITAsset>({
  handler: warehouseHandler,
  resourceName: 'Warehouse'
});

// POST /api/assets/warehouse/bulk-delete - Bulk delete WarehouseIT assets
export async function POST(request: NextRequest) {
  return warehouseRouteHandler.handleBulkDelete(request);
}