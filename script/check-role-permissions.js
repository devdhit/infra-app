// Use the existing db module
const { db } = require('../src/lib/db');

async function checkRolePermissions() {
  try {
    // Find an admin role
    const adminRole = await db.role.findFirst({
      where: {
        name: 'admin'
      }
    });

    if (!adminRole) {
      console.log('No admin role found');
      return;
    }

    console.log('Admin Role ID:', adminRole.id);
    console.log('Admin Role Name:', adminRole.name);

    // Check the permissions object
    console.log('Permissions:', JSON.stringify(adminRole.permissions, null, 2));

    // Check if auditLogs permission is present
    if (adminRole.permissions && adminRole.permissions.auditLogs) {
      console.log('Audit Logs permissions:', adminRole.permissions.auditLogs);
    } else {
      console.log('No auditLogs permissions found in role');
    }

    // Check if settings permission is present
    if (adminRole.permissions && adminRole.permissions.settings) {
      console.log('Settings permissions:', adminRole.permissions.settings);
    } else {
      console.log('No settings permissions found in role');
    }

  } catch (error) {
    console.error('Error checking role permissions:', error);
  } finally {
    await db.$disconnect();
  }
}

checkRolePermissions();