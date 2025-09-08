import { Tenant as TenantType } from "@/hooks/useApi";

// Define the Role type to match the database structure
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Define the JWT payload structure
export interface UserJwtPayload {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  exp: number;
  iat: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role | null;  // Now role is an object when fetched from API
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Props for the UsersTable component
export interface UsersTableProps {
  users: User[];
  tenants: TenantType[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string | string) => void;
  isDeleting?: boolean;
  deletingUserId?: string | null;
}

// Interface for user creation/update (includes password)
// This matches what the API expects for creation/update operations
export interface UserCreateUpdate {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role?: string;  // For API operations, role is a string (role name)
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Updated to support dynamic roles instead of hardcoded 'admin' | 'user'
export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: string;  // Changed from UserRole to string to support dynamic roles
  tenantId?: string;
}

export interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  tenants: TenantType[];
  onSubmit: (data: UserFormValues) => void;
  isSubmitting: boolean;
}

// Updated UserRole type to be more flexible - can be any string for dynamic roles
export type UserRole = string;