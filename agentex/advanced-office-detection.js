const { execSync } = require('child_process');
const os = require('os');

/**
 * Get detailed Office information from Windows Control Panel Programs and Features
 * This function retrieves the exact display name and version as shown in the Control Panel
 * @returns {string} Office information in the format "Microsoft Office Professional 2019 en-us" or similar
 */
function getOfficeInfoFromControlPanel() {
  try {
    if (os.platform() !== 'win32') {
      return 'Not a Windows system';
    }

    console.log('Detecting Office from Control Panel (Programs and Features)...');

    // Try to get Office information using PowerShell which is more reliable
    try {
      console.log('Using PowerShell to query Office information...');
      
      const psScript = `
      Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
      Where-Object { $_.DisplayName -like "*Office*" } | 
      Select-Object DisplayName, DisplayVersion | 
      ConvertTo-Json
      `;
      
      const result = execSync(`powershell -Command "${psScript}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 15000
      });
      
      if (result && result.trim() !== '') {
        try {
          const officeData = JSON.parse(result);
          const offices = Array.isArray(officeData) ? officeData : [officeData];
          
          if (offices.length > 0 && offices[0].DisplayName) {
            const office = offices[0];
            console.log(`Found Office in Control Panel: ${office.DisplayName}`);
            if (office.DisplayVersion) {
              const result = `${office.DisplayName} ${office.DisplayVersion}`;
              console.log(`Returning: ${result}`);
              return result;
            } else {
              console.log(`Returning: ${office.DisplayName}`);
              return office.DisplayName;
            }
          }
        } catch (parseError) {
          console.log('Error parsing PowerShell output:', parseError.message);
        }
      }
    } catch (psError) {
      console.log('PowerShell detection failed:', psError.message);
    }

    // Fallback to registry query method
    console.log('Falling back to registry query method...');
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
          try {
            // First check if this might be an Office entry
            if (subKey.toLowerCase().includes('office')) {
              // Get DisplayName and DisplayVersion
              const detailsOutput = execSync(`reg query "${subKey}" /v DisplayName /v DisplayVersion`, {
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 10000
              });

              // Parse the output to extract DisplayName and DisplayVersion
              let displayName = '';
              let displayVersion = '';
              
              const detailLines = detailsOutput.split('\n');
              for (const detailLine of detailLines) {
                if (detailLine.includes('DisplayName')) {
                  const match = detailLine.match(/REG_SZ\s+(.*)$/);
                  if (match) {
                    displayName = match[1].trim();
                  }
                } else if (detailLine.includes('DisplayVersion')) {
                  const match = detailLine.match(/REG_SZ\s+(.*)$/);
                  if (match) {
                    displayVersion = match[1].trim();
                  }
                }
              }

              // If we found Office information, return it formatted properly
              if (displayName && displayName.includes('Office')) {
                console.log(`Found Office in Control Panel: ${displayName}`);
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
      } catch (registryError) {
        console.log(`Error querying registry path ${registryPath}: ${registryError.message}`);
        // Continue to next registry path
        continue;
      }
    }

    console.log('No Office found in registry, using fallback method...');
    // Fallback to existing method if registry approach doesn't work
    return getOfficeInfoFallback();
  } catch (error) {
    console.error('Error getting Office info from Control Panel:', error.message);
    return getOfficeInfoFallback();
  }
}

/**
 * Fallback method to detect Office installation
 * @returns {string} Office information
 */
function getOfficeInfoFallback() {
  try {
    console.log('Using fallback method to detect Office...');
    
    // Common Office installation paths
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
  } catch (error) {
    console.error('Error in fallback Office detection:', error.message);
    return 'Error detecting Office';
  }
}

// Test the function
if (require.main === module) {
  console.log('Testing advanced Office detection from Control Panel...');
  const officeInfo = getOfficeInfoFromControlPanel();
  console.log('Final detected Office:', officeInfo);
}

module.exports = {
  getOfficeInfoFromControlPanel,
  getOfficeInfoFallback
};