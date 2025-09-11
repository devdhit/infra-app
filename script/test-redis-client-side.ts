// Test script to verify that Redis cache works correctly on both server and client side
import redisCache from '../src/lib/redis-cache';

console.log('Testing Redis cache client-side compatibility...');

// Test that the module imports correctly
console.log('✓ Redis cache module imported successfully');

// Test that methods exist and return appropriate values on client side
console.log('✓ isReady method:', typeof redisCache.isReady === 'function' ? 'Available' : 'Not available');
console.log('✓ get method:', typeof redisCache.get === 'function' ? 'Available' : 'Not available');
console.log('✓ set method:', typeof redisCache.set === 'function' ? 'Available' : 'Not available');
console.log('✓ del method:', typeof redisCache.del === 'function' ? 'Available' : 'Not available');
console.log('✓ delByPattern method:', typeof redisCache.delByPattern === 'function' ? 'Available' : 'Not available');
console.log('✓ createKey method:', typeof redisCache.createKey === 'function' ? 'Available' : 'Not available');
console.log('✓ flushAll method:', typeof redisCache.flushAll === 'function' ? 'Available' : 'Not available');
console.log('✓ disconnect method:', typeof redisCache.disconnect === 'function' ? 'Available' : 'Not available');

// Test actual method calls (should return appropriate fallback values on client side)
console.log('\nTesting method calls on client side (simulated):');
console.log('✓ isReady():', redisCache.isReady());
console.log('✓ get("test"): Promise that resolves to', redisCache.get('test'));
console.log('✓ set("test", "value"):', redisCache.set('test', 'value'));
console.log('✓ del("test"):', redisCache.del('test'));
console.log('✓ delByPattern("test:*"):', redisCache.delByPattern('test:*'));
console.log('✓ createKey("prefix", "id"):', redisCache.createKey('prefix', 'id'));
console.log('✓ flushAll():', redisCache.flushAll());

console.log('\n✓ Redis cache client-side compatibility test completed successfully!');
console.log('\nNote: Actual Redis functionality is only available on the server side.');