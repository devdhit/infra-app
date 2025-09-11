#!/usr/bin/env node

// Test script to verify which route is being used for asset requests
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testRoute() {
  try {
    console.log('🔍 Testing which route is being used for asset requests...\n');
    
    // Get or create a test tenant
    console.log('1. Getting or creating test tenant...');
    let tenant;
    try {
      tenant = await prisma.tenant.findFirst({
        where: { name: 'Route Test Tenant' }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Route Test Tenant',
            description: 'Tenant for route testing'
          }
        });
      }
      
      console.log('  ✅ Using tenant:', tenant.name);
    } catch (error) {
      console.log('  ❌ Error getting/creating tenant:', error.message);
      return;
    }
    
    // Create a test asset with custom fields
    console.log('\n2. Creating test asset with custom fields...');
    let testAsset;
    try {
      testAsset = await prisma.pC.create({
        data: {
          dept: 'Test Department',
          cpuBarcode: 'ROUTE-TEST-001',
          pcName: 'Route Test PC',
          userName: 'Route Tester',
          status: 'working',
          customFields: {
            "AssetTag": "ROUTE-TAG-001",
            "TestField": "ROUTE-VALUE"
          },
          tenantId: tenant.id
        }
      });
      
      console.log('  ✅ Created test asset with custom fields');
      console.log('  Asset ID:', testAsset.id);
    } catch (error) {
      console.log('  ❌ Error creating test asset:', error.message);
      return;
    }
    
    // Wait a moment for triggers to populate search vectors
    console.log('\n3. Waiting for triggers to populate search vectors...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test search using the optimized full-text search
    console.log('\n4. Testing optimized full-text search...');
    try {
      const searchResults = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "userName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'ROUTE-TAG-001')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'ROUTE-TAG-001')
        ORDER BY rank DESC
      `;
      
      console.log('    Found', searchResults.length, 'results with optimized search');
      if (searchResults.length > 0) {
        console.log('    First result:', {
          id: searchResults[0].id,
          cpuBarcode: searchResults[0].cpuBarcode,
          pcName: searchResults[0].pcName,
          userName: searchResults[0].userName
        });
        console.log('    Custom fields:', searchResults[0].customFields);
      }
    } catch (error) {
      console.log('  ❌ Error testing optimized search:', error.message);
    }
    
    // Clean up test asset
    console.log('\n5. Cleaning up test asset...');
    try {
      await prisma.pC.delete({
        where: { id: testAsset.id }
      });
      console.log('  ✅ Test asset deleted');
    } catch (error) {
      console.log('  ❌ Error deleting test asset:', error.message);
    }
    
    console.log('\n✅ Route testing complete!');
    console.log('\nTo verify which API route is being used:');
    console.log('1. Check the browser developer tools Network tab');
    console.log('2. Look for requests to /api/assets/pc');
    console.log('3. Check the response headers for route identification');
    console.log('4. The optimized search should be used if the correct route is called');
    
  } catch (error) {
    console.error('❌ Route testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRoute().catch(console.error);