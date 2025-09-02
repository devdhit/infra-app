'use client';

import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Settings, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  currentPage: string;
}

export function SettingsLayout({ children, title, description, currentPage }: SettingsLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { 
            label: t('nav.dashboard') || 'Dashboard', 
            href: '/dashboard',
            icon: <Home className="h-4 w-4" /> 
          },
          { 
            label: t('nav.settings') || 'Settings', 
            href: '/settings',
            icon: <Settings className="h-4 w-4" /> 
          },
          { 
            label: currentPage, 
            href: '#'
          }
        ]}
      />
      
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      {children}
    </div>
  );
}