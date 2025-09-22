/**
 * Example script to demonstrate how to submit data to the Agent API
 * This script can be used by agent software to send computer configuration data
 */

// Use node-fetch for compatibility
const { default: fetch } = require('node-fetch');

// Configuration - Update these values for your environment
const API_URL = 'http://127.0.0.1:3001/api/agent'; // Changed to use IP instead of localhost
let AUTH_TOKEN = 'your-jwt-token-here'; // Changed to let so it can be updated

// Example computer configuration data from agent software
const agentData = {
  pcName: 'SGDH-IT-DTHIEN',
  userName: 'thien.dinh',
  ipAddress: '10.1.36.31',
  cpu: 'Intel Core i5-10400',
  ram: '32GB DDR4',
  os: 'Windows 10 Pro 21H2',
  harddisk: '1TB NVMe SSD',
  motherboard: 'ASUS Prime B460M-A',
  graphics: 'Intel UHD Graphics 630'
};

/**
 * Submit agent data to the ITAMS system
 * @param {Object} data - Computer configuration data
 * @returns {Promise<Object>} Response from the API
 */
async function submitAgentData(data) {
  try {
    console.log('Submitting data with token:', AUTH_TOKEN.substring(0, 20) + '...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}` // Using the updated token
      },
      body: JSON.stringify(data)
    });

    console.log('Submit response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Submit error response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error submitting agent data:', error.message);
    throw error;
  }
}

/**
 * Check if the Agent API is running
 * @returns {Promise<boolean>} True if API is running
 */
async function checkApiHealth() {
  try {
    console.log('Checking health with token:', AUTH_TOKEN.substring(0, 20) + '...');
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}` // Using the updated token
      }
    });

    console.log('Health check response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Health check error response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('API Health Check:', result.message);
    return true;
  } catch (error) {
    console.error('API Health Check Failed:', error.message);
    return false;
  }
}

/**
 * Login to get a valid JWT token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} JWT token
 */
async function login(email, password) {
  try {
    console.log('Attempting login for:', email);
    
    const response = await fetch('http://127.0.0.1:3001/api/auth/login', { // Changed to use IP
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Login Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('Login successful!');
    return result.token;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Example usage
async function main() {
  console.log('Logging in to get JWT token...');
  try {
    // You'll need to use valid credentials from your database
    // Default admin credentials from the seed data:
    const token = await login('adminit@localhost.com', 'password');
    
    // Update the AUTH_TOKEN with the valid token
    AUTH_TOKEN = token; // Fixed: properly update the token
    console.log('Token updated successfully');
    
    console.log('Checking Agent API health...');
    const isHealthy = await checkApiHealth();
    
    if (isHealthy) {
      console.log('Submitting agent data...');
      try {
        const result = await submitAgentData(agentData);
        console.log('Data submitted successfully!');
        console.log('PC ID:', result.id);
      } catch (error) {
        console.error('Failed to submit data:', error.message);
      }
    } else {
      console.log('Agent API is not available. Please check the service.');
    }
  } catch (error) {
    console.error('Failed to login:', error.message);
    console.log('Please make sure the server is running and you have valid credentials.');
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  submitAgentData,
  checkApiHealth,
  login
};