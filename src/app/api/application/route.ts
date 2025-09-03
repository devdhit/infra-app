import { NextResponse } from 'next/server';
import { getApplicationName } from '@/lib/i18n';

// GET - Retrieve application settings
export async function GET() {
  try {
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
    const body = await request.json();
    const { applicationName } = body;
    
    // Validate input
    if (!applicationName || typeof applicationName !== 'string') {
      return NextResponse.json(
        { error: 'Valid application name is required' },
        { status: 400 }
      );
    }
    
    // Update application name (this will store it in localStorage on the client side)
    // For server-side, we'll return the name and let the client handle localStorage
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