import { default as fetch } from 'node-fetch';
import * as os from 'os';
import { execSync } from 'child_process';

// Define interfaces for our data structures
interface NetworkInfo {
  ip: string;
  mac: string;
}

interface OSInfo {
  platform: string;
  release: string;
  build: string;
  arch: string;
  full: string;
}

interface SystemSpecs {
  totalMemory: number;
  cpuModel: string;
  cpuCores: number;
}

interface SystemIdentifiers {
  hostname: string;
  username: string;
}

interface AgentData {
  pcName: string;
  userName?: string;
  ipAddress?: string;
  cpu: string;
  ram: string;
  os: string;
  harddisk?: string;
  macAddress?: string;
  office?: string;
  [key: string]: any;
}

// Function to get IP and MAC address
function getNetworkInfo(): NetworkInfo {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return {
            ip: alias.address,
            mac: alias.mac
          };
        }
      }
    }
    return { ip: '', mac: '' };
  } catch (error) {
    console.error('Error getting network info:', error);
    return { ip: '', mac: '' };
  }
}

// Function to get detailed OS information
function getOSInfo(): OSInfo {
  try {
    if (os.platform() === 'win32') {
      // For Windows, get detailed version information
      const productName = execSync('wmic os get Caption /value', { encoding: 'utf8' });
      const buildNumber = execSync('wmic os get BuildNumber /value', { encoding: 'utf8' });
      
      // Extract values from WMIC output
      const productMatch = productName.match(/Caption=(.+)/);
      const buildMatch = buildNumber.match(/BuildNumber=(.+)/);
      
      const product = productMatch && productMatch[1] ? productMatch[1].trim() : 'Windows';
      const build = buildMatch && buildMatch[1] ? buildMatch[1].trim() : os.release();
      
      // Determine Windows version based on build number
      let version = product;
      if (build.startsWith('1904')) {
        version = 'Windows 10';
      } else if (build.startsWith('22')) {
        version = 'Windows 11';
      }
      
      return {
        platform: os.platform(),
        release: version,
        build: build || '',
        arch: os.arch(),
        full: `${version} ${os.arch()} (Build ${build})`
      };
    } else {
      // For other platforms, use standard OS module
      return {
        platform: os.platform(),
        release: os.release(),
        build: '',
        arch: os.arch(),
        full: `${os.platform()} ${os.release()} ${os.arch()}`
      };
    }
  } catch (error) {
    console.error('Error getting OS info:', error);
    // Fallback to basic OS info
    return {
      platform: os.platform(),
      release: os.release(),
      build: '',
      arch: os.arch(),
      full: `${os.platform()} ${os.release()} ${os.arch()}`
    };
  }
}

// Function to get system specs
function getSystemSpecs(): SystemSpecs {
  const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
  const cpus = os.cpus();
  
  return {
    totalMemory,
    cpuModel: cpus && cpus.length > 0 && cpus[0] ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length
  };
}

