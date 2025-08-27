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
import { useI18n } from "@/contexts/i18n-context";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useI18n();
  
  const switchLanguage = (lang: string) => {
    // Set the language in the context (this will update the UI)
    setLanguage(lang as any);
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
    
    // Force a page refresh to reload translations
    router.refresh();
  };
  
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
            className={language === lang ? "bg-muted" : ""}
          >
            {getLanguageName(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}