async function testLaptopBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets/laptop';
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
    
    // Create a few Laptop assets to test bulk delete
    console.log('\nCreating Laptop assets for bulk delete test...');
    const laptopAssets = [];
    
    for (let i = 1; i <= 3; i++) {
      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept: `Sales Department ${i}`,
          barcode: `LAP-${Date.now()}-${i}`,
          sapBarcode: `SAP-LAP-${Date.now()}-${i}`,
          model: `Test Laptop Model ${i}`,
          status: 'active',
          note: `Test Laptop asset ${i}`
        })
      });
      
      const createResult = await createResponse.json();
      console.log(`Create Laptop ${i} result:`, createResult);
      
      if (!createResponse.ok) {
        console.error(`Failed to create Laptop ${i}:`, createResult);
        return;
      }
      
      laptopAssets.push(createResult.id);
    }
    
    console.log('\nCreated Laptop assets with IDs:', laptopAssets);
    
    // Test bulk delete using the DELETE method on the main route
    console.log('\nTesting bulk delete...');
    const bulkDeleteResponse = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: laptopAssets
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      console.log('Laptop assets deleted successfully');
    } else {
      const deleteResult = await bulkDeleteResponse.json();
      console.error('Failed to bulk delete Laptop assets:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLaptopBulkDelete();