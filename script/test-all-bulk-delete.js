const fs = require('fs');
const path = require('path');

// Read the auth token from the file
const tokenPath = path.join(__dirname, 'auth-token.txt');
let authToken;
try {
  authToken = fs.readFileSync(tokenPath, 'utf8').trim();
  console.log('Auth token loaded successfully');
} catch (err) {
  console.error('Error reading auth token:', err.message);
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
    console.error(`Error making request to ${url}:`, error.message);
    return { status: 0, error: error.message };
  }
}

// Test bulk delete for each asset type
async function testBulkDelete() {
  const baseUrl = 'http://localhost:3000/api/assets';
  
  console.log('Testing bulk delete functionality for all asset types...\n');
  
  // Test PC bulk delete
  console.log('1. Testing PC bulk delete...');
  const pcResult = await makeRequest(`${baseUrl}/pc/bulk-delete`, 'POST', { ids: [] });
  console.log(`   Status: ${pcResult.status}`);
  console.log(`   Response: ${JSON.stringify(pcResult.data || pcResult.error)}\n`);
  
  // Test Laptop bulk delete
  console.log('2. Testing Laptop bulk delete...');
  const laptopResult = await makeRequest(`${baseUrl}/laptop/bulk-delete`, 'POST', { ids: [] });
  console.log(`   Status: ${laptopResult.status}`);
  console.log(`   Response: ${JSON.stringify(laptopResult.data || laptopResult.error)}\n`);
  
  // Test Printer bulk delete
  console.log('3. Testing Printer bulk delete...');
  const printerResult = await makeRequest(`${baseUrl}/printer/bulk-delete`, 'POST', { ids: [] });
  console.log(`   Status: ${printerResult.status}`);
  console.log(`   Response: ${JSON.stringify(printerResult.data || printerResult.error)}\n`);
  
  // Test License bulk delete
  console.log('4. Testing License bulk delete...');
  const licenseResult = await makeRequest(`${baseUrl}/license/bulk-delete`, 'POST', { ids: [] });
  console.log(`   Status: ${licenseResult.status}`);
  console.log(`   Response: ${JSON.stringify(licenseResult.data || licenseResult.error)}\n`);
  
  // Test Warehouse bulk delete
  console.log('5. Testing Warehouse bulk delete...');
  const warehouseResult = await makeRequest(`${baseUrl}/warehouse/bulk-delete`, 'POST', { ids: [] });
  console.log(`   Status: ${warehouseResult.status}`);
  console.log(`   Response: ${JSON.stringify(warehouseResult.data || warehouseResult.error)}\n`);
  
  console.log('Bulk delete tests completed!');
}

// Run the tests
testBulkDelete().catch(console.error);