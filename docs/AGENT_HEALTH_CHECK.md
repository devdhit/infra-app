# Agent Health Check API

## Overview

The Agent Health Check API provides a simple endpoint to verify that the agent API is running and accessible.

## Endpoint

```
GET /api/agent
```

## Authentication

The health check endpoint requires authentication but allows any authenticated user to access it (no specific permissions required).

## Request Format

### Headers
```
Authorization: Bearer <token>
```

## Response Format

### Success (200 OK)
```json
{
  "message": "Agent API is running"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Example Usage

### curl
```bash
curl -X GET https://your-itams-url.com/api/agent \
  -H "Authorization: Bearer your-jwt-token"
```

### JavaScript/Node.js
```javascript
fetch('https://your-itams-url.com/api/agent', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```