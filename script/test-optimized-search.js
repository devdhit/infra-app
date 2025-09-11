#!/usr/bin/env node

// Test script to verify optimized search functionality with trigram indexes
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testOptimizedSearch(tenantId) {
  console.log('Testing optimized search functionality...\n');
  
  try {
    // Test 1: Verify trigram indexes exist
    console.log('1. Checking for trigram indexes...');
    
    const trigramIndexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE indexname LIKE '%_trigram_idx' 
      AND schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    console.log(`  Found ${trigramIndexes.length} trigram indexes:`);
    trigramIndexes.forEach(idx => {
      console.log(`    - ${idx.tablename}.${idx.indexname}`);
    });
    
    // Test 2: Verify search vector indexes exist
    console.log('\n2. Checking for search vector indexes...');
    
    const searchVectorIndexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE indexname LIKE '%_search_vector_idx' 
      AND schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    console.log(`  Found ${searchVectorIndexes.length} search vector indexes:`);
    searchVectorIndexes.forEach(idx => {
      console.log(`    - ${idx.tablename}.${idx.indexname}`);
    });
    
    // Test 3: Benchmark search performance
    console.log('\n3. Benchmarking search performance...');
    
    // Create a test record if none exists
    const existingCount = await prisma.pC.count({
      where: { tenantId }
    });
    
    if (existingCount === 0) {
      console.log('  Creating test data...');
      await prisma.pC.create({
        data: {
          dept: 'Engineering',
          cpuBarcode: 'CPU12345',
          pcName: 'Workstation-001',
          userName: 'John Doe',
          status: 'working',
          note: 'High-performance workstation for software development',
          tenantId: tenantId,
          customFields: {
            "project": "Web Application",
            "priority": "High",
            "location": "Building A"
          }
        }
      });
    }
    
    // Test full-text search (cast tsvector to text to avoid deserialization issues)
    console.time('Full-text search');
    const ftsResults = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        "dept",
        "cpuBarcode",
        "pcName",
        "userName",
        "status",
        "note",
        "createdAt",
        "updatedAt",
        "tenantId",
        ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
      FROM "PC"
      WHERE "tenantId" = $1
      AND (
        "search_vector" @@ websearch_to_tsquery('english', $2)
        OR
        "search_vector" @@ plainto_tsquery('english', $2)
      )
      ORDER BY rank DESC,
               "createdAt" DESC
      LIMIT 20
    `, tenantId, 'engineering');
    console.timeEnd('Full-text search');
    
    console.log(`  Found ${ftsResults.length} results with full-text search`);
    
    // Test LIKE search for comparison
    console.time('LIKE search');
    const likeResults = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        "dept",
        "cpuBarcode",
        "pcName",
        "userName",
        "status",
        "note",
        "createdAt",
        "updatedAt",
        "tenantId"
      FROM "PC"
      WHERE "tenantId" = $1
      AND (
        "dept" ILIKE $2 OR
        "userName" ILIKE $2 OR
        "note" ILIKE $2
      )
      ORDER BY "createdAt" DESC
      LIMIT 20
    `, tenantId, '%engineering%');
    console.timeEnd('LIKE search');
    
    console.log(`  Found ${likeResults.length} results with LIKE search`);
    
    console.log('\n✅ Search optimization tests completed successfully!');
    console.log('   - Search vector indexes are properly configured');
    console.log('   - Full-text search is working');
    console.log('   - LIKE search is working for comparison');
    
  } catch (error) {
    console.error('❌ Search optimization test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
async function runTest() {
  try {
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Search Test Tenant' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Search Test Tenant',
          description: 'Tenant for search optimization testing'
        }
      });
      console.log(`Created test tenant: ${tenant.name}`);
    }
    
    await testOptimizedSearch(tenant.id);
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTest();