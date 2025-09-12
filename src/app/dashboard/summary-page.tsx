'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Settings,
  TrendingUp,
  Cpu,
  Battery,
  Server,
  Globe
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardSummaryData } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useMemo } from "react";

export default function DashboardSummaryPage() {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading, error } = useDashboardSummary<DashboardSummaryData>();

  // Memoize all data at the top to avoid conditional hook calls
  const assetTypeData = useMemo(() => [
    { 
      name: 'PC', 
      count: dashboardData?.pc?.total || 0, 
      icon: Monitor, 
      color: 'bg-blue-500', 
      iconColor: 'text-blue-500' 
    },
    { 
      name: 'Laptop', 
      count: dashboardData?.laptop?.reduce((sum, item) => sum + item._count, 0) || 0, 
      icon: Laptop, 
      color: 'bg-green-500', 
      iconColor: 'text-green-500' 
    },
    { 
      name: 'Printer', 
      count: dashboardData?.printer?.reduce((sum, item) => sum + item._count, 0) || 0, 
      icon: Printer, 
      color: 'bg-yellow-500', 
      iconColor: 'text-yellow-500' 
    },
    { 
      name: 'License', 
      count: dashboardData?.license?.reduce((sum, item) => sum + item._count, 0) || 0, 
      icon: Key, 
      color: 'bg-red-500', 
      iconColor: 'text-red-500' 
    },
    { 
      name: 'warehouse', 
      count: dashboardData?.warehouseIT?.reduce((sum, item) => sum + item._count, 0) || 0, 
      icon: Warehouse, 
      color: 'bg-purple-500', 
      iconColor: 'text-purple-500' 
    },
    { 
      name: 'internet', 
      count: dashboardData?.internet?.reduce((sum, item) => sum + item._count, 0) || 0, 
      icon: Globe, 
      color: 'bg-indigo-500', 
      iconColor: 'text-indigo-500' 
    },
  ], [dashboardData]);

  // Memoize PC Component Data for new cards
  const pcComponentData = useMemo(() => [
    { 
      name: 'CPU', 
      count: dashboardData?.pc?.totalCpus || 0, 
      icon: Cpu, 
      color: 'bg-blue-500', 
      iconColor: 'text-blue-500' 
    },
    { 
      name: 'Monitor', 
      count: dashboardData?.pc?.totalMonitors || 0, 
      icon: Monitor, 
      color: 'bg-green-500', 
      iconColor: 'text-green-500' 
    },
    { 
      name: 'UPS', 
      count: dashboardData?.pc?.totalUps || 0, 
      icon: Battery, 
      color: 'bg-yellow-500', 
      iconColor: 'text-yellow-500' 
    },
  ], [dashboardData]);

  // Memoize License Statistics Data
  const licenseStatisticsData = useMemo(() => [
    { 
      name: 'Product Types', 
      count: dashboardData?.license?.filter(item => item.productType).length || 0, 
      icon: Key, 
      color: 'bg-red-500', 
      iconColor: 'text-red-500' 
    },
    { 
      name: 'Product Keys', 
      count: dashboardData?.license?.filter(item => item.productKey).length || 0, 
      icon: Key, 
      color: 'bg-purple-500', 
      iconColor: 'text-purple-500' 
    },
  ], [dashboardData]);

  // Memoize custom field statistics data for charts
  const prepareCustomFieldChartData = useMemo(() => (fieldName: string, assetType: string) => {
    // Use the asset type prefixed key to avoid conflicts
    const key = `${assetType}_${fieldName}`
    if (!dashboardData?.customFieldStats?.[key]) return []
    
    const stats = dashboardData.customFieldStats[key]
    return Object.entries(stats.values)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Show top 10 values
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
  const prepareProductTypeData = useMemo(() => () => {
    if (!dashboardData?.license) return []
    
    const productTypeMap: Record<string, number> = {}
    
    dashboardData.license.forEach(item => {
      if (item.productType) {
        productTypeMap[item.productType] = (productTypeMap[item.productType] || 0) + item._count
      }
    })
    
    return Object.entries(productTypeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Show top 10 values
  }, [dashboardData?.license]);

  // Get product type and key data
  const productTypeData = useMemo(() => prepareProductTypeData(), [prepareProductTypeData]);

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button size="sm" className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800">
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.configure')}
          </Button>
        </div>
      </div>

      {/* Asset Type Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {assetTypeData.map((asset, index) => (
          <SummaryCard 
            key={index}
            title={t(`nav.${asset.name.toLowerCase()}`) || asset.name}
            value={asset.count}
            icon={asset.icon}
            color="blue"
          />
        ))}
      </div>

      {/* PC Component Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {pcComponentData.map((component, index) => (
          <SummaryCard 
            key={index}
            title={component.name}
            value={component.count}
            icon={component.icon}
            color="blue"
          />
        ))}
      </div>

      {/* License Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {licenseStatisticsData.map((stat, index) => (
          <SummaryCard 
            key={`license-stat-${index}`}
            title={stat.name}
            value={stat.count}
            icon={stat.icon}
            color="blue"
          />
        ))}
      </div>

      {/* License Product Type Chart */}
      {productTypeData.length > 0 && (
        <ChartCard 
          title={t('assets.license.productType') || 'Product Type'}
          description={t('dashboard.licenseProductTypeDistribution') || 'Distribution of license product types'}
          icon={Key}
        >
          <div className="h-64">
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
      
      {/* Custom Field Statistics Charts for PC */}
      {pcCustomFields.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('dashboard.customFieldStatistics')} - {t('assets.pc.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    blue: "border-t-blue-500 dark:border-t-blue-400 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
    green: "border-t-green-500 dark:border-t-green-400 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300",
    yellow: "border-t-yellow-500 dark:border-t-yellow-400 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300",
    red: "border-t-red-500 dark:border-t-red-400 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300",
    purple: "border-t-purple-500 dark:border-t-purple-400 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 dark:border-t-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
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
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
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