// Define the resource types and permission actions with more flexible typing
export type ResourceType = string;  // Changed from literal types to string for flexibility
export type PermissionAction = string;  // Changed from literal types to string for flexibility

// Define common resource types for type safety where needed
export const COMMON_RESOURCE_TYPES = [
  'users', 
  'tenants', 
  'assets', 
  'settings', 
  'roles', 
  'pc', 
  'laptop', 
  'printer', 
  'license', 
  'warehouse', 
  'internet'
] as const;

// Define common permission actions for type safety where needed
export const COMMON_PERMISSION_ACTIONS = [
  'view', 
  'create', 
  'edit', 
  'delete', 
  'bulkDelete'
] as const;

// Define a type for common resource types
export type CommonResourceType = typeof COMMON_RESOURCE_TYPES[number];

// Define a type for common permission actions
export type CommonPermissionAction = typeof COMMON_PERMISSION_ACTIONS[number];

// Define the Role interface
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<ResourceType, PermissionAction[]>;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Define the RoleFormValues interface
export interface RoleFormValues {
  id?: string;
  name: string;
  description: string;
  permissions: Record<ResourceType, PermissionAction[]>;
}

// Define the RolesTableProps interface
export interface RolesTableProps {
  roles: Role[];
  onEdit?: (role: Role) => void;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
  deletingRoleId: string | null;
}

// Define the RoleFormProps interface
export interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: Role | null;
  onSubmit: (data: RoleFormValues) => void;
  isSubmitting: boolean;
}