import { User, UserFormProps as UserFormPropsBase } from "@/types/users";
import { Tenant } from "@/hooks/useApi";

// Re-export the imported types
export type { User };
export type { Tenant };

// Export the locally defined interfaces
export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: string;
  tenantId?: string;
}

// Define the UsersTableProps interface
export interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

// If we need to extend the base interfaces, we can do so here
export interface UserFormProps extends UserFormPropsBase {}

export interface UsersPageProps {}