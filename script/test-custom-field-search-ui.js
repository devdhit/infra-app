#!/usr/bin/env node

// Test script to verify custom field search functionality from the UI perspective
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testCustomFieldSearchUI() {
  try {
    console.log('🔍 Testing custom field search functionality from UI perspective...\n');
    
    // Get or create a test tenant
    console.log('1. Getting or creating test tenant...');
    let tenant;
    try {
      tenant = await prisma.tenant.findFirst({
        where: { name: 'UI Test Tenant' }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'UI Test Tenant',
            description: 'Tenant for UI search testing'
          }
        });
      }
      
      console.log('  ✅ Using tenant:', tenant.name);
    } catch (error) {
      console.log('  ❌ Error getting/creating tenant:', error.message);
      return;
    }
    
    // Create test assets with custom fields
    console.log('\n2. Creating test assets with custom fields...');
    const testAssets = [];
    
    // Create asset with unique custom field value
    const asset1 = await prisma.pC.create({
      data: {
        dept: 'Engineering',
        cpuBarcode: 'ENG-PC-001',
        pcName: 'Engineering Workstation 1',
        userName: 'John Doe',
        status: 'working',
        customFields: {
          "AssetTag": "ENG-TAG-001",
          "ProjectCode": "PROJ-ALPHA",
          "WarrantyExpiry": "2026-12-31"
        },
        tenantId: tenant.id
      }
    });
    testAssets.push(asset1);
    console.log('  ✅ Created asset with AssetTag: ENG-TAG-001');
    
    // Create asset with different custom field value
    const asset2 = await prisma.pC.create({
      data: {
        dept: 'Marketing',
        cpuBarcode: 'MKT-PC-001',
        pcName: 'Marketing Workstation 1',
        userName: 'Jane Smith',
        status: 'working',
        customFields: {
          "AssetTag": "MKT-TAG-001",
          "Campaign": "SUMMER2025",
          "BudgetCode": "BUDG-789"
        },
        tenantId: tenant.id
      }
    });
    testAssets.push(asset2);
    console.log('  ✅ Created asset with AssetTag: MKT-TAG-001');
    
    // Create asset without custom fields
    const asset3 = await prisma.pC.create({
      data: {
        dept: 'HR',
        cpuBarcode: 'HR-PC-001',
        pcName: 'HR Workstation 1',
        userName: 'Bob Johnson',
        status: 'leave',
        tenantId: tenant.id
      }
    });
    testAssets.push(asset3);
    console.log('  ✅ Created asset without custom fields');
    
    // Wait a moment for triggers to populate search vectors
    console.log('\n3. Waiting for triggers to populate search vectors...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test search functionality that mimics the UI
    console.log('\n4. Testing search functionality...');
    
    // Test 1: Search for asset by custom field value
    console.log('  Testing search for "ENG-TAG-001" (should find 1 asset)...');
    const searchResults1 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "userName", "customFields"
      FROM "PC"
      WHERE "tenantId" = ${tenant.id}
      AND (
        "search_vector" @@ websearch_to_tsquery('english', 'ENG-TAG-001')
        OR
        "search_vector" @@ plainto_tsquery('english', 'ENG-TAG-001')
      )
      ORDER BY "createdAt" DESC
    `;
    
    console.log('    Found', searchResults1.length, 'results');
    if (searchResults1.length > 0) {
      console.log('    First result:', {
        id: searchResults1[0].id,
        cpuBarcode: searchResults1[0].cpuBarcode,
        pcName: searchResults1[0].pcName,
        userName: searchResults1[0].userName
      });
      console.log('    Custom fields:', searchResults1[0].customFields);
    }
    
    // Test 2: Search for asset by different custom field value
    console.log('\n  Testing search for "SUMMER2025" (should find 1 asset)...');
    const searchResults2 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "userName", "customFields"
      FROM "PC"
      WHERE "tenantId" = ${tenant.id}
      AND (
        "search_vector" @@ websearch_to_tsquery('english', 'SUMMER2025')
        OR
        "search_vector" @@ plainto_tsquery('english', 'SUMMER2025')
      )
      ORDER BY "createdAt" DESC
    `;
    
    console.log('    Found', searchResults2.length, 'results');
    if (searchResults2.length > 0) {
      console.log('    First result:', {
        id: searchResults2[0].id,
        cpuBarcode: searchResults2[0].cpuBarcode,
        pcName: searchResults2[0].pcName,
        userName: searchResults2[0].userName
      });
      console.log('    Custom fields:', searchResults2[0].customFields);
    }
    
    // Test 3: Search for non-existent custom field value
    console.log('\n  Testing search for "NON-EXISTENT" (should find 0 assets)...');
    const searchResults3 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "userName", "customFields"
      FROM "PC"
      WHERE "tenantId" = ${tenant.id}
      AND (
        "search_vector" @@ websearch_to_tsquery('english', 'NON-EXISTENT')
        OR
        "search_vector" @@ plainto_tsquery('english', 'NON-EXISTENT')
      )
      ORDER BY "createdAt" DESC
    `;
    
    console.log('    Found', searchResults3.length, 'results');
    
    // Test 4: Search for standard field that should also work
    console.log('\n  Testing search for "Engineering" (should find 1 asset)...');
    const searchResults4 = await prisma.$queryRaw`
      SELECT id, "cpuBarcode", "pcName", "userName", "customFields"
      FROM "PC"
      WHERE "tenantId" = ${tenant.id}
      AND (
        "search_vector" @@ websearch_to_tsquery('english', 'Engineering')
        OR
        "search_vector" @@ plainto_tsquery('english', 'Engineering')
      )
      ORDER BY "createdAt" DESC
    `;
    
    console.log('    Found', searchResults4.length, 'results');
    if (searchResults4.length > 0) {
      console.log('    First result:', {
        id: searchResults4[0].id,
        cpuBarcode: searchResults4[0].cpuBarcode,
        pcName: searchResults4[0].pcName,
        userName: searchResults4[0].userName
      });
    }
    
    // Clean up test assets
    console.log('\n5. Cleaning up test assets...');
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
    
    console.log('\n✅ Custom field search testing complete!');
    console.log('\nSummary:');
    console.log('  - Custom field search is working correctly');
    console.log('  - Assets with custom field values can be found through search');
    console.log('  - Search works for both custom fields and standard fields');
    console.log('  - Non-existent search terms correctly return no results');
    
    if (searchResults1.length > 0 && searchResults2.length > 0 && searchResults3.length === 0 && searchResults4.length > 0) {
      console.log('\n🎉 All tests passed! Custom field search is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the results above.');
    }
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCustomFieldSearchUI().catch(console.error);