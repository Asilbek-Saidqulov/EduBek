/**
 * EduBek — Multilingual sitemap.
 *
 * Phase 4E.6: Generates a sitemap with hreflang alternates for
 * every locale. Next.js App Router automatically serves this at
 * /sitemap.xml.
 *
 * Each entry includes `alternates.languages` with all supported
 * locales so search engines understand the language relationships.
 */
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://edubek.app";
  const locales = routing.locales;

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale with hreflang alternates
  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "weekly" as const },
    { path: "/dashboard", priority: 0.8, changeFreq: "daily" as const },
    { path: "/marketplace", priority: 0.9, changeFreq: "daily" as const },
    { path: "/live-quiz", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/ai-workspace", priority: 0.7, changeFreq: "weekly" as const },
  ];

  for (const page of staticPages) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${baseUrl}/${locale}${page.path}`;
    }

    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: page.priority,
        alternates: { languages: alternates },
      });
    }
  }

  // Dynamic resource pages
  try {
    const resources = await db.resource.findMany({
      where: {
        visibility: { in: ["public", "marketplace"] },
        status: { not: "archived" },
      },
      select: {
        id: true,
        updatedAt: true,
        language: true,
        translations: { select: { language: true } },
      },
      take: 1000,
    });

    for (const resource of resources) {
      const availableLanguages = new Set([
        resource.language,
        ...resource.translations.map((t: any) => t.language),
      ]);

      const alternates: Record<string, string> = {};
      for (const locale of locales) {
        if (availableLanguages.has(locale)) {
          alternates[locale] = `${baseUrl}/${locale}/resources/${resource.id}`;
        }
      }

      for (const lang of availableLanguages) {
        if (locales.includes(lang as any)) {
          entries.push({
            url: `${baseUrl}/${lang}/resources/${resource.id}`,
            lastModified: resource.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.6,
            alternates: { languages: alternates },
          });
        }
      }
    }
  } catch {
    // DB unavailable — return static pages only
  }

  return entries;
}
