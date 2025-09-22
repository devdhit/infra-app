const { default: fetch } = require('node-fetch');

async function testAgentDelete() {
  try {
    console.log('Testing agent deletion...');
    
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

    // First, let's create an agent to delete
    console.log('Creating test agent...');
    const agentData = {
      pcName: 'TEST-PC-DELETE',
      userName: 'test.user',
      ipAddress: '192.168.1.101',
      cpu: 'Intel Core i7-11700K',
      ram: '32GB DDR4',
      os: 'Windows 11 Pro',
      harddisk: '2TB NVMe SSD',
      motherboard: 'ASUS ROG Strix B560-F',
      graphics: 'NVIDIA RTX 3080',
      macAddress: '00:1A:2B:3C:4D:5F'
    };

    const createResponse = await fetch('http://127.0.0.1:3001/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agentData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.log('Agent creation failed:', errorData);
      return;
    }

    const createdAgent = await createResponse.json();
    console.log('Agent created successfully:');
    console.log('PC ID:', createdAgent.id);
    
    // Now test the deletion
    console.log('Testing agent deletion...');
    const deleteResponse = await fetch(`http://127.0.0.1:3001/api/agents/${createdAgent.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text();
      console.log('Agent deletion failed:', errorData);
      return;
    }

    const deleteResult = await deleteResponse.json();
    console.log('Agent deletion successful:');
    console.log(deleteResult);
    
  } catch (error) {
    console.error('Error testing agent deletion:', error);
  }
}

testAgentDelete().catch(console.error);