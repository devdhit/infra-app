'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  TrendingUp,
  Cpu,
  Battery,
  Server,
  Globe,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart as RechartsPieChart, Pie, Legend, AreaChart, Area } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardSummaryData } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useMemo, useState } from "react";
import { useDashboardSummary } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardExport } from "@/components/dashboard/dashboard-export";
import { RealTimeNotifications } from "@/components/dashboard/real-time-notifications";
import { useWebSocketContext } from '@/contexts/websocket-context';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EnhancedDashboardProps {
  onRefresh?: () => void;
}

export default function EnhancedDashboard({ onRefresh }: EnhancedDashboardProps) {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardSummary<DashboardSummaryData>();
  const { isConnected, reconnectAttempts } = useWebSocketContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      if (onRefresh) onRefresh();
      toast.success(t('dashboard.refreshSuccess') || 'Dashboard refreshed successfully');
    } catch (err) {
      toast.error(t('dashboard.refreshError') || 'Failed to refresh dashboard');
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    // In a real implementation, this would trigger a refetch with new filters
    console.log('Filters changed:', newFilters);
    toast.info(t('dashboard.filtersApplied') || 'Filters applied');
  };

  // Handle reset filters
  const handleResetFilters = () => {
    // In a real implementation, this would trigger a refetch without filters
    console.log('Filters reset');
    toast.info(t('dashboard.filtersReset') || 'Filters reset');
  };

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    // In a real implementation, this would trigger an export
    console.log('Exporting as', format);
    toast.success(t('dashboard.exportSuccess', undefined, format.toUpperCase()) || `Data exported as ${format.toUpperCase()}`);
  };

  // Memoize all data at the top to avoid conditional hook calls
  const assetTypeData = useMemo(() => [
    { 
      name: 'PC', 
      count: dashboardData?.pc?.total || 0, 
      icon: Monitor, 
      color: 'bg-blue-500', 
      iconColor: 'text-blue-500',
      description: t('dashboard.totalPcsDescription') || 'Total number of PCs in the system',
      trend: Math.floor(Math.random() * 20) - 10 // Random trend for demo
    },
    { 
      name: 'Laptop', 
      count: dashboardData?.laptop?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0, 
      icon: Laptop, 
      color: 'bg-green-500', 
      iconColor: 'text-green-500',
      description: t('assets.laptop.title') || 'Laptops',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'Printer', 
      count: dashboardData?.printer?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0, 
      icon: Printer, 
      color: 'bg-yellow-500', 
      iconColor: 'text-yellow-500',
      description: t('assets.printer.title') || 'Printers',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'License', 
      count: dashboardData?.license?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0, 
      icon: Key, 
      color: 'bg-red-500', 
      iconColor: 'text-red-500',
      description: t('assets.license.title') || 'Licenses',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'warehouse', 
      count: dashboardData?.warehouseIT?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0, 
      icon: Warehouse, 
      color: 'bg-purple-500', 
      iconColor: 'text-purple-500',
      description: t('assets.warehouse.title') || 'Warehouse IT',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'internet', 
      count: dashboardData?.internet?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0, 
      icon: Globe, 
      color: 'bg-indigo-500', 
      iconColor: 'text-indigo-500',
      description: t('assets.internet.title') || 'Internet',
      trend: Math.floor(Math.random() * 20) - 10
    },
  ], [dashboardData, t]);

  // Memoize PC Component Data for new cards
  const pcComponentData = useMemo(() => [
    { 
      name: 'CPU', 
      count: dashboardData?.pc?.totalCpus || 0, 
      icon: Cpu, 
      color: 'bg-blue-500', 
      iconColor: 'text-blue-500',
      description: t('dashboard.totalCpusDescription') || 'Total number of CPUs in the system',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'Monitor', 
      count: dashboardData?.pc?.totalMonitors || 0, 
      icon: Monitor, 
      color: 'bg-green-500', 
      iconColor: 'text-green-500',
      description: t('dashboard.totalMonitorsDescription') || 'Total number of monitors in the system',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'UPS', 
      count: dashboardData?.pc?.totalUps || 0, 
      icon: Battery, 
      color: 'bg-yellow-500', 
      iconColor: 'text-yellow-500',
      description: t('dashboard.totalUpsDescription') || 'Total number of UPS devices in the system',
      trend: Math.floor(Math.random() * 20) - 10
    },
  ], [dashboardData, t]);

  // Memoize License Statistics Data
  const licenseStatisticsData = useMemo(() => [
    { 
      name: 'Product Types', 
      count: dashboardData?.license?.filter(item => item?.productType).length || 0, 
      icon: Key, 
      color: 'bg-red-500', 
      iconColor: 'text-red-500',
      description: t('assets.license.productType') || 'Product Types',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'Product Keys', 
      count: dashboardData?.license?.filter(item => item?.productKey).length || 0, 
      icon: Key, 
      color: 'bg-purple-500', 
      iconColor: 'text-purple-500',
      description: t('assets.license.productKey') || 'Product Keys',
      trend: Math.floor(Math.random() * 20) - 10
    },
  ], [dashboardData, t]);

  // Memoize custom field statistics data for charts
  const prepareCustomFieldChartData = useMemo(() => {
    return (fieldName: string, assetType: string) => {
      // Use the asset type prefixed key to avoid conflicts
      const key = `${assetType}_${fieldName}`
      if (!dashboardData?.customFieldStats?.[key]) return []
      
      const stats = dashboardData.customFieldStats[key]
      return Object.entries(stats.values)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Show top 10 values
    }
  }, [dashboardData?.customFieldStats]);

  // Memoize custom fields for each asset type
  const pcCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'PC') || [], 
    [dashboardData?.customFields]
  );
  
  const laptopCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'Laptop') || [], 
    [dashboardData?.customFields]
  );
  
  const printerCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'Printer') || [], 
    [dashboardData?.customFields]
  );
  
  const licenseCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'License') || [], 
    [dashboardData?.customFields]
  );
  
  const warehouseCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'WarehouseIT') || [], 
    [dashboardData?.customFields]
  );
  
  const internetCustomFields = useMemo(() => 
    dashboardData?.customFields?.filter(field => field.modelType === 'Internet') || [], 
    [dashboardData?.customFields]
  );

  // Memoize license product type data for charts
  const prepareProductTypeData = useMemo(() => {
    return () => {
      if (!dashboardData?.license) return []
      
      const productTypeMap: Record<string, number> = {}
      
      dashboardData.license.forEach(item => {
        if (item?.productType) {
          productTypeMap[item.productType] = (productTypeMap[item.productType] || 0) + (item?._count || 0)
        }
      })
      
      return Object.entries(productTypeMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Show top 10 values
    }
  }, [dashboardData?.license]);

  // Get product type and key data
  const productTypeData = useMemo(() => prepareProductTypeData(), [prepareProductTypeData]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="default" className="flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                {t('common.connected')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center">
                <WifiOff className="h-3 w-3 mr-1" />
                {t('common.disconnected')}
                {reconnectAttempts > 0 && ` (${reconnectAttempts})`}
              </Badge>
            )}
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-red-500 mb-2">{t('common.error')}</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || t('dashboard.errorLoading')}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.reload')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="default" className="flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                {t('common.connected')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center">
                <WifiOff className="h-3 w-3 mr-1" />
                {t('common.disconnected')}
                {reconnectAttempts > 0 && ` (${reconnectAttempts})`}
              </Badge>
            )}
          </div>
          <RealTimeNotifications />
          <DashboardExport onExport={handleExport} />
          <Button size="sm" className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.title')}</span>
            <span className="sm:hidden">{t('nav.dashboard')}</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.assets')}</span>
            <span className="sm:hidden">{t('nav.assets')}</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.analytics')}</span>
            <span className="sm:hidden">{t('common.analytics')}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.recentActivities')}</span>
            <span className="sm:hidden">{t('dashboard.recentActivities')}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Filters - Collapsible on mobile */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {t('common.filter')}
                {isFiltersOpen ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <DashboardFilters 
                    onFilterChange={handleFilterChange} 
                    onReset={handleResetFilters} 
                  />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Asset Type Summary Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {assetTypeData.map((asset, index) => (
              <SummaryCard 
                key={index}
                title={t(`nav.${asset.name.toLowerCase()}`) || asset.name}
                value={asset.count}
                icon={asset.icon}
                color="blue"
                description={asset.description}
                trend={asset.trend}
              />
            ))}
          </div>

          {/* PC Component Summary Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pcComponentData.map((component, index) => (
              <SummaryCard 
                key={index}
                title={component.name}
                value={component.count}
                icon={component.icon}
                color="blue"
                description={component.description}
                trend={component.trend}
              />
            ))}
          </div>

          {/* License Statistics Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {licenseStatisticsData.map((stat, index) => (
              <SummaryCard 
                key={`license-stat-${index}`}
                title={stat.name}
                value={stat.count}
                icon={stat.icon}
                color="blue"
                description={stat.description}
                trend={stat.trend}
              />
            ))}
          </div>

          {/* License Product Type Chart - Responsive height */}
          {productTypeData.length > 0 && (
            <ChartCard 
              title={t('assets.license.productType') || 'Product Type'}
              description={t('dashboard.licenseProductTypeDistribution') || 'Distribution of license product types'}
              icon={Key}
            >
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productTypeData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [value, t('common.count')]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8884d8"
                      name={t('common.count')}
                    >
                      {productTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-6 mt-6">
          {/* Filters - Collapsible on mobile */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {t('common.filter')}
                {isFiltersOpen ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <DashboardFilters 
                    onFilterChange={handleFilterChange} 
                    onReset={handleResetFilters} 
                  />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetTypeData.map((asset, index) => (
              <SummaryCard 
                key={index}
                title={t(`nav.${asset.name.toLowerCase()}`) || asset.name}
                value={asset.count}
                icon={asset.icon}
                color="blue"
                description={asset.description}
                trend={asset.trend}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Filters - Collapsible on mobile */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {t('common.filter')}
                {isFiltersOpen ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <DashboardFilters 
                    onFilterChange={handleFilterChange} 
                    onReset={handleResetFilters} 
                  />
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Product Type Distribution */}
            {productTypeData.length > 0 && (
              <ChartCard 
                title={t('assets.license.productType') || 'Product Type'}
                description={t('dashboard.licenseProductTypeDistribution') || 'Distribution of license product types'}
                icon={Key}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={productTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {productTypeData.map((_, index) => (
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}
            
            {/* Asset Type Distribution */}
            <ChartCard 
              title={t('dashboard.assetBreakdown') || 'Asset Breakdown'}
              description={t('dashboard.assetBreakdownDescription') || 'Distribution of assets by type'}
              icon={BarChart3}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={assetTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {assetTypeData.map((_, index) => (
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
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          
          {/* Trend Analysis Chart */}
          <ChartCard 
            title={t('dashboard.assetGrowth') || 'Asset Growth'}
            description={t('dashboard.assetGrowthDescription') || 'Historical trend of asset acquisition'}
            icon={TrendingUp}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: 'Jan', assets: 400 },
                    { month: 'Feb', assets: 300 },
                    { month: 'Mar', assets: 200 },
                    { month: 'Apr', assets: 278 },
                    { month: 'May', assets: 189 },
                    { month: 'Jun', assets: 239 },
                    { month: 'Jul', assets: 349 },
                    { month: 'Aug', assets: 400 },
                    { month: 'Sep', assets: 380 },
                    { month: 'Oct', assets: 430 },
                    { month: 'Nov', assets: 450 },
                    { month: 'Dec', assets: 500 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area type="monotone" dataKey="assets" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                {t('dashboard.recentActivities')}
              </CardTitle>
              <CardDescription>{t('dashboard.latestChanges') || 'Latest changes in your asset inventory'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noRecentActivities') || 'No recent activities'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Custom Field Statistics Charts - Responsive grid */}
      {pcCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.pc.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pcCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'PC')
              const key = `PC_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`pc-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Custom Field Statistics Charts for Laptop */}
      {laptopCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.laptop.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laptopCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'Laptop')
              const key = `Laptop_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`laptop-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Custom Field Statistics Charts for Printer */}
      {printerCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.printer.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printerCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'Printer')
              const key = `Printer_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`printer-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Custom Field Statistics Charts for License */}
      {licenseCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.license.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {licenseCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'License')
              const key = `License_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`license-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Custom Field Statistics Charts for WarehouseIT */}
      {warehouseCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.warehouse.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouseCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'WarehouseIT')
              const key = `WarehouseIT_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`warehouse-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Custom Field Statistics Charts for Internet */}
      {internetCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.internet.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internetCustomFields.map((field, index) => {
              const chartData = prepareCustomFieldChartData(field.name, 'Internet')
              const key = `Internet_${field.name}`
              const total = dashboardData?.customFieldStats?.[key]?.count || 0
              
              return chartData.length > 0 ? (
                <ChartCard 
                  key={`internet-${index}`}
                  title={field.name}
                  description={t('dashboard.customFieldDistribution', undefined, total)}
                  icon={Server}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [value, t('common.count')]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8"
                          name={t('common.count')}
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component with memoization
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  trend?: number;
}

function SummaryCard({ title, value, icon: Icon, color, description, trend }: SummaryCardProps) {
  const colorClasses = {
    blue: "border-t-blue-500 dark:border-t-blue-400 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
    green: "border-t-green-500 dark:border-t-green-400 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300",
    yellow: "border-t-yellow-500 dark:border-t-yellow-400 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300",
    red: "border-t-red-500 dark:border-t-red-400 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300",
    purple: "border-t-purple-500 dark:border-t-purple-400 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 dark:border-t-4 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          )}
        </div>
        <div className={`p-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Chart Card Component with memoization
interface ChartCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function ChartCard({ title, description, icon: Icon, children }: ChartCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}