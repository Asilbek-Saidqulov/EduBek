import { logger } from '@/lib/logger'
import { notFound, forbidden, unauthorized } from '@/lib/errors'
import { isOrgMember, type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { COLLECTION_CREATED, COLLECTION_UPDATED, COLLECTION_DELETED, buildEvent } from '@/infra/event-bus/events'
import type { CollectionDto, CollectionWithItemsDto } from './collection.types'
import type { CreateCollectionBody, UpdateCollectionBody, AddItemsBody, ReorderItemsBody } from './collection.schema'
import * as repo from './collection.repository'
const log = logger.child({ module: 'collection-service' })

function mapDto(c: any): CollectionDto { return { id: c.id, ownerId: c.ownerId, orgId: c.orgId, name: c.name, description: c.description, itemCount: c._count?.items ?? 0, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() } }

export async function createCollection(ctx: AuthContext, input: CreateCollectionBody): Promise<CollectionDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (input.orgId && !isOrgMember(ctx, input.orgId)) throw forbidden('Not an org member')
  const col = await repo.createCollection({ ownerId: ctx.userId, orgId: input.orgId, name: input.name, description: input.description })
  eventBus.publish(buildEvent({ type: COLLECTION_CREATED, actorId: ctx.userId, collectionId: col.id, name: col.name, orgId: col.orgId, occurredAt: new Date().toISOString() } as any))
  return mapDto({ ...col, _count: { items: 0 } })
}

export async function getCollections(ctx: AuthContext): Promise<CollectionDto[]> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const personal = await repo.findCollectionsByOwner(ctx.userId)
  const dtos = personal.map(mapDto)
  for (const [orgId] of ctx.orgPermissions) { const orgCols = await repo.findCollectionsByOrg(orgId); dtos.push(...orgCols.map(mapDto)) }
  return dtos.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getCollection(ctx: AuthContext, id: string): Promise<CollectionWithItemsDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const col = await repo.findCollectionById(id)
  if (!col) throw notFound('Collection not found')
  if (col.ownerId !== ctx.userId && col.orgId && !isOrgMember(ctx, col.orgId)) throw forbidden('Cannot view this collection')
  return { ...mapDto({ ...col, _count: { items: col.items.length } }), items: col.items.map((i: any) => ({ id: i.id, resourceId: i.resourceId, resourceTitle: i.resource.title, resourceType: i.resource.resourceType, sortOrder: i.sortOrder, addedAt: i.addedAt.toISOString() })) }
}

export async function updateCollection(ctx: AuthContext, id: string, input: UpdateCollectionBody): Promise<CollectionDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findCollectionById(id)
  if (!existing) throw notFound('Collection not found')
  if (existing.ownerId !== ctx.userId) throw forbidden('Can only modify own collections')
  const changes: string[] = []
  if (input.name !== undefined) changes.push('name')
  if (input.description !== undefined) changes.push('description')
  const updated = await repo.updateCollection(id, { name: input.name, description: input.description ?? undefined })
  eventBus.publish(buildEvent({ type: COLLECTION_UPDATED, actorId: ctx.userId, collectionId: id, changes, occurredAt: new Date().toISOString() } as any))
  return mapDto({ ...updated, _count: { items: existing.items.length } })
}

export async function deleteCollection(ctx: AuthContext, id: string): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findCollectionById(id)
  if (!existing) throw notFound('Collection not found')
  if (existing.ownerId !== ctx.userId) throw forbidden('Can only delete own collections')
  await repo.deleteCollection(id)
  eventBus.publish(buildEvent({ type: COLLECTION_DELETED, actorId: ctx.userId, collectionId: id, occurredAt: new Date().toISOString() } as any))
}

export async function addItems(ctx: AuthContext, collectionId: string, input: AddItemsBody): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const col = await repo.findCollectionById(collectionId)
  if (!col) throw notFound('Collection not found')
  if (col.ownerId !== ctx.userId) throw forbidden('Can only modify own collections')
  const maxSort = await repo.getMaxSortOrder(collectionId)
  for (let i = 0; i < input.resourceIds.length; i++) await repo.addItem(collectionId, input.resourceIds[i], maxSort + i + 1)
}

export async function removeItem(ctx: AuthContext, collectionId: string, resourceId: string): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const col = await repo.findCollectionById(collectionId)
  if (!col) throw notFound('Collection not found')
  if (col.ownerId !== ctx.userId) throw forbidden('Can only modify own collections')
  await repo.removeItem(collectionId, resourceId)
}

export async function reorderItems(ctx: AuthContext, collectionId: string, input: ReorderItemsBody): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const col = await repo.findCollectionById(collectionId)
  if (!col) throw notFound('Collection not found')
  if (col.ownerId !== ctx.userId) throw forbidden('Can only modify own collections')
  await repo.reorderItems(collectionId, input.items)
}
