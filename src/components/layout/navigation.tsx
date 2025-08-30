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
  Home
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLogout } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/hooks/use-translation";

// Define user roles
type UserRole = 'admin' | 'user';

// Define navigation item structure
interface NavigationItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: UserRole[]; // Roles that can access this item
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    nameKey: "nav.dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    roles: ['admin', 'user']
  },
  { 
    nameKey: "nav.assets", 
    href: "/assets", 
    icon: Home,
    roles: ['admin', 'user'],
    children: [
      { nameKey: "nav.pc", href: "/assets/pc", icon: Monitor, roles: ['admin', 'user'] },
      { nameKey: "nav.laptop", href: "/assets/laptop", icon: Laptop, roles: ['admin', 'user'] },
      { nameKey: "nav.printer", href: "/assets/printer", icon: Printer, roles: ['admin', 'user'] },
      { nameKey: "nav.license", href: "/assets/license", icon: Key, roles: ['admin', 'user'] },
      { nameKey: "nav.warehouse", href: "/assets/warehouse", icon: Warehouse, roles: ['admin', 'user'] },
    ]
  },
  { 
    nameKey: "nav.users", 
    href: "/users", 
    icon: Users,
    roles: ['admin'] // Only admins can access users
  },
  { 
    nameKey: "nav.tenants", 
    href: "/tenants", 
    icon: Building,
    roles: ['admin'] // Only admins can access tenants
  },
  { 
    nameKey: "nav.settings", 
    href: "/settings", 
    icon: Settings,
    roles: ['admin', 'user'] // Both roles can access settings
  },
];

interface NavigationProps {
  userRole?: UserRole;
}

export function Navigation({ userRole = 'user' }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "nav.assets": true // Expand assets by default
  });
  const logoutMutation = useLogout();
  const { t } = useTranslation();

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.push('/auth/login');
      toast.success(t('auth.logout.success') || 'Logged out successfully');
    } catch (error) {
      toast.error(t('auth.logout.error') || 'Failed to logout');
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  const toggleExpand = (nameKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [nameKey]: !prev[nameKey]
    }));
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="rounded-full hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ITAMS
        </h1>
        <div className="flex items-center gap-2">
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
          className={`fixed inset-y-0 left-0 w-64 bg-white p-4 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IT Asset Management
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
            {filteredNavigationItems.map((item) => (
              <div key={item.nameKey}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    if (item.children) {
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
                    {item.children
                      .filter(child => !child.roles || child.roles.includes(userRole))
                      .map((child) => (
                        <Link
                          key={child.nameKey}
                          href={child.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                            isActive(child.href)
                              ? "bg-blue-50 text-blue-700 shadow-sm"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <child.icon className="h-4 w-4 mr-3" />
                          {t(child.nameKey)}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IT Asset Management
            </h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-3 space-y-1">
              {filteredNavigationItems.map((item) => (
                <div key={item.nameKey}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-l-4 border-blue-500"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (item.children) {
                        toggleExpand(item.nameKey);
                      }
                    }}
                  >
                    <item.icon className={`h-5 w-5 mr-3 ${isActive(item.href) ? "text-blue-600" : ""}`} />
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
                      {item.children
                        .filter(child => !child.roles || child.roles.includes(userRole))
                        .map((child) => (
                          <Link
                            key={child.nameKey}
                            href={child.href}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive(child.href)
                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <child.icon className={`h-4 w-4 mr-3 ${isActive(child.href) ? "text-blue-600" : ""}`} />
                            {t(child.nameKey)}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t flex items-center justify-between">
            <LanguageSwitcher />
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