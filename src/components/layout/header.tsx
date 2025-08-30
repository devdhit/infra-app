'use client'

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useApi";

export function Header() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  
  return (
    <header className="sticky top-0 right-0 left-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ITAMS
          </h1>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search.placeholder') || "Search assets..."}
              className="pl-10 w-64 rounded-lg border-muted-foreground/20 focus:border-blue-500 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative hidden md:flex rounded-full hover:bg-muted">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white">
              3
            </Badge>
          </Button>
          <LanguageSwitcher />
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Avatar className="h-8 w-8 border border-muted">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}