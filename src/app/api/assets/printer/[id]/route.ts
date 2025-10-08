import { NextRequest } from 'next/server'
import { ApiRouteHandler } from '@/lib/api-route-handler'
import { printerHandler } from '@/lib/asset-api/printer-handler'
import { PrinterAsset } from '@/types/asset-interfaces'

// Create API route handler for Printer assets
const printerRouteHandler = new ApiRouteHandler<PrinterAsset>({
  handler: printerHandler,
  resourceName: 'Printer'
});

// GET /api/assets/printer/[id] - Get a specific Printer asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return printerRouteHandler.handleGetById(request, resolvedParams.id);
}

// PUT /api/assets/printer/[id] - Update a Printer asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return printerRouteHandler.handlePut(request, resolvedParams.id);
}

// DELETE /api/assets/printer/[id] - Delete a Printer asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return printerRouteHandler.handleDelete(request, resolvedParams.id);
}