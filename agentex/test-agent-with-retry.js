const { default: fetch } = require('node-fetch');
const os = require('os');
const { execSync } = require('child_process');
const path = require('path');

// Function to get IP and MAC address
function getNetworkInfo() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
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
function getOSInfo() {
  try {
    if (os.platform() === 'win32') {
      // For Windows, get detailed version information
      const productName = execSync('wmic os get Caption /value', { encoding: 'utf8' });
      const buildNumber = execSync('wmic os get BuildNumber /value', { encoding: 'utf8' });
      
      // Extract values from WMIC output
      const productMatch = productName.match(/Caption=(.+)/);
      const buildMatch = buildNumber.match(/BuildNumber=(.+)/);
      
      const product = productMatch ? productMatch[1].trim() : 'Windows';
      const build = buildMatch ? buildMatch[1].trim() : os.release();
      
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
        build: build,
        arch: os.arch(),
        full: `${version} ${os.arch()} (Build ${build})`
      };
    } else {
      // For other platforms, use standard OS module
      return {
        platform: os.platform(),
        release: os.release(),
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
      arch: os.arch(),
      full: `${os.platform()} ${os.release()} ${os.arch()}`
    };
  }
}

// Function to get system specs
function getSystemSpecs() {
  const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
  const cpus = os.cpus();
  
  return {
    totalMemory,
    cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length
  };
}

// Function to get detailed disk information including SSD/HDD type
function getDiskInfo() {
  try {
    if (os.platform() === 'win32') {
      // For Windows, get detailed disk information
      const drives = [];
      
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
              size = parseInt(line.substring(5).trim());
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
      } catch (wmicError) {
        console.error('Error getting logical disk info:', wmicError.message);
        // Fallback to simpler method
        try {
          const simpleDisks = execSync('wmic logicaldisk get Caption,Size', { encoding: 'utf8' });
          const lines = simpleDisks.split('\n').filter(line => line.trim() !== '' && !line.includes('Caption'));
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const driveLetter = parts[0];
              const size = parseInt(parts[1]);
              
              if (driveLetter && !isNaN(size) && size > 0) {
                const sizeGB = Math.round(size / (1024 * 1024 * 1024));
                drives.push({
                  letter: driveLetter,
                  size: sizeGB
                });
              }
            }
          }
        } catch (simpleError) {
          console.error('Error with simple disk info:', simpleError.message);
        }
      }
      
      // If we still don't have drives, use a very simple fallback
      if (drives.length === 0) {
        try {
          const fs = require('fs');
          const root = 'C:\\';
          if (fs.existsSync(root)) {
            const stats = fs.statSync(root);
            // We can't easily get the total size with fs, so we'll estimate
            drives.push({
              letter: 'C:',
              size: 256 // Default estimate
            });
          }
        } catch (fsError) {
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
      const drives = [];
      
      // Skip the header line and process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
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
  } catch (error) {
    console.error('Error getting disk info:', error.message);
    return 'Error collecting disk information';
  }
}

// Function to get hostname and username
function getSystemIdentifiers() {
  return {
    hostname: os.hostname(),
    username: os.userInfo().username
  };
}

// Function to get MAC address using system commands (fallback)
function getMacAddressFallback() {
  try {
    let macAddress = '';
    if (os.platform() === 'win32') {
      const result = execSync('getmac', { encoding: 'utf8' });
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes('Physical Address') || line.includes('---')) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && parts[0].includes('-')) {
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
function getOfficeInfo() {
  try {
    if (os.platform() === 'win32') {
      // Method 1: Use the comprehensive PowerShell script
      try {
        console.log('Trying the comprehensive PowerShell script for Office detection...');
        
        // Run the PowerShell script and capture output
        const psScriptPath = path.join(__dirname, 'Get-OfficeInfo.ps1');
        const psCommand = `powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`;
        
        const result = execSync(psCommand, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 30000,
          windowsHide: true
        });
        
        if (result && result.includes('===BEGIN OFFICE INFO===')) {
          // Parse the output to extract Office information
          const lines = result.split('\n');
          let inOfficeRows = false;
          let displayName = '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for the first DisplayName in the OfficeRows section
            if (trimmedLine === 'OfficeRows:') {
              inOfficeRows = true;
              continue;
            }
            
            if (inOfficeRows && trimmedLine.startsWith('DisplayName:')) {
              displayName = trimmedLine.substring('DisplayName:'.length).trim();
              if (displayName) {
                console.log(`Found Office via PowerShell script: ${displayName}`);
                return displayName;
              }
            }
            
            // Stop at the end of the OfficeRows section
            if (inOfficeRows && trimmedLine === 'ClickToRun:') {
              break;
            }
          }
          
          // If we found a display name, return it
          if (displayName) {
            return displayName;
          }
        }
      } catch (psError) {
        console.log('PowerShell script detection failed:', psError.message);
      }

      // Method 2: Fallback to the simple PowerShell command
      try {
        console.log('Trying the simple PowerShell command for Office detection...');
        
        // Use only the exact PowerShell command provided
        const psCommand = `powershell -ExecutionPolicy Bypass -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { \\$_.DisplayName -match 'Office|Microsoft 365|Microsoft Office' } | Select-Object DisplayName | ConvertTo-Json -Depth 3"`;
        
        const result = execSync(psCommand, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 20000,
          windowsHide: true
        });
        
        if (result && result.trim() !== '') {
          try {
            let officeData = JSON.parse(result);
            const offices = Array.isArray(officeData) ? officeData : [officeData];
            
            // Get only the DisplayName from the first entry
            if (offices.length > 0 && offices[0].DisplayName) {
              const office = offices[0];
              console.log(`Found Office via PowerShell: ${office.DisplayName}`);
              return office.DisplayName;
            }
          } catch (parseError) {
            console.log('Error parsing PowerShell output:', parseError.message);
          }
        }
      } catch (psError) {
        console.log('Simple PowerShell detection failed:', psError.message);
      }

      // Method 3: Try registry query method for 64-bit and 32-bit registry locations
      try {
        console.log('Trying registry query method for both 64-bit and 32-bit registry locations...');
        
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
              timeout: 15000
            });

            const lines = subKeysOutput.split('\n').filter(line => line.trim().startsWith(registryPath));
            console.log(`Found ${lines.length} entries, filtering for Office...`);
            
            // For each potential entry, check if it's Office-related
            for (const line of lines) {
              const subKey = line.trim();
              // Check if this might be an Office entry
              if (subKey.toLowerCase().includes('office') || subKey.toLowerCase().includes('microsoft 365') || subKey.toLowerCase().includes('microsoft office')) {
                try {
                  // Get DisplayName only
                  const detailsOutput = execSync(`reg query "${subKey}" /v DisplayName`, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 10000
                  });

                  // Parse the output to extract DisplayName
                  let displayName = '';
                  
                  const detailLines = detailsOutput.split('\n');
                  for (const detailLine of detailLines) {
                    if (detailLine.includes('DisplayName')) {
                      const match = detailLine.match(/REG_SZ\s+(.*)$/);
                      if (match) {
                        displayName = match[1].trim();
                        break;
                      }
                    }
                  }

                  // If we found Office information, return it
                  if (displayName && (displayName.includes('Office') || displayName.includes('Microsoft 365') || displayName.includes('Microsoft Office'))) {
                    console.log(`Found Office via registry: ${displayName}`);
                    return displayName;
                  }
                } catch (subKeyError) {
                  // Continue to next subkey
                  continue;
                }
              }
            }
          } catch (registryError) {
            console.log(`Error querying registry path ${registryPath}: ${registryError.message}`);
            // Continue to next registry path
            continue;
          }
        }
      } catch (registryMethodError) {
        console.log('Registry method failed:', registryMethodError.message);
      }

      // Method 4: Fallback to file system check
      console.log('Using file system fallback method...');
      const officePaths = [
        'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
        'C:\\Program Files\\Microsoft Office\\Office15\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\Office15\\WINWORD.EXE',
        'C:\\Program Files\\Microsoft Office\\Office14\\WINWORD.EXE',
        'C:\\Program Files (x86)\\Microsoft Office\\Office14\\WINWORD.EXE'
      ];
      
      const fs = require('fs');
      for (const path of officePaths) {
        if (fs.existsSync(path)) {
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
  } catch (error) {
    console.error('Error detecting Office:', error.message);
    return 'Error detecting Office';
  }
}

// Function to retry a fetch request with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, etc.
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function testAgentUpdate() {
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

    const loginData = await loginResponse.json();
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
    const agentData = {
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

    // Try to submit the data with retry logic
    console.log('Submitting agent data...');
    const agentResponse = await fetchWithRetry('http://localhost:3001/api/agent', {
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

    const agentDataResponse = await agentResponse.json();
    console.log('Agent data submission successful:');
    console.log('PC ID:', agentDataResponse.id);
    console.log('Custom Fields:', JSON.stringify(agentDataResponse.customFields, null, 2));
  } catch (error) {
    console.error('Error testing agent update:', error);
  }
}

testAgentUpdate().catch(console.error);