// Define the resource types and permission actions
export const RESOURCE_TYPES = ['users', 'tenants', 'assets', 'settings', 'roles', 'pc', 'laptop', 'printer', 'license', 'warehouse', 'internet'] as const
export type ResourceType = typeof RESOURCE_TYPES[number]

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'bulkDelete'] as const
export type PermissionAction = typeof PERMISSION_ACTIONS[number]

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