// Script to fix the 'employe' role by correcting the name and assigning proper permissions
const { PrismaClient } = require('../src/generated/prisma');

// Define default permissions directly since we can't import from TypeScript files
const defaultPermissions = {
  admin: {
    users: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    tenants: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    assets: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    settings: ['view', 'edit'],
    roles: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    pc: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    laptop: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    printer: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    license: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    warehouse: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    internet: ['view', 'create', 'edit', 'delete', 'bulkDelete'],
    auditLogs: ['view']
  },
  user: {
    users: ['view'], // Regular users can only view their own profile
    tenants: ['view'],
    assets: ['view', 'create', 'edit', 'delete'],
    settings: ['view'],
    roles: ['view'], // Regular users can view roles
    pc: ['view', 'create', 'edit', 'delete'],
    laptop: ['view', 'create', 'edit', 'delete'],
    printer: ['view', 'create', 'edit', 'delete'],
    license: ['view', 'create', 'edit', 'delete'],
    warehouse: ['view', 'create', 'edit', 'delete'],
    internet: ['view', 'create', 'edit', 'delete'],
    auditLogs: [] // Regular users cannot view audit logs by default
  }
};

// Get default permissions for a role
function getDefaultPermissions(roleName) {
  return defaultPermissions[roleName] || {
    users: [],
    tenants: [],
    assets: [],
    settings: [],
    roles: [],
    pc: [],
    laptop: [],
    printer: [],
    license: [],
    warehouse: [],
    internet: [],
    auditLogs: []
  };
}

const prisma = new PrismaClient();

async function fixEmployeRole() {
  try {
    console.log('Fixing employe role...');
    
    // Find the 'employe' role
    const employeRole = await prisma.role.findFirst({
      where: {
        name: 'employe'
      }
    });
    
    if (!employeRole) {
      console.log('No employe role found');
      return;
    }
    
    console.log(`Found employe role: ${employeRole.name} (${employeRole.id})`);
    console.log('Current permissions:', JSON.stringify(employeRole.permissions, null, 2));
    
    // Get default permissions for user role
    const defaultUserPermissions = getDefaultPermissions('user');
    
    console.log('Default user permissions:', JSON.stringify(defaultUserPermissions, null, 2));
    
    // Update the role to fix the name and assign proper permissions
    const updatedRole = await prisma.role.update({
      where: {
        id: employeRole.id
      },
      data: {
        name: 'employee', // Fix the spelling
        permissions: defaultUserPermissions // Assign proper permissions
      }
    });
    
    console.log(`Updated role: ${updatedRole.name} (${updatedRole.id})`);
    console.log('New permissions:', JSON.stringify(updatedRole.permissions, null, 2));
    
    // Update any users who had the employe role to use proper permissions
    const usersWithEmployeRole = await prisma.user.findMany({
      where: {
        roleId: employeRole.id
      }
    });
    
    console.log(`Found ${usersWithEmployeRole.length} users with the employe role`);
    
    for (const user of usersWithEmployeRole) {
      console.log(`  User: ${user.name} (${user.email})`);
    }
    
    console.log('\n✅ Role fixed successfully!');
    console.log('The user should now have proper permissions.');
    
  } catch (error) {
    console.error('Error fixing employe role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixEmployeRole();