import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { printerHandler } from '@/lib/asset-api/printer-handler'
import { PrinterAsset } from '@/types/asset-interfaces'

// Create API route handler for Printer assets
const printerRouteHandler = new ApiRouteHandler<PrinterAsset>({
  handler: printerHandler,
  resourceName: 'Printer'
});

// GET /api/assets/printer - Get all Printer assets for the user's tenant
export async function GET(request: NextRequest) {
  return printerRouteHandler.handleGet(request);
}

// POST /api/assets/printer - Create a new Printer asset
export async function POST(request: NextRequest) {
  return printerRouteHandler.handlePost(request);
}

// DELETE /api/assets/printer - Bulk delete Printer assets
export async function DELETE(request: NextRequest) {
  return printerRouteHandler.handleBulkDelete(request);
}