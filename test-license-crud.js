const https = require('https');
const http = require('http');
const fetch = require('node-fetch');

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

async function testLicenseCRUD() {
  const baseUrl = 'http://localhost:3000/api/assets/license';
  
  try {
    // Test creating a new license
    console.log('Creating a new license...');
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productType: 'Microsoft Office',
        productKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
        deviceName: 'Test Device',
        userName: 'Test User',
        dept: 'IT Department'
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Create result:', createResult);
    
    if (!createResponse.ok) {
      console.error('Failed to create license:', createResult);
      return;
    }
    
    const licenseId = createResult.data.id;
    console.log('Created license with ID:', licenseId);
    
    // Test getting the license
    console.log('\nGetting the license...');
    const getResponse = await fetch(`${baseUrl}/${licenseId}`);
    const getResult = await getResponse.json();
    console.log('Get result:', getResult);
    
    // Test updating the license
    console.log('\nUpdating the license...');
    const updateResponse = await fetch(`${baseUrl}/${licenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productType: 'Microsoft Office 365',
        userName: 'Updated User'
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('Update result:', updateResult);
    
    // Test deleting the license
    console.log('\nDeleting the license...');
    const deleteResponse = await fetch(`${baseUrl}/${licenseId}`, {
      method: 'DELETE'
    });
    
    console.log('Delete response status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      console.log('License deleted successfully');
    } else {
      const deleteResult = await deleteResponse.json();
      console.error('Failed to delete license:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

async function testPcCrud() {
  try {
    console.log('Testing License CRUD operations...');
    
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
    
    // Test 1: Create a new License asset
    console.log('\n--- Test 1: Create a new License asset ---');
    const newLicenseData = JSON.stringify({
      deviceName: 'Microsoft Office 365',
      productKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      userName: 'John Doe',
      productType: 'Productivity Suite',
      updateStatus: 'active'
    });
    
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/license',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(newLicenseData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const createResponse = await makeRequest(createOptions, newLicenseData);
    console.log('Create License Status Code:', createResponse.statusCode);
    console.log('Create License Response:', createResponse.data);
    
    if (createResponse.statusCode !== 201) {
      console.log('Failed to create License asset');
      return;
    }
    
    const createdLicense = JSON.parse(createResponse.data);
    const licenseId = createdLicense.id;
    console.log('License created with ID:', licenseId);
    
    // Test 2: Get the created License asset
    console.log('\n--- Test 2: Get the created License asset ---');
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/license/${licenseId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    console.log('Get License Status Code:', getResponse.statusCode);
    console.log('Get License Response:', getResponse.data);
    
    // Test 3: Update the License asset
    console.log('\n--- Test 3: Update the License asset ---');
    const updateLicenseData = JSON.stringify({
      userName: 'Jane Smith',
      updateStatus: 'expired'
    });
    
    const updateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/license/${licenseId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateLicenseData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const updateResponse = await makeRequest(updateOptions, updateLicenseData);
    console.log('Update License Status Code:', updateResponse.statusCode);
    console.log('Update License Response:', updateResponse.data);
    
    // Test 4: Get all License assets to verify the update
    console.log('\n--- Test 4: Get all License assets ---');
    const getAllOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets/license',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getAllResponse = await makeRequest(getAllOptions);
    console.log('Get All Licenses Status Code:', getAllResponse.statusCode);
    
    if (getAllResponse.statusCode === 200) {
      const allLicenses = JSON.parse(getAllResponse.data);
      console.log('Total License assets:', allLicenses.pagination.total);
      
      // Find our updated License in the list
      const updatedLicense = allLicenses.data.find(license => license.id === licenseId);
      if (updatedLicense) {
        console.log('Updated License found in list:');
        console.log('- User Name:', updatedLicense.userName);
        console.log('- Update Status:', updatedLicense.updateStatus);
      } else {
        console.log('Updated License not found in list');
      }
    }
    
    // Test 5: Delete the License asset
    console.log('\n--- Test 5: Delete the License asset ---');
    const deleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/license/${licenseId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const deleteResponse = await makeRequest(deleteOptions);
    console.log('Delete License Status Code:', deleteResponse.statusCode);
    console.log('Delete License Response:', deleteResponse.data);
    
    // Test 6: Verify the License asset is deleted
    console.log('\n--- Test 6: Verify the License asset is deleted ---');
    const verifyDeleteOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/assets/license/${licenseId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const verifyDeleteResponse = await makeRequest(verifyDeleteOptions);
    console.log('Verify Delete License Status Code:', verifyDeleteResponse.statusCode);
    
    if (verifyDeleteResponse.statusCode === 404) {
      console.log('License asset successfully deleted');
    } else {
      console.log('License asset was not deleted');
    }
    
    console.log('\n--- License CRUD tests completed ---');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPcCrud();