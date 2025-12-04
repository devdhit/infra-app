# API Documentation

This document provides comprehensive documentation for the IT Asset Management System (ITAMS) RESTful API.

## API Overview

The ITAMS API follows RESTful conventions and provides endpoints for managing IT assets, users, tenants, and system configuration. All API responses are in JSON format.

### Base URL
```
https://your-domain.com/api
```

### Authentication
Most API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Authentication Endpoints

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "user-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "tenantId": "tenant-id",
      "roleId": "role-id"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Logout
```
DELETE /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Tenant Endpoints

### List Tenants
```
GET /tenants
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant-id",
      "name": "Tenant Name",
      "description": "Tenant Description",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get Tenant
```
GET /tenants/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant-id",
    "name": "Tenant Name",
    "description": "Tenant Description",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Create Tenant
```
POST /tenants
```

**Request Body:**
```json
{
  "name": "New Tenant",
  "description": "Tenant Description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-tenant-id",
    "name": "New Tenant",
    "description": "Tenant Description",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update Tenant
```
PUT /tenants/{id}
```

**Request Body:**
```json
{
  "name": "Updated Tenant Name",
  "description": "Updated Description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant-id",
    "name": "Updated Tenant Name",
    "description": "Updated Description",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Delete Tenant
```
DELETE /tenants/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

## User Endpoints

### List Users
```
GET /users
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "tenantId": "tenant-id",
      "roleId": "role-id",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get User
```
GET /users/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "tenantId": "tenant-id",
    "roleId": "role-id",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Create User
```
POST /users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "secure-password",
  "roleId": "role-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "name": "New User",
    "tenantId": "tenant-id",
    "roleId": "role-id",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update User
```
PUT /users/{id}
```

**Request Body:**
```json
{
  "email": "updated@example.com",
  "name": "Updated User",
  "roleId": "updated-role-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "updated@example.com",
    "name": "Updated User",
    "tenantId": "tenant-id",
    "roleId": "updated-role-id",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Delete User
```
DELETE /users/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Asset Endpoints

### PC Assets

#### List PC Assets
```
GET /assets/pc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `status` (optional): Filter by status
- `dept` (optional): Filter by department

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pc-id",
      "pcName": "PC-001",
      "dept": "IT",
      "status": "working",
      "userName": "john.doe",
      "cpuBarcode": "CPU123456",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

#### Get PC Asset
```
GET /assets/pc/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pc-id",
    "pcName": "PC-001",
    "dept": "IT",
    "status": "working",
    "userName": "john.doe",
    "cpuBarcode": "CPU123456",
    "customFields": {
      "CPU": "Intel i7",
      "RAM": "16GB",
      "OS": "Windows 10"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Create PC Asset
```
POST /assets/pc
```

**Request Body:**
```json
{
  "pcName": "PC-002",
  "dept": "IT",
  "status": "working",
  "userName": "jane.doe",
  "cpuBarcode": "CPU789012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-pc-id",
    "pcName": "PC-002",
    "dept": "IT",
    "status": "working",
    "userName": "jane.doe",
    "cpuBarcode": "CPU789012",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Update PC Asset
```
PUT /assets/pc/{id}
```

**Request Body:**
```json
{
  "pcName": "PC-002-Updated",
  "dept": "HR",
  "status": "repair"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pc-id",
    "pcName": "PC-002-Updated",
    "dept": "HR",
    "status": "repair",
    "userName": "jane.doe",
    "cpuBarcode": "CPU789012",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Delete PC Asset
```
DELETE /assets/pc/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "PC asset deleted successfully"
}
```

### Bulk Delete PC Assets
```
DELETE /assets/pc
```

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 PC assets deleted successfully"
}
```

Similar endpoints exist for other asset types:
- **Laptop**: `/assets/laptop`
- **Printer**: `/assets/printer`
- **License**: `/assets/license`
- **Warehouse**: `/assets/warehouse`
- **Internet**: `/assets/internet`

## Custom Fields Endpoints

### List Custom Fields
```
GET /custom-fields
```

**Query Parameters:**
- `modelType` (optional): Filter by asset type (PC, Laptop, etc.)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "field-id",
      "name": "CPU",
      "type": "text",
      "modelType": "PC",
      "required": false,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Get Custom Field
```
GET /custom-fields/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "field-id",
    "name": "CPU",
    "type": "text",
    "modelType": "PC",
    "required": false,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Create Custom Field
```
POST /custom-fields
```

**Request Body:**
```json
{
  "name": "RAM",
  "type": "text",
  "modelType": "PC",
  "required": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-field-id",
    "name": "RAM",
    "type": "text",
    "modelType": "PC",
    "required": false,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Update Custom Field
```
PUT /custom-fields/{id}
```

**Request Body:**
```json
{
  "name": "RAM Size",
  "type": "text",
  "required": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "field-id",
    "name": "RAM Size",
    "type": "text",
    "modelType": "PC",
    "required": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Delete Custom Field
```
DELETE /custom-fields/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Custom field deleted successfully"
}
```

## Dashboard Endpoints

### Get Dashboard Summary
```
GET /dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pc": {
      "total": 50,
      "working": 45,
      "repair": 3,
      "leave": 2
    },
    "laptop": [
      {
        "_count": 30,
        "status": "working"
      }
    ],
    "printer": [
      {
        "_count": 15,
        "status": "working"
      }
    ],
    "license": [
      {
        "_count": 100,
        "updateStatus": "valid"
      }
    ],
    "customFieldStats": {
      "PC_CPU": {
        "count": 50,
        "values": {
          "Intel i7": 25,
          "Intel i5": 20,
          "AMD Ryzen": 5
        }
      }
    }
  }
}
```

## Excel Import/Export Endpoints

### Export Assets to Excel
```
GET /assets/excel/export
```

**Query Parameters:**
- `assetType`: Asset type (pc, laptop, printer, license, warehouse, internet)
- `dept` (optional): Department filter
- `selectedIds` (optional): Comma-separated list of asset IDs

**Response:**
Binary Excel file

### Import Assets from Excel
```
POST /assets/excel/import
```

**Form Data:**
- `file`: Excel file to import
- `assetType`: Asset type (pc, laptop, printer, license, warehouse, internet)

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 25,
    "errors": 0,
    "details": []
  }
}
```

## Agent API Endpoints

### Submit Agent Data
```
POST /agent
```

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "asset-id",
    "message": "Agent data processed successfully"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Request validation failed |
| AUTHENTICATION_ERROR | Authentication failed |
| AUTHORIZATION_ERROR | Insufficient permissions |
| NOT_FOUND | Resource not found |
| DATABASE_ERROR | Database operation failed |
| CACHE_ERROR | Cache operation failed |
| EXCEL_ERROR | Excel processing failed |
| INTERNAL_ERROR | Unexpected server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per IP for unauthenticated endpoints
- 1000 requests per minute per user for authenticated endpoints

Exceeding these limits will result in a 429 (Too Many Requests) response.

## Versioning

The API follows semantic versioning. Breaking changes will be introduced in new major versions, with appropriate version paths.

## Changelog

### v1.0.0 (Initial Release)
- Basic CRUD operations for all entities
- Authentication and authorization
- Excel import/export functionality
- Custom fields support
- Dashboard analytics
- Agent API integration

### v1.1.0 (Planned)
- Advanced search and filtering
- Reporting APIs
- Audit trail endpoints
- Performance optimizations