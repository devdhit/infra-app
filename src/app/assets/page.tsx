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
  Upload,
  Home as HomeIcon
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { useMemo } from "react";

// Define the structure for asset types with proper TypeScript typing
interface AssetType {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

const assetTypes: AssetType[] = [
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
  {
    name: "FixedAsset",
    icon: HomeIcon,
    href: "/assets/fixed-asset",
    description: "Manage fixed assets",
    color: "bg-indigo-100 text-indigo-700",
  },
];

export default function AssetsPage() {
  const { t } = useTranslation();

  // Memoize the asset type cards to prevent unnecessary re-renders
  const assetTypeCards = useMemo(() => {
    return assetTypes.map((assetType) => {
      const Icon = assetType.icon;
      return (
        <Link key={assetType.name} href={assetType.href} prefetch={false}>
          <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full border-t-4 border-t-transparent hover:border-t-4 hover:border-t-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(`nav.${assetType.name.toLowerCase()}`) || assetType.name}
              </CardTitle>
              <div className={`p-2 rounded-full ${assetType.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {assetType.description}
              </div>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                {t('assets.view') || 'View assets'}
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    });
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <HomeIcon className="h-8 w-8 mr-3 text-blue-500" />
            {t('nav.assets') || 'Assets'}
          </h1>
          <p className="text-muted-foreground">{t('assets.description') || 'Manage all your IT assets in one place'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export') || 'Export All'}
          </Button>
          <Button variant="outline" className="rounded-lg">
            <Upload className="h-4 w-4 mr-2" />
            {t('assets.import') || 'Import Assets'}
          </Button>
          <Button className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('assets.add') || 'Add Asset'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assetTypeCards}
      </div>

      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle>{t('assets.overview.title') || 'Asset Management Overview'}</CardTitle>
          <CardDescription>
            {t('assets.overview.description') || 'Quick actions and recent activities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Monitor className="h-8 w-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">{t('nav.pc') || 'Total PCs'}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Laptop className="h-8 w-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">{t('nav.laptop') || 'Total Laptops'}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Printer className="h-8 w-8 text-purple-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">{t('nav.printer') || 'Total Printers'}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <Key className="h-8 w-8 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">{t('nav.license') || 'Total Licenses'}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors">
              <HomeIcon className="h-8 w-8 text-indigo-500 mb-2" />
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">{t('nav.fixedAsset') || 'Total Fixed Assets'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}