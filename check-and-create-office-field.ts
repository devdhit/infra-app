import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function checkAndCreateOfficeField() {
  try {
    // First, get all tenants (assuming we need to create the field for each tenant)
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('No tenants found in the database.');
      return;
    }
    
    console.log(`Found ${tenants.length} tenant(s) in the database.`);
    
    // Check if OFFICE custom field exists for PC model for each tenant
    for (const tenant of tenants) {
      console.log(`\nChecking tenant: ${tenant.name} (${tenant.id})`);
      
      const existingOfficeField = await prisma.customField.findFirst({
        where: {
          tenantId: tenant.id,
          modelType: 'PC',
          name: 'OFFICE'
        }
      });
      
      if (existingOfficeField) {
        console.log(`✓ OFFICE custom field already exists for tenant ${tenant.name}`);
        console.log(`  Field ID: ${existingOfficeField.id}`);
        console.log(`  Field Type: ${existingOfficeField.type}`);
      } else {
        console.log(`✗ OFFICE custom field not found for tenant ${tenant.name}. Creating...`);
        
        // Create the OFFICE custom field
        const newOfficeField = await prisma.customField.create({
          data: {
            name: 'OFFICE',
            type: 'text',
            modelType: 'PC',
            required: false,
            tenantId: tenant.id,
            description: 'Microsoft Office version installed on the PC'
          }
        });
        
        console.log(`✓ Created OFFICE custom field for tenant ${tenant.name}`);
        console.log(`  Field ID: ${newOfficeField.id}`);
        console.log(`  Field Type: ${newOfficeField.type}`);
      }
    }
  } catch (error) {
    console.error('Error checking/creating OFFICE field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateOfficeField();