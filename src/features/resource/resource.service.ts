/** Resource feature — business logic layer (service). Uses actual Prisma schema. */

import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized } from '@/lib/errors'
import { can, canInOrg, isOrgMember, PersonalPermission, OrgPermission, type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import {
  RESOURCE_CREATED, RESOURCE_UPDATED, RESOURCE_ARCHIVED, RESOURCE_RESTORED, RESOURCE_DUPLICATED,
  VERSION_RESTORED, BULK_OPERATION_COMPLETED, RESOURCE_EXPORTED, RESOURCE_IMPORTED,
  buildEvent,
} from '@/infra/event-bus/events'
import { db } from '@/lib/db'
import type { ResourceDto, ResourceListItemDto, ResourceListResult, ResourceVersionDetailDto, ResourceExportDto, ResourceStatsDto, BulkOperationResultDto } from './resource.types'
import type { CreateResourceBody, UpdateResourceBody, DuplicateResourceBody, ListResourcesQuery } from './resource.schema'
import * as repo from './resource.repository'

const log = logger.child({ module: 'resource-service' })

function mapDto(r: any, isFavorited: boolean): ResourceDto {
  return { id: r.id, ownerId: r.ownerId, orgId: r.orgId, resourceType: r.resourceType, title: r.title, description: r.description, content: r.content, subject: r.subject, grade: r.grade, language: r.language, visibility: r.visibility, status: r.status, duplicatedFromId: r.duplicatedFromId, tags: r.tags?.map((t: any) => t.tag) ?? [], isFavorited, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }
}

function mapListItem(r: any): ResourceListItemDto {
  return { id: r.id, ownerId: r.ownerId, orgId: r.orgId, resourceType: r.resourceType, title: r.title, description: r.description, subject: r.subject, grade: r.grade, language: r.language, visibility: r.visibility, status: r.status, tags: r.tags?.map((t: any) => t.tag) ?? [], createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }
}

function mapVersion(v: any): ResourceVersionDetailDto {
  return { id: v.id, version: v.version, snapshot: v.snapshot, changelog: v.changelog, createdById: v.createdById, createdAt: v.createdAt.toISOString() }
}

// Authorization
async function canRead(ctx: AuthContext, r: { ownerId: string; orgId: string | null; visibility: string }): Promise<boolean> {
  if (ctx.isSuperadmin) return true
  if (r.ownerId === ctx.userId) return true
  if (r.visibility === 'public' || r.visibility === 'marketplace') return true
  if (r.orgId && isOrgMember(ctx, r.orgId)) return true
  return false
}

function canUpdate(ctx: AuthContext, r: { ownerId: string; orgId: string | null }): boolean {
  if (ctx.isSuperadmin) return true
  if (r.ownerId === ctx.userId) return can(ctx, PersonalPermission.RESOURCE_UPDATE_OWN)
  if (r.orgId) return canInOrg(ctx, r.orgId, OrgPermission.RESOURCE_UPDATE_ANY)
  return false
}

function canDelete(ctx: AuthContext, r: { ownerId: string; orgId: string | null }): boolean {
  if (ctx.isSuperadmin) return true
  if (r.ownerId === ctx.userId) return can(ctx, PersonalPermission.RESOURCE_DELETE_OWN)
  if (r.orgId) return canInOrg(ctx, r.orgId, OrgPermission.RESOURCE_DELETE_ANY)
  return false
}

function canArchive(ctx: AuthContext, r: { ownerId: string; orgId: string | null }): boolean {
  if (ctx.isSuperadmin) return true
  if (r.ownerId === ctx.userId) return can(ctx, PersonalPermission.RESOURCE_ARCHIVE_OWN)
  if (r.orgId) return canInOrg(ctx, r.orgId, OrgPermission.RESOURCE_ARCHIVE_ANY)
  return false
}

// Track version count locally (schema doesn't have a version field on Resource)
async function getVersionCount(resourceId: string): Promise<number> {
  const versions = await db.resourceVersion.count({ where: { resourceId } })
  return versions
}

// CRUD
export async function createResource(ctx: AuthContext, input: CreateResourceBody): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId)) throw forbidden('Not an org member')
    if (!canInOrg(ctx, input.orgId, OrgPermission.RESOURCE_CREATE)) throw forbidden('No permission to create org resources')
  } else {
    if (!can(ctx, PersonalPermission.RESOURCE_CREATE)) throw forbidden('No permission to create resources')
  }
  const raw = await repo.createResource({ ownerId: ctx.userId, orgId: input.orgId, resourceType: input.resourceType, title: input.title, description: input.description, content: input.content, subject: input.subject, grade: input.grade, language: input.language, visibility: input.visibility, status: 'draft', tags: input.tags })
  eventBus.publish(buildEvent({ type: RESOURCE_CREATED, actorId: ctx.userId, resourceId: raw.id, resourceType: raw.resourceType, title: raw.title, orgId: raw.orgId, ownerId: raw.ownerId, occurredAt: new Date().toISOString() } as any))
  return mapDto(raw, false)
}

export async function getResource(ctx: AuthContext, id: string): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const raw = await repo.findResourceById(id)
  if (!raw) throw notFound('Resource not found')
  if (!(await canRead(ctx, raw))) throw forbidden('Cannot view this resource')
  repo.incrementViewCount(id).catch(() => {})
  const fav = ctx.userId ? await repo.findFavorite(id, ctx.userId) : null
  return mapDto(raw, !!fav)
}

export async function updateResource(ctx: AuthContext, id: string, input: UpdateResourceBody): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findResourceById(id)
  if (!existing) throw notFound('Resource not found')
  if (!canUpdate(ctx, existing)) throw forbidden('Cannot update this resource')
  const updateData: Record<string, unknown> = {}
  const changes: string[] = []
  for (const [k, v] of Object.entries(input)) { if (v !== undefined && k !== 'tags' && k !== 'changelog') { updateData[k] = v; changes.push(k) } }
  const newVersion = await getVersionCount(id) + 1
  const snapshot = JSON.stringify({ title: input.title ?? existing.title, description: input.description ?? existing.description, content: input.content ?? existing.content, subject: input.subject ?? existing.subject, grade: input.grade ?? existing.grade, language: input.language ?? existing.language })
  const updated = await repo.updateResourceData(id, updateData, snapshot, newVersion, ctx.userId, input.changelog ?? null)
  if (input.tags !== undefined) { await repo.setTags(id, input.tags) }
  if (input.content !== undefined) repo.touchLastEdited(id).catch(() => {})
  eventBus.publish(buildEvent({ type: RESOURCE_UPDATED, actorId: ctx.userId, resourceId: id, version: newVersion, changes, occurredAt: new Date().toISOString() } as any))
  const refreshed = input.tags !== undefined ? await repo.findResourceById(id) : updated
  const fav = await repo.findFavorite(id, ctx.userId)
  return mapDto(refreshed ?? updated, !!fav)
}

export async function archiveResource(ctx: AuthContext, id: string): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findResourceById(id)
  if (!existing) throw notFound('Resource not found')
  if (!canArchive(ctx, existing)) throw forbidden('Cannot archive this resource')
  const archived = await repo.archiveResource(id)
  eventBus.publish(buildEvent({ type: RESOURCE_ARCHIVED, actorId: ctx.userId, resourceId: id, title: existing.title, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId)
  return mapDto(archived, !!fav)
}

export async function restoreResource(ctx: AuthContext, id: string): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findResourceById(id)
  if (!existing) throw notFound('Resource not found')
  if (!canArchive(ctx, existing)) throw forbidden('Cannot restore this resource')
  const restored = await repo.restoreResource(id)
  eventBus.publish(buildEvent({ type: RESOURCE_RESTORED, actorId: ctx.userId, resourceId: id, title: existing.title, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId)
  return mapDto(restored, !!fav)
}

export async function deleteResource(ctx: AuthContext, id: string): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findResourceById(id)
  if (!existing) throw notFound('Resource not found')
  if (!canDelete(ctx, existing)) throw forbidden('Cannot delete this resource')
  await repo.deleteResource(id)
}

export async function duplicateResource(ctx: AuthContext, id: string, input: DuplicateResourceBody): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const original = await repo.findResourceById(id)
  if (!original) throw notFound('Resource not found')
  if (!(await canRead(ctx, original))) throw forbidden('Cannot duplicate this resource')
  if (original.orgId) { if (!canInOrg(ctx, original.orgId, OrgPermission.RESOURCE_DUPLICATE)) throw forbidden('No duplicate permission') }
  else { if (!can(ctx, PersonalPermission.RESOURCE_DUPLICATE)) throw forbidden('No duplicate permission') }
  if (input.orgId) { if (!isOrgMember(ctx, input.orgId)) throw forbidden('Not an org member'); if (!canInOrg(ctx, input.orgId, OrgPermission.RESOURCE_CREATE)) throw forbidden('No create permission in org') }
  const title = input.title ?? `Copy of ${original.title}`
  const duplicated = await repo.createResource({ ownerId: ctx.userId, orgId: input.orgId, resourceType: original.resourceType, title, description: original.description ?? undefined, content: original.content, subject: original.subject ?? undefined, grade: original.grade ?? undefined, language: original.language, visibility: 'private', status: 'draft', tags: original.tags.map((t) => t.tag) })
  await repo.setDuplicatedFrom(duplicated.id, id)
  repo.incrementDuplicateCount(id).catch(() => {})
  eventBus.publish(buildEvent({ type: RESOURCE_DUPLICATED, actorId: ctx.userId, resourceId: duplicated.id, originalResourceId: id, title, resourceType: original.resourceType, occurredAt: new Date().toISOString() } as any))
  return mapDto(duplicated, false)
}

export async function listResources(ctx: AuthContext, query: ListResourcesQuery): Promise<ResourceListResult> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (query.orgId && !isOrgMember(ctx, query.orgId) && !ctx.isSuperadmin) throw forbidden('Not an org member')
  const { resources, total } = await repo.listResources({ resourceType: query.resourceType, subject: query.subject, grade: query.grade, ownerId: query.ownerId, orgId: query.orgId, tag: query.tag, visibility: query.visibility, status: query.status, search: query.search, limit: query.limit, offset: query.offset })
  let visible = resources
  if (!query.ownerId && !query.orgId) {
    const checks = await Promise.all(resources.map(async (r) => ({ r, v: await canRead(ctx, r) })))
    visible = checks.filter((c) => c.v).map((c) => c.r)
  }
  return { resources: visible.map(mapListItem), total: query.ownerId || query.orgId ? total : visible.length }
}

export async function toggleFavorite(ctx: AuthContext, id: string): Promise<{ favorited: boolean }> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const resource = await repo.findResourceById(id)
  if (!resource) throw notFound('Resource not found')
  if (!(await canRead(ctx, resource))) throw forbidden('Cannot favorite this resource')
  const existing = await repo.findFavorite(id, ctx.userId)
  if (existing) { await repo.deleteFavorite(id, ctx.userId); repo.updateFavoriteCount(id, -1).catch(() => {}); return { favorited: false } }
  else { await repo.createFavorite(id, ctx.userId); repo.updateFavoriteCount(id, 1).catch(() => {}); return { favorited: true } }
}

export async function listVersions(ctx: AuthContext, id: string): Promise<{ versions: ResourceVersionDetailDto[] }> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const resource = await repo.findResourceById(id)
  if (!resource) throw notFound('Resource not found')
  if (!(await canRead(ctx, resource))) throw forbidden('Cannot view this resource')
  const versions = await repo.listVersions(id)
  return { versions: versions.map(mapVersion) }
}

export async function restoreVersion(ctx: AuthContext, id: string, version: number): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const existing = await repo.findResourceById(id)
  if (!existing) throw notFound('Resource not found')
  if (!canUpdate(ctx, existing)) throw forbidden('Cannot update this resource')
  const oldVersion = await repo.findVersion(id, version)
  if (!oldVersion) throw notFound('Version not found')
  const snapshotData = JSON.parse(oldVersion.snapshot)
  const newVersion = await getVersionCount(id) + 1
  const newSnapshot = JSON.stringify(snapshotData)
  await repo.updateResourceData(id, { title: snapshotData.title, description: snapshotData.description, content: snapshotData.content, subject: snapshotData.subject, grade: snapshotData.grade, language: snapshotData.language }, newSnapshot, newVersion, ctx.userId, `Restored from v${version}`)
  const refreshed = await repo.findResourceById(id)
  eventBus.publish(buildEvent({ type: VERSION_RESTORED, actorId: ctx.userId, resourceId: id, restoredVersion: version, newVersion, occurredAt: new Date().toISOString() } as any))
  const fav = await repo.findFavorite(id, ctx.userId)
  return mapDto(refreshed!, !!fav)
}

// Bulk operations
async function bulkOp(ctx: AuthContext, resourceIds: string[], op: (id: string) => Promise<void>, operationName: string): Promise<BulkOperationResultDto> {
  const succeeded: string[] = []
  const failed: Array<{ id: string; error: string }> = []
  for (const id of resourceIds) { try { await op(id); succeeded.push(id) } catch (e) { failed.push({ id, error: (e as Error).message }) } }
  eventBus.publish(buildEvent({ type: BULK_OPERATION_COMPLETED, actorId: ctx.userId, operation: operationName, resourceIds, succeeded, failed, occurredAt: new Date().toISOString() } as any))
  return { operation: operationName, succeeded, failed }
}

export async function bulkArchive(ctx: AuthContext, resourceIds: string[]) { return bulkOp(ctx, resourceIds, async (id) => { await archiveResource(ctx, id) }, 'archive') }
export async function bulkRestore(ctx: AuthContext, resourceIds: string[]) { return bulkOp(ctx, resourceIds, async (id) => { await restoreResource(ctx, id) }, 'restore') }
export async function bulkDelete(ctx: AuthContext, resourceIds: string[]) { return bulkOp(ctx, resourceIds, async (id) => { await deleteResource(ctx, id) }, 'delete') }
export async function bulkDuplicate(ctx: AuthContext, resourceIds: string[]) { return bulkOp(ctx, resourceIds, async (id) => { await duplicateResource(ctx, id, {}) }, 'duplicate') }
export async function bulkFavorite(ctx: AuthContext, resourceIds: string[]) { return bulkOp(ctx, resourceIds, async (id) => { await toggleFavorite(ctx, id) }, 'favorite') }

// Import/Export
export async function exportResource(ctx: AuthContext, id: string): Promise<ResourceExportDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const resource = await repo.findResourceWithVersions(id)
  if (!resource) throw notFound('Resource not found')
  if (!(await canRead(ctx, resource))) throw forbidden('Cannot export this resource')
  eventBus.publish(buildEvent({ type: RESOURCE_EXPORTED, actorId: ctx.userId, resourceId: id, format: 'json', occurredAt: new Date().toISOString() } as any))
  return { format: 'edubek.resource.v1', resourceType: resource.resourceType, title: resource.title, description: resource.description, content: resource.content, subject: resource.subject, grade: resource.grade, language: resource.language, tags: resource.tags.map((t) => t.tag), versions: resource.versions.map(mapVersion) }
}

export async function importResource(ctx: AuthContext, data: { resourceType: string; title: string; description?: string; content: string; subject?: string; grade?: string; language: string; tags: string[] }): Promise<ResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const result = await createResource(ctx, { resourceType: data.resourceType as any, title: data.title, description: data.description, content: data.content, subject: data.subject, grade: data.grade, language: data.language, visibility: 'private', tags: data.tags })
  eventBus.publish(buildEvent({ type: RESOURCE_IMPORTED, actorId: ctx.userId, resourceId: result.id, resourceType: result.resourceType, title: result.title, source: 'json', occurredAt: new Date().toISOString() } as any))
  return result
}

export async function importResources(ctx: AuthContext, data: Array<{ resourceType: string; title: string; description?: string; content: string; subject?: string; grade?: string; language: string; tags: string[] }>): Promise<ResourceDto[]> {
  const results: ResourceDto[] = []
  for (const item of data) { results.push(await importResource(ctx, item)) }
  return results
}

// Stats
export async function getStats(ctx: AuthContext, id: string): Promise<ResourceStatsDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const resource = await repo.findResourceById(id)
  if (!resource) throw notFound('Resource not found')
  if (!(await canRead(ctx, resource))) throw forbidden('Cannot view stats')
  const stats = await repo.findStats(id)
  return { viewCount: stats.viewCount, duplicateCount: stats.duplicateCount, favoriteCount: stats.favoriteCount, lastOpenedAt: stats.lastOpenedAt?.toISOString() ?? null, lastEditedAt: stats.lastEditedAt?.toISOString() ?? null }
}

export async function assignCategory(ctx: AuthContext, resourceId: string, categoryId: string | null): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const resource = await repo.findResourceById(resourceId)
  if (!resource) throw notFound('Resource not found')
  if (!canUpdate(ctx, resource)) throw forbidden('Cannot update this resource')
  await repo.assignCategory(resourceId, categoryId)
}
