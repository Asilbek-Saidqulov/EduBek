"use client";

import * as React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOCALES = [
  { code: "uz", label: "O'zbekcha" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
] as const;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (locale: string) => {
    router.replace(pathname, { locale });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLocale}</span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-32 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentLocale === code ? "font-semibold bg-accent/50 text-primary" : ""
                }`}
              >
                <span>{label}</span>
                {currentLocale === code && <span className="text-primary text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
