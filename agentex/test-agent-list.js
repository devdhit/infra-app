const { default: fetch } = require('node-fetch');

async function testAgentList() {
  try {
    console.log('Testing agent listing...');
    
    // First, login to get a token
    const loginResponse = await fetch('http://127.0.0.1:3001/api/auth/login', {
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

    // List all agents
    const agentsResponse = await fetch('http://127.0.0.1:3001/api/agents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!agentsResponse.ok) {
      const errorData = await agentsResponse.text();
      console.log('Agent listing failed:', errorData);
      return;
    }

    const agents = await agentsResponse.json();
    console.log('Current agents:');
    console.log(JSON.stringify(agents, null, 2));
    
  } catch (error) {
    console.error('Error testing agent listing:', error);
  }
}

testAgentList().catch(console.error);