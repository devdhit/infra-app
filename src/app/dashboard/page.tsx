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
  Building,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardData, StatusBreakdownItem } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface AssetDataItem {
  name: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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
    { name: 'PC', count: dashboardData?.assets?.pc || 0, icon: Monitor, color: 'bg-blue-500' },
    { name: 'Laptop', count: dashboardData?.assets?.laptop || 0, icon: Laptop, color: 'bg-green-500' },
    { name: 'Printer', count: dashboardData?.assets?.printer || 0, icon: Printer, color: 'bg-yellow-500' },
    { name: 'License', count: dashboardData?.assets?.license || 0, icon: Key, color: 'bg-red-500' },
    { name: 'Warehouse', count: dashboardData?.assets?.warehouse || 0, icon: Warehouse, color: 'bg-purple-500' },
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
      {/* Page title and description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button size="sm" className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.configure')}
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalAssets')}</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.assets?.total || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span>+12% {t('common.fromLastMonth')}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeAssets')}</CardTitle>
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{((activeAssets / (dashboardData?.assets?.total || 1)) * 100).toFixed(1)}% {t('common.ofTotal')}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.maintenanceAssets')}</CardTitle>
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{((maintenanceAssets / (dashboardData?.assets?.total || 1)) * 100).toFixed(1)}% {t('common.ofTotal')}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-gray-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.retiredAssets')}</CardTitle>
            <div className="p-2 rounded-full bg-gray-100 text-gray-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retiredAssets}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{((retiredAssets / (dashboardData?.assets?.total || 1)) * 100).toFixed(1)}% {t('common.ofTotal')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Distribution and Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              {t('dashboard.assetBreakdown')}
            </CardTitle>
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
                    label={({ name, percent }) => `${t(`nav.${name.toLowerCase()}`) || name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, t('common.count')]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('dashboard.noAssets')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              {t('dashboard.assetStatus')}
            </CardTitle>
            <CardDescription>{t('dashboard.assetStatus')}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedStatusData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Bar dataKey="pc" fill="#3b82f6" name={t('nav.pc')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="laptop" fill="#10b981" name={t('nav.laptop')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-purple-500" />
            {t('common.distribution')} {t('common.by')} {t('common.department')}
          </CardTitle>
          <CardDescription>{t('common.distribution')} {t('common.by')} {t('common.department')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pc" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="pc" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t('assets.pc.title')}
              </TabsTrigger>
              <TabsTrigger value="laptop" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t('assets.laptop.title')}
              </TabsTrigger>
              <TabsTrigger value="printer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t('assets.printer.title')}
              </TabsTrigger>
              <TabsTrigger value="license" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {t('assets.license.title')}
              </TabsTrigger>
            </TabsList>
            <div className="mt-6 h-80">
              <TabsContent value="pc">
                {allDepartmentStatsData.pc.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allDepartmentStatsData.pc}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 60,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name={t('assets.pc.title')} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="monitors" fill="#10b981" name={t('assets.pc.monitorBarcode')} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ups" fill="#f59e0b" name={t('assets.pc.upsBarcode')} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('dashboard.noAssets')}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="laptop">
                {allDepartmentStatsData.laptop.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allDepartmentStatsData.laptop}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 60,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#10b981" name={t('assets.laptop.title')} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('dashboard.noAssets')}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="printer">
                {allDepartmentStatsData.printer.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allDepartmentStatsData.printer}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 60,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#f59e0b" name={t('assets.printer.title')} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('dashboard.noAssets')}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="license">
                {allDepartmentStatsData.license.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allDepartmentStatsData.license}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 60,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#ef4444" name={t('assets.license.title')} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('dashboard.noAssets')}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom Fields and Recent Activities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Custom Fields Information */}
        {dashboardData?.customFields && dashboardData.customFields.length > 0 && (
          <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-500" />
                {t('settings.customFields.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.customFields.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium">{dashboardData.customFields.length}</span> {t('settings.customFields.title').toLowerCase()} {t('common.distribution')}
                </div>
                <Separator orientation="vertical" className="h-5" />
                {uniqueCustomFieldTypes.map((type) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.customFields.slice(0, 4).map((field) => (
                  <Card key={field.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{field.name}</span>
                        {field.required && (
                          <Badge variant="default" className="text-xs">
                            {t('common.required')}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{field.type}</Badge>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {dashboardData.customFields.length > 4 && (
                  <Card className="flex items-center justify-center border-dashed hover:shadow-md transition-shadow">
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold">+{dashboardData.customFields.length - 4}</div>
                        <div className="text-sm text-muted-foreground">{t('common.more')}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-500" />
              {t('dashboard.recentActivities')}
            </CardTitle>
            <CardDescription>{t('dashboard.latestChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivities?.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className="bg-gray-100 rounded-full p-2">
                      {activity.action === 'create' && <div className="bg-green-500 rounded-full w-2 h-2"></div>}
                      {activity.action === 'update' && <div className="bg-blue-500 rounded-full w-2 h-2"></div>}
                      {activity.action === 'delete' && <div className="bg-red-500 rounded-full w-2 h-2"></div>}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">
                      {activity.user?.name || 'Unknown User'} <span className="font-normal text-muted-foreground">{activity.action}d</span> a {activity.modelType}
                    </p>
                    <p className="text-xs text-muted-foreground">
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