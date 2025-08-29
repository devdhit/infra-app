'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Plus,
  Download,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const assetTypes = [
  {
    name: "PC",
    icon: Monitor,
    href: "/assets/pc",
    description: "Manage desktop computers",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Laptop",
    icon: Laptop,
    href: "/assets/laptop",
    description: "Manage laptop computers",
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Printer",
    icon: Printer,
    href: "/assets/printer",
    description: "Manage printers and multifunction devices",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "License",
    icon: Key,
    href: "/assets/license",
    description: "Manage software licenses",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Warehouse",
    icon: Warehouse,
    href: "/assets/warehouse",
    description: "Manage warehouse inventory",
    color: "bg-red-100 text-red-700",
  },
];

export default function AssetsPage() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Manage all your IT assets in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Assets
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assetTypes.map((assetType) => {
          const Icon = assetType.icon;
          return (
            <Link key={assetType.name} href={assetType.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {assetType.name}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${assetType.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {assetType.description}
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    View assets →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Management Overview</CardTitle>
          <CardDescription>
            Quick actions and recent activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <Monitor className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total PCs</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <Laptop className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total Laptops</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <Printer className="h-8 w-8 text-purple-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total Printers</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <Key className="h-8 w-8 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total Licenses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}