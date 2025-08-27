async function testLicenseBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets/license';
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
    
    // Create a few License assets to test bulk delete
    console.log('\nCreating License assets for bulk delete test...');
    const licenseAssets = [];
    
    for (let i = 1; i <= 3; i++) {
      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productType: `Software Product ${i}`,
          productKey: `KEY-${Date.now()}-${i}`,
          deviceName: `Test Device ${i}`,
          userName: `Test User ${i}`,
          dept: `IT Department ${i}`,
          note: `Test License asset ${i}`
        })
      });
      
      const createResult = await createResponse.json();
      console.log(`Create License ${i} result:`, createResult);
      
      if (!createResponse.ok) {
        console.error(`Failed to create License ${i}:`, createResult);
        return;
      }
      
      licenseAssets.push(createResult.id);
    }
    
    console.log('\nCreated License assets with IDs:', licenseAssets);
    
    // Test bulk delete using the DELETE method on the main route
    console.log('\nTesting bulk delete...');
    const bulkDeleteResponse = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: licenseAssets
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      console.log('License assets deleted successfully');
    } else {
      const deleteResult = await bulkDeleteResponse.json();
      console.error('Failed to bulk delete License assets:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLicenseBulkDelete();