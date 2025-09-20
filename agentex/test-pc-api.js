const { default: fetch } = require('node-fetch');

async function testPCApi() {
  try {
    console.log('Testing PC API...');
    
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

    // Fetch the new PC data
    const pcResponse = await fetch('http://127.0.0.1:3001/api/assets/pc/72f80c67-bdc8-48f8-accc-b93677368d95', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!pcResponse.ok) {
      const errorData = await pcResponse.text();
      console.log('PC fetch failed:', errorData);
      return;
    }

    const pcData = await pcResponse.json();
    console.log('PC data:', JSON.stringify(pcData, null, 2));
    
    // Also fetch custom fields
    const customFieldsResponse = await fetch('http://127.0.0.1:3001/api/custom-fields?modelType=PC', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!customFieldsResponse.ok) {
      const errorData = await customFieldsResponse.text();
      console.log('Custom fields fetch failed:', errorData);
      return;
    }

    const customFieldsData = await customFieldsResponse.json();
    console.log('Custom fields:', JSON.stringify(customFieldsData, null, 2));
  } catch (error) {
    console.error('Error testing PC API:', error);
  }
}

testPCApi().catch(console.error);