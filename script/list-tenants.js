const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function listTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { 
            users: true, 
            pcs: true, 
            laptops: true, 
            printers: true, 
            licenses: true, 
            warehouseITs: true, 
            internets: true
          }
        }
      }
    });
    
    console.log('Current tenants in database:');
    console.log(JSON.stringify(tenants, null, 2));
  } catch (error) {
    console.error('Error listing tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTenants();