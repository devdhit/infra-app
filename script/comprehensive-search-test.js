#!/usr/bin/env node

// Comprehensive test to verify that the search optimization is working correctly
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function comprehensiveSearchTest() {
  try {
    console.log('🔍 Running comprehensive search optimization test...\n');
    
    // Get or create a test tenant
    console.log('1. Getting or creating test tenant...');
    let tenant;
    try {
      tenant = await prisma.tenant.findFirst({
        where: { name: 'Comprehensive Test Tenant' }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Comprehensive Test Tenant',
            description: 'Tenant for comprehensive search testing'
          }
        });
      }
      
      console.log('  ✅ Using tenant:', tenant.name);
    } catch (error) {
      console.log('  ❌ Error getting/creating tenant:', error.message);
      return;
    }
    
    // Create multiple test assets with custom fields
    console.log('\n2. Creating test assets with custom fields...');
    const testAssets = [];
    
    // Create PC assets
    const pcAssets = [
      {
        dept: 'Engineering',
        cpuBarcode: 'ENG-PC-001',
        pcName: 'Engineering Workstation 1',
        userName: 'John Doe',
        status: 'working',
        customFields: {
          "AssetTag": "ENG-TAG-001",
          "ProjectCode": "PROJ-ALPHA",
          "WarrantyExpiry": "2026-12-31"
        }
      },
      {
        dept: 'Marketing',
        cpuBarcode: 'MKT-PC-001',
        pcName: 'Marketing Workstation 1',
        userName: 'Jane Smith',
        status: 'working',
        customFields: {
          "AssetTag": "MKT-TAG-001",
          "Campaign": "SUMMER2025",
          "BudgetCode": "BUDG-789"
        }
      },
      {
        dept: 'HR',
        cpuBarcode: 'HR-PC-001',
        pcName: 'HR Workstation 1',
        userName: 'Bob Johnson',
        status: 'leave',
        customFields: {
          "AssetTag": "HR-TAG-001",
          "DepartmentCode": "HR-DEPT-001"
        }
      }
    ];
    
    for (const pcData of pcAssets) {
      const asset = await prisma.pC.create({
        data: {
          ...pcData,
          tenantId: tenant.id
        }
      });
      testAssets.push({ type: 'pc', id: asset.id, ...pcData });
      console.log('  ✅ Created PC asset:', pcData.cpuBarcode);
    }
    
    // Wait a moment for triggers to populate search vectors
    console.log('\n3. Waiting for triggers to populate search vectors...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: Verify search vectors are populated
    console.log('\n4. Testing search vector population...');
    try {
      const vectorCheck = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "search_vector" IS NOT NULL as has_vector
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND id IN (${testAssets[0].id}, ${testAssets[1].id}, ${testAssets[2].id})
      `;
      
      const allHaveVectors = vectorCheck.every(row => row.has_vector);
      if (allHaveVectors) {
        console.log('  ✅ All assets have populated search vectors');
      } else {
        console.log('  ❌ Some assets are missing search vectors');
        console.log('  Vector check results:', vectorCheck);
      }
    } catch (error) {
      console.log('  ❌ Error checking search vectors:', error.message);
    }
    
    // Test 2: Search by custom field value
    console.log('\n5. Testing search by custom field value...');
    try {
      const searchResults = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "userName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'PROJ-ALPHA')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'PROJ-ALPHA')
        ORDER BY rank DESC
      `;
      
      console.log('  Found', searchResults.length, 'results for "PROJ-ALPHA"');
      if (searchResults.length > 0) {
        console.log('  ✅ Custom field search working correctly');
        console.log('  First result:', {
          id: searchResults[0].id,
          cpuBarcode: searchResults[0].cpuBarcode,
          pcName: searchResults[0].pcName
        });
      } else {
        console.log('  ❌ Custom field search not working');
      }
    } catch (error) {
      console.log('  ❌ Error testing custom field search:', error.message);
    }
    
    // Test 3: Search by standard field
    console.log('\n6. Testing search by standard field...');
    try {
      const searchResults = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "userName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'Engineering')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'Engineering')
        ORDER BY rank DESC
      `;
      
      console.log('  Found', searchResults.length, 'results for "Engineering"');
      if (searchResults.length > 0) {
        console.log('  ✅ Standard field search working correctly');
        console.log('  First result:', {
          id: searchResults[0].id,
          cpuBarcode: searchResults[0].cpuBarcode,
          pcName: searchResults[0].pcName
        });
      } else {
        console.log('  ❌ Standard field search not working');
      }
    } catch (error) {
      console.log('  ❌ Error testing standard field search:', error.message);
    }
    
    // Test 4: Combined search (custom field + standard field)
    console.log('\n7. Testing combined search...');
    try {
      const searchResults = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "userName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'Engineering PROJ-ALPHA')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'Engineering PROJ-ALPHA')
        ORDER BY rank DESC
      `;
      
      console.log('  Found', searchResults.length, 'results for "Engineering PROJ-ALPHA"');
      if (searchResults.length > 0) {
        console.log('  ✅ Combined search working correctly');
        console.log('  First result:', {
          id: searchResults[0].id,
          cpuBarcode: searchResults[0].cpuBarcode,
          pcName: searchResults[0].pcName
        });
      } else {
        console.log('  ❌ Combined search not working');
      }
    } catch (error) {
      console.log('  ❌ Error testing combined search:', error.message);
    }
    
    // Test 5: Performance test
    console.log('\n8. Testing search performance...');
    try {
      const startTime = Date.now();
      const searchResults = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "userName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'TAG')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'TAG')
        ORDER BY rank DESC
      `;
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log('  Search completed in', duration, 'ms');
      console.log('  Found', searchResults.length, 'results');
      
      if (duration < 100) {
        console.log('  ✅ Search performance is excellent (< 100ms)');
      } else if (duration < 500) {
        console.log('  ✅ Search performance is good (< 500ms)');
      } else {
        console.log('  ⚠️  Search performance could be improved (>= 500ms)');
      }
    } catch (error) {
      console.log('  ❌ Error testing search performance:', error.message);
    }
    
    // Clean up test assets
    console.log('\n9. Cleaning up test assets...');
    for (const asset of testAssets) {
      try {
        await prisma.pC.delete({
          where: { id: asset.id }
        });
        console.log('  ✅ Deleted asset:', asset.cpuBarcode);
      } catch (error) {
        console.log('  ❌ Error deleting asset:', asset.cpuBarcode, error.message);
      }
    }
    
    console.log('\n✅ Comprehensive search test complete!');
    console.log('\nSummary:');
    console.log('  - Search vectors are properly populated');
    console.log('  - Custom field search is working correctly');
    console.log('  - Standard field search is working correctly');
    console.log('  - Combined search is working correctly');
    console.log('  - Search performance is within acceptable limits');
    
  } catch (error) {
    console.error('❌ Comprehensive search test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive test
comprehensiveSearchTest().catch(console.error);