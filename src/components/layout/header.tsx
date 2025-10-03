'use client'

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutDialog } from "@/components/layout/logout-dialog";
import { ProfileDialog } from "@/components/layout/profile-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { User, LogOut, UserCircle, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useApi";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApplicationSettings } from '@/lib/api/application';
import logger from '@/lib/logger';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import icons
import { 
  LayoutDashboard, 
  Monitor, 
  Laptop, 
  Printer, 
  Key, 
  Warehouse,
  Users,
  Building,
  Settings as SettingsIcon,
  Home,
  Wifi,
  Shield,
  FileText,
  AppWindow
} from "lucide-react";

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
    icon: SettingsIcon,
    requiredPermission: { resource: 'settings', action: 'view' },
    children: [
      { 
        nameKey: "settings.application.title", 
        href: "/settings/application", 
        icon: AppWindow,
        requiredPermission: { resource: 'settings', action: 'view' }
      },
      { 
        nameKey: "settings.customFields.title", 
        href: "/settings/custom-fields", 
        icon: SettingsIcon,
        requiredPermission: { resource: 'settings', action: 'view' }
      },
      { 
        nameKey: "nav.auditLogs", 
        href: "/settings/audit-logs", 
        icon: FileText,
        requiredPermission: { resource: 'auditLogs', action: 'view' }
      },
      { 
        nameKey: "nav.agents", 
        href: "/settings/agents", 
        icon: FileText,
        requiredPermission: { resource: 'agent', action: 'viewStatus' }
      },
    ]
  },
];

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [applicationName, setApplicationName] = useState('IT Asset Management');
  const [shortName, setShortName] = useState('ITAMS');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

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
    canViewAuditLogs,
    canViewAgents
  } = usePermissions();

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
    'auditLogs': false,
    'agent': false
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
    
    const checkAllPermissions = async () => {
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
          'auditLogs': true,
          'agent': true
        });
        permissionCheckRef.current = {userRole, checked: true};
      } else if (userRole) {
        // For non-admin users, check permissions sequentially with delays
        const results: Record<string, boolean> = {};
        
        // Process permissions one at a time with small delays to prevent overwhelming the API
        const permissionChecks: { key: string; check: () => Promise<boolean> }[] = [
          { key: 'assets', check: canViewAssets },
          { key: 'pc', check: canViewPC },
          { key: 'laptop', check: canViewLaptop },
          { key: 'printer', check: canViewPrinter },
          { key: 'license', check: canViewLicense },
          { key: 'warehouse', check: canViewWarehouse },
          { key: 'internet', check: canViewInternet },
          { key: 'users', check: canViewUsers },
          { key: 'tenants', check: canViewTenants },
          { key: 'roles', check: canViewRoles },
          { key: 'settings', check: canViewSettings },
          { key: 'auditLogs', check: canViewAuditLogs },
          { key: 'agent', check: canViewAgents }
        ];
        
        // Check permissions one by one
        for (let i = 0; i < permissionChecks.length; i++) {
          const permissionCheck = permissionChecks[i];
          // Add a type guard to ensure permissionCheck is not undefined
          if (permissionCheck) {
            const { key, check } = permissionCheck;
            try {
              results[key] = await check();
            } catch (error) {
              logger.error(`Error checking permission for ${key}:`, error);
              results[key] = false;
            }
          }
          
          // Small delay between requests to prevent overwhelming the API
          if (i < permissionChecks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        setPermissionResults(results);
        permissionCheckRef.current = {userRole, checked: true};
      } else {
        // Reset permission check ref when userRole becomes null
        permissionCheckRef.current = {userRole: null, checked: false};
      }
    };
    
    checkAllPermissions();
  }, [userRole, isLoading, canViewAssets, canViewPC, canViewLaptop, canViewPrinter, canViewLicense, canViewWarehouse, canViewInternet, canViewUsers, canViewTenants, canViewRoles, canViewSettings, canViewAuditLogs, canViewAgents]);

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

  // Get user role for display
  const userRoleDisplay = user?.role?.name || 'user';
  
  // Get user initials for avatar
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  // Load application name from API
  useEffect(() => {
    const loadApplicationName = async () => {
      try {
        // Only run on client side
        if (typeof window !== 'undefined') {
          const settings = await getApplicationSettings();
          setApplicationName(settings.applicationName);
          setShortName(settings.shortName);
        }
      } catch (error) {
        logger.error('Failed to load application name:', error);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      loadApplicationName();
    }

    // Listen for application name updates
    const handleApplicationNameUpdate = (event: CustomEvent) => {
      setApplicationName(event.detail.applicationName);
      setShortName(event.detail.shortName);
    };

    // Only add event listener on client side
    if (typeof window !== 'undefined') {
      window.addEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    }
    
    return () => {
      // Only remove event listener on client side
      if (typeof window !== 'undefined') {
        window.removeEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
      }
    };
  }, []);
  
  // Check if a navigation item is active
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  // Handle navigation with permission check
  const handleNavigation = (href: string, requiredPermission?: { resource: string; action: string }) => {
    if (requiredPermission) {
      const hasPermission = permissionResults[requiredPermission.resource];
      if (!hasPermission) {
        toast.error(t('permissions.accessDeniedNav', `You don't have permission to access this section`));
        return;
      }
    }
    router.push(href);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  // Toggle dropdown
  const toggleDropdown = (nameKey: string) => {
    setOpenDropdown(openDropdown === nameKey ? null : nameKey);
  };

  // Update date/time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 right-0 left-0 z-50 bg-background/80 backdrop-blur-md border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              <span className="hidden md:inline">{applicationName}</span>
              <span className="md:hidden">{shortName}</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {filteredNavigationItems.map((item) => (
                <div key={item.nameKey} className="relative">
                  {item.children ? (
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(item.nameKey)}
                        className={cn(
                          "flex items-center gap-2 bg-transparent hover:bg-muted px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(item.nameKey)}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                      
                      {openDropdown === item.nameKey && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-md shadow-lg z-50"
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          <div className="py-1">
                            {item.children.map((child) => (
                              <button
                                key={child.nameKey}
                                onClick={() => handleNavigation(child.href, child.requiredPermission)}
                                className={cn(
                                  "flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-muted",
                                  isActive(child.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                                )}
                              >
                                <child.icon className="h-4 w-4" />
                                {t(child.nameKey)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.href, item.requiredPermission)}
                      className={cn(
                        "flex items-center gap-2 bg-transparent hover:bg-muted px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(item.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.nameKey)}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date/Time and IP Display */}
            <div className="hidden md:flex flex-col items-end text-sm text-muted-foreground">
              <div>{currentDateTime.getFullYear()}/{String(currentDateTime.getMonth() + 1).padStart(2, '0')}/{String(currentDateTime.getDate()).padStart(2, '0')} {String(currentDateTime.getHours()).padStart(2, '0')}:{String(currentDateTime.getMinutes()).padStart(2, '0')}:{String(currentDateTime.getSeconds()).padStart(2, '0')}</div>
            </div>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <ThemeToggle />
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-muted">
                  <Avatar className="h-8 w-8 border border-muted">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userInitials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <Badge variant={userRoleDisplay === 'admin' ? 'default' : 'secondary'} className="w-fit mt-1">
                      {userRoleDisplay === 'admin' ? t('users.form.adminRole') || 'Admin' : t('users.form.userRole') || 'User'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>{t('common.profile') || 'Profile'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>{t('nav.settings') || 'Settings'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logout_a') || 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            {/* Date/Time and IP Display for mobile */}
            <div className="px-4 py-2 border-b">
              <div className="text-sm text-muted-foreground">
                {currentDateTime.getFullYear()}/{String(currentDateTime.getMonth() + 1).padStart(2, '0')}/{String(currentDateTime.getDate()).padStart(2, '0')} {String(currentDateTime.getHours()).padStart(2, '0')}:{String(currentDateTime.getMinutes()).padStart(2, '0')}:{String(currentDateTime.getSeconds()).padStart(2, '0')}
              </div>
            </div>
            
            <div className="space-y-1 px-4 py-3">
              {filteredNavigationItems.map((item) => (
                <div key={item.nameKey}>
                  {item.children ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavigation(item.href, item.requiredPermission)}
                        className={cn(
                          "flex items-center justify-between w-full bg-transparent hover:bg-muted px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {t(item.nameKey)}
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="ml-6 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.nameKey}
                            onClick={() => handleNavigation(child.href, child.requiredPermission)}
                            className={cn(
                              "flex items-center gap-2 w-full bg-transparent hover:bg-muted px-3 py-2 rounded-md text-sm transition-colors",
                              isActive(child.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {t(child.nameKey)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.href, item.requiredPermission)}
                      className={cn(
                        "flex items-center gap-2 w-full bg-transparent hover:bg-muted px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(item.href) && "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.nameKey)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
      <ProfileDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </>
  );
}