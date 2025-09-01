import { NextResponse } from 'next/server';
import { getApplicationName } from '@/lib/i18n';

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