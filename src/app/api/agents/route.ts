import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse, badRequestResponse } from '@/lib/api-utils'
import logger from '@/lib/logger'
import { validateSearchInput } from '@/lib/security'
import { checkAgentPermission } from '../agent/permissions'

// GET /api/agents - Get all agents with pagination and search support
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkAgentPermission(request, 'viewStatus')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const user = permissionCheck.user;

    // Get pagination and search parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 per page
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      tenantId: user?.tenantId || ''
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        {
          pcName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          customFields: {
            path: ['IP'],
            string_contains: search
          }
        },
        {
          customFields: {
            path: ['MAC'],
            string_contains: search
          }
        }
      ];
    }

    // Fetch PCs that have agent information with pagination and search
    // First, get all PCs matching the criteria to count properly
    const allPcs = await db.pC.findMany({
      where,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Filter for PCs with MAC addresses (agents)
    const agentPcs = allPcs.filter(pc => {
      const customFields = pc.customFields as Record<string, any> || {};
      return customFields.MAC && customFields.MAC !== '';
    });

    // Now apply pagination to the filtered results
    const total = agentPcs.length;
    const paginatedPcs = agentPcs.slice(skip, skip + limit);

    // Transform PCs into agent objects
    const agents = paginatedPcs.map(pc => {
      const customFields = pc.customFields as Record<string, any> || {};
      
      // Determine agent status based on last update time
      const lastUpdate = pc.updatedAt;
      const lastSeen = pc.updatedAt;
      
      // If updated in the last 5 minutes, consider online
      const isOnline = Date.now() - lastUpdate.getTime() < 5 * 60 * 1000;
      const status = isOnline ? 'online' : 'offline';
      
      return {
        id: pc.id,
        name: `Agent-${pc.pcName}`,
        ipAddress: customFields.IP || '',
        lastSeen: lastSeen.toISOString(),
        status: status as 'online' | 'offline' | 'updating' | 'error',
        lastUpdate: lastUpdate.toISOString(),
        pcName: pc.pcName
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    const result = {
      data: agents,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      }
    };

    return successResponse(result)
  } catch (error: any) {
    logger.error('Error fetching agents:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    })
    
    return errorResponse('Failed to fetch agents. Please try again later.')
  }
}

// POST /api/agents - Add a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.ipAddress) {
      return badRequestResponse('IP address is required')
    }

    // Sanitize input data
    const sanitizedData = {
      ipAddress: validateSearchInput(body.ipAddress),
      name: body.name ? validateSearchInput(body.name) : `Agent-${Date.now()}`,
      pcName: body.pcName ? validateSearchInput(body.pcName) : `PC-${Date.now()}`
    }

    // In a real implementation, this would create a new agent record in the database
    // For now, we'll return mock data
    const newAgent = {
      id: `${Date.now()}`,
      name: sanitizedData.name,
      ipAddress: sanitizedData.ipAddress,
      lastSeen: new Date().toISOString(),
      status: 'offline',
      lastUpdate: new Date().toISOString(),
      pcName: sanitizedData.pcName
    }

    logger.info('Agent added successfully', { agentId: newAgent.id, ipAddress: newAgent.ipAddress })
    
    return successResponse(newAgent, 201)
  } catch (error: any) {
    logger.error('Error adding agent:', { 
      error: error.message || error.toString(), 
      stack: error.stack || new Error().stack 
    })
    
    // Handle JSON parsing errors
    if (error.message && error.message.includes('Invalid JSON')) {
      return badRequestResponse('Invalid request body. Please ensure the request is valid JSON.')
    }
    
    return errorResponse('Failed to add agent. Please try again later.')
  }
}

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