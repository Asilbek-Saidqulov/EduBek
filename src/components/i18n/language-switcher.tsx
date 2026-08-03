"use client"

import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { useState, useTransition } from "react"
import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { locales, type Locale } from "@/i18n/routing"

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  uz: "O'zbekcha",
  ru: "Русский",
}

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  uz: "🇺🇿",
  ru: "🇷🇺",
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  function onSelect(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      setIsOpen(false)
      return
    }

    startTransition(async () => {
      // 1. Update the user's locale in the DB + re-issue JWT
      // (Non-authenticated users just get the URL change — the JWT
      // update is best-effort and silently fails if not logged in.)
      try {
        await fetch("/api/auth/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        })
      } catch {
        // Silently ignore — the URL change is the primary mechanism
      }

      // 2. Navigate to the same page in the new locale
      // next-intl's router.replace preserves the pathname + search params
      // and only swaps the locale prefix.
      router.replace(pathname, { locale: nextLocale })
      setIsOpen(false)
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
          aria-label="Switch language"
        >
          <Globe className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{LOCALE_LABELS[currentLocale]}</span>
          <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => onSelect(locale)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{LOCALE_FLAGS[locale]}</span>
              {LOCALE_LABELS[locale]}
            </span>
            {locale === currentLocale && (
              <Check className="size-4 text-emerald-500" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
