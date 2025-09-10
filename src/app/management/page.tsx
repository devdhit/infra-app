'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building, 
  Shield,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from '@/hooks/useApi';
import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

// Define the structure of our permissions state
interface PermissionsState {
  canViewUsers: boolean;
  canViewTenants: boolean;
  canViewRoles: boolean;
}

interface ManagementSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
  gradient: string;
  requiresPermission: keyof PermissionsState;
}

export default function ManagementPage() {
  const { t } = useTranslation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const {
    canViewUsers,
    canViewTenants,
    canViewRoles,
  } = usePermissions();

  // Permission states
  const [permissions, setPermissions] = useState<PermissionsState>({
    canViewUsers: false,
    canViewTenants: false,
    canViewRoles: false
  });

  // Check permissions with error handling and timeout
  useEffect(() => {
    let isMounted = true;
    
    const checkPermissions = async () => {
      if (!isUserLoading && currentUser) {
        try {
          // Add timeout to prevent hanging
          const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          
          // Check all permissions in parallel for better performance with timeout
          const permissionChecks = [
            canViewUsers(),
            canViewTenants(),
            canViewRoles()
          ];
          
          // Apply timeout to each permission check
          const permissionChecksWithTimeout = permissionChecks.map(promise => 
            Promise.race([promise, timeout(5000).then(() => false)])
          );
          
          const [
            viewUsers,
            viewTenants,
            viewRoles
          ] = await Promise.all(permissionChecksWithTimeout);

          if (isMounted) {
            setPermissions({
              canViewUsers: viewUsers ?? false,
              canViewTenants: viewTenants ?? false,
              canViewRoles: viewRoles ?? false
            });
          }
        } catch (error) {
          logger.error('Error checking permissions:', error);
          // Set default permissions on error to prevent infinite loading
          if (isMounted) {
            setPermissions({
              canViewUsers: false,
              canViewTenants: false,
              canViewRoles: false
            });
          }
        }
      }
    };

    checkPermissions();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser, isUserLoading, canViewUsers, canViewTenants, canViewRoles]);

  const managementSections: ManagementSection[] = [
    {
      name: t('nav.users') || "Users",
      icon: Users,
      href: "/users",
      description: t('users.description') || "Manage system users",
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-600",
      requiresPermission: 'canViewUsers'
    },
    {
      name: t('nav.tenants') || "Tenants",
      icon: Building,
      href: "/tenants",
      description: t('tenants.description') || "Manage tenant organizations",
      color: "bg-purple-100 text-purple-700",
      gradient: "from-purple-500 to-purple-600",
      requiresPermission: 'canViewTenants'
    },
    {
      name: t('nav.roles') || "Roles",
      icon: Shield,
      href: "/roles",
      description: t('roles.description') || "Manage user roles and permissions",
      color: "bg-green-100 text-green-700",
      gradient: "from-green-500 to-green-600",
      requiresPermission: 'canViewRoles'
    }
  ];

  // Filter sections based on permissions
  const accessibleSections = managementSections.filter(section => 
    permissions[section.requiresPermission]
  );

  // Show loading state
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user doesn't have access to any management sections, show unauthorized message
  if (accessibleSections.length === 0 && currentUser) {
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('nav.management')}
        </h1>
        <p className="text-muted-foreground">{t('management.description') || "Manage your system organizations and users"}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accessibleSections.map((section) => (
          <Link 
            key={section.name}
            href={section.href}
            className="group block"
          >
            <Card className="h-full hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
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
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}