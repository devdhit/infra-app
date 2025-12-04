/**
 * Enhanced Search Feature Test Script
 * 
 * This script tests the enhanced search functionality across all layers
 */

import { db } from '../src/lib/db';
import {
  executeEnhancedSearch,
  getSearchSuggestions,
  getFilterOptions,
} from '../src/lib/search/search-service';
import searchCacheManager from '../src/lib/search/search-cache';

const TEST_TENANT_ID = 'test-tenant-id';
const TEST_USER_ID = 'test-user-id';

/**
 * Test search functionality for all asset types
 */
async function testSearchAllAssetTypes() {
  console.log('\n=== Testing Search Across All Asset Types ===\n');

  const assetTypes = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet'];
  
  for (const assetType of assetTypes) {
    try {
      console.log(`\nTesting ${assetType}...`);
      
      // Test basic search
      const searchTerm = 'test';
      const results = await executeEnhancedSearch(
        assetType,
        searchTerm,
        TEST_TENANT_ID,
        TEST_USER_ID,
        { page: 1, limit: 5 }
      );
      
      console.log(`  ✓ Search completed: ${results.total} results found`);
      console.log(`  ✓ Page ${results.page} of ${results.totalPages}`);
      console.log(`  ✓ Has more: ${results.hasMore}`);
      
      // Test filter options
      const filterOptions = await getFilterOptions(assetType, TEST_TENANT_ID);
      console.log(`  ✓ Filter options loaded: ${Object.keys(filterOptions).length} filters`);
      
      // Test suggestions
      const suggestions = await getSearchSuggestions(
        TEST_TENANT_ID,
        TEST_USER_ID,
        assetType,
        searchTerm
      );
      console.log(`  ✓ Suggestions loaded: ${suggestions.length} suggestions`);
      
    } catch (error: any) {
      console.error(`  ✗ Error testing ${assetType}:`, error.message);
    }
  }
}

/**
 * Test cache functionality
 */
async function testCacheFeatures() {
  console.log('\n=== Testing Cache Features ===\n');

  try {
    // Test search caching
    console.log('Testing search result caching...');
    await searchCacheManager.cacheSearchResults(
      TEST_TENANT_ID,
      'pc',
      'test query',
      [{ id: '1', name: 'Test PC' }],
      1,
      {},
      1,
      20
    );
    
    const cached = await searchCacheManager.getCachedSearch(
      TEST_TENANT_ID,
      'pc',
      'test query',
      {},
      1,
      20
    );
    
    if (cached) {
      console.log('  ✓ Search results cached and retrieved successfully');
    } else {
      console.log('  ⚠ Cache may not be available (Redis not connected)');
    }

    // Test search history
    console.log('Testing search history...');
    await searchCacheManager.addToSearchHistory(
      TEST_TENANT_ID,
      TEST_USER_ID,
      'pc',
      'test history query'
    );
    
    const history = await searchCacheManager.getSearchHistory(
      TEST_TENANT_ID,
      TEST_USER_ID,
      'pc'
    );
    
    console.log(`  ✓ Search history: ${history.length} items`);

    // Test suggestions
    console.log('Testing search suggestions...');
    await searchCacheManager.updateSearchSuggestions(
      TEST_TENANT_ID,
      'pc',
      'popular search'
    );
    
    const suggestions = await searchCacheManager.getSearchSuggestions(
      TEST_TENANT_ID,
      'pc'
    );
    
    console.log(`  ✓ Search suggestions: ${suggestions.length} items`);

  } catch (error: any) {
    console.error('  ✗ Cache test error:', error.message);
  }
}

/**
 * Test search with filters
 */
async function testSearchWithFilters() {
  console.log('\n=== Testing Search with Filters ===\n');

  try {
    console.log('Testing search with status filter...');
    const results = await executeEnhancedSearch(
      'pc',
      'test',
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        page: 1,
        limit: 10,
        filters: {
          status: 'active',
        },
      }
    );
    
    console.log(`  ✓ Filtered search completed: ${results.total} results`);
    
    console.log('Testing search with date range...');
    const dateResults = await executeEnhancedSearch(
      'laptop',
      'test',
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        page: 1,
        limit: 10,
        filters: {
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        },
      }
    );
    
    console.log(`  ✓ Date range search completed: ${dateResults.total} results`);

  } catch (error: any) {
    console.error('  ✗ Filter test error:', error.message);
  }
}

/**
 * Test pagination
 */
async function testPagination() {
  console.log('\n=== Testing Pagination ===\n');

  try {
    console.log('Testing pagination...');
    
    // Page 1
    const page1 = await executeEnhancedSearch(
      'pc',
      'test',
      TEST_TENANT_ID,
      TEST_USER_ID,
      { page: 1, limit: 5 }
    );
    
    console.log(`  ✓ Page 1: ${page1.data.length} results`);
    console.log(`  ✓ Total: ${page1.total}, Total Pages: ${page1.totalPages}`);
    console.log(`  ✓ Has More: ${page1.hasMore}`);
    
    if (page1.hasMore) {
      // Page 2
      const page2 = await executeEnhancedSearch(
        'pc',
        'test',
        TEST_TENANT_ID,
        TEST_USER_ID,
        { page: 2, limit: 5 }
      );
      
      console.log(`  ✓ Page 2: ${page2.data.length} results`);
    }

  } catch (error: any) {
    console.error('  ✗ Pagination test error:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Enhanced Search Feature Test Suite                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testSearchAllAssetTypes();
    await testCacheFeatures();
    await testSearchWithFilters();
    await testPagination();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     All Tests Completed                                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Note: Some tests may show warnings if Redis is not configured.');
    console.log('This is expected - the search feature will work without Redis,');
    console.log('but with reduced caching performance.\n');

  } catch (error: any) {
    console.error('\n✗ Test suite error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
