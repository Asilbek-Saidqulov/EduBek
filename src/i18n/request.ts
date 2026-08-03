/**
 * EduBek — i18n request configuration.
 *
 * This file is used by `createNextIntlPlugin` in `next.config.ts` to
 * load the correct message catalog for each request. It reads the
 * locale from the request context (set by the middleware) and returns
 * the corresponding JSON catalog.
 *
 * Message catalogs live in `/messages/{locale}.json`.
 */
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is the locale detected by the middleware (from the
  // URL prefix). If it's not a valid locale, fall back to the default.
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
