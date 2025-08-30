export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';
  modelType: 'PC' | 'Laptop' | 'Printer' | 'License' | 'WarehouseIT';
  required: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldFormData {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';
  modelType: 'PC' | 'Laptop' | 'Printer' | 'License' | 'WarehouseIT';
  required: boolean;
  description?: string;
}

export interface ModelTypeOption {
  value: 'PC' | 'Laptop' | 'Printer' | 'License' | 'WarehouseIT';
  label: string;
}

export interface FieldTypeOption {
  value: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  description: string;
}