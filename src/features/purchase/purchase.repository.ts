import { db } from '@/lib/db'
export async function createPurchase(data: any) { return db.mpPurchase.create({ data }) }
export async function findPurchaseById(id: string) { return db.mpPurchase.findUnique({ where: { id }, include: { listing: { select: { title: true } }, resource: { select: { title: true, resourceType: true } } } }) }
export async function findPurchaseByBuyerAndListing(buyerId: string, listingId: string) { return db.mpPurchase.findUnique({ where: { buyerId_listingId: { buyerId, listingId } } }) }
export async function findPurchasesByBuyer(buyerId: string, limit = 20, offset = 0) { const [p, t] = await Promise.all([db.mpPurchase.findMany({ where: { buyerId }, include: { listing: { select: { title: true } }, resource: { select: { title: true, resourceType: true } } }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), db.mpPurchase.count({ where: { buyerId } })]); return { purchases: p, total: t } }
export async function updatePurchaseStatus(id: string, status: string, refundedAt?: Date) { return db.mpPurchase.update({ where: { id }, data: { status, refundedAt } }) }
export async function incrementListingDownloadCount(listingId: string) { await db.mpListing.update({ where: { id: listingId }, data: { downloadCount: { increment: 1 } } }) }
