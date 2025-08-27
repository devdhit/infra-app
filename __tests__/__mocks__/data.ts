export const mockCustomFields = [
  { id: '1', name: 'warranty', type: 'date', modelType: 'PC', required: false },
  { id: '2', name: 'cost', type: 'number', modelType: 'PC', required: true },
  { id: '3', name: 'department', type: 'text', modelType: 'PC', required: false },
];

export const mockAssets = [
  {
    id: 'asset-1',
    cpuBarcode: 'CPU123',
    dept: 'IT',
    customFields: {
      warranty: '2025-12-31',
      cost: 1500,
      department: 'Engineering',
    },
  },
  {
    id: 'asset-2',
    cpuBarcode: 'CPU456',
    dept: 'HR',
    customFields: {
      warranty: '2026-06-30',
      cost: 2000,
    },
  },
];