/**
 * Marketplace feature — constants.
 *
 * Category taxonomy for marketplace quiz listings. In the full platform
 * these would live in the `MarketplaceCategory` database table; for now
 * they're a static list shared by the API, the marketplace browser, and
 * the landing page.
 */

export interface Category {
  id: string
  label: string
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
  { id: 'language', label: 'Language' },
  { id: 'history', label: 'History' },
  { id: 'technology', label: 'Technology' },
  { id: 'geography', label: 'Geography' },
]
