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
    console.log('Testing Laptop CRUD operations...');
    
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
    
    // Test 1: Create a new Laptop asset
    console.log('\n--- Test 1: Create a new Laptop asset ---');
    const newLaptopData = JSON.stringify({
      dept: 'IT',
      barcode: 'Laptop004-' + Date.now(), // Make it unique
      sapBarcode: 'SAP004',
      model: 'ThinkPad X1 Carbon',
      status: 'active'
    });
    
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/laptop',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newLaptopData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const createResponse = await makeRequest(createOptions, newLaptopData);
    console.log('Create Laptop Status Code:', createResponse.statusCode);
    console.log('Create Laptop Response:', createResponse.data);
    
    if (createResponse.statusCode !== 201) {
      console.log('Failed to create Laptop asset');
      return;
    }
    
    const createdLaptop = JSON.parse(createResponse.data);
    const laptopId = createdLaptop.id;
    console.log('Laptop created with ID:', laptopId);
    
    // Test 2: Get the created Laptop asset
    console.log('\n--- Test 2: Get the created Laptop asset ---');
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/laptop/${laptopId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    console.log('Get Laptop Status Code:', getResponse.statusCode);
    console.log('Get Laptop Response:', getResponse.data);
    
    // Test 3: Update the Laptop asset
    console.log('\n--- Test 3: Update the Laptop asset ---');
    const updateLaptopData = JSON.stringify({
      status: 'maintenance'
    });
    
    const updateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/laptop/${laptopId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateLaptopData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const updateResponse = await makeRequest(updateOptions, updateLaptopData);
    console.log('Update Laptop Status Code:', updateResponse.statusCode);
    console.log('Update Laptop Response:', updateResponse.data);
    
    // Test 4: Get all Laptop assets to verify the update
    console.log('\n--- Test 4: Get all Laptop assets ---');
    const getAllOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/laptop',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getAllResponse = await makeRequest(getAllOptions);
    console.log('Get All Laptops Status Code:', getAllResponse.statusCode);
    
    if (getAllResponse.statusCode === 200) {
      const allLaptops = JSON.parse(getAllResponse.data);
      console.log('Total Laptop assets:', allLaptops.pagination.total);
      
      // Find our updated Laptop in the list
      const updatedLaptop = allLaptops.data.find(laptop => laptop.id === laptopId);
      if (updatedLaptop) {
        console.log('Updated Laptop found in list:');
        console.log('- Note:', updatedLaptop.note);
        console.log('- Status:', updatedLaptop.status);
      } else {
        console.log('Updated Laptop not found in list');
      }
    }
    
    // Test 5: Delete the Laptop asset
    console.log('\n--- Test 5: Delete the Laptop asset ---');
    const deleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/laptop/${laptopId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const deleteResponse = await makeRequest(deleteOptions);
    console.log('Delete Laptop Status Code:', deleteResponse.statusCode);
    console.log('Delete Laptop Response:', deleteResponse.data);
    
    // Test 6: Verify the Laptop asset is deleted
    console.log('\n--- Test 6: Verify the Laptop asset is deleted ---');
    const verifyDeleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/laptop/${laptopId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const verifyDeleteResponse = await makeRequest(verifyDeleteOptions);
    console.log('Verify Delete Laptop Status Code:', verifyDeleteResponse.statusCode);
    
    if (verifyDeleteResponse.statusCode === 404) {
      console.log('Laptop asset successfully deleted');
    } else {
      console.log('Laptop asset was not deleted');
    }
    
    console.log('\n--- Laptop CRUD tests completed ---');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPcCrud();