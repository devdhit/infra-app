import { NextRequest } from 'next/server'
import logger from '@/lib/logger'
import { CACHE_PREFIXES } from '@/lib/redis-cache'
import cacheManager from '@/lib/cache-manager'

// Test the invalidateResource method for all asset types
export async function GET(_request: NextRequest) {
  try {
    // Test data
    const tenantId = 'test-tenant-id'
    const assetTypes = ['PC', 'Laptop', 'Printer', 'License', 'WarehouseIT', 'Internet']
    
    logger.info('Testing invalidateResource method for all asset types')

    // Track results for each asset type
    const results = []

    for (const assetType of assetTypes) {
      logger.info(`Testing asset type: ${assetType}`)

      // 1. Create cache entries for this asset type
      const testKeys = [
        // Asset cache
        cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSETS,
          assetType,
          tenantId,
          'test-asset-id'
        ),
        // Asset list cache with hyphens in search parameter
        cacheManager.createCompositeKey(
          CACHE_PREFIXES.ASSET_LIST,
          assetType,
          tenantId,
          1, // page
          10, // limit
          'test-search-term', // search with multiple hyphens
          'active-status'
        )
      ]
      
      // Set cache entries
      for (const key of testKeys) {
        await cacheManager.set(key, { test: 'data', key, assetType }, 60)
      }
      
      logger.info(`Cache entries set for ${assetType}`, { count: testKeys.length })

      // 2. Verify cache entries were set
      const cacheStatusBefore = await Promise.all(
        testKeys.map(key => cacheManager.get(key))
      )
      const allCachedBefore = cacheStatusBefore.every(item => !!item)
      logger.info(`Cache status before invalidation for ${assetType}`, { allCached: allCachedBefore })

      // 3. Test the invalidateResource method
      await cacheManager.invalidateResource(tenantId, assetType, { component: 'cache-test' })
      
      logger.info(`Cache invalidation completed for ${assetType}`)

      // 4. Verify cache entries were invalidated
      const cacheStatusAfter = await Promise.all(
        testKeys.map(key => cacheManager.get(key))
      )
      const allInvalidated = cacheStatusAfter.every(item => !item)
      logger.info(`Cache status after invalidateResource for ${assetType}`, { allInvalidated })
      
      // Store results
      results.push({
        assetType,
        allCachedBefore,
        allInvalidated,
        testKeys: testKeys.length
      })
    }

    // Summary
    const allAssetTypesWorking = results.every(result => result.allInvalidated)
    logger.info('Overall test results', { allAssetTypesWorking, results })

    return Response.json({
      success: true,
      message: 'invalidateResource test completed for all asset types',
      timestamp: new Date().toISOString(),
      testResults: {
        allAssetTypesWorking,
        results
      }
    })
  } catch (error: any) {
    logger.error('invalidateResource test failed:', { 
      error: error.message, 
      stack: error.stack 
    })
    
    return Response.json({
      success: false,
      message: 'invalidateResource test failed: ' + error.message,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}