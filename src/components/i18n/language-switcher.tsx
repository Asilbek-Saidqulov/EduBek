"use client";

import * as React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Globe, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOCALES = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
] as const;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeLocaleObj = LOCALES.find((l) => l.code === currentLocale) || LOCALES[0];

  const handleSelect = (locale: string) => {
    const query = searchParams?.toString();
    const targetPath = query ? `${pathname}?${query}` : pathname;
    router.replace(targetPath, { locale });
    setIsOpen(false);
  };

  // Close on Escape or click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="hidden sm:inline font-medium">{activeLocaleObj.label}</span>
        <span className="sm:hidden font-semibold">{activeLocaleObj.short}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 z-50 mt-1.5 w-36 origin-top-right rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {LOCALES.map(({ code, label }) => {
            const isSelected = currentLocale === code;
            return (
              <button
                key={code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(code)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? "font-semibold bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
