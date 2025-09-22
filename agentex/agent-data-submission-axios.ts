/**
 * Example script to demonstrate how to submit data to the Agent API using Axios
 * This script can be used by agent software to send computer configuration data
 */

import axios, { AxiosInstance } from 'axios';

// Configuration - Update these values for your environment
const API_URL = 'http://localhost:3000/api/agent';
const AUTH_TOKEN = 'your-jwt-token-here';

// Create an axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
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

// Define the interface for agent data
interface AgentData {
  pcName: string;
  userName?: string;
  ipAddress?: string;
  cpu: string;
  ram: string;
  os: string;
  harddisk?: string;
  motherboard?: string;
  graphics?: string;
  macAddress?: string; // Add MAC address field
  [key: string]: any; // Allow additional custom fields
}

/**
 * Submit agent data to the ITAMS system using Axios
 * @param data - Computer configuration data
 * @returns Response from the API
 */
async function submitAgentData(data: AgentData): Promise<any> {
  try {
    const response = await apiClient.post('', data); // POST to base URL
    console.log('Success:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
      throw new Error(`API Error: ${error.response?.data?.error || error.message}`);
    } else {
      console.error('Error submitting agent data:', error.message);
      throw error;
    }
  }
}

/**
 * Check if the Agent API is running using Axios
 * @returns True if API is running
 */
async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get(''); // GET to base URL
    console.log('API Health Check:', response.data.message);
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('API Health Check Failed:', error.response?.data || error.message);
    } else {
      console.error('API Health Check Failed:', error.message);
    }
    return false;
  }
}

// Example usage
async function main() {
  console.log('Checking Agent API health...');
  const isHealthy = await checkApiHealth();
  
  if (isHealthy) {
    // Example computer configuration data from agent software
    const agentData: AgentData = {
      pcName: 'SGDH-IT-DTHIEN',
      userName: 'thien.dinh',
      ipAddress: '10.1.36.31',
      cpu: 'Intel Core i5-10400',
      ram: '32GB DDR4',
      os: 'Windows 10 Pro 21H2',
      harddisk: '1TB NVMe SSD',
      motherboard: 'ASUS Prime B460M-A',
      graphics: 'Intel UHD Graphics 630',
      macAddress: '00:1A:2B:3C:4D:5E' // Add MAC address
    };

    console.log('Submitting agent data...');
    try {
      const result = await submitAgentData(agentData);
      console.log('Data submitted successfully!');
      console.log('PC ID:', result.id);
    } catch (error: any) {
      console.error('Failed to submit data:', error.message);
    }
  } else {
    console.log('Agent API is not available. Please check the service.');
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  submitAgentData,
  checkApiHealth,
  type AgentData
};