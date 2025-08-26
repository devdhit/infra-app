'use client'

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supportedLanguages } from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  
  const switchLanguage = (lang: string) => {
    // Get the current path without the locale prefix
    let pathWithoutLocale = pathname;
    supportedLanguages.forEach((locale) => {
      if (pathname.startsWith(`/${locale}/`)) {
        pathWithoutLocale = pathname.slice(locale.length + 1);
      } else if (pathname === `/${locale}`) {
        pathWithoutLocale = "/";
      }
    });
    
    // Redirect to the new language path
    const newPath = `/${lang}${pathWithoutLocale}`;
    router.push(newPath);
  };
  
  // Get current language
  let currentLang = "en";
  supportedLanguages.forEach((locale) => {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      currentLang = locale;
    }
  });
  
  const getLanguageName = (lang: string) => {
    switch (lang) {
      case "en": return "English";
      case "zh-tw": return "繁體中文";
      default: return lang;
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => switchLanguage(lang)}
            className={currentLang === lang ? "bg-muted" : ""}
          >
            {getLanguageName(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}