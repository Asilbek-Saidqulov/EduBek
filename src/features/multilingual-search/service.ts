/**
 * EduBek — Multilingual search service.
 *
 * Phase 4E.6: Locale-aware search with cross-language aliases,
 * language-aware ranking, and locale-aware fallback.
 *
 * Search flow:
 *   1. Expand query with cross-language aliases
 *   2. Search in user's preferred language first (highest rank)
 *   3. Search in all available languages (medium rank)
 *   4. Search in original content (lower rank)
 *   5. Return results with locale metadata
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { expandQuery } from "./aliases";
import type {
  MultilingualSearchQuery,
  MultilingualSearchResult,
  MultilingualSearchResultPage,
} from "./types";

const log = getLogger("multilingual-search");

export async function multilingualSearch(
  query: MultilingualSearchQuery,
): Promise<MultilingualSearchResultPage> {
  const { query: rawQuery, locale, searchAllLanguages = true, resourceType, page = 1, pageSize = 20 } = query;

  // Step 1: Expand query with cross-language aliases
  const { expandedTerms, aliasesUsed } = expandQuery(rawQuery);
  const crossLanguageMatch = aliasesUsed.length > 0;

  log.info("search.expanded", {
    query: rawQuery,
    locale,
    expandedCount: expandedTerms.length,
    aliasesUsed,
  });

  // Step 2: Build Prisma where clause
  // Search in title, description, and tags
  const searchConditions: any[] = [];

  for (const term of expandedTerms) {
    const condition: any = {
      OR: [
        { title: { contains: term } },
        { description: { contains: term } },
      ],
    };
    if (resourceType) {
      condition.resourceType = resourceType;
    }
    searchConditions.push(condition);
  }

  // Also search in tags
  for (const term of expandedTerms) {
    searchConditions.push({
      tags: { some: { tag: { contains: term } } },
    });
  }

  // Also search in translations (title/description)
  for (const term of expandedTerms) {
    searchConditions.push({
      translations: { some: { title: { contains: term } } },
    });
    searchConditions.push({
      translations: { some: { description: { contains: term } } },
    });
  }

  const where = {
    OR: searchConditions,
    status: { not: "archived" },
    visibility: { in: ["public", "organization", "marketplace"] },
  };

  // Step 3: Execute search
  const [resources, total] = await Promise.all([
    db.resource.findMany({
      where,
      include: {
        tags: true,
        translations: { select: { language: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
    db.resource.count({ where }),
  ]);

  // Step 4: Rank results by language preference
  // Ranking: same language → official translation → original content → machine translation
  const results: MultilingualSearchResult[] = resources.map((r: any) => {
    const availableLanguages = [
      r.language,
      ...r.translations.map((t: any) => t.language),
    ];
    const isPreferredLanguage = r.language === locale || availableLanguages.includes(locale);
    const isTranslated = r.language !== locale && availableLanguages.includes(locale);

    // Score: 1.0 for preferred language, 0.8 for translated, 0.6 for original
    let score = 0.6; // base score for original content
    if (isPreferredLanguage) score = 1.0;
    else if (isTranslated) score = 0.8;

    // Boost score if title matches (more relevant than description)
    const titleLower = r.title.toLowerCase();
    if (expandedTerms.some((t) => titleLower.includes(t))) {
      score += 0.1;
    }

    // Build snippet
    const snippet = buildSnippet(r.title, r.description, expandedTerms);

    // Determine matched language
    let matchedLanguage = r.language;
    if (r.language !== locale && availableLanguages.includes(locale)) {
      matchedLanguage = locale;
    }

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      resourceType: r.resourceType,
      language: r.language,
      isPreferredLanguage,
      isTranslated,
      availableLanguages,
      score: Math.min(1.0, score),
      snippet,
      matchedLanguage,
    };
  });

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  // Collect matched languages
  const matchedLanguages = [...new Set(results.map((r) => r.matchedLanguage))];

  return {
    results,
    total,
    page,
    pageSize,
    matchedLanguages,
    crossLanguageMatch,
    expandedAliases: aliasesUsed,
  };
}

/**
 * Build a search snippet with highlighting markers.
 * Wraps matched terms in <mark> tags for frontend rendering.
 */
function buildSnippet(title: string, description: string | null, terms: string[]): string {
  const source = description ?? title;
  if (!source) return "";

  // Find the first match position
  const lowerSource = source.toLowerCase();
  let matchPos = -1;
  let matchedTerm = "";

  for (const term of terms) {
    const pos = lowerSource.indexOf(term);
    if (pos !== -1 && (matchPos === -1 || pos < matchPos)) {
      matchPos = pos;
      matchedTerm = term;
    }
  }

  if (matchPos === -1) {
    // No match in description — return truncated title
    return title.substring(0, 100) + (title.length > 100 ? "..." : "");
  }

  // Extract context around the match (50 chars before, 100 after)
  const start = Math.max(0, matchPos - 50);
  const end = Math.min(source.length, matchPos + matchedTerm.length + 100);
  let snippet = source.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) snippet = "..." + snippet;
  if (end < source.length) snippet = snippet + "...";

  // Highlight all matched terms
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
    snippet = snippet.replace(regex, "<mark>$1</mark>");
  }

  return snippet;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
