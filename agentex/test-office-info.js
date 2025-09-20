const { default: fetch } = require('node-fetch');

async function testOfficeInfo() {
  try {
    console.log('Testing Office information submission...');
    
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

    // Submit test agent data with Office information
    const agentData = {
      pcName: 'TEST-PC-' + Date.now(),
      userName: 'testuser',
      ipAddress: '192.168.1.100',
      cpu: 'Intel Core i7',
      ram: '16GB',
      os: 'Windows 11',
      harddisk: 'SSD: 512GB',
      macAddress: '00:11:22:33:44:55',
      office: 'Microsoft Office 2019' // Office information
    };

    console.log('Submitting test data with Office information:');
    console.log(JSON.stringify(agentData, null, 2));

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
    console.log('Agent data submission successful:');
    console.log('PC ID:', agentDataResponse.id);
    console.log('Custom Fields:', JSON.stringify(agentDataResponse.customFields, null, 2));
    
    // Check if Office field was stored
    if (agentDataResponse.customFields && agentDataResponse.customFields.OFFICE) {
      console.log('✓ Office information successfully stored in custom fields');
    } else {
      console.log('⚠ Office information may not be stored - ensure OFFICE custom field exists for PC model');
    }
  } catch (error) {
    console.error('Error testing Office information:', error);
  }
}

testOfficeInfo().catch(console.error);