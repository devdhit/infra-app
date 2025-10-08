import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { printerHandler } from '@/lib/asset-api/printer-handler'
import { PrinterAsset } from '@/types/asset-interfaces'

// Create API route handler for Printer assets
const printerRouteHandler = new ApiRouteHandler<PrinterAsset>({
  handler: printerHandler,
  resourceName: 'Printer'
});

// POST /api/assets/printer/bulk-delete - Bulk delete Printer assets
export async function POST(request: NextRequest) {
  return printerRouteHandler.handleBulkDelete(request);
}