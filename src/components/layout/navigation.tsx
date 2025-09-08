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
  Shield
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
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
  requiredPermission?: { resource: string; action: string }; // Permission required to access this item
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
    requiredPermission: { resource: 'users', action: 'view' }, // Require at least user view permission for management access
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
  },
];

interface NavigationProps {
}

export function Navigation({}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "nav.assets": true // Expand assets by default
  });
  const logoutMutation = useLogout();
  const { t } = useTranslation();
  const [applicationName, setApplicationName] = useState('IT Asset Management');
  const [shortName, setShortName] = useState('ITAMS');
  
  // Use permission hooks to check permissions
  const { 
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
    canViewInternet
  } = usePermissions();

  // Load application name from API
  useEffect(() => {
    const loadApplicationName = async () => {
      try {
        const settings = await getApplicationSettings();
        setApplicationName(settings.applicationName);
        setShortName(settings.shortName);
      } catch (error) {
        // Log errors only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load application name:', error);
        }
      }
    };

    loadApplicationName();

    // Listen for application name updates
    const handleApplicationNameUpdate = (event: CustomEvent) => {
      setApplicationName(event.detail.applicationName);
      setShortName(event.detail.shortName);
    };

    window.addEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    
    return () => {
      window.removeEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    };
  }, []);

  // Check if user has permission for a navigation item
  const hasPermission = useCallback((item: NavigationItem) => {
    // If no permission is required, allow access
    if (!item.requiredPermission) return Promise.resolve(true);
    
    // Check specific permissions based on resource
    switch (item.requiredPermission.resource) {
      case 'users':
        return canViewUsers();
      case 'tenants':
        return canViewTenants();
      case 'roles':
        return canViewRoles();
      case 'settings':
        return canViewSettings();
      case 'assets':
        return canViewAssets();
      case 'pc':
        return canViewPC();
      case 'laptop':
        return canViewLaptop();
      case 'printer':
        return canViewPrinter();
      case 'license':
        return canViewLicense();
      case 'warehouse':
        return canViewWarehouse();
      case 'internet':
        return canViewInternet();
      default:
        return Promise.resolve(false);
    }
  }, [canViewUsers, canViewTenants, canViewRoles, canViewSettings, canViewAssets, canViewPC, canViewLaptop, canViewPrinter, canViewLicense, canViewWarehouse, canViewInternet]);

  // Filter navigation items based on user permissions
  const [filteredNavigationItems, setFilteredNavigationItems] = useState<NavigationItem[]>([]);

  // Effect to filter navigation items when permissions change
  useEffect(() => {
    let isMounted = true;
    
    const filterNavigationItems = async () => {
      const filterItems = async (items: NavigationItem[]): Promise<NavigationItem[]> => {
        const filteredItems: NavigationItem[] = [];
        
        for (const item of items) {
          // Check if user has permission for this item
          const hasPerm = await hasPermission(item);
          
          if (hasPerm) {
            // If item has children, filter them recursively
            if (item.children) {
              const filteredChildren = await filterItems(item.children);
              // Only include the parent item if it has children or it's a direct link
              if (filteredChildren.length > 0) {
                filteredItems.push({
                  ...item,
                  children: filteredChildren
                });
              }
            } else {
              // Include items without children directly
              filteredItems.push(item);
            }
          }
        }
        
        return filteredItems;
      };

      const filtered = await filterItems(navigationItems);
      if (isMounted) {
        setFilteredNavigationItems(filtered);
      }
    };

    filterNavigationItems();
    
    return () => {
      isMounted = false;
    };
  }, [canViewUsers, canViewTenants, canViewRoles, canViewSettings, canViewAssets, canViewPC, canViewLaptop, canViewPrinter, canViewLicense, canViewWarehouse, canViewInternet, hasPermission]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      // Clear token from localStorage
      localStorage.removeItem('auth-token');
      // Force a page reload to ensure auth state is properly reset
      window.location.href = '/auth/login';
    } catch (error) {
      toast.error(t('auth.logout.error') || 'Failed to logout');
    }
  }, [logoutMutation, t]);

  const isActive = useCallback((href: string) => {
    return pathname === href || pathname.startsWith(href);
  }, [pathname]);

  const toggleExpand = useCallback((nameKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [nameKey]: !prev[nameKey]
    }));
  }, []);

  // Render navigation items
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
            e.preventDefault(); // Prevent default to handle navigation manually
            if (item.children) {
              toggleExpand(item.nameKey);
            } else {
              setSidebarOpen(false);
              // Use router for navigation to enable prefetching
              router.push(item.href);
            }
          }}
        >
          <item.icon className="h-5 w-5 mr-3" />
          <span className="flex-1">{t(item.nameKey)}</span>
          {item.children && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.nameKey);
              }}
              className="p-1 rounded-full hover:bg-muted"
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
                  e.preventDefault();
                  setSidebarOpen(false);
                  // Use router for navigation to enable prefetching
                  router.push(child.href);
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
  }, [filteredNavigationItems, isActive, expandedItems, toggleExpand, router, t]);

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