import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { InternetAsset } from '@/types/asset-interfaces';

// Define operations specific to Internet assets
const internetOperations: AssetOperations<InternetAsset> = {
  modelName: 'Internet',
  requiredFields: ['dept', 'status'],
  searchFields: ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note']
};

// Create handler for Internet assets
export const internetHandler = new BaseAssetApiHandler<InternetAsset>(db, internetOperations);