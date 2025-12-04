# Agent API Guide

This document provides comprehensive guidance on the Agent API implementation in the IT Asset Management System (ITAMS), including endpoint specifications, data mapping, security considerations, and integration best practices.

## Overview

The Agent API allows computer agent software to automatically submit computer configuration data to the ITAMS system. The agent software should send updated information every 5-10 minutes to keep the system synchronized with actual computer configurations.

### Key Features

1. **Automated Data Submission** - Real-time computer configuration updates
2. **MAC Address Identification** - Prevent duplicate entries using MAC addresses
3. **Field Mapping** - Automatic mapping of agent fields to database custom fields
4. **Error Handling** - Comprehensive error reporting and recovery
5. **Security** - Authentication and data validation
6. **Performance** - Efficient data processing and storage

## API Endpoint

### Submission Endpoint

```
POST /api/agent
```

#### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <optional-jwt-token>
User-Agent: ITAMS-Agent/<version>
```

#### Request Body

```json
{
  "pcName": "SGDH-IT-DTHIEN",
  "userName": "thien.dinh",
  "ipAddress": "10.1.1.10",
  "cpu": "Intel Core i5-10400",
  "ram": "32GB DDR4",
  "os": "Windows 10 Pro 21H2",
  "harddisk": "1TB NVMe SSD",
  "motherboard": "ASUS Prime B460M-A",
  "graphics": "Intel UHD Graphics 630",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "office": "Microsoft Office 2021"
}
```

## Field Mapping

### Agent to Database Mapping

The agent fields are automatically mapped to database custom fields as follows:

| Agent Field | Database Custom Field | Asset Type | Description |
|-------------|----------------------|------------|-------------|
| `pcName` | N/A | PC | Computer name (primary identifier) |
| `userName` | N/A | PC | Assigned user |
| `ipAddress` | `IP` | PC | Network IP address |
| `cpu` | `CPU` | PC | Processor information |
| `ram` | `RAM` | PC | Memory specifications |
| `os` | `OS` | PC | Operating system |
| `harddisk` | `HARDISK` | PC | Storage information |
| `motherboard` | `MOTHERBOARD` | PC | Motherboard model |
| `graphics` | `GRAPHICS` | PC | Graphics card information |
| `macAddress` | `MAC` | PC | Network MAC address |
| `office` | `OFFICE` | PC | Office software version |

### Data Validation

#### Required Fields

1. **pcName** - Must be provided and unique
2. **userName** - Should be provided for user assignment
3. **macAddress** - Required for MAC-based identification

#### Field Validation Rules

```typescript
// src/lib/agent-validation.ts
interface AgentData {
  pcName: string;
  userName?: string;
  ipAddress?: string;
  cpu?: string;
  ram?: string;
  os?: string;
  harddisk?: string;
  motherboard?: string;
  graphics?: string;
  macAddress?: string;
  office?: string;
}

const validationRules = {
  pcName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\-_.]+$/
  },
  macAddress: {
    required: true,
    pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
  },
  ipAddress: {
    required: false,
    pattern: /^(\d{1,3}\.){3}\d{1,3}$/
  }
};
```

## Implementation Details

### API Route Handler

#### Endpoint Implementation

```typescript
// src/app/api/agent/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { validateAgentData } from '@/lib/agent-validation';
import { mapAgentToCustomFields } from '@/lib/agent-mapping';

