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

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const postData = JSON.stringify({
      email: 'admin@demo.com',
      password: 'password'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Status Code:', response.statusCode);
    console.log('Response:', response.data);
    
    // If login is successful, try to access the PC assets API
    if (response.statusCode === 200) {
      const loginData = JSON.parse(response.data);
      console.log('Login successful, testing PC assets API...');
      
      const pcOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/assets/pc',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      };
      
      const pcResponse = await makeRequest(pcOptions);
      console.log('PC Assets Status Code:', pcResponse.statusCode);
      console.log('PC Assets Response:', pcResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();