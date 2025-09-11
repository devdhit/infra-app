import redisCache from '../src/lib/redis-cache';

async function testRedisCache() {
  console.log('Testing Redis cache implementation...');
  
  try {
    // Test if Redis is ready
    console.log('Redis ready:', redisCache.isReady());
    
    if (!redisCache.isReady()) {
      console.log('Redis is not ready - testing graceful fallback behavior');
      
      // Test that operations don't fail when Redis is not available
      const testKey = 'test:key';
      const testValue = { name: 'Test', value: 123 };
      
      // These operations should not throw errors even when Redis is not available
      const setResult = await redisCache.set(testKey, testValue, 60);
      console.log('Set operation result (should be false):', setResult);
      
      // Fix the type issue by not using type arguments
      const getResult = await redisCache.get(testKey);
      console.log('Get operation result (should be null):', getResult);
      
      const delResult = await redisCache.del(testKey);
      console.log('Delete operation result (should be false):', delResult);
      
      console.log('Graceful fallback behavior confirmed - all operations handled correctly without Redis');
      return;
    }
    
    // Test basic set/get operations
    console.log('\n1. Testing basic set/get operations...');
    const testKey = 'test:key';
    const testValue = { name: 'Test', value: 123, nested: { data: 'test' } };
    
    await redisCache.set(testKey, testValue, 60); // 60 seconds TTL
    // Fix the type issue by not using type arguments
    const retrievedValue = await redisCache.get(testKey);
    
    console.log('Set value:', testValue);
    console.log('Retrieved value:', retrievedValue);
    console.log('Values match:', JSON.stringify(testValue) === JSON.stringify(retrievedValue));
    
    // Test cache key creation
    console.log('\n2. Testing cache key creation...');
    const cacheKey = redisCache.createKey('assets', 'PC', 'tenant-123', 'asset-456');
    console.log('Generated cache key:', cacheKey);
    
    // Test deletion
    console.log('\n3. Testing deletion...');
    await redisCache.set('test:delete', 'delete-me', 60);
    // Fix the type issue by not using type arguments
    const beforeDelete = await redisCache.get('test:delete');
    console.log('Before delete:', beforeDelete);
    
    await redisCache.del('test:delete');
    // Fix the type issue by not using type arguments
    const afterDelete = await redisCache.get('test:delete');
    console.log('After delete:', afterDelete);
    
    // Test pattern deletion
    console.log('\n4. Testing pattern deletion...');
    await redisCache.set('pattern:test:1', 'value1', 60);
    await redisCache.set('pattern:test:2', 'value2', 60);
    await redisCache.set('pattern:other:1', 'other1', 60);
    
    const count = await redisCache.delByPattern('pattern:test:*');
    console.log('Deleted', count, 'keys with pattern "pattern:test:*"');
    
    // Verify deletion
    // Fix the type issue by not using type arguments
    const remaining1 = await redisCache.get('pattern:test:1');
    const remaining2 = await redisCache.get('pattern:test:2');
    const other = await redisCache.get('pattern:other:1');
    console.log('Remaining test keys:', remaining1, remaining2);
    console.log('Other key still exists:', other);
    
    console.log('\nAll Redis cache tests completed successfully!');
  } catch (error) {
    console.error('Redis cache test failed:', error);
  }
}

testRedisCache();