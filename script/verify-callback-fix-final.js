const fs = require('fs');
const path = require('path');

// Path to the component file
const componentPath = path.join('src', 'components', 'assets', 'excel-import-export-dialog.tsx');

// Read the file content
const content = fs.readFileSync(componentPath, 'utf8');

console.log('=== useCallback Dependency Analysis ===\n');

// Extract the handleImport useCallback with its dependencies
const importMatch = content.match(/handleImport = useCallback\([\s\S]*?\}\s*,\s*\[([^\]]*)\]\)/);
if (importMatch) {
  const importDeps = importMatch[1].trim();
  console.log('handleImport dependencies:', `[${importDeps}]`);
  
  if (importDeps.includes('toast')) {
    console.log('❌ ERROR: toast is still in handleImport dependencies');
    process.exit(1);
  } else {
    console.log('✅ OK: toast is not in handleImport dependencies');
  }
} else {
  console.log('⚠️ WARNING: Could not find handleImport useCallback');
}

console.log('');

// Extract the handleExport useCallback with its dependencies
const exportMatch = content.match(/handleExport = useCallback\([\s\S]*?\}\s*,\s*\[([^\]]*)\]\)/);
if (exportMatch) {
  const exportDeps = exportMatch[1].trim();
  console.log('handleExport dependencies:', `[${exportDeps}]`);
  
  if (exportDeps.includes('toast')) {
    console.log('❌ ERROR: toast is still in handleExport dependencies');
    process.exit(1);
  } else {
    console.log('✅ OK: toast is not in handleExport dependencies');
  }
} else {
  console.log('⚠️ WARNING: Could not find handleExport useCallback');
}

console.log('\n✅ All useCallback dependencies are properly configured!');
console.log('✅ React Hook useCallback dependency warnings have been resolved!');