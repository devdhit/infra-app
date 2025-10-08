import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { PCAsset } from '@/types/asset-interfaces';

// Define operations specific to PC assets
const pcOperations: AssetOperations<PCAsset> = {
  modelName: 'PC',
  requiredFields: ['dept', 'pcName', 'status'],
  searchFields: ['cpuBarcode', 'pcName', 'userName', 'dept', 'status']
};

// Create handler for PC assets
export const pcHandler = new BaseAssetApiHandler<PCAsset>(db, pcOperations);