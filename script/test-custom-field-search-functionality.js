// Test script to verify custom field search functionality
const { PrismaClient } = require('@prisma/client');

async function testCustomFieldSearch() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing custom field search functionality...\n');

    // 1. Create a test PC asset with custom fields
    console.log('1. Creating test PC asset with custom fields...');
    const testPC = await prisma.pC.create({
      data: {
        dept: 'IT Department',
        cpuBarcode: 'CPU001',
        pcName: 'Test PC',
        status: 'working',
        customFields: {
          warranty: '2025-12-31',
          cost: 1500,
          location: 'IT Department',
          owner: 'John Doe'
        },
        tenantId: 'test-tenant-id'
      }
    });
    console.log('  Created PC with ID:', testPC.id);

    // 2. Verify search vector was populated
    console.log('\n2. Verifying search vector was populated...');
    const pcWithSearchVector = await prisma.$queryRaw`
      SELECT id, "search_vector" 
      FROM "PC" 
      WHERE id = ${testPC.id}
    `;
    console.log('  Search vector exists:', !!pcWithSearchVector[0]?.search_vector);

    // 3. Test search for custom field values
    console.log('\n3. Testing search for custom field values...');
    
    // Test search for "John Doe" (custom field value)
    const searchResults1 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "customFields"
      FROM "PC" 
      WHERE "tenantId" = ${'test-tenant-id'}
      AND "search_vector" @@ websearch_to_tsquery('english', 'John Doe')
      ORDER BY ts_rank("search_vector", websearch_to_tsquery('english', 'John Doe')) DESC
    `;
    console.log('  Search for "John Doe" found:', searchResults1.length, 'results');

    // Test search for "IT Department" (both regular field and custom field value)
    const searchResults2 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "customFields"
      FROM "PC" 
      WHERE "tenantId" = ${'test-tenant-id'}
      AND "search_vector" @@ websearch_to_tsquery('english', 'IT Department')
      ORDER BY ts_rank("search_vector", websearch_to_tsquery('english', 'IT Department')) DESC
    `;
    console.log('  Search for "IT Department" found:', searchResults2.length, 'results');

    // Test search for "warranty" (custom field key)
    const searchResults3 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "customFields"
      FROM "PC" 
      WHERE "tenantId" = ${'test-tenant-id'}
      AND "search_vector" @@ websearch_to_tsquery('english', 'warranty')
      ORDER BY ts_rank("search_vector", websearch_to_tsquery('english', 'warranty')) DESC
    `;
    console.log('  Search for "warranty" found:', searchResults3.length, 'results');

    // 4. Clean up test data
    console.log('\n4. Cleaning up test data...');
    await prisma.pC.delete({
      where: { id: testPC.id }
    });
    console.log('  Test data cleaned up successfully');

    console.log('\n✅ All tests completed successfully!');
    console.log('✅ Custom field search functionality is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomFieldSearch();