import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { FixedAsset } from '@/types/asset-interfaces';

// Define operations specific to Fixed assets
const fixedAssetOperations: AssetOperations<FixedAsset> = {
  modelName: 'FixedAsset',
  requiredFields: ['dept', 'name', 'status'],
  searchFields: ['dept', 'barcode', 'sapCode', 'name', 'place', 'location', 'status', 'note']
};

// Create handler for Fixed assets
export const fixedAssetHandler = new BaseAssetApiHandler<FixedAsset>(db, fixedAssetOperations);