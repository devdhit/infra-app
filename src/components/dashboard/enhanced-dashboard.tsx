'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Cpu,
  Battery,
  Server,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Wifi
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardSummaryData } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useMemo, useState } from "react";
import { useDashboardSummary } from "@/hooks/useApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardExport } from "@/components/dashboard/dashboard-export";
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import logger from "@/lib/logger";

interface EnhancedDashboardProps {
  onRefresh?: () => void;
}

export default function EnhancedDashboard({ onRefresh }: EnhancedDashboardProps) {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading, error, refetch } = useDashboardSummary<DashboardSummaryData>();
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
    logger.debug('Filters changed:', newFilters);
    toast.info(t('dashboard.filtersApplied') || 'Filters applied');
  };

  // Handle reset filters
  const handleResetFilters = () => {
    // In a real implementation, this would trigger a refetch without filters
    logger.debug('Filters reset');
    toast.info(t('dashboard.filtersReset') || 'Filters reset');
  };

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    // In a real implementation, this would trigger an export
    logger.debug('Exporting as', format);
    toast.success(t('dashboard.exportSuccess', undefined, format.toUpperCase()) || `Data exported as ${format.toUpperCase()}`);
  };

  // Memoize all data at the top to avoid conditional hook calls
  const assetTypeData = useMemo(() => [
    { 
      name: 'PC', 
      count: dashboardData?.pc?.total || 0, 
      icon: Monitor, 
      color: 'blue', 
      iconColor: 'text-blue-500',
      description: t('dashboard.totalPcsDescription') || 'Total number of PCs in the system',
      trend: Math.floor(Math.random() * 20) - 10 // Random trend for demo
    },
    { 
      name: 'Laptop', 
      count: dashboardData?.laptop?.reduce((sum, item) => sum + (Number(item?._count) || 0), 0) || 0, 
      icon: Laptop, 
      color: 'green', 
      iconColor: 'text-green-500',
      description: t('assets.laptop.title') || 'Laptops',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'Printer', 
      count: dashboardData?.printer?.reduce((sum, item) => sum + (Number(item?._count) || 0), 0) || 0, 
      icon: Printer, 
      color: 'yellow', 
      iconColor: 'text-yellow-500',
      description: t('assets.printer.title') || 'Printers',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'License', 
      count: dashboardData?.license?.reduce((sum, item) => sum + (Number(item?._count) || 0), 0) || 0, 
      icon: Key, 
      color: 'red', 
      iconColor: 'text-red-500',
      description: t('assets.license.title') || 'Licenses',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'warehouse', 
      count: dashboardData?.warehouseIT?.reduce((sum, item) => sum + (Number(item?._count) || 0), 0) || 0, 
      icon: Warehouse, 
      color: 'purple', 
      iconColor: 'text-purple-500',
      description: t('assets.warehouse.title') || 'Warehouse IT',
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: 'internet', 
      count: dashboardData?.internet?.reduce((sum, item) => sum + (Number(item?._count) || 0), 0) || 0, 
      icon: Wifi, 
      color: 'indigo', 
      iconColor: 'text-indigo-500',
      description: t('assets.internet.title') || 'Internet',
      trend: Math.floor(Math.random() * 20) - 10
    },
  ], [dashboardData, t]);

  // Memoize PC Component Data for new cards with better descriptions
  const pcComponentData = useMemo(() => [
    { 
      name: t('dashboard.cpus'), 
      count: dashboardData?.pc?.totalCpus || 0, 
      icon: Cpu, 
      color: 'blue', 
      iconColor: 'text-blue-500',
      description: t('dashboard.totalCpusDescription') || 'Total CPUs in the system',
      percentage: dashboardData?.pc?.total 
        ? Math.round(((dashboardData.pc.totalCpus || 0) / dashboardData.pc.total) * 100) 
        : 0,
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: t('dashboard.monitors'), 
      count: dashboardData?.pc?.totalMonitors || 0, 
      icon: Monitor, 
      color: 'green', 
      iconColor: 'text-green-500',
      description: t('dashboard.totalMonitorsDescription') || 'Total monitors in the system',
      percentage: dashboardData?.pc?.total 
        ? Math.round(((dashboardData.pc.totalMonitors || 0) / dashboardData.pc.total) * 100) 
        : 0,
      trend: Math.floor(Math.random() * 20) - 10
    },
    { 
      name: t('dashboard.upsDevices'), 
      count: dashboardData?.pc?.totalUps || 0, 
      icon: Battery, 
      color: 'yellow', 
      iconColor: 'text-yellow-500',
      description: t('dashboard.totalUpsDescription') || 'Total UPS devices in the system',
      percentage: dashboardData?.pc?.total 
        ? Math.round(((dashboardData.pc.totalUps || 0) / dashboardData.pc.total) * 100) 
        : 0,
      trend: Math.floor(Math.random() * 20) - 10
    },
  ], [dashboardData, t]);

  // Memoize License Statistics Data with better insights
  const licenseStatisticsData = useMemo(() => {
    const totalLicenses = dashboardData?.license?.reduce((sum, item) => sum + (item?._count || 0), 0) || 0;
    const productTypes = dashboardData?.license?.filter(item => item?.productType).length || 0;
    const productKeys = dashboardData?.license?.filter(item => item?.productKey).length || 0;
    
    return [
      { 
        name: t('dashboard.licenseProductTypes'), 
        count: productTypes, 
        icon: Key, 
        color: 'red', 
        iconColor: 'text-red-500',
        description: t('dashboard.licenseProductTypesDescription') || 'Different product types',
        percentage: totalLicenses ? Math.round((productTypes / totalLicenses) * 100) : 0,
        trend: Math.floor(Math.random() * 20) - 10
      },
      { 
        name: t('dashboard.licenseProductKeys'), 
        count: productKeys, 
        icon: Key, 
        color: 'purple', 
        iconColor: 'text-purple-500',
        description: t('dashboard.licenseProductKeysDescription') || 'Licenses with product keys',
        percentage: totalLicenses ? Math.round((productKeys / totalLicenses) * 100) : 0,
        trend: Math.floor(Math.random() * 20) - 10
      },
    ];
  }, [dashboardData, t]);

  // Memoize custom field statistics data for charts with better grouping
  const prepareCustomFieldChartData = useMemo(() => {
    return (fieldName: string, assetType: string, showAll: boolean = false) => {
      // Use the asset type prefixed key to avoid conflicts
      const key = `${assetType}_${fieldName}`;
      if (!dashboardData?.customFieldStats?.[key]) return [];
      
      const stats = dashboardData.customFieldStats[key];
      const allData = Object.entries(stats.values)
        .map(([name, count]) => ({ 
          name: name.length > 20 ? `${name.substring(0, 17)}...` : name,
          count,
          fullName: name // Keep full name for tooltip
        }))
        .sort((a, b) => b.count - a.count);
      
      // If showAll is true or there are 20 or fewer items, return all data
      // Otherwise, return only the top 20
      return showAll || allData.length <= 20 ? allData : allData.slice(0, 20);
    };
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

  // Memoize license product type data for charts with better labeling
  const prepareProductTypeData = useMemo(() => {
    return () => {
      if (!dashboardData?.license) return [];
      
      const productTypeMap: Record<string, number> = {};
      
      dashboardData.license.forEach(item => {
        if (item?.productType) {
          const typeName = item.productType.length > 20 
            ? `${item.productType.substring(0, 17)}...` 
            : item.productType;
          
          productTypeMap[typeName] = (productTypeMap[typeName] || 0) + (item?._count || 0);
        }
      });
      
      return Object.entries(productTypeMap)
        .map(([name, count]) => ({ 
          name, 
          count,
          fullName: Object.keys(productTypeMap).find(key => 
            key.startsWith(name.replace('...', '')) && key.length > name.length
          ) || name
        }))
        .sort((a, b) => b.count - a.count)
        // Show top 20 values instead of just top 10 for better data visibility
        .slice(0, 20);
    };
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
      {/* Page header with enhanced styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <DashboardExport onExport={handleExport} />
          <Button 
            size="sm" 
            className="rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md" 
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs - Simplified structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{t('dashboard.overview')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all duration-200"
          >
            <PieChart className="h-4 w-4" />
            <span>{t('common.analytics')}</span>
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

          {/* Asset Overview Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('dashboard.assetOverview')}</h2>
            
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
          </div>

          {/* PC Components Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('dashboard.pcComponents')}</h2>
            
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
          </div>

          {/* License Statistics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('assets.license.title')}</h2>
            
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
          </div>

          {/* License Product Type Chart - Responsive height */}
          {productTypeData.length > 0 && (
            <ChartCard 
              title={t('assets.license.productType') || 'Product Type'}
              description={t('dashboard.licenseProductTypeDistribution') || 'Distribution of license product types'}
              icon={Key}
            >
              <div className="h-80 min-w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={500}>
                  <BarChart
                    data={productTypeData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={90}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <Tooltip 
                      formatter={(value) => [value, t('common.count')]}
                      labelFormatter={(value) => {
                        // Find the full name for the truncated label
                        const item = productTypeData.find(d => d.name === value);
                        return item?.fullName || value;
                      }}
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

          {/* Custom Field Statistics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')}</h2>
            
            {/* PC Custom Fields */}
            {pcCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.pc.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pcCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'PC')
                    const key = `PC_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`pc-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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

            {/* Laptop Custom Fields */}
            {laptopCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.laptop.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {laptopCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'Laptop')
                    const key = `Laptop_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`laptop-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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

            {/* Printer Custom Fields */}
            {printerCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.printer.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {printerCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'Printer')
                    const key = `Printer_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`printer-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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

            {/* License Custom Fields */}
            {licenseCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.license.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {licenseCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'License')
                    const key = `License_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`license-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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

            {/* WarehouseIT Custom Fields */}
            {warehouseCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.warehouse.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {warehouseCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'WarehouseIT')
                    const key = `WarehouseIT_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`warehouse-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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

            {/* Internet Custom Fields */}
            {internetCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('assets.internet.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {internetCustomFields.map((field, index) => {
                    const chartData = prepareCustomFieldChartData(field.name, 'Internet')
                    const key = `Internet_${field.name}`
                    const total = dashboardData?.customFieldStats?.[key]?.count || 0
                    
                    return chartData.length > 0 ? (
                      <ChartCard 
                        key={`internet-${index}`}
                        title={field.name}
                        description={t('dashboard.customFieldDistribution', undefined, total.toString())}
                        icon={Server}
                      >
                        <div className="h-64 min-w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={90}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                              />
                              <Tooltip 
                                formatter={(value) => [value, t('common.count')]}
                                labelFormatter={(value) => {
                                  // Find the full name for the truncated label
                                  const item = chartData.find(d => d.name === value);
                                  return item?.fullName || value;
                                }}
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
        </TabsContent>
      </Tabs>
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
  percentage?: number;
}

function SummaryCard({ title, value, icon: Icon, color, description, trend, percentage }: SummaryCardProps) {
  const colorClasses = {
    blue: "border-t-blue-500 dark:border-t-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    green: "border-t-green-500 dark:border-t-green-400 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
    yellow: "border-t-yellow-500 dark:border-t-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300",
    red: "border-t-red-500 dark:border-t-red-400 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
    purple: "border-t-purple-500 dark:border-t-purple-400 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
    indigo: "border-t-indigo-500 dark:border-t-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 dark:border-t-4 h-full bg-gradient-to-br from-background to-muted/30 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-1 opacity-80">{description}</CardDescription>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mt-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )
        }
        </div>
        {percentage !== undefined && percentage > 0 && (
          <div className="mt-3 flex items-center">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
              {percentage}%
            </span>
          </div>
        )}
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
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full bg-gradient-to-br from-background to-muted/30 border-t-4 border-t-blue-500 dark:border-t-blue-400 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 mr-3">
            <Icon className="h-5 w-5" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="opacity-80">{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-0">
        <div className="pt-4 min-h-[300px] flex items-center justify-center">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}