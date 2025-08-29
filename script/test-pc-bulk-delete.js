async function testPCBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets/pc';
  const bulkDeleteUrl = 'http://localhost:3000/api/assets/pc/bulk-delete';
  const authUrl = 'http://localhost:3000/api/auth/login';
  
  try {
    // Login first to get authentication token
    console.log('Logging in...');
    const loginResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'password'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (!loginResponse.ok) {
      console.error('Failed to login:', loginResult);
      return;
    }
    
    const token = loginResult.token;
    console.log('Login successful, token acquired.');
    
    // Create a few PC assets to test bulk delete
    console.log('\nCreating PC assets for bulk delete test...');
    const pcAssets = [];
    
    for (let i = 1; i <= 3; i++) {
      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept: `IT Department ${i}`,
          cpuBarcode: `PC-CPU-${Date.now()}-${i}`,
          cpuSapBarcode: `SAP-CPU-${Date.now()}-${i}`,
          pcName: `Test-PC-${Date.now()}-${i}`,
          status: 'working',
          note: `Test PC asset ${i}`
        })
      });
      
      const createResult = await createResponse.json();
      console.log(`Create PC ${i} result:`, createResult);
      
      if (!createResponse.ok) {
        console.error(`Failed to create PC ${i}:`, createResult);
        return;
      }
      
      pcAssets.push(createResult.id);
    }
    
    console.log('\nCreated PC assets with IDs:', pcAssets);
    
    // Test bulk delete
    console.log('\nTesting bulk delete...');
    const bulkDeleteResponse = await fetch(bulkDeleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: pcAssets
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      console.log('PC assets deleted successfully');
    } else {
      const deleteResult = await bulkDeleteResponse.json();
      console.error('Failed to bulk delete PC assets:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testPCBulkDelete();