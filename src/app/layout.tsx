import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/contexts/i18n-context";
import { getCurrentLanguage } from '@/lib/i18n-server';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Asset Management System",
  description: "Comprehensive IT asset management solution",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Get the current language on the server side
  const language = await getCurrentLanguage();
  
  return (
    <html lang={language}>
      <body className={inter.className}>
        <I18nProvider initialLanguage={language}>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}