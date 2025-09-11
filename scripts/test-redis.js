const redis = require('redis');

async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    // Connect to Redis
    await client.connect();
    
    // Test setting and getting a value
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    
    console.log('Redis test successful!');
    console.log('Retrieved value:', value);
    
    // Clean up
    await client.del('test-key');
    await client.quit();
    
    console.log('Redis connection test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Redis connection test failed:', error);
    process.exit(1);
  }
}

testRedisConnection();