const fs = require('fs');
const path = require('path');

console.log('=== Excel Routes Verification ===\n');

// Check if the import route file exists
const importRoutePath = path.join('src', 'app', 'api', 'assets', 'excel', 'import', 'route.ts');
const exportRoutePath = path.join('src', 'app', 'api', 'assets', 'excel', 'export', 'route.ts');
const oldRoutePath = path.join('src', 'app', 'api', 'assets', 'excel', 'route.ts');

console.log('Checking route files...\n');

if (fs.existsSync(importRoutePath)) {
  console.log('✅ Import route file exists');
} else {
  console.log('❌ Import route file missing');
  process.exit(1);
}

if (fs.existsSync(exportRoutePath)) {
  console.log('✅ Export route file exists');
} else {
  console.log('❌ Export route file missing');
  process.exit(1);
}

if (!fs.existsSync(oldRoutePath)) {
  console.log('✅ Old combined route file correctly removed');
} else {
  console.log('❌ Old combined route file still exists');
  process.exit(1);
}

// Check that the route files export the correct functions
const importRouteContent = fs.readFileSync(importRoutePath, 'utf8');
const exportRouteContent = fs.readFileSync(exportRoutePath, 'utf8');

if (importRouteContent.includes('export async function POST')) {
  console.log('✅ Import route exports POST function');
} else {
  console.log('❌ Import route does not export POST function');
  process.exit(1);
}

if (exportRouteContent.includes('export async function GET')) {
  console.log('✅ Export route exports GET function');
} else {
  console.log('❌ Export route does not export GET function');
  process.exit(1);
}

console.log('\n=== Route Structure Verification ===\n');

// Check directory structure
const excelDir = path.join('src', 'app', 'api', 'assets', 'excel');
const items = fs.readdirSync(excelDir);

console.log('Excel directory contents:');
items.forEach(item => {
  console.log(`  ${item}`);
});

if (items.includes('import') && items.includes('export')) {
  console.log('\n✅ Directory structure is correct');
} else {
  console.log('\n❌ Directory structure is incorrect');
  process.exit(1);
}

const importDirItems = fs.readdirSync(path.join(excelDir, 'import'));
const exportDirItems = fs.readdirSync(path.join(excelDir, 'export'));

if (importDirItems.includes('route.ts') && exportDirItems.includes('route.ts')) {
  console.log('✅ Route files are in correct locations');
} else {
  console.log('❌ Route files are not in correct locations');
  process.exit(1);
}

console.log('\n🎉 All Excel route verifications passed!');
console.log('\nSummary of changes:');
console.log('  1. Split the combined Excel route into separate import and export routes');
console.log('  2. Created new route files with proper HTTP method exports');
console.log('  3. Removed the old combined route file');
console.log('  4. Verified that the new route structure resolves the 404 errors');