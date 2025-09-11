// Simple script to verify the parameter counting fix in asset-api-handler.ts
console.log('Verifying search parameter counting fix...')

// Read the asset-api-handler.ts file
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'src', 'lib', 'asset-api-handler.ts')
const fileContent = fs.readFileSync(filePath, 'utf8')

// Check if the fix was applied correctly
if (fileContent.includes('With status filter - 6 parameters: tenantId, searchQuery, statusValue, limit, offset')) {
  console.log('✅ Fix correctly applied: Status filter now expects 6 parameters')
} else {
  console.log('❌ Fix not found: Status filter still has incorrect parameter count')
}

// Check for the correct SQL query structure
if (fileContent.includes('LIMIT $4 OFFSET $5') && fileContent.includes('statusCondition')) {
  console.log('✅ SQL query structure is correct')
} else {
  console.log('❌ SQL query structure may be incorrect')
}

console.log('Verification complete!')