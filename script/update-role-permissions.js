// Script to update role permissions to include audit logs
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Define default permissions for built-in roles
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

async function updateRolePermissions() {
  try {
    console.log('Updating role permissions to include audit logs...');
    
    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles`);
    
    let updatedCount = 0;
    
    for (const role of roles) {
      console.log(`\nUpdating role: ${role.name} (${role.id}) for tenant ${role.tenantId}`);
      
      // Get default permissions for this role type
      const defaultPermissions = getDefaultPermissions(role.name);
      console.log('Default permissions:', defaultPermissions);
      
      // Check if the role already has audit logs permissions
      const hasAuditLogsPermission = role.permissions.auditLogs !== undefined;
      
      if (hasAuditLogsPermission) {
        console.log('  Role already has audit logs permissions');
        continue;
      }
      
      // Update the role permissions to include audit logs
      const updatedPermissions = {
        ...role.permissions,
        ...defaultPermissions
      };
      
      console.log('  Updated permissions:', updatedPermissions);
      
      // Update the role in the database
      await prisma.role.update({
        where: {
          id: role.id
        },
        data: {
          permissions: updatedPermissions
        }
      });
      
      console.log('  Role updated successfully');
      updatedCount++;
    }
    
    console.log(`\nUpdated permissions for ${updatedCount} roles`);
    console.log('Role permissions update completed successfully!');
  } catch (error) {
    console.error('Role permissions update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRolePermissions();