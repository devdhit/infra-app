const https = require('https');
const http = require('http');

// Function to make HTTP requests
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    
    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testPcCrud() {
  try {
    console.log('Testing Printer CRUD operations...');
    
    // First, login to get the token
    const loginData = JSON.stringify({
      email: 'admin@demo.com',
      password: 'password'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('Login response status:', loginResponse.statusCode);
    console.log('Login response data:', loginResponse.data);
    
    if (loginResponse.statusCode !== 200) {
      console.log('Login failed:', loginResponse.data);
      return;
    }
    
    const loginResult = JSON.parse(loginResponse.data);
    const token = loginResult.token;
    console.log('Login successful, token acquired.');
    
    // Test 1: Create a new Printer asset
    console.log('\n--- Test 1: Create a new Printer asset ---');
    const newPrinterData = JSON.stringify({
      dept: 'IT',
      barcode: 'Printer004-' + Date.now(), // Make it unique
      sapCode: 'SAP004',
      model: 'HP LaserJet Pro',
      location: 'Building A, Floor 2',
      ip: '192.168.1.100',
      color: false
    });
    
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/printer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newPrinterData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const createResponse = await makeRequest(createOptions, newPrinterData);
    console.log('Create Printer Status Code:', createResponse.statusCode);
    console.log('Create Printer Response:', createResponse.data);
    
    if (createResponse.statusCode !== 201) {
      console.log('Failed to create Printer asset');
      return;
    }
    
    const createdPrinter = JSON.parse(createResponse.data);
    const printerId = createdPrinter.id;
    console.log('Printer created with ID:', printerId);
    
    // Test 2: Get the created Printer asset
    console.log('\n--- Test 2: Get the created Printer asset ---');
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/printer/${printerId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    console.log('Get Printer Status Code:', getResponse.statusCode);
    console.log('Get Printer Response:', getResponse.data);
    
    // Test 3: Update the Printer asset
    console.log('\n--- Test 3: Update the Printer asset ---');
    const updatePrinterData = JSON.stringify({
      location: 'Building B, Floor 3',
      color: true
    });
    
    const updateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/printer/${printerId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updatePrinterData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const updateResponse = await makeRequest(updateOptions, updatePrinterData);
    console.log('Update Printer Status Code:', updateResponse.statusCode);
    console.log('Update Printer Response:', updateResponse.data);
    
    // Test 4: Get all Printer assets to verify the update
    console.log('\n--- Test 4: Get all Printer assets ---');
    const getAllOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/printer',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getAllResponse = await makeRequest(getAllOptions);
    console.log('Get All Printers Status Code:', getAllResponse.statusCode);
    
    if (getAllResponse.statusCode === 200) {
      const allPrinters = JSON.parse(getAllResponse.data);
      console.log('Total Printer assets:', allPrinters.pagination.total);
      
      // Find our updated Printer in the list
      const updatedPrinter = allPrinters.data.find(printer => printer.id === printerId);
      if (updatedPrinter) {
        console.log('Updated Printer found in list:');
        console.log('- Location:', updatedPrinter.location);
        console.log('- Color:', updatedPrinter.color);
      } else {
        console.log('Updated Printer not found in list');
      }
    }
    
    // Test 5: Delete the Printer asset
    console.log('\n--- Test 5: Delete the Printer asset ---');
    const deleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/printer/${printerId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const deleteResponse = await makeRequest(deleteOptions);
    console.log('Delete Printer Status Code:', deleteResponse.statusCode);
    console.log('Delete Printer Response:', deleteResponse.data);
    
    // Test 6: Verify the Printer asset is deleted
    console.log('\n--- Test 6: Verify the Printer asset is deleted ---');
    const verifyDeleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/printer/${printerId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const verifyDeleteResponse = await makeRequest(verifyDeleteOptions);
    console.log('Verify Delete Printer Status Code:', verifyDeleteResponse.statusCode);
    
    if (verifyDeleteResponse.statusCode === 404) {
      console.log('Printer asset successfully deleted');
    } else {
      console.log('Printer asset was not deleted');
    }
    
    console.log('\n--- Printer CRUD tests completed ---');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPcCrud();