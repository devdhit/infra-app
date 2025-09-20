const { default: fetch } = require('node-fetch');

async function testAgentAPI() {
  try {
    console.log('Testing agent API...');
    
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'adminit@localhost.com',
        password: 'password'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful!');

    // Test the agent endpoint with minimal data
    const agentData = {
      pcName: 'TestPC-' + Date.now(),
      cpu: 'Test CPU',
      ram: '8GB',
      os: 'Test OS'
    };

    console.log('Sending test data to agent API...');
    const agentResponse = await fetch('http://localhost:3001/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agentData)
    });

    if (!agentResponse.ok) {
      const errorData = await agentResponse.text();
      console.log('Agent submission failed:', errorData);
      return;
    }

    const agentDataResponse = await agentResponse.json();
    console.log('Agent API test successful:');
    console.log('PC ID:', agentDataResponse.id);
  } catch (error) {
    console.error('Error testing agent API:', error);
  }
}

testAgentAPI().catch(console.error);