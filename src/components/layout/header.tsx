'use client'

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslation } from "@/hooks/use-translation";

export function Header() {
  const { t } = useTranslation();
  
  return (
    <header className="bg-white border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-bold">{t('dashboard.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}