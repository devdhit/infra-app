"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.getRolePermissions = getRolePermissions;
// Define permissions for each role
const permissions = [
    {
        role: 'admin',
        resource: 'users',
        actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
    },
    {
        role: 'user',
        resource: 'users',
        actions: ['view'] // Regular users can only view their own profile
    },
    {
        role: 'admin',
        resource: 'tenants',
        actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
    },
    {
        role: 'user',
        resource: 'tenants',
        actions: ['view']
    },
    {
        role: 'admin',
        resource: 'assets',
        actions: ['view', 'create', 'edit', 'delete', 'bulkDelete']
    },
    {
        role: 'user',
        resource: 'assets',
        actions: ['view', 'create', 'edit', 'delete']
    },
    {
        role: 'admin',
        resource: 'settings',
        actions: ['view', 'edit']
    },
    {
        role: 'user',
        resource: 'settings',
        actions: ['view']
    }
];
/**
 * Check if a user role has permission to perform an action on a resource
 * @param role - The user's role
 * @param resource - The resource type
 * @param action - The action to perform
 * @returns boolean - Whether the user has permission
 */
function hasPermission(role, resource, action) {
    const permission = permissions.find(p => p.role === role && p.resource === resource);
    if (!permission) {
        return false;
    }
    return permission.actions.includes(action);
}
/**
 * Check if a user role has any of the specified permissions
 * @param role - The user's role
 * @param resource - The resource type
 * @param actions - Array of actions to check
 * @returns boolean - Whether the user has any of the permissions
 */
function hasAnyPermission(role, resource, actions) {
    return actions.some(action => hasPermission(role, resource, action));
}
/**
 * Get all permissions for a user role
 * @param role - The user's role
 * @returns Array of permissions
 */
function getRolePermissions(role) {
    return permissions.filter(p => p.role === role);
}
