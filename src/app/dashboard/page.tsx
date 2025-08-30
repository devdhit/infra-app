'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Activity,
  User,
  Building,
  Settings
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardData, StatusBreakdownItem, DepartmentAssetStat } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssetDataItem {
  name: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading, error } = useDashboard<DashboardData>();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500">{t('common.error')}</h2>
          <p className="text-muted-foreground">{t('dashboard.errorLoading')}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const assetData: AssetDataItem[] = [
    { name: 'PC', count: dashboardData?.assets?.pc || 0, icon: Monitor },
    { name: 'Laptop', count: dashboardData?.assets?.laptop || 0, icon: Laptop },
    { name: 'Printer', count: dashboardData?.assets?.printer || 0, icon: Printer },
    { name: 'License', count: dashboardData?.assets?.license || 0, icon: Key },
    { name: 'Warehouse', count: dashboardData?.assets?.warehouse || 0, icon: Warehouse },
  ];

  // Initialize with proper structure
  const statusData: StatusBreakdownItem[] = [
    { status: 'working', _count: 0 },
    { status: 'leave', _count: 0 },
    { status: 'repair', _count: 0 },
  ];

  // Process status breakdown data for PC
  dashboardData?.statusBreakdown?.pc?.forEach((item) => {
    const statusItem = statusData.find(s => s.status === item.status);
    if (statusItem) {
      statusItem._count = item._count;
    }
  });

  // Process status breakdown data for Laptop
  const laptopStatusData: StatusBreakdownItem[] = [
    { status: 'working', _count: 0 },
    { status: 'leave', _count: 0 },
    { status: 'repair', _count: 0 },
  ];

  dashboardData?.statusBreakdown?.laptop?.forEach((item) => {
    const statusItem = laptopStatusData.find(s => s.status === item.status);
    if (statusItem) {
      statusItem._count = item._count;
    }
  });

  // Combine data for chart
  const combinedStatusData = statusData.map((pcItem, index) => ({
    name: t(`assets.status.${pcItem.status}`, pcItem.status),
    pc: pcItem._count,
    laptop: laptopStatusData[index]?._count || 0
  }));

  // Calculate active assets (working status)
  const activeAssets = (statusData.find(s => s.status === 'working')?._count || 0) + 
                      (laptopStatusData.find(s => s.status === 'working')?._count || 0);

  // Calculate maintenance assets (repair status)
  const maintenanceAssets = (statusData.find(s => s.status === 'repair')?._count || 0) + 
                           (laptopStatusData.find(s => s.status === 'repair')?._count || 0);

  // Calculate retired assets (leave status)
  const retiredAssets = (statusData.find(s => s.status === 'leave')?._count || 0) + 
                       (laptopStatusData.find(s => s.status === 'leave')?._count || 0);

  // Prepare data for pie chart
  const pieData = assetData.filter(item => item.count > 0);

  // Prepare department statistics data
  const departmentStatsData = dashboardData?.departmentStats?.map((dept: DepartmentAssetStat) => ({
    name: dept.department,
    pcs: dept.pcCount,
    monitors: dept.monitorCount,
    ups: dept.upsCount
  })) || [];

  // Prepare department statistics for all asset types
  const allDepartmentStatsData = {
    pc: dashboardData?.allDepartmentStats?.pc?.map(dept => ({
      name: dept.department,
      count: dept.count,
      monitors: dept.monitorCount,
      ups: dept.upsCount
    })) || [],
    laptop: dashboardData?.allDepartmentStats?.laptop?.map(dept => ({
      name: dept.department,
      count: dept.count
    })) || [],
    printer: dashboardData?.allDepartmentStats?.printer?.map(dept => ({
      name: dept.department,
      count: dept.count
    })) || [],
    license: dashboardData?.allDepartmentStats?.license?.map(dept => ({
      name: dept.department,
      count: dept.count
    })) || []
  };

  // Get custom field types for display
  const customFieldTypes = dashboardData?.customFields?.map(field => field.type) || [];
  const uniqueCustomFieldTypes = Array.from(new Set(customFieldTypes));

  return (
    <div className="space-y-6">
      {/* Page title and description (without header) */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalAssets')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.assets?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeAssets')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.maintenanceAssets')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.retiredAssets')}</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retiredAssets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('assets.pc.title')} {t('common.distribution')}</CardTitle>
            <CardDescription>{t('dashboard.assetDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetData.map((asset) => (
                <div key={asset.name} className="flex items-center">
                  <div className="flex items-center w-32">
                    <asset.icon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{t(`nav.${asset.name.toLowerCase()}`) || asset.name}</span>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ 
                          width: `${dashboardData?.assets?.total ? (asset.count / dashboardData.assets.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium">
                    {asset.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.assetBreakdown')}</CardTitle>
            <CardDescription>{t('dashboard.assetBreakdownDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${t(`nav.${name.toLowerCase()}`) || name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, t('common.count')]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('dashboard.noAssets')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Tabs defaultValue="pc" className="w-full">
        <TabsList>
          <TabsTrigger value="pc">{t('assets.pc.title')}</TabsTrigger>
          <TabsTrigger value="laptop">{t('assets.laptop.title')}</TabsTrigger>
          <TabsTrigger value="printer">{t('assets.printer.title')}</TabsTrigger>
          <TabsTrigger value="license">{t('assets.license.title')}</TabsTrigger>
        </TabsList>
        <TabsContent value="pc">
          <Card>
            <CardHeader>
              <CardTitle>{t('assets.pc.title')} {t('common.distribution')} {t('assets.pc.dept')}</CardTitle>
              <CardDescription>{t('assets.pc.title')} {t('common.distribution')} {t('assets.pc.dept')}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {allDepartmentStatsData.pc.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allDepartmentStatsData.pc}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 60,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name={t('assets.pc.title')} />
                    <Bar dataKey="monitors" fill="#10b981" name={t('assets.pc.monitorBarcode')} />
                    <Bar dataKey="ups" fill="#f59e0b" name={t('assets.pc.upsBarcode')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('dashboard.noAssets')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="laptop">
          <Card>
            <CardHeader>
              <CardTitle>{t('assets.laptop.title')} {t('common.distribution')} {t('assets.laptop.department')}</CardTitle>
              <CardDescription>{t('assets.laptop.title')} {t('common.distribution')} {t('assets.laptop.department')}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {allDepartmentStatsData.laptop.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allDepartmentStatsData.laptop}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 60,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name={t('assets.laptop.title')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('dashboard.noAssets')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="printer">
          <Card>
            <CardHeader>
              <CardTitle>{t('assets.printer.title')} {t('common.distribution')} {t('assets.printer.department')}</CardTitle>
              <CardDescription>{t('assets.printer.title')} {t('common.distribution')} {t('assets.printer.department')}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {allDepartmentStatsData.printer.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allDepartmentStatsData.printer}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 60,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#f59e0b" name={t('assets.printer.title')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('dashboard.noAssets')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>{t('assets.license.title')} {t('common.distribution')} {t('assets.license.department')}</CardTitle>
              <CardDescription>{t('assets.license.title')} {t('common.distribution')} {t('assets.license.department')}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {allDepartmentStatsData.license.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allDepartmentStatsData.license}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 60,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ef4444" name={t('assets.license.title')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('dashboard.noAssets')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Fields Information */}
      {dashboardData?.customFields && dashboardData.customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              {t('settings.customFields.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.customFields.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <div className="text-sm">
                <span className="font-medium">{dashboardData.customFields.length}</span> {t('settings.customFields.title').toLowerCase()} {t('common.distribution')}
              </div>
              {uniqueCustomFieldTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.customFields.slice(0, 6).map((field) => (
                <Card key={field.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{field.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{field.type}</Badge>
                      {field.required && (
                        <Badge variant="default">{t('settings.customFields.required')}</Badge>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {field.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {dashboardData.customFields.length > 6 && (
                <Card className="flex items-center justify-center">
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold">+{dashboardData.customFields.length - 6}</div>
                      <div className="text-sm text-muted-foreground">{t('common.more')}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Status and Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('assets.pc.title')} {t('assets.laptop.title')} {t('common.status')}</CardTitle>
            <CardDescription>{t('dashboard.assetStatus')}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedStatusData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pc" fill="#3b82f6" name={t('nav.pc')} />
                <Bar dataKey="laptop" fill="#10b981" name={t('nav.laptop')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivities')}</CardTitle>
            <CardDescription>{t('dashboard.latestChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivities?.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="bg-gray-100 rounded-full p-2">
                      {activity.action === 'create' && <div className="bg-green-500 rounded-full w-2 h-2"></div>}
                      {activity.action === 'update' && <div className="bg-blue-500 rounded-full w-2 h-2"></div>}
                      {activity.action === 'delete' && <div className="bg-red-500 rounded-full w-2 h-2"></div>}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">
                      {activity.user?.name || 'Unknown User'} {activity.action}d a {activity.modelType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('dashboard.noRecentActivities')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}