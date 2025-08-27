async function testPrinterBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets/printer';
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
    
    // Create a few Printer assets to test bulk delete
    console.log('\nCreating Printer assets for bulk delete test...');
    const printerAssets = [];
    
    for (let i = 1; i <= 3; i++) {
      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept: `IT Department ${i}`,
          barcode: `PRN-${Date.now()}-${i}`,
          model: `Test Printer Model ${i}`,
          location: `Room ${i}`,
          ip: `192.168.1.${i + 100}`,
          color: i % 2 === 0,
          note: `Test Printer asset ${i}`
        })
      });
      
      const createResult = await createResponse.json();
      console.log(`Create Printer ${i} result:`, createResult);
      
      if (!createResponse.ok) {
        console.error(`Failed to create Printer ${i}:`, createResult);
        return;
      }
      
      printerAssets.push(createResult.id);
    }
    
    console.log('\nCreated Printer assets with IDs:', printerAssets);
    
    // Test bulk delete using the DELETE method on the main route
    console.log('\nTesting bulk delete...');
    const bulkDeleteResponse = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: printerAssets
      })
    });
    
    console.log('Bulk delete response status:', bulkDeleteResponse.status);
    
    if (bulkDeleteResponse.ok) {
      console.log('Printer assets deleted successfully');
    } else {
      const deleteResult = await bulkDeleteResponse.json();
      console.error('Failed to bulk delete Printer assets:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testPrinterBulkDelete();