import { NextResponse } from 'next/server';
import { getApplicationName, setApplicationName } from '@/lib/i18n';
import { getCurrentUser } from '@/lib/auth';

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

    // Only allow admin users to access application settings
    const userRoleName = user.role?.name || 'user';
    if (userRoleName !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can access application settings' },
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

    // Only allow admin users to update application settings
    const userRoleName = user.role?.name || 'user';
    if (userRoleName !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can update application settings' },
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