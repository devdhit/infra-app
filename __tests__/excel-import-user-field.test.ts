import { importFromExcelWithTemplate } from '@/lib/excel';

// Mock the xlsx-populate library
jest.mock('xlsx-populate', () => ({
  fromDataAsync: jest.fn().mockResolvedValue({
    sheet: jest.fn().mockReturnValue({
      usedRange: jest.fn().mockReturnValue({
        value: jest.fn().mockReturnValue([
          ['dept', 'cpuBarcode', 'pcName', 'user'], // headers
          ['IT', 'CPU123', 'PC-001', 'john.doe@example.com'], // row with user
          ['HR', 'CPU124', 'PC-002', ''], // row with empty user
          ['Finance', 'CPU125', 'PC-003', null], // row with null user
        ])
      })
    })
  })
}));

describe('Excel Import User Field Handling', () => {
  it('should handle user field correctly', async () => {
    const mockFile = new File([''], 'test.xlsx');
    const result = await importFromExcelWithTemplate(mockFile, 'pc');
    
    expect(result).toHaveLength(3);
    
    // Row with user email should have user field as string
    expect(result[0].user).toBe('john.doe@example.com');
    
    // Row with empty user should have user field as undefined
    expect(result[1].user).toBeUndefined();
    
    // Row with null user should have user field as undefined
    expect(result[2].user).toBeUndefined();
  });
});