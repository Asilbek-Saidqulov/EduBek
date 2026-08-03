import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized } from '@/lib/errors'
import { can, canInOrg, isOrgMember, PersonalPermission, OrgPermission, type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { LISTING_CREATED, LISTING_UPDATED, LISTING_SUBMITTED, LISTING_APPROVED, LISTING_PUBLISHED, LISTING_UNPUBLISHED, LISTING_ARCHIVED, LISTING_FAVORITED, LISTING_UNFAVORITED, LISTING_VIEWED, buildEvent } from '@/infra/event-bus/events'
import type { MpListingDto, MpListingListItemDto, MpListingListResult, MpCategoryDto, CreatorDashboardDto } from './mp.types'
import type { CreateListingBody, UpdateListingBody, BrowseListingsQuery, CreateCategoryBody } from './mp.schema'
import * as repo from './mp.repository'
import { enforceMarketplaceAIPolicy } from './policy'
const log = logger.child({ module: 'mp-service' })

function mapListing(l: any, isFavorited: boolean): MpListingDto {
  return { id: l.id, resourceId: l.resourceId, creatorId: l.creatorId, orgId: l.orgId, title: l.title, description: l.description, thumbnailUrl: l.thumbnailUrl, estimatedDuration: l.estimatedDuration, difficulty: l.difficulty, price: l.price, currency: l.currency, licenseType: l.licenseType, status: l.status, visibility: l.visibility, featured: l.featured, resourceVersionPublished: l.resourceVersionPublished, viewCount: l.viewCount, favoriteCount: l.favoriteCount, downloadCount: l.downloadCount, ratingAverage: l.ratingAverage, ratingCount: l.ratingCount, publishedAt: l.publishedAt?.toISOString() ?? null, isFavorited, isOutOfSync: false, categories: l.categories?.map((c: any) => c.category?.name ?? '').filter(Boolean) ?? [], createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() }
}
function mapListItem(l: any): MpListingListItemDto {
  return { id: l.id, title: l.title, description: l.description, thumbnailUrl: l.thumbnailUrl, resourceType: l.resource?.resourceType ?? 'unknown', price: l.price, currency: l.currency, featured: l.featured, viewCount: l.viewCount, favoriteCount: l.favoriteCount, ratingAverage: l.ratingAverage, ratingCount: l.ratingCount, creatorName: l.creator?.name ?? 'Unknown', categories: l.categories?.map((c: any) => c.category?.name ?? '').filter(Boolean) ?? [], publishedAt: l.publishedAt?.toISOString() ?? null, createdAt: l.createdAt.toISOString() }
}
function mapCategory(c: any): MpCategoryDto { return { id: c.id, slug: c.slug, name: c.name, description: c.description, icon: c.icon, sortOrder: c.sortOrder } }
function canManage(ctx: AuthContext, l: { creatorId: string; orgId: string | null }): boolean { if (ctx.isSuperadmin) return true; if (l.creatorId === ctx.userId) return can(ctx, PersonalPermission.MARKETPLACE_PUBLISH); if (l.orgId) return canInOrg(ctx, l.orgId, OrgPermission.MARKETPLACE_MANAGE); return false }

export async function createListing(ctx: AuthContext, input: CreateListingBody): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (!can(ctx, PersonalPermission.MARKETPLACE_PUBLISH)) throw forbidden('No permission to publish')
  const { findResourceById } = await import('@/features/resource/resource.repository')
  const resource = await findResourceById(input.resourceId)
  if (!resource) throw notFound('Resource not found')
  if (resource.ownerId !== ctx.userId) throw forbidden('Can only publish own resources')
  const existing = await repo.findListingByResource(input.resourceId)
  if (existing) throw badRequest('Listing already exists for this resource')
  // MVP Marketplace policy: AI-generated content cannot be sold. The check
  // runs at submission too, but we enforce at creation so a paid draft can
  // never exist for AI content.
  await enforceMarketplaceAIPolicy({ resourceId: input.resourceId, price: input.price })
  const listing = await repo.createListing({ resourceId: input.resourceId, creatorId: ctx.userId, orgId: input.orgId, title: input.title, description: input.description, thumbnailUrl: input.thumbnailUrl, estimatedDuration: input.estimatedDuration, difficulty: input.difficulty, price: input.price, currency: input.currency, licenseType: input.licenseType, categoryIds: input.categoryIds })
  eventBus.publish(buildEvent({ type: LISTING_CREATED, actorId: ctx.userId, listingId: listing.id, resourceId: input.resourceId, title: listing.title, creatorId: ctx.userId, occurredAt: new Date().toISOString() } as any))
  return mapListing(listing, false)
}

export async function getListing(ctx: AuthContext, id: string, trackView = false): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const listing = await repo.findListingById(id)
  if (!listing) throw notFound('Listing not found')
  if (listing.status !== 'published' && !canManage(ctx, listing)) throw forbidden('Cannot view this listing')
  const fav = ctx.userId ? await repo.findFavorite(id, ctx.userId) : null
  if (trackView) { repo.incrementViewCount(id).catch(() => {}); eventBus.publish(buildEvent({ type: LISTING_VIEWED, actorId: ctx.userId, listingId: id, userId: ctx.userId, occurredAt: new Date().toISOString() } as any)) }
  return mapListing(listing, !!fav)
}

export async function updateListing(ctx: AuthContext, id: string, input: UpdateListingBody): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findListingById(id)
  if (!existing) throw notFound('Listing not found')
  if (!canManage(ctx, existing)) throw forbidden('Cannot update this listing')
  const data: Record<string, unknown> = {}; const changes: string[] = []
  for (const [k, v] of Object.entries(input)) { if (v !== undefined && k !== 'categoryIds') { data[k] = v; changes.push(k) } }
  // MVP Marketplace policy: AI-generated content cannot be sold. If the
  // update is raising the price on an AI-generated resource, reject it.
  if (typeof input.price === 'number' && input.price > 0) {
    await enforceMarketplaceAIPolicy({ resourceId: existing.resourceId, price: input.price })
  }
  const updated = await repo.updateListing(id, data)
  if (input.categoryIds) await repo.setListingCategories(id, input.categoryIds)
  eventBus.publish(buildEvent({ type: LISTING_UPDATED, actorId: ctx.userId, listingId: id, changes, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId)
  return mapListing(updated, !!fav)
}

export async function deleteListing(ctx: AuthContext, id: string): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findListingById(id)
  if (!existing) throw notFound('Listing not found')
  if (!canManage(ctx, existing)) throw forbidden('Cannot delete this listing')
  if (existing.status === 'published') throw badRequest('Unpublish first')
  await repo.deleteListing(id)
}

export async function submitListing(ctx: AuthContext, id: string): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const e = await repo.findListingById(id); if (!e) throw notFound('Listing not found')
  if (!canManage(ctx, e)) throw forbidden('Cannot submit')
  if (e.status !== 'draft' && e.status !== 'ready') throw badRequest(`Cannot submit from '${e.status}'`)
  // MVP Marketplace policy: AI-generated content cannot be sold. Re-check
  // at submission in case the price was raised via updateListing.
  await enforceMarketplaceAIPolicy({ resourceId: e.resourceId, price: e.price })
  const u = await repo.updateListing(id, { status: 'submitted', submittedAt: new Date() })
  eventBus.publish(buildEvent({ type: LISTING_SUBMITTED, actorId: ctx.userId, listingId: id, title: e.title, creatorId: ctx.userId, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId); return mapListing(u, !!fav)
}

export async function approveListing(ctx: AuthContext, id: string): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const e = await repo.findListingById(id); if (!e) throw notFound('Listing not found')
  if (e.status !== 'submitted') throw badRequest(`Cannot approve from '${e.status}'`)
  const u = await repo.updateListing(id, { status: 'approved', approvedAt: new Date(), approvedById: ctx.userId })
  eventBus.publish(buildEvent({ type: LISTING_APPROVED, actorId: ctx.userId, listingId: id, title: e.title, approvedById: ctx.userId, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId); return mapListing(u, !!fav)
}

export async function publishListing(ctx: AuthContext, id: string): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const e = await repo.findListingById(id); if (!e) throw notFound('Listing not found')
  if (!canManage(ctx, e)) throw forbidden('Cannot publish')
  if (e.status !== 'approved') throw badRequest('Must be approved first')
  const u = await repo.updateListing(id, { status: 'published', publishedAt: new Date() })
  const { updateResource } = await import('@/features/resource/resource.service')
  await updateResource(ctx, e.resourceId, { visibility: 'public', status: 'ready' }).catch(() => {})
  eventBus.publish(buildEvent({ type: LISTING_PUBLISHED, actorId: ctx.userId, listingId: id, title: e.title, creatorId: ctx.userId, resourceVersion: 1, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId); return mapListing(u, !!fav)
}

export async function unpublishListing(ctx: AuthContext, id: string): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const e = await repo.findListingById(id); if (!e) throw notFound('Listing not found')
  if (!canManage(ctx, e)) throw forbidden('Cannot unpublish')
  if (e.status !== 'published') throw badRequest('Not published')
  const u = await repo.updateListing(id, { status: 'unpublished', unpublishedAt: new Date() })
  eventBus.publish(buildEvent({ type: LISTING_UNPUBLISHED, actorId: ctx.userId, listingId: id, title: e.title, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId); return mapListing(u, !!fav)
}

export async function archiveListing(ctx: AuthContext, id: string): Promise<MpListingDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const e = await repo.findListingById(id); if (!e) throw notFound('Listing not found')
  if (!canManage(ctx, e)) throw forbidden('Cannot archive')
  const u = await repo.updateListing(id, { status: 'archived', archivedAt: new Date() })
  eventBus.publish(buildEvent({ type: LISTING_ARCHIVED, actorId: ctx.userId, listingId: id, title: e.title, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId); return mapListing(u, !!fav)
}

export async function browseListings(ctx: AuthContext, query: BrowseListingsQuery): Promise<MpListingListResult> {
  const { listings, total } = await repo.browseListings({ search: query.search, resourceType: query.resourceType, grade: query.grade, subject: query.subject, language: query.language, creatorId: query.creatorId, categoryId: query.categoryId, featured: query.featured, free: query.free, paid: query.paid, sort: query.sort, limit: query.limit, offset: query.offset })
  return { listings: listings.map(mapListItem), total }
}

export async function toggleFavorite(ctx: AuthContext, id: string): Promise<{ favorited: boolean }> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (!can(ctx, PersonalPermission.MARKETPLACE_FAVORITE)) throw forbidden('No permission to favorite')
  const listing = await repo.findListingById(id); if (!listing) throw notFound('Listing not found')
  const existing = await repo.findFavorite(id, ctx.userId)
  if (existing) { await repo.deleteFavorite(id, ctx.userId); repo.updateFavoriteCount(id, -1).catch(() => {}); eventBus.publish(buildEvent({ type: LISTING_UNFAVORITED, actorId: ctx.userId, listingId: id, userId: ctx.userId, occurredAt: new Date().toISOString() } as any)); return { favorited: false } }
  else { await repo.createFavorite(id, ctx.userId); repo.updateFavoriteCount(id, 1).catch(() => {}); eventBus.publish(buildEvent({ type: LISTING_FAVORITED, actorId: ctx.userId, listingId: id, userId: ctx.userId, occurredAt: new Date().toISOString() } as any)); return { favorited: true } }
}

export async function listFavoriteListings(ctx: AuthContext, limit = 20, offset = 0) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const favorites = await repo.findFavoriteListings(ctx.userId, limit, offset)
  return {
    listings: favorites.map((favorite: any) => ({
      id: favorite.listing?.id,
      title: favorite.listing?.title,
      description: favorite.listing?.description,
      thumbnailUrl: favorite.listing?.thumbnailUrl,
      resourceType: favorite.listing?.resource?.resourceType ?? 'unknown',
      price: favorite.listing?.price,
      currency: favorite.listing?.currency,
      featured: favorite.listing?.featured,
      viewCount: favorite.listing?.viewCount ?? 0,
      favoriteCount: favorite.listing?.favoriteCount ?? 0,
      ratingAverage: favorite.listing?.ratingAverage ?? 0,
      ratingCount: favorite.listing?.ratingCount ?? 0,
      creatorName: favorite.listing?.creator?.name ?? 'Unknown',
      categories: favorite.listing?.categories?.map((c: any) => c.category?.name ?? '').filter(Boolean) ?? [],
      publishedAt: favorite.listing?.publishedAt?.toISOString() ?? null,
      createdAt: favorite.listing?.createdAt?.toISOString() ?? null,
    })),
    total: favorites.length,
  }
}

export async function getCategories(): Promise<MpCategoryDto[]> { return (await repo.findCategories()).map(mapCategory) }
export async function createCategory(ctx: AuthContext, input: CreateCategoryBody): Promise<MpCategoryDto> {
  if (!ctx.userId) throw unauthorized('Authentication required'); if (!ctx.isSuperadmin) throw forbidden('Admin only')
  const existing = await repo.findCategoryBySlug(input.slug); if (existing) throw badRequest('Slug already exists')
  return mapCategory(await repo.createCategory(input))
}
export async function getCreatorDashboard(ctx: AuthContext): Promise<CreatorDashboardDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const listings = await repo.findListingsByCreator(ctx.userId)
  const published = listings.filter((l) => l.status === 'published')
  const recent = await repo.findRecentListingsByCreator(ctx.userId, 5)
  return { totalListings: listings.length, draftCount: listings.filter((l) => l.status === 'draft' || l.status === 'ready').length, submittedCount: listings.filter((l) => l.status === 'submitted').length, publishedCount: published.length, archivedCount: listings.filter((l) => l.status === 'archived').length, totalViews: published.reduce((s, l) => s + l.viewCount, 0), totalFavorites: published.reduce((s, l) => s + l.favoriteCount, 0), totalDownloads: published.reduce((s, l) => s + l.downloadCount, 0), averageRating: published.length > 0 ? published.reduce((s, l) => s + l.ratingAverage, 0) / published.length : 0, recentListings: recent.map(mapListItem) }
}
export async function getFeatured(limit = 10) { return (await repo.findFeatured(limit)).map(mapListItem) }
export async function getNew(limit = 10) { return (await repo.findNew(limit)).map(mapListItem) }
export async function getPopular(limit = 10) { return (await repo.findPopular(limit)).map(mapListItem) }
