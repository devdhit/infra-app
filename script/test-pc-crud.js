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
    console.log('Testing PC CRUD operations...');
    
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
    
    // Test 1: Create a new PC asset
    console.log('\n--- Test 1: Create a new PC asset ---');
    const newPcData = JSON.stringify({
      dept: 'IT',
      cpuBarcode: 'PC004-' + Date.now(), // Make it unique
      cpuSapBarcode: 'SAP004',
      pcName: 'IT-PC-004',
      status: 'working',
      note: 'New test PC'
    });
    
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/pc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newPcData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const createResponse = await makeRequest(createOptions, newPcData);
    console.log('Create PC Status Code:', createResponse.statusCode);
    console.log('Create PC Response:', createResponse.data);
    
    if (createResponse.statusCode !== 201) {
      console.log('Failed to create PC asset');
      return;
    }
    
    const createdPc = JSON.parse(createResponse.data);
    const pcId = createdPc.id;
    console.log('PC created with ID:', pcId);
    
    // Test 2: Get the created PC asset
    console.log('\n--- Test 2: Get the created PC asset ---');
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/pc/${pcId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    console.log('Get PC Status Code:', getResponse.statusCode);
    console.log('Get PC Response:', getResponse.data);
    
    // Test 3: Update the PC asset
    console.log('\n--- Test 3: Update the PC asset ---');
    const updatePcData = JSON.stringify({
      note: 'Updated test PC',
      status: 'maintenance'
    });
    
    const updateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/pc/${pcId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updatePcData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const updateResponse = await makeRequest(updateOptions, updatePcData);
    console.log('Update PC Status Code:', updateResponse.statusCode);
    console.log('Update PC Response:', updateResponse.data);
    
    // Test 4: Get all PC assets to verify the update
    console.log('\n--- Test 4: Get all PC assets ---');
    const getAllOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/pc',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getAllResponse = await makeRequest(getAllOptions);
    console.log('Get All PCs Status Code:', getAllResponse.statusCode);
    
    if (getAllResponse.statusCode === 200) {
      const allPcs = JSON.parse(getAllResponse.data);
      console.log('Total PC assets:', allPcs.pagination.total);
      
      // Find our updated PC in the list
      const updatedPc = allPcs.data.find(pc => pc.id === pcId);
      if (updatedPc) {
        console.log('Updated PC found in list:');
        console.log('- Note:', updatedPc.note);
        console.log('- Status:', updatedPc.status);
      } else {
        console.log('Updated PC not found in list');
      }
    }
    
    // Test 5: Delete the PC asset
    console.log('\n--- Test 5: Delete the PC asset ---');
    const deleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/pc/${pcId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const deleteResponse = await makeRequest(deleteOptions);
    console.log('Delete PC Status Code:', deleteResponse.statusCode);
    console.log('Delete PC Response:', deleteResponse.data);
    
    // Test 6: Verify the PC asset is deleted
    console.log('\n--- Test 6: Verify the PC asset is deleted ---');
    const verifyDeleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/pc/${pcId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const verifyDeleteResponse = await makeRequest(verifyDeleteOptions);
    console.log('Verify Delete PC Status Code:', verifyDeleteResponse.statusCode);
    
    if (verifyDeleteResponse.statusCode === 404) {
      console.log('PC asset successfully deleted');
    } else {
      console.log('PC asset was not deleted');
    }
    
    console.log('\n--- PC CRUD tests completed ---');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPcCrud();