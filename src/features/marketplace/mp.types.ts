export type ListingStatus = 'draft' | 'ready' | 'submitted' | 'approved' | 'published' | 'unpublished' | 'archived'

export interface MpListingDto {
  id: string; resourceId: string; creatorId: string; orgId: string | null
  title: string; description: string | null; thumbnailUrl: string | null
  estimatedDuration: string | null; difficulty: string | null
  price: number; currency: string; licenseType: string; status: string
  visibility: string; featured: boolean; resourceVersionPublished: number | null
  viewCount: number; favoriteCount: number; downloadCount: number
  ratingAverage: number; ratingCount: number; publishedAt: string | null
  isFavorited: boolean; isOutOfSync: boolean; categories: string[]
  createdAt: string; updatedAt: string
  /** Phase 4E.5: Available content languages (additive). */
  availableLanguages?: string[]
  /** Phase 4E.5: Default content language (additive). */
  defaultLanguage?: string
}

export interface MpListingListItemDto {
  id: string; title: string; description: string | null
  thumbnailUrl: string | null; resourceType: string; price: number
  currency: string; featured: boolean; viewCount: number; favoriteCount: number
  ratingAverage: number; ratingCount: number; creatorName: string
  categories: string[]; publishedAt: string | null; createdAt: string
  /** Phase 4E.5: Content language (additive). */
  contentLanguage?: string
  /** Phase 4E.5: Is translated (additive). */
  isTranslated?: boolean
}

export interface MpListingListResult { listings: MpListingListItemDto[]; total: number }

export interface MpCategoryDto {
  id: string; slug: string; name: string; description: string | null
  icon: string | null; sortOrder: number
  /** Phase 4E.5: Translation key for the category name (additive). */
  displayNameKey?: string
  /** Phase 4E.5: Translation key for the category description (additive). */
  descriptionKey?: string
  /** Phase 4E.5: Available languages for this category (additive). */
  availableLanguages?: string[]
}

export interface CreatorDashboardDto {
  totalListings: number; draftCount: number; submittedCount: number
  publishedCount: number; archivedCount: number; totalViews: number
  totalFavorites: number; totalDownloads: number; averageRating: number
  recentListings: MpListingListItemDto[]
}
