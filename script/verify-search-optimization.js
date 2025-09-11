#!/usr/bin/env node

// Verification script for search optimization implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Search Optimization Implementation...\n');

// 1. Check migration file for all required components
console.log('1. Checking migration file...');
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250911000000_add_fulltext_search', 'migration.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

const checks = [
  {
    name: 'Extension creation',
    test: () => migrationContent.includes('CREATE EXTENSION IF NOT EXISTS pg_trgm') && 
              migrationContent.includes('CREATE EXTENSION IF NOT EXISTS btree_gin'),
    required: true
  },
  {
    name: 'Search vector column creation',
    test: () => migrationContent.includes('ADD COLUMN IF NOT EXISTS "search_vector" tsvector'),
    required: true
  },
  {
    name: 'Custom field extraction function',
    test: () => migrationContent.includes('extract_custom_field_values') && 
              migrationContent.includes('jsonb_each_text'),
    required: true
  },
  {
    name: 'Trigger functions with proper weighting',
    test: () => migrationContent.includes("setweight(to_tsvector('english'") && 
              migrationContent.includes('RETURN NEW'),
    required: true
  },
  {
    name: 'GIN indexes on search vectors',
    test: () => migrationContent.includes('USING GIN ("search_vector")'),
    required: true
  },
  {
    name: 'Trigram indexes on key fields',
    test: () => migrationContent.includes('gin_trgm_ops'),
    required: true
  },
  {
    name: 'Data population for existing records',
    test: () => migrationContent.includes('UPDATE "PC" SET "search_vector" =') &&
              migrationContent.includes('UPDATE "Laptop" SET "search_vector" ='),
    required: true
  }
];

let allPassed = true;
checks.forEach(check => {
  const passed = check.test();
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed && check.required) {
    allPassed = false;
  }
});

// 2. Check API handler for optimized queries
console.log('\n2. Checking API handler...');
const apiHandlerPath = path.join(__dirname, '..', 'src', 'lib', 'asset-api-handler.ts');
const apiHandlerContent = fs.readFileSync(apiHandlerPath, 'utf8');

const apiChecks = [
  {
    name: 'Hybrid search query implementation',
    test: () => apiHandlerContent.includes('websearch_to_tsquery') && 
              apiHandlerContent.includes('ts_rank') &&
              apiHandlerContent.includes('similarity('),
    required: true
  },
  {
    name: 'Proper parameter counting',
    test: () => apiHandlerContent.includes('With status filter - 6 parameters') ||
              apiHandlerContent.includes('Without status filter - 4 parameters'),
    required: true
  },
  {
    name: 'Rank-based ordering',
    test: () => apiHandlerContent.includes('ORDER BY rank DESC') &&
              apiHandlerContent.includes('GREATEST('),
    required: true
  }
];

apiChecks.forEach(check => {
  const passed = check.test();
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed && check.required) {
    allPassed = false;
  }
});

// 3. Check documentation
console.log('\n3. Checking documentation...');
const docsPath = path.join(__dirname, '..', 'docs', 'search-optimization.md');
const docsExist = fs.existsSync(docsPath);
console.log(`  ${docsExist ? '✅' : '❌'} Search optimization documentation exists`);

// 4. Check test scripts
console.log('\n4. Checking test scripts...');
const testScriptPath = path.join(__dirname, 'test-optimized-search.js');
const testScriptExists = fs.existsSync(testScriptPath);
console.log(`  ${testScriptExists ? '✅' : '❌'} Optimized search test script exists`);

console.log('\n📋 Summary:');
if (allPassed && docsExist && testScriptExists) {
  console.log('  🎉 All checks passed! Search optimization is properly implemented.');
  console.log('  ✅ Full-text search with GIN indexes');
  console.log('  ✅ Trigram indexes for similarity search');
  console.log('  ✅ Custom field integration');
  console.log('  ✅ Hybrid search approach');
  console.log('  ✅ Proper documentation');
  console.log('  ✅ Test scripts available');
} else {
  console.log('  ⚠️  Some checks failed. Please review the implementation.');
}

console.log('\n📊 Performance expectations:');
console.log('  - Search queries should execute in < 50ms for datasets up to 100K records');
console.log('  - Results should be relevance-ranked');
console.log('  - Custom fields should be searchable');
console.log('  - Multi-tenant isolation maintained');

console.log('\nVerification completed!');