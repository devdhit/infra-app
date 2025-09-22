const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication with adminit@localhost.com / password');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'adminit@localhost.com',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('Authentication successful!');
    console.log('Response:', response.data);
    return response.data.token;
  } catch (error) {
    console.error('Authentication failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

if (require.main === module) {
  testAuth();
}