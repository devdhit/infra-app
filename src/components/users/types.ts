import { User, UserCreateUpdate } from "@/types/users";
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
  onDelete?: (id: string | string[]) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

// Define the UserFormProps interface with all required props
export interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserCreateUpdate | null;
  tenants: Tenant[];
  onSubmit: (data: UserCreateUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export interface UsersPageProps {}