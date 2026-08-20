/** Resource feature — data access layer (repository). Uses actual Prisma schema. */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'resource-repository' })

export async function createResource(data: {
  ownerId: string; orgId?: string; resourceType: string; title: string; description?: string
  content: string; subject?: string; grade?: string; language: string; visibility: string; status: string; tags: string[]
}) {
  log.info('createResource', { ownerId: data.ownerId, type: data.resourceType })
  const snapshot = JSON.stringify({ title: data.title, description: data.description, content: data.content, subject: data.subject, grade: data.grade, language: data.language })
  return db.resource.create({
    data: {
      ownerType: data.orgId ? 'org' : 'user', ownerId: data.ownerId, orgId: data.orgId,
      resourceType: data.resourceType, title: data.title, description: data.description,
      content: data.content, subject: data.subject, grade: data.grade, language: data.language,
      visibility: data.visibility, status: data.status,
      tags: { create: data.tags.map((tag) => ({ tag })) },
      versions: { create: { version: 1, snapshot, createdById: data.ownerId } },
      stats: { create: {} },
    },
    include: { tags: true },
  })
}

export async function findResourceById(id: string) {
  return db.resource.findUnique({ where: { id }, include: { tags: true } })
}

export async function findResourceWithVersions(id: string) {
  return db.resource.findUnique({ where: { id }, include: { tags: true, versions: { orderBy: { version: 'desc' } } } })
}

export async function updateResourceData(id: string, data: Record<string, unknown>, snapshot: string, newVersion: number, createdById: string, changelog: string | null) {
  return db.resource.update({
    where: { id },
    data: { ...data, versions: { create: { version: newVersion, snapshot, createdById, changelog } } },
    include: { tags: true },
  })
}

export async function archiveResource(id: string) {
  return db.resource.update({ where: { id }, data: { status: 'archived' }, include: { tags: true } })
}

export async function restoreResource(id: string) {
  return db.resource.update({ where: { id }, data: { status: 'ready' }, include: { tags: true } })
}

export async function deleteResource(id: string) {
  return db.resource.delete({ where: { id } })
}

export async function setTags(resourceId: string, tags: string[]) {
  await db.resourceTag.deleteMany({ where: { resourceId } })
  const unique = [...new Set(tags)]
  if (unique.length > 0) await db.resourceTag.createMany({ data: unique.map((tag) => ({ resourceId, tag })) })
}

export async function findFavorite(resourceId: string, userId: string) {
  return db.resourceFavorite.findUnique({ where: { resourceId_userId: { resourceId, userId } } })
}

export async function createFavorite(resourceId: string, userId: string) {
  return db.resourceFavorite.create({ data: { resourceId, userId } }).catch(() => null)
}

export async function deleteFavorite(resourceId: string, userId: string) {
  return db.resourceFavorite.deleteMany({ where: { resourceId, userId } })
}

export interface ListResourcesFilter {
  resourceType?: string; subject?: string; grade?: string; ownerId?: string; orgId?: string
  tag?: string; visibility?: string; status?: string; search?: string; limit: number; offset: number
}

export async function listResources(filter: ListResourcesFilter) {
  const where: Record<string, unknown> = {}
  if (filter.resourceType) where.resourceType = filter.resourceType
  if (filter.subject) where.subject = filter.subject
  if (filter.grade) where.grade = filter.grade
  if (filter.ownerId) where.ownerId = filter.ownerId
  if (filter.orgId) where.orgId = filter.orgId
  if (filter.visibility) where.visibility = filter.visibility
  if (filter.status) where.status = filter.status
  if (filter.tag) where.tags = { some: { tag: filter.tag } }
  if (filter.search) where.OR = [{ title: { contains: filter.search } }, { description: { contains: filter.search } }]
  const [resources, total] = await Promise.all([
    db.resource.findMany({ where, include: { tags: true }, orderBy: { updatedAt: 'desc' }, take: filter.limit, skip: filter.offset }),
    db.resource.count({ where }),
  ])
  return { resources, total }
}

export async function listVersions(resourceId: string) {
  return db.resourceVersion.findMany({ where: { resourceId }, orderBy: { version: 'desc' } })
}

export async function findVersion(resourceId: string, version: number) {
  return db.resourceVersion.findUnique({ where: { resourceId_version: { resourceId, version } } })
}

export async function bulkUpdateStatus(resourceIds: string[], status: string) {
  return db.resource.updateMany({ where: { id: { in: resourceIds } }, data: { status } })
}

export async function bulkDelete(resourceIds: string[]) {
  return db.resource.deleteMany({ where: { id: { in: resourceIds } } })
}

export async function countDuplicates(resourceId: string) {
  return db.resource.count({ where: { duplicatedFromId: resourceId } })
}

export async function setDuplicatedFrom(newId: string, originalId: string) {
  return db.resource.update({ where: { id: newId }, data: { duplicatedFromId: originalId } })
}

export async function findStats(resourceId: string) {
  let stats = await db.resourceStat.findUnique({ where: { resourceId } })
  if (!stats) stats = await db.resourceStat.create({ data: { resourceId } })
  return stats
}

export async function incrementViewCount(resourceId: string) {
  await db.resourceStat.update({ where: { resourceId }, data: { viewCount: { increment: 1 }, lastOpenedAt: new Date() } }).catch(() => {})
}

export async function incrementDuplicateCount(resourceId: string) {
  await db.resourceStat.update({ where: { resourceId }, data: { duplicateCount: { increment: 1 } } }).catch(() => {})
}

export async function updateFavoriteCount(resourceId: string, delta: number) {
  await db.resourceStat.update({ where: { resourceId }, data: { favoriteCount: { increment: delta } } }).catch(() => {})
}

export async function touchLastEdited(resourceId: string) {
  await db.resourceStat.update({ where: { resourceId }, data: { lastEditedAt: new Date() } }).catch(() => {})
}
