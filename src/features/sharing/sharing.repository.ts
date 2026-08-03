import { db } from '@/lib/db'
export async function createShare(data: { resourceId: string; token: string; createdById: string; expiresAt?: Date }) { return db.sharedResource.create({ data: { resourceId: data.resourceId, token: data.token, createdById: data.createdById, expiresAt: data.expiresAt ?? null } }) }
export async function findShareByToken(token: string) { return db.sharedResource.findUnique({ where: { token }, include: { resource: true } }) }
export async function findSharesByResource(resourceId: string) { return db.sharedResource.findMany({ where: { resourceId }, orderBy: { createdAt: 'desc' } }) }
export async function revokeShare(id: string) { return db.sharedResource.update({ where: { id }, data: { revokedAt: new Date() } }) }
export async function incrementViewCount(token: string) { await db.sharedResource.update({ where: { token }, data: { viewCount: { increment: 1 } } }) }
export async function findShareById(id: string) { return db.sharedResource.findUnique({ where: { id } }) }
