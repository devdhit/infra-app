import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { WarehouseITAsset } from '@/types/asset-interfaces';

// Define operations specific to WarehouseIT assets
const warehouseOperations: AssetOperations<WarehouseITAsset> = {
  modelName: 'WarehouseIT',
  requiredFields: ['status'],
  searchFields: ['barcode', 'sapCode', 'status', 'note']
};

// Create handler for WarehouseIT assets
export const warehouseHandler = new BaseAssetApiHandler<WarehouseITAsset>(db, warehouseOperations);