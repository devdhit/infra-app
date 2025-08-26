declare module 'xlsx-populate' {
  type CellValue = string | number | boolean | Date | null | undefined;

  interface Cell {
    value(): CellValue;
    value(value: CellValue): Cell;
  }

  interface Range {
    value(): CellValue[][];
  }

  interface Worksheet {
    cell(row: number, column: number): Cell;
    usedRange(): Range | null;
    name(): string;
    name(name: string): Worksheet;
  }

  interface Workbook {
    sheet(index: number): Worksheet;
    sheet(name: string): Worksheet;
    outputAsync(): Promise<ArrayBuffer>;
    toFileAsync(path: string): Promise<void>;
  }

  const XLSX: {
    fromBlankAsync(): Promise<Workbook>;
    fromDataAsync(data: ArrayBuffer | Buffer | Uint8Array): Promise<Workbook>;
  };

  export default XLSX;
}