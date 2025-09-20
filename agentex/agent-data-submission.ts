/**
 * Example script to demonstrate how to submit data to the Agent API
 * This script can be used by agent software to send computer configuration data
 */

// Configuration - Update these values for your environment
const API_URL = 'http://localhost:3000/api/agent';
const AUTH_TOKEN = 'your-jwt-token-here';

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
 * Submit agent data to the ITAMS system
 * @param data - Computer configuration data
 * @returns Response from the API
 */
async function submitAgentData(data: AgentData): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error: any) {
    console.error('Error submitting agent data:', error.message);
    throw error;
  }
}

/**
 * Check if the Agent API is running
 * @returns True if API is running
 */
async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    console.log('API Health Check:', result.message);
    return true;
  } catch (error: any) {
    console.error('API Health Check Failed:', error.message);
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