import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { LaptopAsset } from '@/types/asset-interfaces';

// Define operations specific to Laptop assets
const laptopOperations: AssetOperations<LaptopAsset> = {
  modelName: 'Laptop',
  requiredFields: ['dept', 'status'],
  searchFields: ['barcode', 'userName', 'dept', 'model', 'status']
};

// Create handler for Laptop assets
export const laptopHandler = new BaseAssetApiHandler<LaptopAsset>(db, laptopOperations);