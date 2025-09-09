import { NextRequest } from 'next/server';
import { getApplicationName, setApplicationName } from '@/lib/i18n';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

// GET - Retrieve application settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Check if user has permission to view settings
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'view'
    );
    
    if (!hasViewPermission) {
      return errorResponse('Forbidden: You do not have permission to access application settings', 403);
    }

    const applicationName = getApplicationName();
    const shortName = applicationName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS';
    
    return successResponse({
      applicationName,
      shortName
    });
  } catch (error) {
    return errorResponse('Failed to retrieve application name');
  }
}

// POST - Update application settings
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Check if user has permission to edit settings
    const hasEditPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'edit'
    );
    
    if (!hasEditPermission) {
      return errorResponse('Forbidden: You do not have permission to update application settings', 403);
    }

    const body = await request.json();
    const { applicationName } = body;
    
    // Validate input
    if (!applicationName || typeof applicationName !== 'string') {
      return errorResponse('Valid application name is required', 400);
    }
    
    // Update application name
    setApplicationName(applicationName);
    
    // Return updated settings
    const shortName = applicationName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS';
    
    return successResponse({
      applicationName,
      shortName,
      message: 'Application settings updated successfully'
    });
  } catch (error) {
    return errorResponse('Failed to update application settings');
  }
}

// PUT - Update application settings (alias for POST)
export async function PUT(request: NextRequest) {
  return await POST(request);
}