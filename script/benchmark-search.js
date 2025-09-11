#!/usr/bin/env node

// Benchmark script to compare search performance before and after FTS optimization
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function createTestData(tenantId, count = 1000) {
  console.log(`Creating ${count} test PC records...`);
  
  // Create test data
  const testData = [];
  for (let i = 0; i < count; i++) {
    testData.push({
      dept: `Department ${i % 5}`,
      cpuBarcode: `CPU${1000 + i}`,
      cpuSapBarcode: `SAP${1000 + i}`,
      pcName: `PC-${i}`,
      userName: `User ${i % 100}`,
      status: ['working', 'leave', 'repair'][i % 3],
      note: `Note for PC ${i} with some searchable text`,
      tenantId: tenantId,
      search_vector: undefined // Will be populated by trigger
    });
  }
  
  // Insert in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < testData.length; i += batchSize) {
    const batch = testData.slice(i, i + batchSize);
    await prisma.pC.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(testData.length/batchSize)}`);
  }
  
  console.log(`Created ${count} test records`);
}

async function benchmarkSearch(tenantId, searchTerm) {
  console.log(`\n=== Benchmarking Search for "${searchTerm}" ===`);
  
  // Benchmark traditional search
  console.time('Traditional Search');
  const traditionalResults = await prisma.pC.findMany({
    where: {
      tenantId: tenantId,
      OR: [
        { dept: { contains: searchTerm, mode: 'insensitive' } },
        { cpuBarcode: { contains: searchTerm, mode: 'insensitive' } },
        { pcName: { contains: searchTerm, mode: 'insensitive' } },
        { userName: { contains: searchTerm, mode: 'insensitive' } },
        { status: { contains: searchTerm, mode: 'insensitive' } },
        { note: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    take: 20
  });
  console.timeEnd('Traditional Search');
  console.log(`Traditional search found ${traditionalResults.length} results`);
  
  // Benchmark full-text search
  console.time('Full-Text Search');
  const ftsResults = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "PC"
    WHERE "tenantId" = $1
    AND "search_vector" @@ websearch_to_tsquery('english', $2)
    ORDER BY ts_rank("search_vector", websearch_to_tsquery('english', $2)) DESC
    LIMIT 20
  `, tenantId, searchTerm);
  console.timeEnd('Full-Text Search');
  console.log(`Full-text search found ${ftsResults.length} results`);
  
  // Benchmark full-text search with LIKE (for comparison)
  console.time('LIKE Search');
  const likeResults = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "PC"
    WHERE "tenantId" = $1
    AND (
      "dept" ILIKE $2 OR
      "cpuBarcode" ILIKE $2 OR
      "pcName" ILIKE $2 OR
      "userName" ILIKE $2 OR
      "status" ILIKE $2 OR
      "note" ILIKE $2
    )
    LIMIT 20
  `, tenantId, `%${searchTerm}%`);
  console.timeEnd('LIKE Search');
  console.log(`LIKE search found ${likeResults.length} results`);
  
  return {
    traditional: traditionalResults.length,
    fts: ftsResults.length,
    like: likeResults.length
  };
}

async function runBenchmark() {
  try {
    console.log('Search Performance Benchmark');
    console.log('==========================');
    
    // Get or create a test tenant
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Benchmark Test Tenant' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Benchmark Test Tenant',
          description: 'Tenant for search performance benchmarking'
        }
      });
      console.log(`Created test tenant: ${tenant.name}`);
    }
    
    // Check if we have enough data
    const existingCount = await prisma.pC.count({
      where: { tenantId: tenant.id }
    });
    
    if (existingCount < 1000) {
      await createTestData(tenant.id, 1000 - existingCount);
    }
    
    // Run benchmarks
    await benchmarkSearch(tenant.id, 'working');
    await benchmarkSearch(tenant.id, 'user');
    await benchmarkSearch(tenant.id, 'department');
    await benchmarkSearch(tenant.id, 'pc');
    
    console.log('\n=== Benchmark Complete ===');
    console.log('Full-text search should show significantly better performance');
    console.log('especially as the dataset size increases.');
    
  } catch (error) {
    console.error('Benchmark error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the benchmark
runBenchmark().catch(console.error);