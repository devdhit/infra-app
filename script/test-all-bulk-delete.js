const fs = require('fs');
const path = require('path');

// Read the auth token from the file
const tokenPath = path.join(__dirname, 'auth-token.txt');
let authToken;
try {
  authToken = fs.readFileSync(tokenPath, 'utf8').trim();
  // Auth token loaded successfully
} catch (err) {
  // Error reading auth token
  process.exit(1);
}

// Function to make API requests
async function makeRequest(url, method, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    // Error making request to URL
    return { status: 0, error: error.message };
  }
}

// Test bulk delete for each asset type
async function testBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets';
  
  // Testing bulk delete functionality for all asset types
  
  // Test PC bulk delete
  const pcResult = await makeRequest(`${baseUrl}/pc/bulk-delete`, 'POST', { ids: [] });
  // Status and response logging removed for production
  
  // Test Laptop bulk delete
  const laptopResult = await makeRequest(`${baseUrl}/laptop/bulk-delete`, 'POST', { ids: [] });
  // Status and response logging removed for production
  
  // Test Printer bulk delete
  const printerResult = await makeRequest(`${baseUrl}/printer/bulk-delete`, 'POST', { ids: [] });
  // Status and response logging removed for production
  
  // Test License bulk delete
  const licenseResult = await makeRequest(`${baseUrl}/license/bulk-delete`, 'POST', { ids: [] });
  // Status and response logging removed for production
  
  // Test Warehouse bulk delete
  const warehouseResult = await makeRequest(`${baseUrl}/warehouse/bulk-delete`, 'POST', { ids: [] });
  // Status and response logging removed for production
  
  // Bulk delete tests completed!
}

// Run the tests
testBulkDelete().catch(() => {
  // Error handling without console output
});