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

async function testPrinterAllFields() {
  try {
    console.log('Testing Printer creation with all valid fields...');
    
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
    
    if (loginResponse.statusCode !== 200) {
      console.log('Login failed:', loginResponse.data);
      return;
    }
    
    const loginResult = JSON.parse(loginResponse.data);
    const token = loginResult.token;
    console.log('Login successful, token acquired.');
    
    // Test: Create a new Printer asset with all valid fields
    console.log('\n--- Test: Create a new Printer asset with all valid fields ---');
    const newPrinterData = JSON.stringify({
      dept: 'IT Department',
      barcode: 'PRINTER016-' + Date.now(), // Make it unique
      color: false,
      sapCode: 'SAP004',
      model: 'HP LaserJet Pro 400',
      location: 'Building A, Floor 2, Room 201',
      ip: '192.168.1.100',
      note: 'This is a test printer',
      // Not sending status to use default value
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
    
    if (createResponse.statusCode === 201) {
      console.log('Printer created successfully!');
      const createdPrinter = JSON.parse(createResponse.data);
      console.log('Printer ID:', createdPrinter.id);
      console.log('Printer Status:', createdPrinter.status);
    } else {
      console.log('Failed to create Printer asset');
    }
    
    console.log('\n--- Printer all fields test completed ---');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPrinterAllFields();