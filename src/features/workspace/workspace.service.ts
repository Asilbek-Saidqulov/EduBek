import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import type { WorkspaceDashboardDto } from './workspace.types'
const log = logger.child({ module: 'workspace-service' })

export async function getDashboard(ctx: AuthContext): Promise<WorkspaceDashboardDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const orgIds = Array.from(ctx.orgPermissions.keys())
  const [recentResources, draftCount, readyCount, archivedCount, favorites, recentlyEdited, orgResources, personalResources, collections] = await Promise.all([
    db.resource.findMany({ where: { ownerId: ctx.userId, status: { not: 'archived' } }, select: { id: true, title: true, resourceType: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.resource.count({ where: { ownerId: ctx.userId, status: 'draft' } }),
    db.resource.count({ where: { ownerId: ctx.userId, status: 'ready' } }),
    db.resource.count({ where: { ownerId: ctx.userId, status: 'archived' } }),
    db.resourceFavorite.findMany({ where: { userId: ctx.userId }, include: { resource: { select: { id: true, title: true, resourceType: true, updatedAt: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    db.resource.findMany({ where: { ownerId: ctx.userId }, select: { id: true, title: true, resourceType: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.resource.findMany({ where: { orgId: { in: orgIds }, status: { not: 'archived' } }, select: { id: true, title: true, resourceType: true, orgId: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.resource.findMany({ where: { ownerId: ctx.userId, orgId: null, status: { not: 'archived' } }, select: { id: true, title: true, resourceType: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.collection.findMany({ where: { ownerId: ctx.userId }, select: { id: true, name: true, _count: { select: { items: true } }, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 10 }),
  ])
  return {
    recentResources: recentResources.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })),
    draftCount, readyCount, archivedCount,
    favorites: favorites.map((f) => ({ id: f.resource.id, title: f.resource.title, resourceType: f.resource.resourceType, updatedAt: f.resource.updatedAt.toISOString() })),
    recentlyEdited: recentlyEdited.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })),
    orgResources: orgResources.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })),
    personalResources: personalResources.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })),
    collections: collections.map((c) => ({ id: c.id, name: c.name, itemCount: c._count.items, updatedAt: c.updatedAt.toISOString() })),
  }
}
