const { default: fetch } = require('node-fetch');

async function testDeleteSpecificAgent() {
  try {
    console.log('Testing deletion of specific agent...');
    
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

    // List all agents to find the one we want to delete
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
    
    // Find the agent with pcName "TEST-PC-001"
    const agentToDelete = agents.find(agent => agent.pcName === 'TEST-PC-001');
    
    if (!agentToDelete) {
      console.log('Agent to delete not found');
      return;
    }
    
    console.log(`Found agent to delete: ${agentToDelete.name} (${agentToDelete.id})`);
    
    // Now test the deletion
    console.log('Testing agent deletion...');
    const deleteResponse = await fetch(`http://127.0.0.1:3001/api/agents/${agentToDelete.id}`, {
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
    
    // List agents again to confirm deletion
    console.log('Listing agents after deletion...');
    const agentsAfterDeleteResponse = await fetch('http://127.0.0.1:3001/api/agents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!agentsAfterDeleteResponse.ok) {
      const errorData = await agentsAfterDeleteResponse.text();
      console.log('Agent listing failed:', errorData);
      return;
    }

    const agentsAfterDelete = await agentsAfterDeleteResponse.json();
    console.log('Agents after deletion:');
    console.log(JSON.stringify(agentsAfterDelete, null, 2));
    
  } catch (error) {
    console.error('Error testing agent deletion:', error);
  }
}

testDeleteSpecificAgent().catch(console.error);