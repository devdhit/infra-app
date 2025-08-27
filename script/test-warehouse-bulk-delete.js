async function testWarehouseBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets/warehouse';
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
    
    // Create a few Warehouse assets to test bulk delete
    console.log('\nCreating Warehouse assets for bulk delete test...');
    const warehouseAssets = [];
    
    for (let i = 1; i <= 3; i++) {
      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cpuBarcode: `CPU-${Date.now()}-${i}`,
          cpuSapBarcode: `SAP-CPU-${Date.now()}-${i}`,
          monitorBarcode: `MON-${Date.now()}-${i}`,
          status: 'available',
          note: `Test Warehouse asset ${i}`
        })
      });
      
      const createResult = await createResponse.json();
      console.log(`Create Warehouse ${i} result:`, createResult);
      
      if (!createResponse.ok) {
        console.error(`Failed to create Warehouse ${i}:`, createResult);
        return;
      }
      
      warehouseAssets.push(createResult.id);
    }
    
    console.log('\nCreated Warehouse assets with IDs:', warehouseAssets);
    
    // Test bulk delete using the DELETE method on the main route
    console.log('\nTesting bulk delete...');
    const bulkDeleteResponse = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: warehouseAssets
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      console.log('Warehouse assets deleted successfully');
    } else {
      const deleteResult = await bulkDeleteResponse.json();
      console.error('Failed to bulk delete Warehouse assets:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testWarehouseBulkDelete();