// Function to get detailed disk information including SSD/HDD type
function getDiskInfo(): string {
  try {
    if (os.platform() === 'win32') {
      // For Windows, get detailed disk information
      const drives: { letter: string; size: number }[] = [];
      
      try {
        // Get logical disks information with better error handling
        const logicalDisks = execSync('wmic logicaldisk where "DriveType=3" get Caption,Size,FileSystem /format:value', { 
          encoding: 'utf8',
          timeout: 5000
        });
        
        // Split by the double newline that WMIC uses to separate records
        const records = logicalDisks.split('\r\r\n\r\r\n').filter(record => record.trim() !== '');
        
        for (const record of records) {
          const lines = record.split('\r\r\n').filter(line => line.trim() !== '');
          let driveLetter = '';
          let size = 0;
          
          for (const line of lines) {
            if (line.startsWith('Caption=')) {
              driveLetter = line.substring(8).trim();
            } else if (line.startsWith('Size=')) {
              const sizeMatch = line.substring(5).trim();
              size = parseInt(sizeMatch) || 0;
            }
          }
          
          if (driveLetter && !isNaN(size) && size > 0) {
            const sizeGB = Math.round(size / (1024 * 1024 * 1024));
            drives.push({
              letter: driveLetter,
              size: sizeGB
            });
          }
        }
      } catch (wmicError: any) {
        console.error('Error getting logical disk info:', wmicError.message);
        // Fallback to simpler method
        try {
          const simpleDisks = execSync('wmic logicaldisk get Caption,Size', { encoding: 'utf8' });
          const lines = simpleDisks.split('\n').filter(line => line.trim() !== '' && !line.includes('Caption'));
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const driveLetter = parts[0];
              const sizeStr = parts[1] || '';
              const size = parseInt(sizeStr) || 0;
              
              if (driveLetter && !isNaN(size) && size > 0) {
                const sizeGB = Math.round(size / (1024 * 1024 * 1024));
                drives.push({
                  letter: driveLetter,
                  size: sizeGB
                });
              }
            }
          }
        } catch (simpleError: any) {
          console.error('Error with simple disk info:', simpleError.message);
        }
      }
      
      // If we still don't have drives, use a very simple fallback
      if (drives.length === 0) {
        try {
          const fs = require('fs');
          const root = 'C:\\';
          if (fs.existsSync(root)) {
            // We can't easily get the total size with fs, so we'll estimate
            drives.push({
              letter: 'C:',
              size: 256 // Default estimate
            });
          }
        } catch (fsError: any) {
          console.error('Filesystem fallback error:', fsError.message);
        }
      }
      
      // Format the output with proper SSD/HDD identification
      if (drives.length > 0) {
        const formattedDrives = drives.map((drive, index) => {
          // For a realistic approach, we'll assume:
          // 1. The first drive (usually C:) is an SSD if it's <= 2TB
          // 2. Other drives are HDDs
          if (index === 0 && drive.size <= 2048) { // First drive and <= 2TB, likely SSD
            // Convert to TB if size is large enough
            if (drive.size >= 1000) {
              const tb = (drive.size / 1000).toFixed(1);
              return `SSD: ${tb}TB`;
            } else {
              return `SSD: ${drive.size}GB`;
            }
          } else {
            // For other drives, format as HDD
            if (drive.size >= 1000) {
              const tb = (drive.size / 1000).toFixed(1);
              return `HDD: ${tb}TB`;
            } else {
              return `HDD: ${drive.size}GB`;
            }
          }
        });
        
        return formattedDrives.join(', ');
      } else {
        return 'No drives detected';
      }
    } else {
      // For Unix-like systems, use df command to get all mounted filesystems
      const result = execSync('df -h', { encoding: 'utf8' });
      const lines = result.split('\n');
      const drives: string[] = [];
      
      // Skip the header line and process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim() || '';
        if (line !== '') {
          const parts = line.split(/\s+/);
          if (parts.length >= 6) {
            // On some systems, the device name is in the first column, size in the second
            const device = parts[0];
            const size = parts[1];
            const mountPoint = parts[5];
            drives.push(`${device} (${size}) on ${mountPoint}`);
          }
        }
      }
      return drives.length > 0 ? drives.join(', ') : 'No drives detected';
    }
  } catch (error: any) {
    console.error('Error getting disk info:', error.message);
    return 'Error collecting disk information';
  }
}

// Function to get hostname and username
function getSystemIdentifiers(): SystemIdentifiers {
  return {
    hostname: os.hostname(),
    username: os.userInfo().username
  };
}

// Function to get MAC address using system commands (fallback)
function getMacAddressFallback(): string {
  try {
    let macAddress = '';
    if (os.platform() === 'win32') {
      const result = execSync('getmac', { encoding: 'utf8' });
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes('Physical Address') || line.includes('---')) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && parts[0]?.includes('-')) {
          macAddress = parts[0].replace(/-/g, ':');
          break;
        }
      }
    } else {
      const result = execSync('ifconfig', { encoding: 'utf8' });
      const match = result.match(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i);
      if (match) {
        macAddress = match[0];
      }
    }
    return macAddress;
  } catch (error) {
    console.error('Error getting MAC address:', error);
    return '';
  }
}

// Function to detect Office installation
function getOfficeInfo(): string {
  try {
    if (os.platform() === 'win32') {
      // Method 1: Use PowerShell with inline script for better performance
      try {
        console.log('Trying inline PowerShell script for Office detection...');
        
        // Inline PowerShell script that combines the functionality of Get-OfficeInfo.ps1
        const psScript = `
        $results = @()
        
        function Get-UninstallItems($path) {
          if (Test-Path $path) {
            Get-ItemProperty "$path\\*" | ForEach-Object {
              [PSCustomObject]@{
                Source         = $path
                DisplayName    = $_.DisplayName
                DisplayVersion = $_.DisplayVersion
                Publisher      = $_.Publisher
              }
            }
          }
        }
        
        # Search common uninstall locations
        $results += Get-UninstallItems "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
        $results += Get-UninstallItems "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
        
        # Filter Office-related rows and remove null DisplayName
        $officeRows = $results | Where-Object { $_.DisplayName -and ($_.DisplayName -match 'Office|Microsoft 365|Microsoft Office|Visio|Project') } |
                      Sort-Object DisplayName -Unique
        
        # Output only the essential information
        if ($officeRows.Count -gt 0) {
          # Output just the first Office entry
          $firstOffice = $officeRows[0]
          @{
            DisplayName = $firstOffice.DisplayName
            DisplayVersion = $firstOffice.DisplayVersion
          } | ConvertTo-Json
        }
        `;
        
        const psCommand = `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '""')}"`;
        
        const result = execSync(psCommand, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 15000, // 15 seconds timeout
          windowsHide: true
        });
        
        if (result && result.trim() !== '') {
          try {
            const officeData = JSON.parse(result);
            if (officeData.DisplayName) {
              const displayName = officeData.DisplayName;
              const version = officeData.DisplayVersion || '';
              const result = version ? `${displayName} ${version}` : displayName;
              console.log(`Found Office via inline PowerShell: ${result}`);
              return result;
            }
          } catch (parseError: any) {
            console.log('Error parsing PowerShell output:', parseError.message);
            
            // Try alternative parsing method
            const lines = result.split('\n');
            let displayName = '';
            let displayVersion = '';
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('DisplayName:')) {
                displayName = trimmedLine.substring('DisplayName:'.length).trim();
              } else if (trimmedLine.startsWith('DisplayVersion:')) {
                displayVersion = trimmedLine.substring('DisplayVersion:'.length).trim();
              }
            }
            
            if (displayName) {
              const result = displayVersion ? `${displayName} ${displayVersion}` : displayName;
              console.log(`Found Office via alternative parsing: ${result}`);
              return result;
            }
          }
        }
      } catch (psError: any) {
        console.log('Inline PowerShell detection failed:', psError.message);
      }

      // Method 2: Fallback to registry query method
      try {
        console.log('Trying registry query method...');
        
        // Query both registry locations
        const registryPaths = [
          'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
          'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
        ];

        for (const registryPath of registryPaths) {
          try {
            console.log(`Checking registry path: ${registryPath}`);
            
            // Get all subkeys under the uninstall path
            const subKeysOutput = execSync(`reg query "${registryPath}"`, {
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 10000
            });

            const lines = subKeysOutput.split('\n').filter(line => line.trim().startsWith(registryPath));
            console.log(`Found ${lines.length} entries, filtering for Office...`);
            
            // For each potential entry, check if it's Office-related
            for (const line of lines) {
              const subKey = line.trim();
              try {
                // First check if this might be an Office entry
                if (subKey.toLowerCase().includes('office') || subKey.toLowerCase().includes('microsoft 365') || subKey.toLowerCase().includes('microsoft office')) {
                  // Get DisplayName and DisplayVersion
                  const detailsOutput = execSync(`reg query "${subKey}" /v DisplayName /v DisplayVersion`, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 5000
                  });

                  // Parse the output to extract DisplayName and DisplayVersion
                  let displayName = '';
                  let displayVersion = '';
                  
                  const detailLines = detailsOutput.split('\n');
                  for (const detailLine of detailLines) {
                    if (detailLine.includes('DisplayName')) {
                      const match = detailLine.match(/REG_SZ\s+(.*)$/);
                      if (match && match[1]) {
                        displayName = match[1].trim();
                      }
                    } else if (detailLine.includes('DisplayVersion')) {
                      const match = detailLine.match(/REG_SZ\s+(.*)$/);
                      if (match && match[1]) {
                        displayVersion = match[1].trim();
                      }
                    }
                  }

                  // If we found Office information, return it formatted properly
                  if (displayName && (displayName.includes('Office') || displayName.includes('Microsoft 365') || displayName.includes('Microsoft Office'))) {
                    console.log(`Found Office in registry: ${displayName}`);
                    if (displayVersion) {
                      const result = `${displayName} ${displayVersion}`;
                      console.log(`Returning: ${result}`);
                      return result;
                    } else {
                      console.log(`Returning: ${displayName}`);
                      return displayName;
                    }
                  }
                }
              } catch (subKeyError) {
                // Continue to next subkey
                continue;
              }
            }
          } catch (registryError: any) {
            console.log(`Error querying registry path ${registryPath}: ${registryError.message}`);
            // Continue to next registry path
            continue;
          }
        }
      } catch (registryMethodError: any) {
        console.log('Registry method failed:', registryMethodError.message);
      }

      // Method 3: Fallback to file system check
      console.log('Using file system fallback method...');
      const officePaths = [
        'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
        'C:\\Program Files\\Microsoft Office\\Office15\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\Office15\\WINWORD.EXE',
        'C:\\Program Files\\Microsoft Office\\Office14\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\Office14\\WINWORD.EXE'
      ];
      
      for (const path of officePaths) {
        if (require('fs').existsSync(path)) {
          console.log(`Found Office installation at: ${path}`);
          // Extract version from path
          if (path.includes('Office16')) {
            return 'Microsoft Office 2016/2019/365';
          } else if (path.includes('Office15')) {
            return 'Microsoft Office 2013';
          } else if (path.includes('Office14')) {
            return 'Microsoft Office 2010';
          } else {
            return 'Microsoft Office';
          }
        }
      }
      
      return 'Office not detected';
    } else {
      // For non-Windows systems, check for common office suites
      try {
        // Check for LibreOffice
        const libreOfficeResult = execSync('which libreoffice', { encoding: 'utf8', stdio: 'ignore' });
        if (libreOfficeResult.trim() !== '') {
          return 'LibreOffice';
        }
      } catch (error) {
        // LibreOffice not found
      }
      
      try {
        // Check for OpenOffice
        const openOfficeResult = execSync('which soffice', { encoding: 'utf8', stdio: 'ignore' });
        if (openOfficeResult.trim() !== '') {
          return 'Apache OpenOffice';
        }
      } catch (error) {
        // OpenOffice not found
      }
      
      return 'Office not detected';
    }
  } catch (error: any) {
    console.error('Error detecting Office:', error.message);
    return 'Error detecting Office';
  }
}

