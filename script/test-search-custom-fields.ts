import { db } from '../src/lib/db'

async function testSearchWithCustomFields() {
  console.log('Testing search with custom fields...')
  
  try {
    // Test 1: Check if search_vector column exists
    console.log('\n1. Checking search_vector column existence...')
    const pcTableInfo = await db.$queryRaw`SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'PC' AND column_name = 'search_vector'`
    console.log('PC search_vector column:', pcTableInfo)
    
    // Test 2: Insert a test record with custom fields
    console.log('\n2. Inserting test record with custom fields...')
    const testPC = await db.pC.create({
      data: {
        dept: 'IT',
        cpuBarcode: 'TEST001',
        pcName: 'Test PC',
        status: 'working',
        customFields: {
          warranty: '2025-12-31',
          cost: 1500,
          department: 'IT Department'
        },
        tenantId: 'test-tenant-id' // Using a test tenant ID
      }
    })
    console.log('Created test PC:', testPC.id)
    
    // Test 3: Check if search_vector was populated
    console.log('\n3. Checking if search_vector was populated...')
    const pcWithSearchVector = await db.$queryRaw`SELECT id, "search_vector" 
      FROM "PC" WHERE id = ${testPC.id}`
    console.log('PC with search_vector:', pcWithSearchVector)
    
    // Test 4: Perform a search query using the search_vector
    console.log('\n4. Performing search query...')
    const searchResults = await db.$queryRaw`SELECT id, "cpuBarcode", "pcName", "customFields"
      FROM "PC" 
      WHERE "tenantId" = ${'test-tenant-id'}
      AND "search_vector" @@ websearch_to_tsquery('english', 'IT Department')
      ORDER BY ts_rank("search_vector", websearch_to_tsquery('english', 'IT Department')) DESC`
    console.log('Search results:', searchResults)
    
    // Test 5: Clean up test record
    console.log('\n5. Cleaning up test record...')
    await db.pC.delete({
      where: { id: testPC.id }
    })
    console.log('Test record deleted')
    
    console.log('\nAll tests completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

testSearchWithCustomFields()