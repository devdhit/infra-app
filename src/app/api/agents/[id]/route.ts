import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'
import { checkAgentPermission } from '../../agent/permissions'

// DELETE /api/agents/[id] - Remove an agent by clearing its MAC address
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check permissions
    const permissionCheck = await checkAgentPermission(request, 'viewStatus')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const user = permissionCheck.user;
    const resolvedParams = await params;
    
    // Find the PC by ID
    const pc = await db.pC.findUnique({
      where: {
        id: resolvedParams.id,
        tenantId: user?.tenantId || ''
      }
    });

    if (!pc) {
      return errorResponse('Agent not found', 404);
    }

    // Get current custom fields
    const customFields = pc.customFields as Record<string, any> || {};
    
    // Remove the MAC address to "delete" the agent association
    delete customFields.MAC;
    
    // Also remove IP if it exists
    delete customFields.IP;
    
    // Update the PC to remove agent information
    await db.pC.update({
      where: { 
        id: resolvedParams.id,
        tenantId: user?.tenantId || ''
      },
      data: {
        customFields
      }
    });

    logger.info('Agent deleted successfully', { pcId: resolvedParams.id });
    
    return successResponse({ 
      message: 'Agent deleted successfully',
      pcId: resolvedParams.id
    }, 200);
  } catch (error: any) {
    logger.error('Error deleting agent:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    });
    
    return errorResponse('Failed to delete agent. Please try again later.');
  }
}