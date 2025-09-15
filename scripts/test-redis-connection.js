const redis = require('redis');

async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            return new Error('Redis max retries exceeded');
          }
          // Exponential backoff
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
      },
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
    
    // Test with TTL
    await client.setEx('test-key-ttl', 5, 'test-value-ttl');
    const valueWithTTL = await client.get('test-key-ttl');
    console.log('Retrieved value with TTL:', valueWithTTL);
    
    // Test keys pattern matching
    const keys = await client.keys('test-key*');
    console.log('Matching keys:', keys);
    
    // Clean up
    await client.del('test-key', 'test-key-ttl');
    await client.quit();
    
    console.log('Redis connection test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Redis connection test failed:', error);
    process.exit(1);
  }
}

testRedisConnection();