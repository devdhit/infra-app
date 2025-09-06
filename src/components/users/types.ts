import { User, Tenant, UsersTableProps as UsersTablePropsBase, UserFormProps as UserFormPropsBase, UsersPageProps as UsersPagePropsBase } from "@/types/users";

// Re-export the imported types
export type { User, Tenant };

// Export the locally defined interfaces
export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  tenantId?: string;
}

// If we need to extend the base interfaces, we can do so here
export interface UsersTableProps extends UsersTablePropsBase {}

export interface UserFormProps extends UserFormPropsBase {}

export interface UsersPageProps extends UsersPagePropsBase {}