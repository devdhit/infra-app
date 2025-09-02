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
  Activity,
  Settings,
  TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from "@/hooks/use-translation";
import { DashboardSummaryData } from "@/types/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function DashboardSummaryPage() {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading, error } = useDashboardSummary<DashboardSummaryData>();

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

  // Asset type data for cards
  const assetTypeData = [
    { 
      name: 'PC', 
      count: dashboardData?.pc?.reduce((sum, item) => sum + item._count, 0) || 0, 
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
  ];

  // Prepare data for charts by asset type
  const prepareChartData = (data: any[], groupByField: string, labelField?: string) => {
    if (!data) return [];
    
    return data.map(item => ({
      name: item[groupByField] || t('common.unknown'),
      count: item._count,
      label: labelField ? item[labelField] : undefined
    }));
  };

  // PC Charts Data
  const pcCpuData = prepareChartData(dashboardData?.pc || [], 'cpuBarcode');
  const pcMonitorData = prepareChartData(dashboardData?.pc || [], 'monitorBarcode');
  const pcUpsData = prepareChartData(dashboardData?.pc || [], 'upsBarcode');

  // Laptop Charts Data
  const laptopStatusData = prepareChartData(dashboardData?.laptop || [], 'status');
  const laptopModelData = prepareChartData(dashboardData?.laptop || [], 'model');

  // Printer Charts Data
  const printerColorData = prepareChartData(dashboardData?.printer || [], 'color');
  const printerModelData = prepareChartData(dashboardData?.printer || [], 'model');
  const printerLocationData = prepareChartData(dashboardData?.printer || [], 'location');

  // License Charts Data
  const licenseProductTypeData = prepareChartData(dashboardData?.license || [], 'productType');
  const licenseProductKeyData = prepareChartData(dashboardData?.license || [], 'productKey');

  // WarehouseIT Charts Data
  const warehouseCpuBarcodeData = prepareChartData(dashboardData?.warehouseIT || [], 'cpuBarcode');
  const warehouseCpuSapData = prepareChartData(dashboardData?.warehouseIT || [], 'cpuSapBarcode');
  const warehouseMonitorBarcodeData = prepareChartData(dashboardData?.warehouseIT || [], 'monitorBarcode');
  const warehouseMonitorSapData = prepareChartData(dashboardData?.warehouseIT || [], 'monitorSapBarcode');
  const warehouseUpsBarcodeData = prepareChartData(dashboardData?.warehouseIT || [], 'upsBarcode');
  const warehouseUpsSapData = prepareChartData(dashboardData?.warehouseIT || [], 'upsSapBarcode');
  const warehouseStatusData = prepareChartData(dashboardData?.warehouseIT || [], 'status');

  // Get custom field types for display
  const customFieldTypes = dashboardData?.customFields?.map(field => field.type) || [];
  const uniqueCustomFieldTypes = Array.from(new Set(customFieldTypes));

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

      {/* Asset Summary Charts by Type */}
      <Tabs defaultValue="pc" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 dark:bg-muted/20">
          <TabsTrigger value="pc" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            {t('assets.pc.title')}
          </TabsTrigger>
          <TabsTrigger value="laptop" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            {t('assets.laptop.title')}
          </TabsTrigger>
          <TabsTrigger value="printer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            {t('assets.printer.title')}
          </TabsTrigger>
          <TabsTrigger value="license" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            {t('assets.license.title')}
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-background">
            {t('assets.warehouse.title')}
          </TabsTrigger>
        </TabsList>
        
        {/* PC Charts */}
        <TabsContent value="pc" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard 
              title={t('assets.pc.cpu')}
              description={t('dashboard.summaryByCpu')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pcCpuData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.pc.monitorBarcode')}
              description={t('dashboard.summaryByMonitor')}
              icon={Monitor}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pcMonitorData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#10b981" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.pc.upsBarcode')}
              description={t('dashboard.summaryByUps')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pcUpsData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#f59e0b" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        {/* Laptop Charts */}
        <TabsContent value="laptop" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard 
              title={t('assets.laptop.status')}
              description={t('dashboard.summaryByStatus')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={laptopStatusData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.laptop.model')}
              description={t('dashboard.summaryByModel')}
              icon={Laptop}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={laptopModelData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#10b981" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        {/* Printer Charts */}
        <TabsContent value="printer" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard 
              title={t('assets.printer.color')}
              description={t('dashboard.summaryByColor')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={printerColorData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.printer.model')}
              description={t('dashboard.summaryByModel')}
              icon={Printer}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={printerModelData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#10b981" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.printer.location')}
              description={t('dashboard.summaryByLocation')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={printerLocationData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#f59e0b" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        {/* License Charts */}
        <TabsContent value="license" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard 
              title={t('assets.license.productType')}
              description={t('dashboard.summaryByProductType')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={licenseProductTypeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.license.licenseKey')}
              description={t('dashboard.summaryByLicenseKey')}
              icon={Key}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={licenseProductKeyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#10b981" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        {/* WarehouseIT Charts */}
        <TabsContent value="warehouse" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard 
              title={t('assets.warehouse.cpuBarcode')}
              description={t('dashboard.summaryByCpuBarcode')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseCpuBarcodeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.cpuSapBarcode')}
              description={t('dashboard.summaryByCpuSap')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseCpuSapData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#10b981" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.monitorBarcode')}
              description={t('dashboard.summaryByMonitorBarcode')}
              icon={Monitor}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseMonitorBarcodeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#f59e0b" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.monitorSapBarcode')}
              description={t('dashboard.summaryByMonitorSap')}
              icon={Monitor}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseMonitorSapData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#ef4444" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.upsBarcode')}
              description={t('dashboard.summaryByUpsBarcode')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseUpsBarcodeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#8b5cf6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.upsSapBarcode')}
              description={t('dashboard.summaryByUpsSap')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseUpsSapData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#ec4899" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title={t('assets.warehouse.status')}
              description={t('dashboard.summaryByStatus')}
              icon={Activity}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseStatusData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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
                    <Bar dataKey="count" fill="#3b82f6" name={t('common.count')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Fields Section */}
      {dashboardData?.customFields && dashboardData.customFields.length > 0 && (
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.customFields.map((field) => (
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Summary Card Component
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

// Chart Card Component
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