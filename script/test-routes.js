// Simple test to check if routes are accessible
async function testRoutes() {
  const baseUrl = 'http://localhost:3000/api/assets';
  const routes = [
    '/pc/bulk-delete',
    '/laptop/bulk-delete',
    '/printer/bulk-delete',
    '/license/bulk-delete',
    '/warehouse/bulk-delete'
  ];
  
  console.log('Testing bulk delete routes accessibility...\n');
  
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${i + 1}. ${route}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Method: POST`);
      
      // Try to read response body if possible
      try {
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n`);
      } catch (e) {
        console.log(`   Response: Could not read body\n`);
      }
    } catch (error) {
      console.log(`${i + 1}. ${route}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  console.log('Route accessibility test completed!');
}

testRoutes().catch(console.error);