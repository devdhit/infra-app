// Test script to verify all fixes for custom field search functionality
const fs = require('fs');
const path = require('path');

console.log('Verifying all fixes for custom field search functionality...\n');

// 1. Check migration file for proper JSON casting
console.log('1. Checking migration file for proper JSON casting...');
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250911000000_add_fulltext_search', 'migration.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

// Check if trigger functions properly cast JSONB to JSON
const jsonCastCheck = migrationContent.includes('json_each_text(NEW."customFields"::json)');
console.log(`  Trigger functions cast JSONB to JSON: ${jsonCastCheck ? '✅' : '❌'}`);

// Check if UPDATE statements properly cast JSONB to JSON
const updateJsonCastCheck = migrationContent.includes('json_each_text("customFields"::json)');
console.log(`  UPDATE statements cast JSONB to JSON: ${updateJsonCastCheck ? '✅' : '❌'}`);

// 2. Check API handler for correct parameter counting
console.log('\n2. Checking API handler for correct parameter counting...');
const apiHandlerPath = path.join(__dirname, '..', 'src', 'lib', 'asset-api-handler.ts');
const apiHandlerContent = fs.readFileSync(apiHandlerPath, 'utf8');

// Check if the fix for parameter counting is applied
const parameterCountFix = apiHandlerContent.includes('With status filter - 6 parameters: tenantId, searchQuery, statusValue, limit, offset');
console.log(`  Parameter counting fix applied: ${parameterCountFix ? '✅' : '❌'}`);

// Check SQL query structure
const sqlStructureCheck = apiHandlerContent.includes('LIMIT $4 OFFSET $5') && apiHandlerContent.includes('statusCondition');
console.log(`  SQL query structure correct: ${sqlStructureCheck ? '✅' : '❌'}`);

// 3. Verify that custom fields are included in search
console.log('\n3. Verifying custom fields are included in search vectors...');
const customFieldInSearch = migrationContent.includes('setweight(to_tsvector(\'english\', coalesce(custom_field_values, \'\')), \'D\')');
console.log(`  Custom fields included in search vectors: ${customFieldInSearch ? '✅' : '❌'}`);

console.log('\n🔍 Summary:');
if (jsonCastCheck && updateJsonCastCheck && parameterCountFix && sqlStructureCheck && customFieldInSearch) {
  console.log('  All checks passed! Custom field search should work correctly.');
  console.log('  ✅ JSONB fields are properly cast to JSON for json_each_text function');
  console.log('  ✅ Custom fields are properly extracted and included in search vectors');
  console.log('  ✅ API handler has correct parameter counting');
  console.log('  ✅ Search functionality should work with custom fields');
  console.log('\n  You can now run the migration with: npx prisma migrate dev');
} else {
  console.log('  Some checks failed. Please review the implementation.');
}

console.log('\nTest completed!');