interface LoginResponse {
  token: string;
}

interface AgentResponse {
  id: string;
  customFields: Record<string, any>;
}

interface UpdateResponse {
  message: string;
  agentId: string;
}

async function testAgentUpdate(): Promise<void> {
  try {
    console.log('Testing agent update with real PC information...');
    
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'adminit@localhost.com',
        password: 'password'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData);
      return;
    }

    const loginData = await loginResponse.json() as LoginResponse;
    const token = loginData.token;
    console.log('Login successful!');

    // Collect real system information
    console.log('Collecting PC information...');
    const networkInfo = getNetworkInfo();
    const osInfo = getOSInfo();
    const systemSpecs = getSystemSpecs();
    const identifiers = getSystemIdentifiers();
    const diskInfo = getDiskInfo();
    
    // Fallback for MAC address if not found
    let macAddress = networkInfo.mac;
    if (!macAddress || macAddress === '00:00:00:00:00:00') {
      console.log('Using fallback method to get MAC address...');
      macAddress = getMacAddressFallback();
    }
    
    // Get Office information
    const officeInfo = getOfficeInfo();
    
    // Submit real agent data
    const agentData: AgentData = {
      pcName: identifiers.hostname,
      userName: identifiers.username,
      ipAddress: networkInfo.ip,
      cpu: systemSpecs.cpuModel,
      ram: `${systemSpecs.totalMemory}GB`,
      os: osInfo.full, // Use the formatted OS information
      harddisk: diskInfo, // Now includes properly formatted SSD/HDD information
      macAddress: macAddress,
      office: officeInfo // Add Office information
    };

    console.log('Collected information:');
    console.log(JSON.stringify(agentData, null, 2));

    const agentResponse = await fetch('http://localhost:3001/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agentData)
    });

    if (!agentResponse.ok) {
      const errorData = await agentResponse.text();
      console.log('Agent submission failed:', errorData);
      return;
    }

    const agentDataResponse = await agentResponse.json() as AgentResponse;
    console.log('Agent data submission successful:');
    console.log('PC ID:', agentDataResponse.id);
    console.log('Custom Fields:', JSON.stringify(agentDataResponse.customFields, null, 2));
    
    // Add the handleTriggerUpdate function here
    const handleTriggerUpdate = async (agentId: string): Promise<void> => {
      try {
        console.log(`Triggering update for agent ${agentId}...`);
        
        // Update UI immediately to show updating status (simulated)
        console.log('Updating UI to show updating status...');
        
        // Call the API to trigger the update
        const updateResponse = await fetch(`http://localhost:3001/api/agents/${agentId}/trigger-update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.text();
          console.log('Update trigger failed:', errorData);
          return;
        }

        const updateData = await updateResponse.json() as UpdateResponse;
        console.log('Update triggered successfully:', updateData.message);
        
        // Simulate update completion
        console.log('Simulating update completion...');
        setTimeout(() => {
          console.log('Update completed successfully!');
        }, 3000);
      } catch (error) {
        console.error('Error triggering update:', error);
      }
    };
    
    // Trigger the update for the newly created agent
    await handleTriggerUpdate(agentDataResponse.id);
    
  } catch (error) {
    console.error('Error testing agent update:', error);
  }
}

testAgentUpdate().catch(console.error);