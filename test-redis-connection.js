const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  // Try to connect to Redis
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.log('Redis Client Error:', err.message);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  client.on('ready', () => {
    console.log('Redis Client Ready');
  });

  try {
    await client.connect();
    console.log('Successfully connected to Redis');
    
    // Test basic operations
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('Test key value:', value);
    
    // Test pattern deletion
    const keys = await client.keys('test_*');
    console.log('Keys matching pattern:', keys);
    
    await client.quit();
    console.log('Disconnected from Redis');
  } catch (error) {
    console.log('Failed to connect to Redis:', error.message);
    console.log('This might be because:');
    console.log('1. Redis server is not running');
    console.log('2. REDIS_URL environment variable is not set correctly');
    console.log('3. Redis is running on a different port');
  }
}

testRedisConnection();