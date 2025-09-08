// Test script to simulate the permission check API call
const { PrismaClient } = require('./../src/generated/prisma');

async function testApiPermissionCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing API permission check simulation...\n');
    
    // Find the admin user
    const user = await prisma.user.findUnique({
      where: {
        email: 'adminit@localhost.com'
      },
      include: {
        role: true,
        tenant: true
      }
    });
    
    if (!user) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('User data:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Tenant ID: ${user.tenantId}`);
    console.log(`- Role ID: ${user.roleId}`);
    console.log(`- Role: ${user.role ? user.role.name : 'No role'}`);
    
    // Simulate the API check
    const roleId = user.role?.id || '';
    const tenantId = user.tenantId || '';
    
    console.log(`\nSimulating API check with:`);
    console.log(`- Role ID: '${roleId}'`);
    console.log(`- Tenant ID: '${tenantId}'`);
    
    if (!roleId || !tenantId) {
      console.log('ERROR: Missing role ID or tenant ID!');
      return;
    }
    
    // Get the role with its permissions (simulating the hasPermission function)
    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
        tenantId: tenantId
      }
    });
    
    if (!role) {
      console.log('ERROR: Role not found!');
      return;
    }
    
    console.log(`\nRole found:`);
    console.log(`- Role ID: ${role.id}`);
    console.log(`- Role Name: ${role.name}`);
    
    // Parse permissions from JSON
    const permissions = role.permissions;
    console.log(`- Permissions: ${JSON.stringify(permissions, null, 2)}`);
    
    // Check if the role has the required permission (users.view)
    const resource = 'users';
    const action = 'view';
    
    console.log(`\nChecking permission: ${resource}.${action}`);
    
    if (permissions[resource] && permissions[resource].includes(action)) {
      console.log('RESULT: Permission GRANTED');
    } else {
      console.log('RESULT: Permission DENIED');
    }
    
  } catch (error) {
    console.error('Error testing API permission check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiPermissionCheck();