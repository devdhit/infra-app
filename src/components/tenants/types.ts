import { Tenant } from "@/hooks/useApi";

export interface TenantFormValues {
  id?: string;
  name: string;
  description?: string;
}

export interface TenantsTableProps {
  tenants: Tenant[];
  onEdit: (tenant: Tenant | null) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingTenantId: string | null;
}

export interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  onSubmit: (data: TenantFormValues) => void;
  isSubmitting: boolean;
}

export interface TenantsPageProps {
  // Add any props that might be needed for the page component
}