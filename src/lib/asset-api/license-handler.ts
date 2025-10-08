import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { LicenseAsset } from '@/types/asset-interfaces';

// Define operations specific to License assets
const licenseOperations: AssetOperations<LicenseAsset> = {
  modelName: 'License',
  requiredFields: ['productKey'],
  searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'updateStatus']
};

// Create handler for License assets
export const licenseHandler = new BaseAssetApiHandler<LicenseAsset>(db, licenseOperations);