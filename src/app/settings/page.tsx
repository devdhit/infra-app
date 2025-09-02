'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Users,
  Building,
  FileText,
  ArrowRight,
  AppWindow
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

interface SettingsSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
  gradient: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  
  const settingsSections: SettingsSection[] = [
    {
      name: t('settings.application.title') || "Application",
      icon: AppWindow,
      href: "/settings/application",
      description: t('settings.application.description') || "Customize application name and branding",
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: t('settings.customFields.title') || "Custom Fields",
      icon: Settings,
      href: "/settings/custom-fields",
      description: t('settings.customFields.description') || "Manage tenant-specific custom fields",
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: t('users.title') || "Users",
      icon: Users,
      href: "/users",
      description: t('users.description') || "Manage system users",
      color: "bg-green-100 text-green-700",
      gradient: "from-green-500 to-green-600"
    },
    {
      name: t('tenants.title') || "Tenants",
      icon: Building,
      href: "/tenants",
      description: t('tenants.description') || "Manage tenant organizations",
      color: "bg-purple-100 text-purple-700",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      name: t('settings.appearance.title') || "Appearance",
      icon: Palette,
      href: "/settings/appearance",
      description: t('settings.appearance.description') || "Customize the look and feel",
      color: "bg-yellow-100 text-yellow-700",
      gradient: "from-yellow-500 to-yellow-600"
    },
    {
      name: t('settings.notifications.title') || "Notifications",
      icon: Bell,
      href: "/settings/notifications",
      description: t('settings.notifications.description') || "Configure notification preferences",
      color: "bg-red-100 text-red-700",
      gradient: "from-red-500 to-red-600"
    },
    {
      name: t('settings.security.title') || "Security",
      icon: Shield,
      href: "/settings/security",
      description: t('settings.security.description') || "Manage security settings",
      color: "bg-indigo-100 text-indigo-700",
      gradient: "from-indigo-500 to-indigo-600"
    },
    {
      name: t('settings.dataManagement.title') || "Data Management",
      icon: Database,
      href: "/settings/data-management",
      description: t('settings.dataManagement.description') || "Manage data backup, retention, and export settings",
      color: "bg-cyan-100 text-cyan-700",
      gradient: "from-cyan-500 to-cyan-600"
    },
    {
      name: t('settings.auditLogs.title') || "Audit Logs",
      icon: FileText,
      href: "/settings/audit-logs",
      description: t('settings.auditLogs.description') || "Configure audit logging and monitoring settings",
      color: "bg-gray-100 text-gray-700",
      gradient: "from-gray-500 to-gray-600"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('nav.settings')}
          </h1>
          <p className="text-muted-foreground">{t('settings.description') || "Manage your system preferences"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg">
            {t('common.export')}
          </Button>
          <Button className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            {t('settings.configure')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.name} href={section.href}>
              <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full border-t-4 border-t-transparent hover:border-t-4 hover:border-t-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {section.name}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${section.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    {section.description}
                  </div>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    {t('settings.configure') || "Configure"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}