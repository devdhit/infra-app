'use client'

import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Users,
  Building,
  LogOut,
  Menu,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Wifi,
  Shield,
  FileText,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLogout } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { getApplicationSettings } from '@/lib/api/application';
import { usePermissions } from "@/hooks/use-permissions";

// Define navigation item structure
interface NavigationItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<any>;
  requiredPermission?: { resource: string; action: string };
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    nameKey: "nav.dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    requiredPermission: { resource: 'assets', action: 'view' }
  },
  { 
    nameKey: "nav.assets", 
    href: "/assets", 
    icon: Home,
    requiredPermission: { resource: 'assets', action: 'view' },
    children: [
      { nameKey: "nav.pc", href: "/assets/pc", icon: Monitor, requiredPermission: { resource: 'pc', action: 'view' } },
      { nameKey: "nav.laptop", href: "/assets/laptop", icon: Laptop, requiredPermission: { resource: 'laptop', action: 'view' } },
      { nameKey: "nav.printer", href: "/assets/printer", icon: Printer, requiredPermission: { resource: 'printer', action: 'view' } },
      { nameKey: "nav.license", href: "/assets/license", icon: Key, requiredPermission: { resource: 'license', action: 'view' } },
      { nameKey: "nav.warehouse", href: "/assets/warehouse", icon: Warehouse, requiredPermission: { resource: 'warehouse', action: 'view' } },
      { nameKey: "nav.internet", href: "/assets/internet", icon: Wifi, requiredPermission: { resource: 'internet', action: 'view' } },
    ]
  },
  { 
    nameKey: "nav.management", 
    href: "/management", 
    icon: Users,
    requiredPermission: { resource: 'users', action: 'view' },
    children: [
      { nameKey: "nav.users", href: "/users", icon: Users, requiredPermission: { resource: 'users', action: 'view' } },
      { nameKey: "nav.tenants", href: "/tenants", icon: Building, requiredPermission: { resource: 'tenants', action: 'view' } },
      { nameKey: "nav.roles", href: "/roles", icon: Shield, requiredPermission: { resource: 'roles', action: 'view' } },
    ]
  },
  { 
    nameKey: "nav.settings", 
    href: "/settings", 
    icon: Settings,
    requiredPermission: { resource: 'settings', action: 'view' },
    children: [
      { 
        nameKey: "nav.auditLogs", 
        href: "/settings/audit-logs", 
        icon: FileText,
        requiredPermission: { resource: 'auditLogs', action: 'view' }
      },
    ]
  },
];

interface NavigationProps {
}

