import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/contexts/i18n-context";
import { getCurrentLanguage } from '@/lib/i18n-server';
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PerformanceMonitor } from "@/components/performance/performance-monitor";

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
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <html lang={language} suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider initialLanguage={language}>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ProtectedLayout>
                {children}
              </ProtectedLayout>
              <Toaster />
              {isDevelopment && <PerformanceMonitor />}
            </ThemeProvider>
          </ReactQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}