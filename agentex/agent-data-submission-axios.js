/**
 * Example script to demonstrate how to submit data to the Agent API using Axios
 * This script can be used by agent software to send computer configuration data
 */

const axios = require('axios');

// Configuration - Update these values for your environment
const API_BASE_URL = 'http://127.0.0.1:3001/api';
let AUTH_TOKEN = 'your-jwt-token-here';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    if (AUTH_TOKEN) {
      config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
 * Submit agent data to the ITAMS system using Axios
 * @param {Object} data - Computer configuration data
 * @returns {Promise<Object>} Response from the API
 */
async function submitAgentData(data) {
  try {
    console.log('Submitting data with token:', AUTH_TOKEN.substring(0, 20) + '...');
    
    const response = await apiClient.post('/agent', data);
    
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('API Error Response:', error.response.status, error.response.data);
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
      throw error;
    }
  }
}

/**
 * Check if the Agent API is running using Axios
 * @returns {Promise<boolean>} True if API is running
 */
async function checkApiHealth() {
  try {
    console.log('Checking health with token:', AUTH_TOKEN.substring(0, 20) + '...');
    
    const response = await apiClient.get('/agent');
    
    console.log('API Health Check:', response.data.message);
    return true;
  } catch (error) {
    if (error.response) {
      console.error('API Health Check Failed:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received for health check:', error.request);
    } else {
      console.error('Health Check Error:', error.message);
    }
    return false;
  }
}

/**
 * Login to get a valid JWT token using Axios
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} JWT token
 */
async function login(email, password) {
  try {
    console.log('Attempting login for:', email);
    
    const response = await apiClient.post('/auth/login', { email, password });
    
    console.log('Login successful!');
    return response.data.token;
  } catch (error) {
    if (error.response) {
      console.error('Login Error Response:', error.response.status, error.response.data);
      throw new Error(`Login Error: ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      console.error('No response received for login:', error.request);
      throw new Error('No response received from login server');
    } else {
      console.error('Login Error:', error.message);
      throw error;
    }
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
    AUTH_TOKEN = token;
    console.log('Token updated successfully');
    
    console.log('Checking Agent API health...');
    const isHealthy = await checkApiHealth();
    
    if (isHealthy) {
      console.log('Submitting agent data...');
      try {
        const result = await submitAgentData(agentData);
        console.log('Data submitted successfully!');
        console.log('PC ID:', result.data.id);
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