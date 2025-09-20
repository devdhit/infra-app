/**
 * Debug script to test the Agent API
 */
const { default: fetch } = require('node-fetch');

async function debugAgentAPI() {
  try {
    console.log('Testing login...');
    
    // Test login
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

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful! Token:', loginData.token.substring(0, 20) + '...');

    // Test health check
    console.log('\nTesting health check...');
    const healthResponse = await fetch('http://localhost:3001/api/agent', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    console.log('Health check response status:', healthResponse.status);
    
    if (!healthResponse.ok) {
      const errorText = await healthResponse.text();
      console.log('Health check error:', errorText);
      return;
    }

    const healthData = await healthResponse.json();
    console.log('Health check successful:', healthData);

    // Test data submission
    console.log('\nTesting data submission...');
    const agentData = {
      pcName: 'DEBUG-PC-001',
      userName: 'debug.user',
      ipAddress: '192.168.1.100',
      cpu: 'Intel Core i7-11700K',
      ram: '32GB DDR4',
      os: 'Windows 11 Pro',
      harddisk: '2TB NVMe SSD',
      motherboard: 'ASUS ROG Strix B560-F',
      graphics: 'NVIDIA RTX 3080'
    };

    const submitResponse = await fetch('http://localhost:3001/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(agentData)
    });

    console.log('Submit response status:', submitResponse.status);
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.log('Submit error:', errorText);
      return;
    }

    const submitData = await submitResponse.json();
    console.log('Submit successful:', submitData);
  } catch (error) {
    console.error('Debug script error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug script
debugAgentAPI().catch(console.error);