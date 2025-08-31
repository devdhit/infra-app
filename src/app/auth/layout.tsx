'use client'

import { ReactNode } from "react";
import { useTranslation } from "@/hooks/use-translation";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ITAMS
          </h1>
          <p className="text-sm text-gray-600">
            {t('auth.login.title') || 'IT Asset Management System'}
          </p>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} IT Asset Management System. {t('common.allRightsReserved') || 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}