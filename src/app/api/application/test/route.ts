import { NextResponse } from 'next/server';
import { getApplicationName, setApplicationName } from '@/lib/i18n';

export async function GET() {
  try {
    // Test getting the application name
    const applicationName = getApplicationName();
    
    return NextResponse.json({
      applicationName,
      message: 'Application name retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve application name' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Application name is required' },
        { status: 400 }
      );
    }
    
    // Test setting the application name
    setApplicationName(name);
    
    return NextResponse.json({
      message: 'Application name updated successfully',
      applicationName: name
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update application name' },
      { status: 500 }
    );
  }
}