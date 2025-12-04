import { db } from '../db';
import { BaseAssetApiHandler, AssetOperations } from './base-asset-handler';
import { ITPurchasingAsset } from '@/types/asset-interfaces';

// Define operations specific to IT Purchasing assets
const itPurchasingOperations: AssetOperations<ITPurchasingAsset> = {
  modelName: 'ITPurchasing',
  requiredFields: ['bpmName', 'bpmContent', 'bpmId', 'deptCode', 'statusBPM'],
  searchFields: ['bpmName', 'bpmContent', 'bpmId', 'deptCode', 'statusBPM', 'prId', 'statusPR', 'statusReceive', 'noted']
};

// Create handler for IT Purchasing assets
export const itPurchasingHandler = new BaseAssetApiHandler<ITPurchasingAsset>(db, itPurchasingOperations);
