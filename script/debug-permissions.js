const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function debugPermissions() {
  try {
    logger.info('Debugging permissions...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    logger.info(`Found ${tenants.length} tenants`);
    
    for (const tenant of tenants) {
      logger.info(`\nTenant: ${tenant.name} (${tenant.id})`);
      
      // Get roles for this tenant
      const roles = await prisma.role.findMany({
        where: {
          tenantId: tenant.id
        },
        include: {
          users: true
        }
      });
      
      logger.info(`  Roles: ${roles.length}`);
      
      for (const role of roles) {
        logger.info(`    Role: ${role.name}`);
        logger.info(`      Description: ${role.description}`);
        logger.info(`      Users: ${role.users.length}`);
        logger.info(`      Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
      }
    }
    
  } catch (error) {
    logger.error('Error debugging permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPermissions();