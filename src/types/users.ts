import { Tenant as TenantType } from "@/hooks/useApi";

export type UserRole = 'admin' | 'user';

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

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role | null;  // Now role is an object when fetched from API
  tenantId: string;
  createdAt: string;
  updatedAt: string;
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

export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;  // For form values, we still use the string representation
  tenantId?: string;
}

export interface UsersTableProps {
  users: User[];
  tenants: TenantType[];
  onEdit?: (user: User | null) => void;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

export interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  tenants: TenantType[];
  onSubmit: (data: UserFormValues) => void;
  isSubmitting: boolean;
}

export interface UsersPageProps {
  // Add any props that might be needed for the page component
}

export interface UserJwtPayload {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  exp: number;
}

// Export the Tenant type from useApi
export type Tenant = TenantType;