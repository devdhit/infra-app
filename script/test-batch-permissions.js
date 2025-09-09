// Script to test the batch permission API
async function testBatchPermissions() {
  try {
    console.log('Testing batch permission API...');
    
    // Test data - multiple permissions to check
    const permissionsToCheck = [
      { resource: 'users', action: 'view' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'edit' },
      { resource: 'users', action: 'delete' },
      { resource: 'users', action: 'bulkDelete' },
      { resource: 'roles', action: 'view' },
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'edit' },
      { resource: 'roles', action: 'delete' },
      { resource: 'settings', action: 'view' },
      { resource: 'settings', action: 'edit' },
      { resource: 'pc', action: 'view' },
      { resource: 'pc', action: 'create' },
      { resource: 'pc', action: 'edit' },
      { resource: 'pc', action: 'delete' },
      { resource: 'laptop', action: 'view' },
      { resource: 'laptop', action: 'create' },
      { resource: 'laptop', action: 'edit' },
      { resource: 'laptop', action: 'delete' }
    ];
    
    console.log(`Checking ${permissionsToCheck.length} permissions in batch...`);
    
    // Make batch API call
    const response = await fetch('http://localhost:3001/api/permissions/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions: permissionsToCheck })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Batch permission check results:');
    console.log(JSON.stringify(data, null, 2));
    
    // Count how many permissions the user has
    const hasPermissions = Object.values(data.permissions).filter(Boolean).length;
    const totalPermissions = Object.keys(data.permissions).length;
    
    console.log(`\nUser has ${hasPermissions} out of ${totalPermissions} permissions`);
    
    // Show which permissions the user has
    console.log('\nPermissions granted:');
    for (const [key, value] of Object.entries(data.permissions)) {
      if (value) {
        console.log(`  ✓ ${key}`);
      }
    }
    
    // Show which permissions the user doesn't have
    console.log('\nPermissions denied:');
    for (const [key, value] of Object.entries(data.permissions)) {
      if (!value) {
        console.log(`  ✗ ${key}`);
      }
    }
    
    console.log('\n✅ Batch permission API test completed successfully!');
    
  } catch (error) {
    console.error('Error testing batch permission API:', error);
  }
}

// Run the test
testBatchPermissions();