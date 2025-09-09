import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    if (user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Get all admin roles
    const adminRoles = await db.role.findMany({
      where: {
        name: 'admin'
      }
    });
    
    // Get the user's role with permissions
    const userRole = await db.role.findUnique({
      where: {
        id: user.role?.id || ''
      }
    });
    
    return NextResponse.json({
      userRole,
      allAdminRoles: adminRoles,
      userTenantId: user.tenantId
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}