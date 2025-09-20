/**
 * Test script to verify that the agent API correctly identifies and updates PCs by MAC address
 */

const API_URL = 'http://localhost:3001/api/agent';

// Test data for a PC with MAC address
const testData1 = {
  pcName: 'TEST-PC-001',
  userName: 'testuser',
  ipAddress: '192.168.1.100',
  cpu: 'Intel Core i7',
  ram: '16GB',
  os: 'Windows 11',
  macAddress: '00:11:22:33:44:55',
  harddisk: '512GB SSD'
};

// Updated test data with same MAC but different pcName
const testData2 = {
  pcName: 'RENAMED-PC-001', // Changed name
  userName: 'newuser', // Changed user
  ipAddress: '192.168.1.101', // Changed IP
  cpu: 'Intel Core i7',
  ram: '16GB',
  os: 'Windows 11',
  macAddress: '00:11:22:33:44:55', // Same MAC
  harddisk: '1TB SSD' // Changed disk
};

async function submitAgentData(data) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', result);
    return { status: response.status, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { status: 0, error };
  }
}

async function runTest() {
  console.log('=== Testing PC Update by MAC Address ===\n');
  
  console.log('1. Submitting initial PC data...');
  const result1 = await submitAgentData(testData1);
  
  if (result1.status !== 201) {
    console.log('❌ Failed to create initial PC');
    return;
  }
  
  console.log('✅ Initial PC created successfully\n');
  const initialPCId = result1.data.id;
  
  console.log('2. Submitting updated data with same MAC but different pcName...');
  const result2 = await submitAgentData(testData2);
  
  if (result2.status !== 201) {
    console.log('❌ Failed to update PC');
    return;
  }
  
  console.log('✅ PC data submitted successfully\n');
  const updatedPCId = result2.data.id;
  
  // Check if the same PC was updated (same ID)
  if (initialPCId === updatedPCId) {
    console.log('✅ SUCCESS: Same PC was updated (IDs match)');
    console.log(`   PC ID: ${initialPCId}`);
    console.log(`   Original PC Name: ${testData1.pcName}`);
    console.log(`   Updated PC Name: ${testData2.pcName}`);
  } else {
    console.log('❌ FAILURE: Different PC was created instead of updating');
    console.log(`   Initial PC ID: ${initialPCId}`);
    console.log(`   Updated PC ID: ${updatedPCId}`);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { submitAgentData, runTest };