export async function POST(request: Request) {
  try {
    // Parse request body
    const agentData = await request.json();
    
    // Validate incoming data
    const validation = validateAgentData(agentData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid agent data',
          details: validation.errors
        }
      }, { status: 400 });
    }

    // Check for existing PC by MAC address
    let existingPC = null;
    if (agentData.macAddress) {
      existingPC = await db.pC.findFirst({
        where: {
          customFields: {
            path: ['MAC'],
            equals: agentData.macAddress
          }
        }
      });
    }

    // Prepare custom fields data
    const customFields = mapAgentToCustomFields(agentData);

    if (existingPC) {
      // Update existing PC
      const updatedPC = await db.pC.update({
        where: { id: existingPC.id },
        data: {
          pcName: agentData.pcName,
          userName: agentData.userName,
          customFields: {
            ...existingPC.customFields,
            ...customFields
          },
          updatedAt: new Date()
        }
      });

      logger.info('Agent data updated existing PC', {
        pcId: updatedPC.id,
        pcName: agentData.pcName,
        macAddress: agentData.macAddress
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedPC.id,
          message: 'PC data updated successfully',
          action: 'updated'
        }
      });
    } else {
      // Create new PC
      const newPC = await db.pC.create({
        data: {
          pcName: agentData.pcName,
          userName: agentData.userName,
          dept: 'IT', // Default department
          status: 'working', // Default status
          tenantId: 'default-tenant', // This would be determined by authentication
          customFields
        }
      });

      logger.info('Agent data created new PC', {
        pcId: newPC.id,
        pcName: agentData.pcName,
        macAddress: agentData.macAddress
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newPC.id,
          message: 'PC data created successfully',
          action: 'created'
        }
      });
    }
  } catch (error) {
    logger.error('Agent API error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process agent data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
}
```

### Data Mapping

#### Custom Field Mapping

```typescript
// src/lib/agent-mapping.ts
interface AgentData {
  [key: string]: string | undefined;
}

interface CustomFields {
  [key: string]: string;
}

export function mapAgentToCustomFields(agentData: AgentData): CustomFields {
  const fieldMapping: Record<string, string> = {
    'cpu': 'CPU',
    'ram': 'RAM',
    'os': 'OS',
    'ipAddress': 'IP',
    'harddisk': 'HARDISK',
    'motherboard': 'MOTHERBOARD',
    'graphics': 'GRAPHICS',
    'macAddress': 'MAC',
    'office': 'OFFICE'
  };

  const customFields: CustomFields = {};

  for (const [agentField, customField] of Object.entries(fieldMapping)) {
    if (agentData[agentField]) {
      customFields[customField] = agentData[agentField]!;
    }
  }

  return customFields;
}
```

### Data Validation

#### Validation Logic

```typescript
// src/lib/agent-validation.ts
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAgentData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!data.pcName || data.pcName.trim() === '') {
    errors.push('pcName is required');
  } else if (data.pcName.length > 100) {
    errors.push('pcName must be less than 100 characters');
  } else if (!/^[a-zA-Z0-9\-_.]+$/.test(data.pcName)) {
    errors.push('pcName contains invalid characters');
  }

  // MAC address validation
  if (!data.macAddress || data.macAddress.trim() === '') {
    errors.push('macAddress is required');
  } else if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(data.macAddress)) {
    errors.push('Invalid MAC address format');
  }

  // IP address validation (if provided)
  if (data.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(data.ipAddress)) {
    errors.push('Invalid IP address format');
  }

  // Additional field validations
  const maxLengthFields = ['cpu', 'ram', 'os', 'harddisk', 'motherboard', 'graphics', 'office'];
  for (const field of maxLengthFields) {
    if (data[field] && data[field]!.length > 255) {
      errors.push(`${field} must be less than 255 characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## MAC Address Identification

### Duplicate Prevention

The system supports identifying existing computers by MAC address to prevent duplicate entries when a computer's name or other details change.

#### Implementation

```typescript
// src/lib/mac-identification.ts
import { db } from './db';

export async function findPCByMAC(macAddress: string): Promise<any | null> {
  try {
    const pc = await db.pC.findFirst({
      where: {
        customFields: {
          path: ['MAC'],
          equals: macAddress
        }
      }
    });
    
    return pc;
  } catch (error) {
    logger.error('Error finding PC by MAC:', { macAddress, error });
    return null;
  }
}

export async function updatePCByMAC(macAddress: string, updateData: any): Promise<any | null> {
  try {
    const pc = await findPCByMAC(macAddress);
    
    if (pc) {
      const updatedPC = await db.pC.update({
        where: { id: pc.id },
        data: updateData
      });
      
      return updatedPC;
    }
    
    return null;
  } catch (error) {
    logger.error('Error updating PC by MAC:', { macAddress, error });
    return null;
  }
}
```

### Setup Requirements

To enable MAC address identification:

1. **Create Custom Field**
   - Create a custom field named "MAC" for the PC asset type
   - Set field type to "Text"
   - Make field required if desired

2. **Include MAC Address**
   - Ensure agent data submissions include the `macAddress` field
   - The system will automatically check for existing PCs with the same MAC address

## Security Considerations

### Authentication

#### API Key Authentication

```typescript
// src/lib/agent-auth.ts
import { db } from './db';

interface AgentToken {
  id: string;
  token: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
}

export async function validateAgentToken(token: string): Promise<AgentToken | null> {
  try {
    const agentToken = await db.agentToken.findUnique({
      where: { token }
    });

    if (!agentToken) {
      return null;
    }

    // Check if token is expired
    if (agentToken.expiresAt < new Date()) {
      return null;
    }

    return agentToken;
  } catch (error) {
    logger.error('Error validating agent token:', error);
    return null;
  }
}
```

#### Rate Limiting

```typescript
// src/lib/agent-rate-limit.ts
import { redisCache } from './redis-cache';

export async function checkAgentRateLimit(ipAddress: string): Promise<boolean> {
  const key = `agent_rate_limit:${ipAddress}`;
  const limit = 100; // 100 requests per hour
  const windowMs = 3600000; // 1 hour

  try {
    const currentCount = await redisCache.get<number>(key) || 0;
    
    if (currentCount >= limit) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    await redisCache.set(key, currentCount + 1, windowMs / 1000);
    
    return true; // Within rate limit
  } catch (error) {
    logger.error('Error checking agent rate limit:', error);
    return true; // Allow request if rate limiting fails
  }
}
```

### Data Validation

#### Input Sanitization

```typescript
// src/lib/agent-sanitization.ts
export function sanitizeAgentData(data: any): any {
  const sanitized: any = {};

  // Whitelist allowed fields
  const allowedFields = [
    'pcName', 'userName', 'ipAddress', 'cpu', 'ram', 'os',
    'harddisk', 'motherboard', 'graphics', 'macAddress', 'office'
  ];

  for (const field of allowedFields) {
    if (data[field] && typeof data[field] === 'string') {
      // Trim whitespace and limit length
      sanitized[field] = data[field].trim().substring(0, 255);
    }
  }

  // Validate and sanitize MAC address
  if (sanitized.macAddress) {
    sanitized.macAddress = sanitized.macAddress.toUpperCase().replace(/[^0-9A-F:]/g, '');
  }

  // Validate and sanitize IP address
  if (sanitized.ipAddress) {
    // Basic IP validation
    const ipParts = sanitized.ipAddress.split('.');
    if (ipParts.length === 4 && ipParts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    })) {
      sanitized.ipAddress = ipParts.join('.');
    } else {
      delete sanitized.ipAddress; // Remove invalid IP
    }
  }

  return sanitized;
}
```

## Performance Optimization

### Batch Processing

#### Efficient Data Handling

```typescript
// src/lib/agent-batch.ts
interface BatchAgentData {
  data: any[];
  timestamp: Date;
}

export class AgentBatchProcessor {
  private batchSize: number = 50;
  private batchTimeout: number = 30000; // 30 seconds
  private batchQueue: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async addToBatch(data: any): Promise<void> {
    this.batchQueue.push(data);

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process batch if it's full
    if (this.batchQueue.length >= this.batchSize) {
      await this.processBatch();
    } else {
      // Set timer to process batch after timeout
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Process batch data
      await this.processBatchData(batch);
      logger.info('Agent batch processed successfully', { count: batch.length });
    } catch (error) {
      logger.error('Error processing agent batch:', error);
      // Re-queue failed items
      this.batchQueue.unshift(...batch);
    }
  }

  private async processBatchData(batch: any[]): Promise<void> {
    // Implementation for processing batch data
    for (const data of batch) {
      await this.processSingleAgentData(data);
    }
  }

  private async processSingleAgentData(data: any): Promise<void> {
    // Implementation for processing single agent data
    // This would call the same logic as the POST endpoint
  }
}
```

### Caching Strategy

#### MAC Address Caching

```typescript
// src/lib/agent-cache.ts
import { redisCache } from './redis-cache';

export class AgentCache {
  private static readonly MAC_CACHE_PREFIX = 'agent:mac:';
  private static readonly MAC_CACHE_TTL = 3600; // 1 hour

  static async cachePCByMAC(macAddress: string, pcId: string): Promise<void> {
    const key = `${this.MAC_CACHE_PREFIX}${macAddress}`;
    await redisCache.set(key, pcId, this.MAC_CACHE_TTL);
  }

  static async getCachedPCByMAC(macAddress: string): Promise<string | null> {
    const key = `${this.MAC_CACHE_PREFIX}${macAddress}`;
    return await redisCache.get<string>(key);
  }

  static async invalidateMACCache(macAddress: string): Promise<void> {
    const key = `${this.MAC_CACHE_PREFIX}${macAddress}`;
    await redisCache.del(key);
  }
}
```

## Integration Examples

### Agent Implementation

#### PowerShell Agent Example

```powershell
# Get-OfficeInfo.ps1
param(
    [string]$ApiUrl = "http://localhost:3000/api/agent",
    [string]$AuthToken = ""
)

function Get-ComputerInfo {
    $computerInfo = Get-ComputerInfo
    $networkInfo = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}
    $macAddress = (Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1).MacAddress
    
    return @{
        pcName = $env:COMPUTERNAME
        userName = $env:USERNAME
        ipAddress = $networkInfo[0].IPAddress
        cpu = (Get-WmiObject -Class Win32_Processor).Name
        ram = "$((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB)GB"
        os = $computerInfo.WindowsProductName
        harddisk = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").Size / 1GB
        motherboard = (Get-WmiObject -Class Win32_BaseBoard).Product
        graphics = (Get-WmiObject -Class Win32_VideoController).Name
        macAddress = $macAddress
        office = Get-OfficeVersion
    }
}

function Get-OfficeVersion {
    $officePaths = @(
        "HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration",
        "HKLM:\SOFTWARE\Microsoft\Office\16.0\Common\ProductVersion",
        "HKLM:\SOFTWARE\Microsoft\Office\15.0\Common\ProductVersion"
    )
    
    foreach ($path in $officePaths) {
        if (Test-Path $path) {
            $version = (Get-ItemProperty -Path $path -ErrorAction SilentlyContinue).VersionToReport
            if ($version) {
                return "Microsoft Office $version"
            }
        }
    }
    
    return "Microsoft Office (Unknown Version)"
}

function Send-AgentData {
    param($data)
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    $body = $data | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Headers $headers -Body $body
        Write-Host "Agent data sent successfully: $($response.data.message)"
    } catch {
        Write-Error "Failed to send agent data: $($_.Exception.Message)"
    }
}

# Main execution
$agentData = Get-ComputerInfo
Send-AgentData -data $agentData
```

#### Node.js Agent Example

```javascript
// agent.js
const os = require('os');
const si = require('systeminformation');
const axios = require('axios');

class ITAMSAgent {
  constructor(config) {
    this.apiUrl = config.apiUrl || 'http://localhost:3000/api/agent';
    this.authToken = config.authToken || '';
    this.interval = config.interval || 300000; // 5 minutes
  }

  async getSystemInfo() {
    try {
      const [cpu, mem, osInfo, network, disk] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.networkInterfaces(),
        si.diskLayout()
      ]);

      const networkInterface = network.find(net => net.ip4 && !net.internal);
      
      return {
        pcName: os.hostname(),
        userName: os.userInfo().username,
        ipAddress: networkInterface ? networkInterface.ip4 : '',
        cpu: `${cpu.manufacturer} ${cpu.brand}`,
        ram: `${Math.round(mem.total / 1024 / 1024 / 1024)}GB`,
        os: `${osInfo.distro} ${osInfo.release}`,
        harddisk: disk.length > 0 ? `${Math.round(disk[0].size / 1000 / 1000 / 1000)}GB` : '',
        motherboard: '', // Requires additional library
        graphics: '', // Requires additional library
        macAddress: networkInterface ? networkInterface.mac : '',
        office: await this.getOfficeInfo()
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return null;
    }
  }

  async getOfficeInfo() {
    // Implementation for detecting Office version
    // This would depend on the specific environment
    return 'Microsoft Office (Detection not implemented)';
  }

  async sendAgentData() {
    try {
      const data = await this.getSystemInfo();
      if (!data) {
        console.error('Failed to get system information');
        return;
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await axios.post(this.apiUrl, data, { headers });
      console.log('Agent data sent successfully:', response.data.data.message);
    } catch (error) {
      console.error('Failed to send agent data:', error.message);
    }
  }

  start() {
    // Send data immediately
    this.sendAgentData();

    // Schedule regular updates
    setInterval(() => {
      this.sendAgentData();
    }, this.interval);
  }
}

// Usage
const agent = new ITAMSAgent({
  apiUrl: 'http://your-itams-server.com/api/agent',
  authToken: 'your-agent-token',
  interval: 300000 // 5 minutes
});

agent.start();
```

## Monitoring and Logging

### Health Monitoring

#### Agent Health Endpoint

```typescript
// src/app/api/agent/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache } from '@/lib/redis-cache';

export async function GET() {
  try {
    // Check database connectivity
    const dbHealth = await db.$queryRaw`SELECT 1`;
    
    // Check Redis connectivity
    const redisHealth = await redisCache.client.ping();
    
    // Get recent agent submissions
    const recentSubmissions = await db.pC.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth ? 'connected' : 'disconnected',
        redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
        recentSubmissions,
        version: '1.0.0'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Agent API health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
```

### Activity Logging

#### Agent Activity Tracking

```typescript
// src/lib/agent-logging.ts
import { logger } from './logger';
import { db } from './db';

interface AgentActivity {
  pcName: string;
  macAddress: string;
  ipAddress?: string;
  action: 'created' | 'updated' | 'failed';
  timestamp: Date;
  error?: string;
}

export async function logAgentActivity(activity: AgentActivity): Promise<void> {
  try {
    // Log to file/console
    logger.info('Agent activity', activity);

    // Store in database for analytics
    await db.agentActivity.create({
      data: {
        pcName: activity.pcName,
        macAddress: activity.macAddress,
        ipAddress: activity.ipAddress,
        action: activity.action,
        error: activity.error,
        timestamp: activity.timestamp
      }
    });
  } catch (error) {
    logger.error('Failed to log agent activity:', error);
  }
}
```

## Best Practices

### Agent Development

#### Data Collection Best Practices

1. **Minimal Data Collection**
   - Only collect necessary information
   - Respect user privacy
   - Avoid sensitive data collection

2. **Error Handling**
   - Implement robust error handling
   - Retry failed submissions
   - Log errors for debugging

3. **Performance Considerations**
   - Minimize system resource usage
   - Optimize data collection frequency
   - Implement efficient data transmission

#### Security Best Practices

1. **Authentication**
   - Use secure authentication tokens
   - Implement token rotation
   - Store tokens securely

2. **Data Protection**
   - Encrypt sensitive data in transit
   - Validate all incoming data
   - Implement rate limiting

3. **Network Security**
   - Use HTTPS for all communications
   - Implement proper firewall rules
   - Monitor for suspicious activity

### System Integration

#### Integration Testing

1. **Unit Tests**
   ```typescript
   // __tests__/lib/agent-validation.test.ts
   import { validateAgentData } from '@/lib/agent-validation';

   describe('Agent Data Validation', () => {
     it('should validate correct data', () => {
       const validData = {
         pcName: 'TEST-PC-001',
         macAddress: '00:1A:2B:3C:4D:5E',
         ipAddress: '192.168.1.100'
       };

       const result = validateAgentData(validData);
       expect(result.isValid).toBe(true);
       expect(result.errors).toHaveLength(0);
     });

     it('should reject invalid MAC address', () => {
       const invalidData = {
         pcName: 'TEST-PC-001',
         macAddress: 'invalid-mac'
       };

       const result = validateAgentData(invalidData);
       expect(result.isValid).toBe(false);
       expect(result.errors).toContain('Invalid MAC address format');
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   // __tests__/api/agent.test.ts
   import { test, expect } from '@playwright/test';

   test('agent data submission', async ({ request }) => {
     const agentData = {
       pcName: 'TEST-PC-001',
       userName: 'testuser',
       macAddress: '00:1A:2B:3C:4D:5E'
     };

     const response = await request.post('/api/agent', {
       data: agentData
     });

     expect(response.status()).toBe(200);
     const result = await response.json();
     expect(result.success).toBe(true);
   });
   ```

## Troubleshooting

### Common Issues

#### Data Submission Failures

1. **Validation Errors**
   ```bash
   # Check agent logs for validation errors
   grep "VALIDATION_ERROR" /var/log/itams/agent.log
   
   # Verify MAC address format
   echo "00:1A:2B:3C:4D:5E" | grep -E "^([0-9A-F]{2}:){5}[0-9A-F]{2}$"
   ```

2. **Network Connectivity**
   ```bash
   # Test API endpoint connectivity
   curl -X POST http://your-server.com/api/agent -d '{"test": "data"}'
   
   # Check firewall rules
   sudo ufw status
   ```

#### Performance Issues

1. **Slow Processing**
   ```bash
   # Monitor database performance
   tail -f /var/log/postgresql/postgresql-13-main.log | grep "duration"
   
   # Check system resources
   htop
   iotop
   ```

2. **High Memory Usage**
   ```bash
   # Monitor Redis memory usage
   redis-cli info memory
   
   # Check for memory leaks
   ps aux | grep node
   ```

### Debugging Tools

#### Agent Debugging

```bash
# Enable debug logging
export DEBUG=itams:agent*

# Monitor agent logs
tail -f /var/log/itams/agent.log

# Test agent data submission
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "pcName": "DEBUG-PC-001",
    "userName": "debuguser",
    "macAddress": "00:11:22:33:44:55"
  }'
```

## Conclusion

The Agent API in ITAMS provides a robust and secure mechanism for automated computer configuration data submission. By following the implementation guidelines, best practices, and security considerations outlined in this document, organizations can ensure reliable and efficient agent integration while maintaining data integrity and system performance.

Regular monitoring, proper error handling, and adherence to security best practices will help maintain a stable and effective agent infrastructure that supports the comprehensive asset management capabilities of the ITAMS system.