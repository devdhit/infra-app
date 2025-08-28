import { User, Tenant } from "@/hooks/useApi";

export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  tenantId?: string;
}

export interface UsersTableProps {
  users: User[];
  tenants: Tenant[];
  onEdit: (user: User | null) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

export interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  tenants: Tenant[];
  onSubmit: (data: UserFormValues) => void;
  isSubmitting: boolean;
}

export interface UsersPageProps {
  // Add any props that might be needed for the page component
}