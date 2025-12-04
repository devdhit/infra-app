import { CustomField } from "@/types/custom-fields";

export interface AssetCounts {
  total: number;
  pc: number;
  laptop: number;
  printer: number;
  license: number;
  warehouse: number;
  fixedAsset: number;
}

export interface StatusBreakdownItem {
  status: string;
  _count: number;
}

export interface StatusBreakdown {
  pc: StatusBreakdownItem[];
  laptop: StatusBreakdownItem[];
}

export interface RecentActivity {
  id: string;
  action: string;
  modelType: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export interface DepartmentAssetStat {
  department: string;
  pcCount: number;
  monitorCount: number;
  upsCount: number;
}

export interface DepartmentStats {
  pc: Array<{
    department: string;
    count: number;
    monitorCount: number;
    upsCount: number;
  }>;
  laptop: Array<{
    department: string;
    count: number;
  }>;
  printer: Array<{
    department: string;
    count: number;
  }>;
  license: Array<{
    department: string;
    count: number;
  }>;
}

// New interfaces for dashboard summary data
export interface PCSummary {
  cpuBarcode: string | null;
  cpuSapBarcode: string | null;
  monitorBarcode: string | null;
  monitorSapBarcode: string | null;
  upsBarcode: string | null;
  upsSapBarcode: string | null;
  _count: number;
}

export interface PCStats {
  total: number;
  totalCpus: number;
  totalMonitors: number;
  totalUps: number;
  details: PCSummary[];
}

export interface LaptopSummary {
  status: string | null;
  model: string | null;
  _count: number;
}

export interface PrinterSummary {
  color: string | null;
  model: string | null;
  location: string | null;
  _count: number;
}

export interface LicenseSummary {
  softwareName: string | null;
  productType: string | null;
  productKey: string | null;
  _count: number;
}

export interface WarehouseITSummary {
  barcode: string | null;
  sapCode: string | null;
  status: string | null;
  _count: number;
}

export interface InternetSummary {
  dept: string | null;
  manager: string | null;
  status: string | null;
  _count: number;
}

export interface FixedAssetSummary {
  dept: string | null;
  status: string | null;
  _count: number;
}

export interface FixedAssetStats {
  total: number;
  details: FixedAssetSummary[];
}

export interface CustomFieldStat {
  count: number;
  values: Record<string, number>;
}

export interface DashboardSummaryData {
  pc: PCStats;
  laptop: LaptopSummary[];
  printer: PrinterSummary[];
  license: LicenseSummary[];
  warehouseIT: WarehouseITSummary[];
  internet: InternetSummary[];
  fixedAsset: FixedAssetStats;
  customFields: CustomField[];
  customFieldStats: Record<string, CustomFieldStat>;
}

export interface DashboardData {
  assets: AssetCounts;
  statusBreakdown: StatusBreakdown;
  departmentStats: DepartmentAssetStat[];
  allDepartmentStats: DepartmentStats;
  customFields: CustomField[];
  recentActivities: RecentActivity[];
  licenseExpirations?: number;
  userCount?: number;
  totalDepartmentCount?: number;
  totalMonitorCount?: number;
  totalUpsCount?: number;
}