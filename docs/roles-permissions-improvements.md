# Roles and Permissions System Improvements

## Overview

This document describes the improvements made to the ITAMS roles and permissions system to make it more flexible and dynamic, allowing for custom roles beyond the hardcoded 'admin' and 'user' roles.

## Key Improvements

### 1. Dynamic Role Assignment

Previously, the system only supported two hardcoded roles: 'admin' and 'user'. The improved system now supports:

- Creation of custom roles with unique names
- Assignment of any role to users (not limited to admin/user)
- Dynamic role fetching in the UI components

### 2. Flexible Permission System

The permission system now:

- Supports any number of custom roles
- Allows fine-grained permission control per resource type
- Provides asset-specific permissions for different asset types
- Uses a JSON-based permission structure stored in the database

### 3. Complete API Implementation

The API routes have been completed with full CRUD operations:

- **Users API**: GET, POST, PUT, DELETE with proper permission checks
- **Roles API**: GET, POST, PUT, DELETE with proper permission checks

### 4. UI Enhancements

The frontend components have been updated to:

- Dynamically fetch available roles from the API
- Display all available roles in selection dropdowns
- Support creation and management of custom roles
- Properly handle role-based access control

## Technical Changes

### Backend Changes

1. **Fixed incomplete API routes**:
   - Completed the users API with PUT and DELETE methods
   - Added PUT and DELETE methods to the roles API

2. **Enhanced permission checking**:
   - Updated permission validation to work with dynamic roles
   - Improved error handling and logging

3. **Database schema**:
   - Roles are stored with a JSON permissions field
   - Users are linked to roles via foreign key relationship

### Frontend Changes

1. **User Form Component**:
   - Replaced hardcoded role options with dynamic role fetching
   - Updated type definitions to support string-based roles

2. **Role Form Component**:
   - Maintained comprehensive permission configuration UI
   - Supports asset-specific permissions

3. **Users Page**:
   - Updated to properly handle dynamic roles
   - Improved permission checking logic

## Usage Examples

### Creating a Custom Role

```javascript
// API call to create a custom role
const customRole = await db.role.create({
  data: {
    name: 'asset_manager',
    description: 'Role for managing company assets',
    permissions: {
      assets: ['view', 'create', 'edit', 'delete'],
      pc: ['view', 'create', 'edit', 'delete'],
      laptop: ['view', 'create', 'edit', 'delete']
    },
    tenantId: 'tenant-id-here'
  }
});
```

### Assigning a User to a Custom Role

```javascript
// API call to create a user with a custom role
const user = await db.user.create({
  data: {
    email: 'asset.manager@company.com',
    name: 'Asset Manager',
    password: hashedPassword,
    roleId: customRole.id, // ID of the custom role
    tenantId: 'tenant-id-here'
  }
});
```

### Checking Permissions

```javascript
// Check if a user has permission to perform an action
const hasPermission = await hasPermission(
  user.roleId,
  user.tenantId,
  'assets',
  'create'
);
```

## Benefits

1. **Flexibility**: Organizations can create roles that match their specific organizational structure
2. **Scalability**: The system can accommodate any number of custom roles
3. **Security**: Fine-grained permission control ensures users only have access to what they need
4. **Maintainability**: The system is easier to maintain and extend with new features

## Testing

Comprehensive test scripts have been created to verify the functionality:

- `script/test-role-permissions.js`: Tests basic role and permission functionality
- `script/test-user-role-system.js`: Tests the complete user and role management system

These scripts can be run to verify that the system is working correctly.