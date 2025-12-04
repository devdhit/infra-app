// Define comprehensive asset interfaces with proper typing
export interface BaseAsset {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  customFields?: Record<string, any>;
}

export interface PCAsset extends BaseAsset {
  dept: string;
  cpuBarcode?: string;
  cpuSapBarcode?: string;
  monitorBarcode?: string;
  monitorSapBarcode?: string;
  upsBarcode?: string;
  upsSapBarcode?: string;
  pcName: string;
  userName?: string;
  status: string;
  note?: string;
}

export interface LaptopAsset extends BaseAsset {
  dept: string;
  barcode?: string;
  sapBarcode?: string;
  dateBuy?: string;
  userName?: string;
  email?: string;
  model?: string;
  status: string;
}

export interface PrinterAsset extends BaseAsset {
  dept: string;
  location?: string;
  ip?: string;
  model?: string;
  color: string;
  barcode?: string;
  sapCode?: string;
  date?: string;
  note?: string;
}

export interface LicenseAsset extends BaseAsset {
  deviceName?: string;
  userName?: string;
  dept?: string;
  productType?: string;
  productKey?: string;
  model?: string;
  pc?: string;
  mac?: string;
  ip?: string;
  date?: string;
  updateStatus?: string;
}

export interface WarehouseITAsset extends BaseAsset {
  barcode?: string;
  sapCode?: string;
  status: string;
  note?: string;
}

export interface InternetAsset extends BaseAsset {
  dept: string;
  manager?: string;
  userName?: string;
  email?: string;
  ipAddress?: string;
  internetAccess?: string;
  status: string;
  note?: string;
}

export interface FixedAsset extends BaseAsset {
  dept: string;
  barcode?: string;
  sapCode?: string;
  name: string;
  place?: string;
  inputDate?: string;
  location?: string;
  status: string;
  note?: string;
}

export interface ITPurchasingAsset extends BaseAsset {
  bpmName: string;
  bpmContent: string;
  bpmId: string;
  deptCode: string;
  statusBPM: string;
  prId?: string;
  statusPR?: string;
  statusReceive?: string;
  dateReceive?: string;
  noted?: string;
}

// Union type for all asset types
export type AssetType = PCAsset | LaptopAsset | PrinterAsset | LicenseAsset | WarehouseITAsset | InternetAsset | FixedAsset | ITPurchasingAsset;