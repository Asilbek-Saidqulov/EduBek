import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { RESOURCE_SHARED, buildEvent } from '@/infra/event-bus/events'
import type { SharedResourceDto, SharedResourceViewDto } from './sharing.types'
import type { CreateShareBody } from './sharing.schema'
import * as repo from './sharing.repository'
const log = logger.child({ module: 'sharing-service' })

function mapDto(s: any): SharedResourceDto { return { id: s.id, resourceId: s.resourceId, token: s.token, readOnly: true, expiresAt: s.expiresAt?.toISOString() ?? null, revokedAt: s.revokedAt?.toISOString() ?? null, viewCount: s.viewCount, createdAt: s.createdAt.toISOString() } }

export async function createShareLink(ctx: AuthContext, resourceId: string, input: CreateShareBody): Promise<SharedResourceDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { findResourceById } = await import('@/features/resource/resource.repository')
  const resource = await findResourceById(resourceId)
  if (!resource) throw notFound('Resource not found')
  if (resource.ownerId !== ctx.userId) throw forbidden('Only the owner can share')
  const token = randomBytes(32).toString('hex')
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined
  if (expiresAt && expiresAt < new Date()) throw badRequest('Expiration must be in the future')
  const share = await repo.createShare({ resourceId, token, createdById: ctx.userId, expiresAt })
  eventBus.publish(buildEvent({ type: RESOURCE_SHARED, actorId: ctx.userId, resourceId, shareToken: token, expiresAt: expiresAt?.toISOString() ?? null, occurredAt: new Date().toISOString() } as any))
  return mapDto(share)
}

export async function getSharedResource(token: string): Promise<SharedResourceViewDto> {
  const share = await repo.findShareByToken(token) as any
  if (!share) throw notFound('Shared resource not found')
  if (share.revokedAt) throw badRequest('Share link revoked')
  if (share.expiresAt && share.expiresAt < new Date()) throw badRequest('Share link expired')
  repo.incrementViewCount(token).catch(() => {})
  const r = share.resource
  return { resourceType: r.resourceType, title: r.title, description: r.description, contentJson: r.content, subject: r.subject, grade: r.grade, language: r.language, ownerName: null }
}

export async function listShares(ctx: AuthContext, resourceId: string): Promise<SharedResourceDto[]> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { findResourceById } = await import('@/features/resource/resource.repository')
  const resource = await findResourceById(resourceId)
  if (!resource) throw notFound('Resource not found')
  if (resource.ownerId !== ctx.userId) throw forbidden('Only the owner can view shares')
  const shares = await repo.findSharesByResource(resourceId)
  return shares.map(mapDto)
}

export async function revokeShare(ctx: AuthContext, shareId: string): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const share = await repo.findShareById(shareId)
  if (!share) throw notFound('Share not found')
  if (share.createdById !== ctx.userId) throw forbidden('Only the creator can revoke')
  await repo.revokeShare(shareId)
}
