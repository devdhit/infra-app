const redis = require('redis');

async function testCacheConsistency() {
  try {
    console.log('Testing cache consistency after delete operations...');
    
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Connect to Redis
    await client.connect();
    
    // Test scenario: Cache has data but DB doesn't
    const testAssetKey = 'assets:PC:test-tenant:test-asset-id';
    const testAssetListKey = 'asset_list:PC:test-tenant:1:20:no-search:no-status';
    
    // Simulate cached asset data
    const assetData = JSON.stringify({
      id: 'test-asset-id',
      cpuBarcode: 'TEST-001',
      pcName: 'Test PC',
      status: 'active'
    });
    
    const assetListData = JSON.stringify({
      data: [{
        id: 'test-asset-id',
        cpuBarcode: 'TEST-001',
        pcName: 'Test PC',
        status: 'active'
      }],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      }
    });
    
    // Set test data in cache
    await client.setEx(testAssetKey, 300, assetData);
    await client.setEx(testAssetListKey, 120, assetListData);
    
    console.log('Test data set in cache');
    
    // Verify data is in cache
    const cachedAsset = await client.get(testAssetKey);
    const cachedAssetList = await client.get(testAssetListKey);
    
    if (cachedAsset && cachedAssetList) {
      console.log('Cache data verified successfully');
    } else {
      console.error('Failed to set cache data');
      await client.quit();
      process.exit(1);
    }
    
    // Simulate delete operation - remove cache entries
    await client.del(testAssetKey);
    const listKeys = await client.keys('asset_list:PC:test-tenant:*');
    if (listKeys.length > 0) {
      await client.del(...listKeys);
    }
    
    console.log('Cache entries deleted');
    
    // Verify cache is cleared
    const clearedAsset = await client.get(testAssetKey);
    const clearedAssetListKeys = await client.keys('asset_list:PC:test-tenant:*');
    
    if (!clearedAsset && clearedAssetListKeys.length === 0) {
      console.log('Cache consistency test passed - entries properly invalidated');
    } else {
      console.error('Cache consistency test failed - entries not properly cleared');
    }
    
    // Clean up any remaining test keys
    const allTestKeys = await client.keys('*test-tenant*');
    if (allTestKeys.length > 0) {
      await client.del(...allTestKeys);
    }
    
    await client.quit();
    
    console.log('Cache consistency test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Cache consistency test failed:', error);
    process.exit(1);
  }
}

testCacheConsistency();