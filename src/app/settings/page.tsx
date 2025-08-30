'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Users,
  Building,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

interface SettingsSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  
  const settingsSections: SettingsSection[] = [
    {
      name: t('settings.customFields.title') || "Custom Fields",
      icon: Settings,
      href: "/settings/custom-fields",
      description: t('settings.customFields.description') || "Manage tenant-specific custom fields",
      color: "bg-blue-100 text-blue-700",
    },
    {
      name: t('users.title') || "Users",
      icon: Users,
      href: "/users",
      description: t('users.description') || "Manage system users",
      color: "bg-green-100 text-green-700",
    },
    {
      name: t('tenants.title') || "Tenants",
      icon: Building,
      href: "/tenants",
      description: t('tenants.description') || "Manage tenant organizations",
      color: "bg-purple-100 text-purple-700",
    },
    {
      name: t('settings.appearance.title') || "Appearance",
      icon: Palette,
      href: "/settings/appearance",
      description: t('settings.appearance.description') || "Customize the look and feel",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      name: t('settings.notifications.title') || "Notifications",
      icon: Bell,
      href: "/settings/notifications",
      description: t('settings.notifications.description') || "Configure notification preferences",
      color: "bg-red-100 text-red-700",
    },
    {
      name: t('settings.security.title') || "Security",
      icon: Shield,
      href: "/settings/security",
      description: t('settings.security.description') || "Manage security settings",
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      name: t('settings.dataManagement.title') || "Data Management",
      icon: Database,
      href: "/settings/data-management",
      description: t('settings.dataManagement.description') || "Manage data backup, retention, and export settings",
      color: "bg-cyan-100 text-cyan-700",
    },
    {
      name: t('settings.auditLogs.title') || "Audit Logs",
      icon: FileText,
      href: "/settings/audit-logs",
      description: t('settings.auditLogs.description') || "Configure audit logging and monitoring settings",
      color: "bg-gray-100 text-gray-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground">{t('settings.description') || "Manage your system preferences"}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.name} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {section.name}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${section.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {section.description}
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    {t('settings.configure') || "Configure"} →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}