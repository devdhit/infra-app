import { CustomField } from "@/types/custom-fields";

export interface AssetCounts {
  total: number;
  pc: number;
  laptop: number;
  printer: number;
  license: number;
  warehouse: number;
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

export interface DashboardData {
  assets: AssetCounts;
  statusBreakdown: StatusBreakdown;
  departmentStats: DepartmentAssetStat[];
  allDepartmentStats: DepartmentStats;
  customFields: CustomField[];
  recentActivities: RecentActivity[];
}