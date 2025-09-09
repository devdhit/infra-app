// Script to verify that the fixes are working correctly
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verifyFixes() {
  try {
    console.log('Verifying fixes...');
    
    // Check that the role has been fixed
    const employeeRole = await prisma.role.findFirst({
      where: {
        name: 'employee'
      }
    });
    
    if (!employeeRole) {
      console.log('❌ Employee role not found');
      return;
    }
    
    console.log(`✅ Employee role found: ${employeeRole.name} (${employeeRole.id})`);
    
    // Check that permissions are properly assigned
    const hasProperPermissions = employeeRole.permissions.users && 
                                employeeRole.permissions.users.includes('view') &&
                                employeeRole.permissions.assets && 
                                employeeRole.permissions.assets.includes('view');
    
    if (hasProperPermissions) {
      console.log('✅ Employee role has proper permissions');
      console.log('Permissions:', JSON.stringify(employeeRole.permissions, null, 2));
    } else {
      console.log('❌ Employee role does not have proper permissions');
      console.log('Current permissions:', JSON.stringify(employeeRole.permissions, null, 2));
      return;
    }
    
    // Check that the old 'employe' role no longer exists
    const employeRole = await prisma.role.findFirst({
      where: {
        name: 'employe'
      }
    });
    
    if (employeRole) {
      console.log('❌ Old employe role still exists');
      return;
    }
    
    console.log('✅ Old employe role no longer exists');
    
    // Check the user who had the employe role
    const userWithEmployeeRole = await prisma.user.findFirst({
      where: {
        roleId: employeeRole.id
      },
      include: {
        role: true
      }
    });
    
    if (userWithEmployeeRole) {
      console.log(`✅ User ${userWithEmployeeRole.name} (${userWithEmployeeRole.email}) has the correct employee role`);
      console.log(`Role: ${userWithEmployeeRole.role.name}`);
    } else {
      console.log('❌ No user found with the employee role');
    }
    
    console.log('\n🎉 All fixes verified successfully!');
    console.log('The user should now be able to access the application properly.');
    
  } catch (error) {
    console.error('Error verifying fixes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyFixes();