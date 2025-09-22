# Agent API Documentation

## Overview

The Agent API allows computer agent software to automatically submit computer configuration data to the ITAMS system. The agent software should send updated information every 5-10 minutes to keep the system synchronized with actual computer configurations.

## Endpoint

`POST /api/agent`

## Authentication

No authentication is required for this endpoint. It's designed to be called by agent software running on client machines.

## Request Body

The request body should be a JSON object containing computer configuration data:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pcName | string | Yes | Computer name |
| userName | string | No | Current user of the computer |
| ipAddress | string | No | IP address of the computer |
| cpu | string | Yes | CPU information |
| ram | string | Yes | RAM information |
| os | string | Yes | Operating system information |
| harddisk | string | No | Hard disk information |
| motherboard | string | No | Motherboard information |
| graphics | string | No | Graphics card information |
| macAddress | string | No | MAC address of the computer |

## MAC Address Identification

The system supports identifying existing computers by MAC address to prevent duplicate entries when a computer's name or other details change:

1. Create a custom field named "MAC" for the PC asset type
2. Include the `macAddress` field in agent data submissions
3. The system will automatically check for existing PCs with the same MAC address and update them instead of creating new records

## Field Mapping

The agent fields are mapped to database custom fields as follows:
- `cpu` → `CPU`
- `ram` → `RAM`
- `os` → `OS`
- `ipAddress` → `IP`
- `harddisk` → `HARDISK`
- `motherboard` → `MOTHERBOARD`
- `graphics` → `GRAPHICS`
- `macAddress` → `MAC`

## Response

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "clx5...",
    "pcName": "SGDH-IT-DTHIEN",
    "userName": "thien.dinh",
    "cpuBarcode": "CPU-...",
    "status": "active",
    "dept": "IT",
    "tenantId": "...",
    "customFields": {
      "CPU": "Intel Core i5-10400",
      "RAM": "32GB DDR4",
      "OS": "Windows 10 Pro 21H2",
      "IP": "10.1.36.31",
      "HARDISK": "1TB NVMe SSD",
      "MOTHERBOARD": "ASUS Prime B460M-A",
      "GRAPHICS": "Intel UHD Graphics 630",
      "MAC": "00:1A:2B:3C:4D:5E"
    },
    "createdAt": "2025-09-19T10:30:00.000Z",
    "updatedAt": "2025-09-19T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: pcName, cpu, ram, and os are required"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to process agent data. Please try again later."
}
```

## Example Usage

### JavaScript/Node.js
```javascript
const agentData = {
  pcName: 'SGDH-IT-DTHIEN',
  userName: 'thien.dinh',
  ipAddress: '10.1.36.31',
  cpu: 'Intel Core i5-10400',
  ram: '32GB DDR4',
  os: 'Windows 10 Pro 21H2',
  harddisk: '1TB NVMe SSD',
  motherboard: 'ASUS Prime B460M-A',
  graphics: 'Intel UHD Graphics 630',
  macAddress: '00:1A:2B:3C:4D:5E'
};

fetch('http://your-itams-server.com/api/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(agentData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Data submitted successfully:', data.data);
  } else {
    console.error('Error submitting data:', data.error);
  }
})
.catch(error => console.error('Network error:', error));
```

### Python
```python
import requests
import json

agent_data = {
    "pcName": "SGDH-IT-DTHIEN",
    "userName": "thien.dinh",
    "ipAddress": "10.1.36.31",
    "cpu": "Intel Core i5-10400",
    "ram": "32GB DDR4",
    "os": "Windows 10 Pro 21H2",
    "harddisk": "1TB NVMe SSD",
    "motherboard": "ASUS Prime B460M-A",
    "graphics": "Intel UHD Graphics 630",
    "macAddress": "00:1A:2B:3C:4D:5E"
}

response = requests.post(
    'http://your-itams-server.com/api/agent',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(agent_data)
)

if response.status_code == 201:
    result = response.json()
    print('Data submitted successfully:', result['data'])
else:
    print('Error submitting data:', response.text)
```

## Health Check Endpoint

### Endpoint
`GET /api/agent`

### Response
```json
{
  "success": true,
  "data": {
    "message": "Agent API is running"
  }
}
```

## Best Practices

1. **Frequency**: Send updates every 5-10 minutes to keep data current without overwhelming the server
2. **Error Handling**: Implement retry logic for failed submissions
3. **Data Validation**: Ensure data is properly formatted before sending
4. **MAC Address**: Always include the MAC address to enable proper computer identification
5. **Security**: Ensure the agent software is secure and only sends legitimate data

## Troubleshooting

### Common Issues

1. **400 Bad Request**: Check that all required fields (pcName, cpu, ram, os) are included
2. **500 Internal Server Error**: Check server logs for detailed error information
3. **Network Issues**: Ensure the agent can reach the ITAMS server

### Testing

Use the provided test scripts in the `agentex` directory:
- `agent-data-submission.ts` - Example agent data submission
- `test-pc-mac-update.js` - Test MAC address-based PC updates
- `test-mac-address-identification.js` - Comprehensive MAC address testing
- `test-edge-cases.js` - Edge case testing