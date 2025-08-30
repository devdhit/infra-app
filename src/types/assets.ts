// Common types for asset management

export interface Asset {
  id: string;
  [key: string]: any; // Allow additional properties
}

export interface AssetResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AssetColumn {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
  originalKey?: string; // For unique key handling
  isCustomField?: boolean; // To identify custom fields
  hide?: boolean; // Whether to hide the column by default
}

export interface AssetFormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "textarea" | "select" | "url" | "boolean";
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  render?: (value: any) => React.ReactNode;
  isCustomField?: boolean; // Add this property
}

export interface AssetType {
  name: string;
  key: string;
  columns: AssetColumn[];
  formFields: AssetFormField[];
}