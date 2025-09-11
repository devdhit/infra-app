#!/usr/bin/env node

// Debug script to check search vector implementation and test custom field search functionality
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function debugSearchVectors() {
  try {
    console.log('🔍 Debugging search vector implementation...\n');
    
    // Check if the extract_custom_field_values function exists and works correctly
    console.log('1. Testing extract_custom_field_values function...');
    try {
      const testResult = await prisma.$queryRaw([
        `SELECT extract_custom_field_values($1::jsonb) as result`,
        JSON.stringify({
          "AssetTag": "TAG-123",
          "PurchaseOrder": "PO-456",
          "WarrantyExpiry": "2025-12-31"
        })
      ]);
      
      console.log('  Test result:', testResult[0].result);
      console.log('  ✅ extract_custom_field_values function works correctly');
    } catch (error) {
      console.log('  ❌ Error testing extract_custom_field_values function:', error.message);
    }
    
    // Check if search_vector columns exist
    console.log('\n2. Checking if search_vector columns exist...');
    const tables = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet'];
    
    for (const table of tables) {
      try {
        const columnExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = ${table} AND column_name = 'search_vector'
          ) as exists;
        `;
        
        if (columnExists[0].exists) {
          console.log(`  ✅ ${table} table has search_vector column`);
        } else {
          console.log(`  ❌ ${table} table does not have search_vector column`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking ${table} table:`, error.message);
      }
    }
    
    // Check if triggers exist
    console.log('\n3. Checking if search vector triggers exist...');
    const triggers = [
      'pc_search_vector_trigger',
      'laptop_search_vector_trigger',
      'printer_search_vector_trigger',
      'license_search_vector_trigger',
      'warehouseit_search_vector_trigger',
      'internet_search_vector_trigger'
    ];
    
    for (const trigger of triggers) {
      try {
        const triggerExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = ${trigger}
          ) as exists;
        `;
        
        if (triggerExists[0].exists) {
          console.log(`  ✅ ${trigger} exists`);
        } else {
          console.log(`  ❌ ${trigger} does not exist`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking ${trigger}:`, error.message);
      }
    }
    
    // Get or create a test tenant
    console.log('\n4. Getting or creating test tenant...');
    let tenant;
    try {
      tenant = await prisma.tenant.findFirst({
        where: { name: 'Debug Test Tenant' }
      });
      
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Debug Test Tenant',
            description: 'Tenant for debugging search functionality'
          }
        });
      }
      
      console.log('  ✅ Using tenant:', tenant.name);
    } catch (error) {
      console.log('  ❌ Error getting/creating tenant:', error.message);
      return;
    }
    
    // Create a test asset with custom fields
    console.log('\n5. Creating test asset with custom fields...');
    let testAsset;
    try {
      testAsset = await prisma.pC.create({
        data: {
          dept: 'Test Department',
          cpuBarcode: 'TEST-CPU-001',
          pcName: 'Test PC',
          userName: 'Test User',
          status: 'working',
          customFields: {
            "AssetTag": "UNIQUE-TAG-123",
            "PurchaseOrder": "PO-789",
            "WarrantyExpiry": "2026-06-30"
          },
          tenantId: tenant.id
        }
      });
      
      console.log('  ✅ Test asset created with custom fields');
      console.log('  Asset ID:', testAsset.id);
    } catch (error) {
      console.log('  ❌ Error creating test asset:', error.message);
      return;
    }
    
    // Wait a moment for the trigger to populate the search vector
    console.log('\n6. Waiting for trigger to populate search vector...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check the search vector content
    console.log('\n7. Checking search vector content...');
    try {
      const assetWithVector = await prisma.pC.findUnique({
        where: { id: testAsset.id },
        select: { 
          search_vector: true,
          dept: true,
          cpuBarcode: true,
          pcName: true,
          userName: true,
          status: true,
          customFields: true
        }
      });
      
      console.log('  Asset data:');
      console.log('    dept:', assetWithVector.dept);
      console.log('    cpuBarcode:', assetWithVector.cpuBarcode);
      console.log('    pcName:', assetWithVector.pcName);
      console.log('    userName:', assetWithVector.userName);
      console.log('    status:', assetWithVector.status);
      console.log('    customFields:', JSON.stringify(assetWithVector.customFields, null, 2));
      console.log('    search_vector:', assetWithVector.search_vector);
    } catch (error) {
      console.log('  ❌ Error checking search vector content:', error.message);
    }
    
    // Test search with custom field content
    console.log('\n8. Testing search with custom field content...');
    try {
      // Test 1: Search with websearch_to_tsquery
      console.log('  Testing with websearch_to_tsquery...');
      const searchResults1 = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "customFields",
               ts_rank("search_vector", websearch_to_tsquery('english', 'UNIQUE-TAG-123')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ websearch_to_tsquery('english', 'UNIQUE-TAG-123')
        ORDER BY rank DESC
      `;
      
      console.log('    Found', searchResults1.length, 'results with websearch_to_tsquery');
      if (searchResults1.length > 0) {
        console.log('    First result:', searchResults1[0]);
      }
      
      // Test 2: Search with plainto_tsquery
      console.log('  Testing with plainto_tsquery...');
      const searchResults2 = await prisma.$queryRaw`
        SELECT id, "cpuBarcode", "pcName", "customFields",
               ts_rank("search_vector", plainto_tsquery('english', 'UNIQUE-TAG-123')) as rank
        FROM "PC"
        WHERE "tenantId" = ${tenant.id}
        AND "search_vector" @@ plainto_tsquery('english', 'UNIQUE-TAG-123')
        ORDER BY rank DESC
      `;
      
      console.log('    Found', searchResults2.length, 'results with plainto_tsquery');
      if (searchResults2.length > 0) {
        console.log('    First result:', searchResults2[0]);
      }
      
      // Test 3: Check if custom field values are in the search vector
      console.log('  Checking if custom field values are in search vector...');
      const vectorCheck = await prisma.$queryRaw`
        SELECT id, "search_vector",
               "search_vector" @@ to_tsquery('english', 'UNIQUE-TAG-123') as contains_tag
        FROM "PC"
        WHERE id = ${testAsset.id}
      `;
      
      console.log('    Vector check result:', vectorCheck[0]);
      
      if (vectorCheck[0].contains_tag) {
        console.log('  ✅ Custom field values are properly included in search vector');
      } else {
        console.log('  ❌ Custom field values are NOT included in search vector');
      }
    } catch (error) {
      console.log('  ❌ Error testing search:', error.message);
    }
    
    // Clean up test asset
    console.log('\n9. Cleaning up test asset...');
    try {
      await prisma.pC.delete({
        where: { id: testAsset.id }
      });
      console.log('  ✅ Test asset deleted');
    } catch (error) {
      console.log('  ❌ Error deleting test asset:', error.message);
    }
    
    console.log('\n✅ Debugging complete!');
    
  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugSearchVectors().catch(console.error);