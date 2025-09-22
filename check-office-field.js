const { PrismaClient } = require('@prisma/client');

async function checkOfficeField() {
  const prisma = new PrismaClient();
  
  try {
    const officeFields = await prisma.customField.findMany({
      where: {
        modelType: 'PC',
        name: 'OFFICE'
      }
    });
    
    console.log('OFFICE custom fields for PC model:');
    console.log(officeFields);
    
    if (officeFields.length === 0) {
      console.log('No OFFICE custom field found for PC model. Creating one...');
      
      // Get the default tenant ID (you might need to adjust this)
      const tenants = await prisma.tenant.findMany();
      if (tenants.length > 0) {
        const defaultTenantId = tenants[0].id;
        
        const newField = await prisma.customField.create({
          data: {
            name: 'OFFICE',
            type: 'text',
            modelType: 'PC',
            required: false,
            tenantId: defaultTenantId
          }
        });
        
        console.log('Created OFFICE custom field:', newField);
      } else {
        console.log('No tenants found. Please create a tenant first.');
      }
    }
  } catch (error) {
    console.error('Error checking/creating OFFICE field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOfficeField();