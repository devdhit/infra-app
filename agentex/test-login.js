const { default: fetch } = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'adminit@localhost.com',
        password: 'password'
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Login successful! Token:', data.token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testLogin().catch(console.error);