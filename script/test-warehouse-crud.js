async function testWarehouseCRUD() {
  const baseUrl = 'http://localhost:3000/api/assets/warehouse';
  const authUrl = 'http://localhost:3000/api/auth/login';
  
  try {
    // Login first to get authentication token
    console.log('Logging in...');
    const loginResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'password'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (!loginResponse.ok) {
      console.error('Failed to login:', loginResult);
      return;
    }
    
    const token = loginResult.token;
    console.log('Login successful, token acquired.');
    
    // Test creating a new warehouse item
    console.log('\nCreating a new warehouse item...');
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cpuBarcode: 'CPU123456',
        cpuSapBarcode: 'SAPCPU123456',
        monitorBarcode: 'MON123456',
        status: 'available',
        note: 'Test warehouse item'
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Create result:', createResult);
    
    if (!createResponse.ok) {
      console.error('Failed to create warehouse item:', createResult);
      return;
    }
    
    const warehouseId = createResult.id;
    console.log('Created warehouse item with ID:', warehouseId);
    
    // Test getting the warehouse item
    console.log('\nGetting the warehouse item...');
    const getResponse = await fetch(`${baseUrl}/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const getResult = await getResponse.json();
    console.log('Get result:', getResult);
    
    // Test updating the warehouse item
    console.log('\nUpdating the warehouse item...');
    const updateResponse = await fetch(`${baseUrl}/${warehouseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'in-use',
        note: 'Updated warehouse item'
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('Update result:', updateResult);
    
    // Test deleting the warehouse item
    console.log('\nDeleting the warehouse item...');
    const deleteResponse = await fetch(`${baseUrl}/${warehouseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Delete response status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      console.log('Warehouse item deleted successfully');
    } else {
      const deleteResult = await deleteResponse.json();
      console.error('Failed to delete warehouse item:', deleteResult);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testWarehouseCRUD();