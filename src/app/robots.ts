/**
 * EduBek — robots.txt generator.
 *
 * Phase 4E.6: References the multilingual sitemap.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/"],
    },
    sitemap: "https://edubek.app/sitemap.xml",
    host: "https://edubek.app",
  };
}
