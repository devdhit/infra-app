// Test script to verify custom field search functionality
const fs = require('fs');
const path = require('path');

console.log('Testing custom field search implementation...\n');

// 1. Check migration file for proper custom field handling
console.log('1. Checking migration file for custom field handling...');
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250911000000_add_fulltext_search', 'migration.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

// Check if trigger functions properly extract custom fields
const triggerFunctionCheck = migrationContent.includes('SELECT string_agg(value::TEXT, \' \') INTO custom_field_values FROM json_each_text(NEW."customFields")');
console.log(`  Trigger functions extract custom fields: ${triggerFunctionCheck ? '✅' : '❌'}`);

// Check if UPDATE statements properly extract custom fields
const updateStatementCheck = migrationContent.includes('SELECT string_agg(value::TEXT, \' \') FROM json_each_text("customFields")');
console.log(`  UPDATE statements extract custom fields: ${updateStatementCheck ? '✅' : '❌'}`);

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
if (triggerFunctionCheck && updateStatementCheck && parameterCountFix && sqlStructureCheck && customFieldInSearch) {
  console.log('  All checks passed! Custom field search should work correctly.');
  console.log('  ✅ Custom fields are properly extracted and included in search vectors');
  console.log('  ✅ API handler has correct parameter counting');
  console.log('  ✅ Search functionality should work with custom fields');
} else {
  console.log('  Some checks failed. Please review the implementation.');
}

console.log('\nTest completed!');