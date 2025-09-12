'use client'

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutDialog } from "@/components/layout/logout-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { User, LogOut, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useApi";
import { useState, useEffect } from "react";
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

export function Header() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [shortName, setShortName] = useState('ITAMS');

  // Get user role for display
  const userRole = user?.role?.name || 'user';
  
  // Get user initials for avatar
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  // Load application name from API
  useEffect(() => {
    const loadApplicationName = async () => {
      try {
        const settings = await getApplicationSettings();
        setShortName(settings.shortName);
      } catch (error) {
        logger.error('Failed to load application name:', error);
      }
    };

    loadApplicationName();

    // Listen for application name updates
    const handleApplicationNameUpdate = (event: CustomEvent) => {
      setShortName(event.detail.shortName);
    };

    window.addEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    
    return () => {
      window.removeEventListener('applicationNameUpdated', handleApplicationNameUpdate as EventListener);
    };
  }, []);
  
  return (
    <>
      <header className="sticky top-0 right-0 left-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              {shortName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
                    <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="w-fit mt-1">
                      {userRole === 'admin' ? t('users.form.adminRole') || 'Admin' : t('users.form.userRole') || 'User'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>{t('common.profile') || 'Profile'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings') || 'Settings'}</span>
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
      </header>
      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </>
  );
}