/**
 * Test edge cases for the agent API MAC address functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEdgeCases() {
  console.log('=== Agent API Edge Cases Test ===\n');
  
  // Test 1: PC with no MAC address (should work as before)
  console.log('1. Testing PC without MAC address...');
  
  const testDataNoMAC = {
    pcName: 'NO-MAC-PC',
    userName: 'nomacuser',
    ipAddress: '192.168.20.100',
    cpu: 'AMD Ryzen 5',
    ram: '16GB',
    os: 'Windows 11'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDataNoMAC)
    });
    
    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ PC without MAC created successfully');
      console.log('   PC ID:', result.id);
    } else {
      console.log('❌ Failed to create PC without MAC:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: PC with empty MAC address
  console.log('\n2. Testing PC with empty MAC address...');
  
  const testDataEmptyMAC = {
    pcName: 'EMPTY-MAC-PC',
    userName: 'emptymacuser',
    ipAddress: '192.168.20.101',
    cpu: 'AMD Ryzen 7',
    ram: '32GB',
    os: 'Windows 11',
    macAddress: '' // Empty MAC
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDataEmptyMAC)
    });
    
    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ PC with empty MAC handled correctly');
    } else {
      console.log('ℹ️  Expected behavior for empty MAC:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Multiple PCs with same name but different MACs (should create separate records)
  console.log('\n3. Testing same name, different MACs...');
  
  const testDataSameName1 = {
    pcName: 'DUPLICATE-NAME-PC',
    userName: 'user1',
    ipAddress: '192.168.30.100',
    cpu: 'Intel Core i3',
    ram: '4GB',
    os: 'Windows 10',
    macAddress: '11:22:33:44:55:66'
  };
  
  const testDataSameName2 = {
    pcName: 'DUPLICATE-NAME-PC', // Same name
    userName: 'user2', // Different user
    ipAddress: '192.168.30.101', // Different IP
    cpu: 'Intel Core i5',
    ram: '8GB',
    os: 'Windows 11',
    macAddress: 'AA:BB:CC:DD:EE:FF' // Different MAC
  };
  
  try {
    // Submit first PC
    console.log('   Creating first PC with name DUPLICATE-NAME-PC...');
    const response1 = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDataSameName1)
    });
    
    const result1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    
    if (response1.status === 201) {
      console.log('✅ First PC created successfully');
      console.log('   PC ID:', result1.id);
    }
    
    // Submit second PC
    console.log('   Creating second PC with same name but different MAC...');
    const response2 = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDataSameName2)
    });
    
    const result2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    
    if (response2.status === 201) {
      console.log('✅ Second PC created successfully');
      console.log('   PC ID:', result2.id);
      
      // Check if they have different IDs (should be separate records)
      if (result1.id !== result2.id) {
        console.log('✅ Correctly created separate records for different MACs');
      } else {
        console.log('❌ Incorrectly updated existing record instead of creating new one');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n=== Edge Cases Test Complete ===');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEdgeCases()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { testEdgeCases };