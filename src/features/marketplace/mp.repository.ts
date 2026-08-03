import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
const log = logger.child({ module: 'mp-repository' })

export async function createListing(data: any) { log.info('createListing', { resourceId: data.resourceId }); return db.mpListing.create({ data: { ...data, categories: { create: (data.categoryIds || []).map((categoryId: string) => ({ categoryId })) } }, include: { categories: { include: { category: true } } } }) }
export async function findListingById(id: string) { return db.mpListing.findUnique({ where: { id }, include: { resource: { select: { id: true, resourceType: true, subject: true, grade: true, language: true, tags: { select: { tag: true } } } }, creator: { select: { id: true, name: true, username: true } }, categories: { include: { category: true } } } }) }
export async function findListingByResource(resourceId: string) { return db.mpListing.findUnique({ where: { resourceId } }) }
export async function updateListing(id: string, data: Record<string, unknown>) { return db.mpListing.update({ where: { id }, data, include: { categories: { include: { category: true } } } }) }
export async function setListingCategories(listingId: string, categoryIds: string[]) { await db.mpListingCategory.deleteMany({ where: { listingId } }); if (categoryIds.length > 0) await db.mpListingCategory.createMany({ data: categoryIds.map((categoryId) => ({ listingId, categoryId })) }) }
export async function deleteListing(id: string) { return db.mpListing.delete({ where: { id } }) }
export async function incrementViewCount(id: string) { await db.mpListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }) }
export async function updateFavoriteCount(id: string, delta: number) { await db.mpListing.update({ where: { id }, data: { favoriteCount: { increment: delta } } }) }
export async function findFavorite(listingId: string, userId: string) { return db.mpFavorite.findUnique({ where: { listingId_userId: { listingId, userId } } }) }
export async function createFavorite(listingId: string, userId: string) { return db.mpFavorite.create({ data: { listingId, userId } }).catch(() => null) }
export async function deleteFavorite(listingId: string, userId: string) { return db.mpFavorite.deleteMany({ where: { listingId, userId } }) }
export async function findFavoriteListings(userId: string, limit = 20, offset = 0) { return db.mpFavorite.findMany({ where: { userId }, include: { listing: { include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } } } }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }) }
export async function browseListings(filter: any) {
  const where: Record<string, unknown> = { status: 'published' }
  if (filter.featured) where.featured = true
  if (filter.creatorId) where.creatorId = filter.creatorId
  if (filter.categoryId) where.categories = { some: { categoryId: filter.categoryId } }
  if (filter.free) where.price = 0
  if (filter.paid) where.price = { gt: 0 }
  if (filter.search) where.OR = [{ title: { contains: filter.search } }, { description: { contains: filter.search } }]
  if (filter.resourceType || filter.grade || filter.subject || filter.language) { const rf: Record<string, string> = {}; if (filter.resourceType) rf.resourceType = filter.resourceType; if (filter.grade) rf.grade = filter.grade; if (filter.subject) rf.subject = filter.subject; if (filter.language) rf.language = filter.language; where.resource = rf }
  const orderBy: Record<string, string> = { newest: 'publishedAt', popular: 'viewCount', featured: 'featured', rated: 'ratingAverage', alphabetical: 'title' }
  const sortField = orderBy[filter.sort] || 'publishedAt'
  const sortDir = filter.sort === 'alphabetical' ? 'asc' : 'desc'
  const [listings, total] = await Promise.all([db.mpListing.findMany({ where, include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } }, orderBy: [{ [sortField]: sortDir }], take: filter.limit, skip: filter.offset }), db.mpListing.count({ where })])
  return { listings, total }
}
export async function findListingsByCreator(creatorId: string) { return db.mpListing.findMany({ where: { creatorId }, orderBy: { updatedAt: 'desc' } }) }
export async function findRecentListingsByCreator(creatorId: string, limit = 5) { return db.mpListing.findMany({ where: { creatorId, status: 'published' }, include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } }, orderBy: { publishedAt: 'desc' }, take: limit }) }
export async function createCategory(data: any) { return db.mpCategory.create({ data }) }
export async function findCategories() { return db.mpCategory.findMany({ orderBy: { sortOrder: 'asc' } }) }
export async function findCategoryById(id: string) { return db.mpCategory.findUnique({ where: { id } }) }
export async function findCategoryBySlug(slug: string) { return db.mpCategory.findUnique({ where: { slug } }) }
export async function updateCategory(id: string, data: any) { return db.mpCategory.update({ where: { id }, data }) }
export async function deleteCategory(id: string) { return db.mpCategory.delete({ where: { id } }) }
export async function findFeatured(limit = 10) { return db.mpListing.findMany({ where: { status: 'published', featured: true }, include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } }, orderBy: { publishedAt: 'desc' }, take: limit }) }
export async function findNew(limit = 10) { return db.mpListing.findMany({ where: { status: 'published' }, include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } }, orderBy: { publishedAt: 'desc' }, take: limit }) }
export async function findPopular(limit = 10) { return db.mpListing.findMany({ where: { status: 'published' }, include: { resource: { select: { resourceType: true } }, creator: { select: { name: true } }, categories: { include: { category: true } } }, orderBy: [{ viewCount: 'desc' }, { favoriteCount: 'desc' }], take: limit }) }
