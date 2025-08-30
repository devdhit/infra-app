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
  Building
} from "lucide-react";
import Link from "next/link";

interface SettingsSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

const settingsSections: SettingsSection[] = [
  {
    name: "Custom Fields",
    icon: Settings,
    href: "/settings/custom-fields",
    description: "Manage tenant-specific custom fields",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Users",
    icon: Users,
    href: "/users",
    description: "Manage system users",
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Tenants",
    icon: Building,
    href: "/tenants",
    description: "Manage tenant organizations",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Appearance",
    icon: Palette,
    href: "/settings/appearance",
    description: "Customize the look and feel",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Notifications",
    icon: Bell,
    href: "/settings/notifications",
    description: "Configure notification preferences",
    color: "bg-red-100 text-red-700",
  },
  {
    name: "Security",
    icon: Shield,
    href: "/settings/security",
    description: "Manage security settings",
    color: "bg-indigo-100 text-indigo-700",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your system preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.name} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                    Configure →
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