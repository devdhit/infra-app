import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'

// PUT /api/agents/[id]/trigger-update - Trigger an immediate update from an agent
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using
    const resolvedParams = await params;
    
    // In a real implementation, this would send a command to the specified agent
    // to trigger an immediate update
    
    // For now, we'll just log the request and return success
    logger.info('Update triggered for agent', { agentId: resolvedParams.id })
    
    return successResponse({ 
      message: 'Update triggered successfully',
      agentId: resolvedParams.id
    })
  } catch (error: any) {
    logger.error('Error triggering agent update:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    })
    
    return errorResponse('Failed to trigger agent update. Please try again later.')
  }
}