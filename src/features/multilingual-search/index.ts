/**
 * EduBek — Multilingual search barrel export.
 */
export { multilingualSearch } from "./service";
export { expandQuery, hasAliases, getAliases } from "./aliases";
export type {
  MultilingualSearchQuery,
  MultilingualSearchResult,
  MultilingualSearchResultPage,
  SearchAlias,
} from "./types";
