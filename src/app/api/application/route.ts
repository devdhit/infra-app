import { NextResponse } from 'next/server';
import { getApplicationName, setApplicationName } from '@/lib/i18n';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET - Retrieve application settings
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request as any);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view settings
    const hasViewPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'view'
    );
    
    if (!hasViewPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access application settings' },
        { status: 403 }
      );
    }

    const applicationName = getApplicationName();
    const shortName = applicationName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS';
    
    return NextResponse.json({
      applicationName,
      shortName
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve application name' },
      { status: 500 }
    );
  }
}

// POST - Update application settings
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request as any);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to edit settings
    const hasEditPermission = await hasPermission(
      user.role?.id || '',
      user.tenantId,
      'settings',
      'edit'
    );
    
    if (!hasEditPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update application settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { applicationName } = body;
    
    // Validate input
    if (!applicationName || typeof applicationName !== 'string') {
      return NextResponse.json(
        { error: 'Valid application name is required' },
        { status: 400 }
      );
    }
    
    // Update application name
    setApplicationName(applicationName);
    
    // Return updated settings
    const shortName = applicationName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS';
    
    return NextResponse.json({
      applicationName,
      shortName,
      message: 'Application settings updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update application settings' },
      { status: 500 }
    );
  }
}

// PUT - Update application settings (alias for POST)
export async function PUT(request: Request) {
  return POST(request);
}