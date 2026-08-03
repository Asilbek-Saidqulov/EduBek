/**
 * EduBek — i18n routing configuration.
 *
 * Defines the supported locales, default locale, and URL prefix strategy.
 * Used by:
 *   - src/middleware.ts (for locale detection + URL rewriting)
 *   - src/i18n/request.ts (for loading message catalogs)
 *   - NextIntlClientProvider (for client-side locale awareness)
 *
 * Locale detection order (in middleware):
 *   1. URL prefix (e.g. /uz/dashboard → locale = "uz")
 *   2. User.locale (from JWT — set at login, updated on language switch)
 *   3. Accept-Language header (browser preference)
 *   4. Default locale ("en")
 *
 * URL structure:
 *   /en/dashboard   → English
 *   /uz/dashboard   → Uzbek
 *   /ru/dashboard   → Russian
 *   /dashboard      → redirects to /{detected-locale}/dashboard
 *
 * Old locale-agnostic URLs are automatically redirected to the
 * locale-prefixed equivalent. This is backward-compatible — existing
 * bookmarks and links continue to work.
 */
import { defineRouting } from "next-intl/routing";

export const locales = ["en", "uz", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/**
 * RTL locales — Arabic (ar) will be added here when enabled.
 * For now, all supported locales are LTR, but the `dir` attribute
 * is set dynamically so RTL support is structural from day one.
 */
export const rtlLocales: readonly string[] = ["ar", "he", "fa"];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale);
}

export function getDir(locale: string): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/**
 * Check if a string is a valid supported locale.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
