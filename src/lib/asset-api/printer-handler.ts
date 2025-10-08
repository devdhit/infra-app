import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { PrinterAsset } from '@/types/asset-interfaces';

// Define operations specific to Printer assets
const printerOperations: AssetOperations<PrinterAsset> = {
  modelName: 'Printer',
  requiredFields: ['dept', 'color'],
  searchFields: ['barcode', 'dept', 'model', 'ip', 'note']
};

// Create handler for Printer assets
export const printerHandler = new BaseAssetApiHandler<PrinterAsset>(db, printerOperations);