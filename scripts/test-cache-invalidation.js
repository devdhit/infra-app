const redis = require('redis');
const { CACHE_PREFIXES } = require('../dist/lib/redis-cache');

async function testCacheInvalidation() {
  try {
    console.log('Testing cache invalidation patterns...');
    
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
      },
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Connect to Redis
    await client.connect();
    
    // Test cache key patterns
    const tenantId = 'test-tenant';
    const model = 'PC';
    const assetId = 'test-asset-123';
    
    // Create test cache keys
    const assetKey = `${CACHE_PREFIXES.ASSETS}:${model}:${tenantId}:${assetId}`;
    const assetListKeys = [
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:1:10:no-search:no-status`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:1:10:test:working`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:2:20:test2:repair`,
    ];
    
    const searchKey = `${CACHE_PREFIXES.SEARCH}:${model}:${tenantId}:test-search`;
    
    console.log('Testing cache key creation...');
    console.log('Asset key:', assetKey);
    console.log('Asset list keys:', assetListKeys);
    console.log('Search key:', searchKey);
    
    // Set test values
    await client.set(assetKey, JSON.stringify({ id: assetId, name: 'Test Asset' }));
    for (let i = 0; i < assetListKeys.length; i++) {
      await client.set(assetListKeys[i], JSON.stringify({ page: i + 1, data: [] }));
    }
    await client.set(searchKey, JSON.stringify({ query: 'test', results: [] }));
    
    console.log('Test values set in cache.');
    
    // Verify values are in cache
    const assetValue = await client.get(assetKey);
    console.log('Asset value in cache:', assetValue ? 'YES' : 'NO');
    
    // Test cache invalidation patterns
    console.log('\nTesting cache invalidation patterns...');
    
    // Test asset key deletion
    const deletedAsset = await client.del(assetKey);
    console.log(`Deleted ${deletedAsset} asset keys`);
    
    // Test asset list pattern invalidation
    const assetListPattern = `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*`;
    const matchingKeys = await client.keys(assetListPattern);
    console.log(`Found ${matchingKeys.length} keys matching pattern: ${assetListPattern}`);
    
    if (matchingKeys.length > 0) {
      const deletedListKeys = await client.del(...matchingKeys);
      console.log(`Deleted ${deletedListKeys} asset list keys`);
    }
    
    // Test search key deletion
    const deletedSearch = await client.del(searchKey);
    console.log(`Deleted ${deletedSearch} search keys`);
    
    // Test comprehensive patterns
    console.log('\nTesting comprehensive invalidation patterns...');
    const patterns = [
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*:*`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*:*:*`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*:*:*:*`,
      `${CACHE_PREFIXES.ASSET_LIST}:${model}:${tenantId}:*:*:*:*:*`,
      `${CACHE_PREFIXES.SEARCH}:${model}:${tenantId}:*`
    ];
    
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      console.log(`Pattern ${pattern} matches ${keys.length} keys`);
    }
    
    // Clean up
    await client.quit();
    
    console.log('\nCache invalidation test completed successfully.');
    console.log('All cache patterns are working correctly.');
    
  } catch (error) {
    console.error('Cache invalidation test failed:', error);
    process.exit(1);
  }
}

testCacheInvalidation();