'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useApi";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Activity,
  User,
  Building
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const assetData = [
    { name: 'PC', count: dashboardData?.assets?.pc || 0, icon: Monitor },
    { name: 'Laptop', count: dashboardData?.assets?.laptop || 0, icon: Laptop },
    { name: 'Printer', count: dashboardData?.assets?.printer || 0, icon: Printer },
    { name: 'License', count: dashboardData?.assets?.license || 0, icon: Key },
    { name: 'Warehouse', count: dashboardData?.assets?.warehouse || 0, icon: Warehouse },
  ];

  const statusData = [
    { name: 'Active', pc: 0, laptop: 0 },
    { name: 'Inactive', pc: 0, laptop: 0 },
    { name: 'Maintenance', pc: 0, laptop: 0 },
    { name: 'Retired', pc: 0, laptop: 0 },
  ];

  // Process status breakdown data
  dashboardData?.statusBreakdown?.pc?.forEach((item: any) => {
    const statusItem = statusData.find(s => s.name.toLowerCase() === item.status);
    if (statusItem) {
      statusItem.pc = item._count;
    }
  });

  dashboardData?.statusBreakdown?.laptop?.forEach((item: any) => {
    const statusItem = statusData.find(s => s.name.toLowerCase() === item.status);
    if (statusItem) {
      statusItem.laptop = item._count;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your IT Asset Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.assets?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.statusBreakdown?.pc?.find((s: any) => s.status === 'active')?._count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Breakdown of assets by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetData.map((asset) => (
                <div key={asset.name} className="flex items-center">
                  <div className="flex items-center w-32">
                    <asset.icon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{asset.name}</span>
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
            <CardTitle>Asset Status</CardTitle>
            <CardDescription>Status distribution of PCs and Laptops</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
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
                <Bar dataKey="pc" fill="#3b82f6" name="PC" />
                <Bar dataKey="laptop" fill="#10b981" name="Laptop" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest changes in your asset inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.recentActivities?.map((activity: any) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}