# Role-Based Access Control (RBAC) System

This document explains the role-based access control system implemented in the IT Asset Management System.

## Overview

The system implements role-based access control to restrict access to certain features based on the user's role. There are two roles in the system:

1. **Admin** - Has full access to all features
2. **User** - Has limited access to features

## Roles and Permissions

### Admin Role
Admin users have full access to all features in the system:
- View, create, edit, delete, and bulk delete users
- View, create, edit, delete, and bulk delete tenants
- View, create, edit, delete, and bulk delete assets
- View and edit settings

### User Role
Regular users have limited access:
- View users (only their own profile)
- View tenants
- View, create, edit, and delete assets (but not bulk delete)
- View settings

## Implementation Details

### 1. Permissions System

The permissions system is implemented in `src/lib/permissions.ts` and consists of:

- **UserRole**: Type definition for user roles ('admin' | 'user')
- **PermissionAction**: Type definition for actions ('view' | 'create' | 'edit' | 'delete' | 'bulkDelete')
- **ResourceType**: Type definition for resources ('users' | 'tenants' | 'assets' | 'settings')
- **hasPermission()**: Function to check if a role has permission for a specific action on a resource
- **hasAnyPermission()**: Function to check if a role has any of the specified permissions
- **getRolePermissions()**: Function to get all permissions for a role

### 2. Navigation Filtering

The navigation sidebar (`src/components/layout/navigation.tsx`) filters menu items based on the user's role. Each navigation item can specify which roles can access it:

```typescript
{
  nameKey: "nav.users", 
  href: "/users", 
  icon: Users,
  roles: ['admin'] // Only admins can access
}
```

### 3. Permission Hook

The `usePermissions()` hook (`src/hooks/use-permissions.ts`) provides an easy way to check permissions in components:

```typescript
const { checkPermission, canViewUsers, canCreateUsers } = usePermissions();

// Check specific permission
if (checkPermission('users', 'create')) {
  // Show create user button
}

// Use convenience methods
if (canCreateUsers()) {
  // Show create user button
}
```

### 4. Component-Level Access Control

Pages and components check permissions before rendering sensitive actions:

```typescript
const { checkPermission } = usePermissions();
const canCreateUsers = checkPermission('users', 'create');

// Conditionally render create button
{canCreateUsers && (
  <Button onClick={() => handleEdit(null)}>
    Add User
  </Button>
)}
```

### 5. API-Level Access Control

API routes should also implement access control checks to prevent unauthorized access even if UI restrictions are bypassed.

## Adding New Roles or Permissions

To add new roles or modify existing permissions:

1. Update the `UserRole` type in `src/lib/permissions.ts`
2. Modify the permissions array in `src/lib/permissions.ts`
3. Update the navigation items in `src/components/layout/navigation.tsx` if needed
4. Add new convenience methods to the `usePermissions()` hook
5. Update components to use the new permissions
6. Update translation files with new messages

## Security Considerations

1. **Client-Side Filtering**: The current implementation filters UI elements based on roles, but this is only for user experience. Server-side validation must also be implemented in API routes.

2. **Token Storage**: JWT tokens are stored in localStorage. For production applications, consider using httpOnly cookies for better security.

3. **Role Validation**: Always validate user roles in API routes, not just in the UI.

## Testing

Permissions are tested in `__tests__/permissions.test.ts` to ensure that:
- Admin users have appropriate access to all features
- Regular users have limited access as defined
- Unknown roles or actions are properly handled