export function Navigation({}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "nav.assets": true,
    "nav.management": false, // Initially collapsed
    "nav.settings": false    // Initially collapsed
  });
  const logoutMutation = useLogout();
  const { t } = useTranslation();
  const [applicationName, setApplicationName] = useState('IT Asset Management');
  const [shortName, setShortName] = useState('ITAMS');
  
  // Use permission hooks
  const { 
    userRole,
    isLoading,
    canViewUsers,
    canViewTenants,
    canViewRoles,
    canViewSettings,
    canViewAssets,
    canViewPC,
    canViewLaptop,
    canViewPrinter,
    canViewLicense,
    canViewWarehouse,
    canViewInternet,
    canViewAuditLogs
  } = usePermissions();

  // Load application name
  useEffect(() => {
    let isMounted = true;
    
    const loadApplicationName = async () => {
      try {
        // Only try to load application settings if user has settings permission
        const hasSettingsPermission = await canViewSettings();
        if (!isMounted) return;
        
        if (hasSettingsPermission) {
          const settings = await getApplicationSettings();
          if (isMounted) {
            setApplicationName(settings.applicationName);
            setShortName(settings.shortName);
          }
        } else {
          // Use default names if user doesn't have permission
          if (isMounted) {
            setApplicationName('IT Infra Management');
            setShortName('IIMS');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load application name:', error);
        }
        // Use default names if there's an error
        if (isMounted) {
          setApplicationName('IT Infra Management');
          setShortName('IIMS');
        }
      }
    };

    loadApplicationName();

    const handleApplicationNameUpdate = (event: CustomEvent) => {
      if (isMounted) {
        setApplicationName(event.detail.applicationName);
        setShortName(event.detail.shortName);
      }
    };

    window.addEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    
    return () => {
      isMounted = false;
      window.removeEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    };
  }, [canViewSettings]); // Add canViewSettings to dependency array

  // Permission results - check once and store
  const [permissionResults, setPermissionResults] = useState<Record<string, boolean>>({
    'assets': false,
    'pc': false,
    'laptop': false,
    'printer': false,
    'license': false,
    'warehouse': false,
    'internet': false,
    'users': false,
    'tenants': false,
    'roles': false,
    'settings': false,
    'auditLogs': false
  });
  
  // Ref to track if we've already checked permissions for the current user
  const permissionCheckRef = useRef<{userRole: string | null, checked: boolean}>({userRole: null, checked: false});

  // For admin users, we can skip permission checks since they have all permissions
  useEffect(() => {
    // Only run this effect when userRole or isLoading changes
    if (isLoading) return;
    
    // Skip if we've already checked permissions for this user role
    if (permissionCheckRef.current.userRole === userRole && permissionCheckRef.current.checked) {
      return;
    }
    
    // Reset checked flag when user role changes
    if (permissionCheckRef.current.userRole !== userRole) {
      permissionCheckRef.current = {userRole, checked: false};
    }
    
    if (userRole === 'admin') {
      // Admin has all permissions
      setPermissionResults({
        'assets': true,
        'pc': true,
        'laptop': true,
        'printer': true,
        'license': true,
        'warehouse': true,
        'internet': true,
        'users': true,
        'tenants': true,
        'roles': true,
        'settings': true,
        'auditLogs': true
      });
      permissionCheckRef.current = {userRole, checked: true};
    } else if (userRole) {
      // For non-admin users, check permissions sequentially with delays
      const checkPermissions = async () => {
        const results: Record<string, boolean> = {};
        
        // Define the permissions we need to check in order
        const permissionChecks: { key: string; check: () => Promise<boolean> }[] = [
          { key: 'assets', check: () => canViewAssets() },
          { key: 'pc', check: () => canViewPC() },
          { key: 'laptop', check: () => canViewLaptop() },
          { key: 'printer', check: () => canViewPrinter() },
          { key: 'license', check: () => canViewLicense() },
          { key: 'warehouse', check: () => canViewWarehouse() },
          { key: 'internet', check: () => canViewInternet() },
          { key: 'users', check: () => canViewUsers() },
          { key: 'tenants', check: () => canViewTenants() },
          { key: 'roles', check: () => canViewRoles() },
          { key: 'settings', check: () => canViewSettings() },
          { key: 'auditLogs', check: () => canViewAuditLogs() }
        ];
        
        // Process permissions one at a time with delays
        for (let i = 0; i < permissionChecks.length; i++) {
          const permissionCheck = permissionChecks[i];
          // Add a type guard to ensure permissionCheck is not undefined
          if (permissionCheck) {
            const { key, check } = permissionCheck;
            try {
              results[key] = await check();
            } catch (error) {
              console.error(`Error checking permission for ${key}:`, error);
              results[key] = false;
            }
          }
          
          // Add a delay between requests to avoid overwhelming the server
          if (i < permissionChecks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        setPermissionResults(results);
        permissionCheckRef.current = {userRole, checked: true};
      };
      
      checkPermissions();
    } else {
      // Reset permission check ref when userRole becomes null
      permissionCheckRef.current = {userRole: null, checked: false};
    }
  }, [userRole, isLoading, canViewAssets, canViewPC, canViewLaptop, canViewPrinter, canViewLicense, canViewWarehouse, canViewInternet, canViewUsers, canViewTenants, canViewRoles, canViewSettings, canViewAuditLogs]);

  // Filter navigation items
  const filteredNavigationItems = useMemo(() => {
    if (isLoading) return [];
    
    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items.filter(item => {
        if (!item.requiredPermission) return true;
        return permissionResults[item.requiredPermission.resource] || false;
      }).map(item => {
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          
          if (item.nameKey === "nav.management") {
            if (permissionResults[item.requiredPermission!.resource] && filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }
            return null;
          }
          
          if (item.nameKey === "nav.settings") {
            if (permissionResults[item.requiredPermission!.resource]) {
              return { ...item, children: filteredChildren };
            }
            return null;
          }
          
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          } else if (!item.requiredPermission) {
            return item;
          }
          return null;
        }
        return item;
      }).filter((item): item is NavigationItem => item !== null);
    };

    return filterItems(navigationItems);
  }, [permissionResults, isLoading]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      localStorage.removeItem('auth-token');
      // Use router.push instead of window.location for SPA navigation
      router.push('/auth/login');
    } catch (error) {
      toast.error(t('auth.logout.error') || 'Failed to logout');
    }
  }, [logoutMutation, t, router]);

  const isActive = useCallback((href: string) => {
    return pathname === href || pathname.startsWith(href);
  }, [pathname]);

  const toggleExpand = useCallback((nameKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [nameKey]: !prev[nameKey]
    }));
  }, []);

  // Render navigation items with optimized click handling
  const renderNavigationItems = useMemo(() => {
    return filteredNavigationItems.map((item) => (
      <div key={item.nameKey}>
        <Link
          href={item.href}
          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isActive(item.href)
              ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
              : "text-foreground hover:bg-muted"
          }`}
          onClick={(e) => {
            // Check if user has permission to access this item
            if (item.requiredPermission) {
              const hasPermission = permissionResults[item.requiredPermission.resource];
              if (!hasPermission) {
                e.preventDefault();
                toast.error(t('permissions.accessDeniedNav', `You don't have permission to access ${t(item.nameKey)}`));
                return;
              }
            }
            
            // Handle expand/collapse for items with children
            if (item.children) {
              e.preventDefault(); // Prevent navigation for parent items with children
              toggleExpand(item.nameKey);
            } else {
              setSidebarOpen(false);
            }
          }}
        >
          <item.icon className="h-5 w-5 mr-3" />
          <span className="flex-1">{t(item.nameKey)}</span>
          {item.children && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault(); // Prevent link navigation
                toggleExpand(item.nameKey);
              }}
              className="p-1 rounded-full hover:bg-muted"
              aria-label={expandedItems[item.nameKey] ? "Collapse" : "Expand"}
            >
              {expandedItems[item.nameKey] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </Link>
        {item.children && expandedItems[item.nameKey] && (
          <div className="ml-9 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.nameKey}
                href={child.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  isActive(child.href)
                    ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-foreground hover:bg-muted"
                }`}
                onClick={(e) => {
                  // Check if user has permission to access this child item
                  if (child.requiredPermission) {
                    const hasPermission = permissionResults[child.requiredPermission.resource];
                    if (!hasPermission) {
                      e.preventDefault();
                      toast.error(t('permissions.accessDeniedNav', `You don't have permission to access ${t(child.nameKey)}`));
                      return;
                    }
                  }
                  
                  setSidebarOpen(false);
                }}
              >
                <child.icon className="h-4 w-4 mr-3" />
                {t(child.nameKey)}
              </Link>
            ))}
          </div>
        )}
      </div>
    ));
  }, [filteredNavigationItems, isActive, expandedItems, toggleExpand, permissionResults, t]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        <div className="flex flex-col flex-grow pt-5 bg-background overflow-y-auto border-r shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied message if user has no navigation items
  if (filteredNavigationItems.length === 0 && !isLoading && userRole !== 'admin') {
    return (
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        <div className="flex flex-col flex-grow pt-5 bg-background overflow-y-auto border-r shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              {applicationName}
            </h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col items-center justify-center p-4 text-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30 mb-4">
              <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('permissions.noAccess', 'No Access')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('permissions.noNavigationItems', 'You don\'t have permission to access any navigation items.')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('permissions.contactAdmin', 'Please contact your administrator.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="rounded-full hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
          {shortName}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="rounded-full hover:bg-muted"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div 
          className={`fixed inset-y-0 left-0 w-64 bg-background p-4 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              {applicationName}
            </h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-1">
            {renderNavigationItems}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        <div className="flex flex-col flex-grow pt-5 bg-background overflow-y-auto border-r shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              {applicationName}
            </h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-1">
              {renderNavigationItems}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <Button 
              variant="ghost" 
              className="justify-start rounded-lg hover:bg-muted"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t('auth.logout_a')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}