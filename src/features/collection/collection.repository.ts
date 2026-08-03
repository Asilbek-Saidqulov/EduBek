import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
const log = logger.child({ module: 'collection-repository' })
export async function createCollection(data: { ownerId: string; orgId?: string; name: string; description?: string }) { log.info('createCollection', { ownerId: data.ownerId }); return db.collection.create({ data }) }
export async function findCollectionById(id: string) { return db.collection.findUnique({ where: { id }, include: { items: { include: { resource: { select: { id: true, title: true, resourceType: true } } }, orderBy: { sortOrder: 'asc' } } } }) }
export async function findCollectionsByOwner(ownerId: string) { return db.collection.findMany({ where: { ownerId }, orderBy: { updatedAt: 'desc' }, include: { _count: { select: { items: true } } } }) }
export async function findCollectionsByOrg(orgId: string) { return db.collection.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' }, include: { _count: { select: { items: true } } } }) }
export async function updateCollection(id: string, data: { name?: string; description?: string | null }) { return db.collection.update({ where: { id }, data }) }
export async function deleteCollection(id: string) { return db.collection.delete({ where: { id } }) }
export async function addItem(collectionId: string, resourceId: string, sortOrder: number = 0) { return db.collectionItem.create({ data: { collectionId, resourceId, sortOrder } }).catch(() => null) }
export async function removeItem(collectionId: string, resourceId: string) { return db.collectionItem.deleteMany({ where: { collectionId, resourceId } }) }
export async function reorderItems(collectionId: string, items: Array<{ resourceId: string; sortOrder: number }>) { await Promise.all(items.map((item) => db.collectionItem.updateMany({ where: { collectionId, resourceId: item.resourceId }, data: { sortOrder: item.sortOrder } }))) }
export async function getMaxSortOrder(collectionId: string) { const r = await db.collectionItem.aggregate({ where: { collectionId }, _max: { sortOrder: true } }); return r._max.sortOrder ?? 0 }
