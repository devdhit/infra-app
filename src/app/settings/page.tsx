'use client'

import { useState, useEffect, useCallback } from 'react'
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
  AppWindow,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from '@/hooks/useApi';

// Define the structure of our permissions state
interface PermissionsState {
  canView: boolean;
  canViewUsersSection: boolean;
  canViewTenantsSection: boolean;
  canViewRolesSection: boolean;
  // Add permissions for other settings sections
  canViewApplication: boolean;
  canViewAppearance: boolean;
  canViewNotifications: boolean;
  canViewSecurity: boolean;
  canViewDataManagement: boolean;
  canViewAuditLogs: boolean;
  canViewCustomFields: boolean;
}

interface SettingsSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
  gradient: string;
  requiresAdmin?: boolean;
  requiresPermission?: keyof PermissionsState; // Restrict to only valid permission keys
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { 
    userRole, 
    canViewSettings,
    canViewUsers,
    canViewTenants,
    canViewRoles
  } = usePermissions();
  
  const [permissions, setPermissions] = useState<PermissionsState>({
    canView: true, // Default to true to ensure the page is accessible
    canViewUsersSection: false,
    canViewTenantsSection: false,
    canViewRolesSection: false,
    // Add permissions for other settings sections - all set to true for accessibility
    canViewApplication: true,
    canViewAppearance: true,
    canViewNotifications: true,
    canViewSecurity: true,
    canViewDataManagement: true,
    canViewAuditLogs: true,
    canViewCustomFields: true
  });
  
  const [loading, setLoading] = useState(true); // Default to true to show loading state initially
  
  // Memoize the permission checking function to prevent infinite loops
  const checkPermissions = useCallback(async () => {
    // Only proceed if user data is fully loaded
    if (isUserLoading || !currentUser || !currentUser.role?.id || !currentUser.tenantId) {
      // Reset to default permissions if user data is not available
      setPermissions({
        canView: true,
        canViewUsersSection: false,
        canViewTenantsSection: false,
        canViewRolesSection: false,
        // Set all settings permissions to true since they're now accessible to all
        canViewApplication: true,
        canViewAppearance: true,
        canViewNotifications: true,
        canViewSecurity: true,
        canViewDataManagement: true,
        canViewAuditLogs: true,
        canViewCustomFields: true
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true); // Set loading to true when starting permission checks
      // Run all permission checks in parallel for better performance
      const [
        viewPermission,
        usersPermission,
        tenantsPermission,
        rolesPermission,
        customFieldsPermission
      ] = await Promise.all([
        canViewSettings(),
        canViewUsers(),
        canViewTenants(),
        canViewRoles(),
        // Only check permissions for sections that still require them
        canViewSettings()
      ]);
      
      setPermissions({
        canView: viewPermission ?? true,
        canViewUsersSection: usersPermission ?? false,
        canViewTenantsSection: tenantsPermission ?? false,
        canViewRolesSection: rolesPermission ?? false,
        // Set general settings permissions to true since they're now accessible to all
        canViewApplication: true,
        canViewAppearance: true,
        canViewNotifications: true,
        canViewSecurity: true,
        canViewDataManagement: true,
        canViewAuditLogs: true,
        canViewCustomFields: customFieldsPermission ?? true
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      // Default to allowing access if there's an error to avoid blocking legitimate users
      setPermissions({
        canView: true,
        canViewUsersSection: false,
        canViewTenantsSection: false,
        canViewRolesSection: false,
        // Set all settings permissions to true since they're now accessible to all
        canViewApplication: true,
        canViewAppearance: true,
        canViewNotifications: true,
        canViewSecurity: true,
        canViewDataManagement: true,
        canViewAuditLogs: true,
        canViewCustomFields: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, isUserLoading, canViewSettings, canViewUsers, canViewTenants, canViewRoles]);
  
  // Check permissions with proper dependency management
  useEffect(() => {
    // Add a small delay to ensure user data is fully loaded
    const timer = setTimeout(() => {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        checkPermissions();
      } else {
        // If user data is not ready, set loading to false and use default permissions
        setLoading(false);
        setPermissions({
          canView: true,
          canViewUsersSection: false,
          canViewTenantsSection: false,
          canViewRolesSection: false,
          // Set all settings permissions to true since they're now accessible to all
          canViewApplication: true,
          canViewAppearance: true,
          canViewNotifications: true,
          canViewSecurity: true,
          canViewDataManagement: true,
          canViewAuditLogs: true,
          canViewCustomFields: true
        });
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [checkPermissions, currentUser, isUserLoading]);
  
  // Check if user has admin permissions
  const isAdmin = userRole === 'admin';
  
  // Organize settings into logical groups
  const generalSettings: SettingsSection[] = [
    {
      name: t('settings.application.title') || "Application",
      icon: AppWindow,
      href: "/settings/application",
      description: t('settings.application.description') || "Customize application name and branding",
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-600"
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
    }
  ];

  const securitySettings: SettingsSection[] = [
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
    }
  ];

  const userManagementSettings: SettingsSection[] = [
    {
      name: t('users.title') || "Users",
      icon: Users,
      href: "/users",
      description: t('users.description') || "Manage system users",
      color: "bg-green-100 text-green-700",
      gradient: "from-green-500 to-green-600",
      requiresAdmin: true,
      requiresPermission: 'canViewUsersSection'
    },
    {
      name: t('tenants.title') || "Tenants",
      icon: Building,
      href: "/tenants",
      description: t('tenants.description') || "Manage tenant organizations",
      color: "bg-purple-100 text-purple-700",
      gradient: "from-purple-500 to-purple-600",
      requiresAdmin: true,
      requiresPermission: 'canViewTenantsSection'
    },
    {
      name: t('roles.title') || "Roles",
      icon: Shield,
      href: "/roles",
      description: t('roles.description') || "Manage system roles and permissions",
      color: "bg-indigo-100 text-indigo-700",
      gradient: "from-indigo-500 to-indigo-600",
      requiresAdmin: true,
      requiresPermission: 'canViewRolesSection'
    }
  ];

  const customFieldsSettings: SettingsSection[] = [
    {
      name: t('settings.customFields.title') || "Custom Fields",
      icon: Settings,
      href: "/settings/custom-fields",
      description: t('settings.customFields.description') || "Manage tenant-specific custom fields",
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-600"
    }
  ];

  // Filter sections based on permissions
  const getFilteredSections = (sections: SettingsSection[]) => {
    // During loading, show all sections to avoid blocking access
    if (loading) {
      return sections;
    }
    
    return sections.filter(section => {
      // Filter based on admin requirement
      if (section.requiresAdmin && !isAdmin) {
        return false;
      }
      
      // Filter based on specific permissions
      if (section.requiresPermission) {
        return permissions[section.requiresPermission];
      }
      
      // Default to showing the section
      return true;
    });
  };

  // Render a settings group
  const renderSettingsGroup = (title: string, sections: SettingsSection[]) => {
    const filteredSections = getFilteredSections(sections);
    
    // Don't render group if no sections are visible
    if (filteredSections.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <Link 
              key={section.href}
              href={section.href}
              className="block group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-full ${section.color}`}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{section.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
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
              {t('common.save')}
            </Button>
          </div>
        </div>

        <div className="space-y-10">
          {/* Show all sections while loading to avoid blocking access */}
          {renderSettingsGroup(t('settings.groups.general') || "General Settings", generalSettings)}
          {renderSettingsGroup(t('settings.groups.security') || "Security & Data", securitySettings)}
          {renderSettingsGroup(t('settings.groups.management') || "User Management", userManagementSettings)}
          {renderSettingsGroup(t('settings.groups.customization') || "Customization", customFieldsSettings)}
        </div>
      </div>
    );
  }
  
  // If user doesn't have view permission, show unauthorized message
  // But allow access by default to avoid blocking legitimate users
  // During loading, don't show unauthorized message
  if (!permissions.canView && !loading && typeof window !== 'undefined') {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
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
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {renderSettingsGroup(t('settings.groups.general') || "General Settings", generalSettings)}
        {renderSettingsGroup(t('settings.groups.security') || "Security & Data", securitySettings)}
        {renderSettingsGroup(t('settings.groups.management') || "User Management", userManagementSettings)}
        {renderSettingsGroup(t('settings.groups.customization') || "Customization", customFieldsSettings)}
      </div>
    </div>
  );
}