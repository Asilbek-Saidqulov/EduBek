import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uz", "en", "ru"],
  defaultLocale: "uz",
  localePrefix: "always",
});

export const locales = routing.locales;


export function getDir(locale: string) {
  return "ltr";
}

export type Locale = (typeof routing.locales)[number];
