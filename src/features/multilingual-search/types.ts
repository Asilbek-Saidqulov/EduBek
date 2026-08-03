/**
 * EduBek — Multilingual search types.
 *
 * Phase 4E.6: Cross-language search aliases, language-aware ranking,
 * and locale-aware search fallback.
 */

/** A cross-language search alias maps terms across languages. */
export interface SearchAlias {
  /** The canonical term (e.g. "photosynthesis"). */
  canonical: string;
  /** Aliases in other languages (e.g. "fotosintez", "фотосинтез"). */
  aliases: string[];
  /** The language of the canonical term. */
  language: string;
}

/** Locale-aware search query. */
export interface MultilingualSearchQuery {
  /** The raw search text. */
  query: string;
  /** The user's preferred locale. */
  locale: string;
  /** Whether to search across all languages (default: true). */
  searchAllLanguages?: boolean;
  /** Content type filter. */
  resourceType?: string;
  /** Page number (1-based). */
  page?: number;
  /** Page size. */
  pageSize?: number;
}

/** A single search result with locale metadata. */
export interface MultilingualSearchResult {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  language: string;
  /** Whether the result is in the user's preferred language. */
  isPreferredLanguage: boolean;
  /** Whether the result is a translation. */
  isTranslated: boolean;
  /** Available languages for this result. */
  availableLanguages: string[];
  /** Relevance score (0-1, higher is better). */
  score: number;
  /** Matched snippet with highlighting markers. */
  snippet: string;
  /** Which language the match was found in. */
  matchedLanguage: string;
}

export interface MultilingualSearchResultPage {
  results: MultilingualSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  /** Languages that matched the query. */
  matchedLanguages: string[];
  /** Whether cross-language matching was used. */
  crossLanguageMatch: boolean;
  /** Aliases that were expanded. */
  expandedAliases: string[];
}
