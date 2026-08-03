import { db } from '@/lib/db'
export async function createSession(data: { ownerId: string; orgId?: string; title: string }) { return db.aiSession.create({ data }) }
export async function findSessionById(id: string) { return db.aiSession.findUnique({ where: { id } }) }
export async function findSessionWithMessages(id: string) { return db.aiSession.findUnique({ where: { id }, include: { conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } } } }) }
export async function findSessionsByOwner(ownerId: string) { return db.aiSession.findMany({ where: { ownerId, status: 'active' }, orderBy: { updatedAt: 'desc' } }) }
export async function updateSession(id: string, data: Record<string, unknown>) { return db.aiSession.update({ where: { id }, data }) }
export async function archiveSession(id: string) { return db.aiSession.update({ where: { id }, data: { status: 'archived' } }) }
export async function deleteSession(id: string) { return db.aiSession.update({ where: { id }, data: { status: 'deleted' } }) }
export async function createConversation(data: { userId: string; orgId?: string; title?: string }) { return db.aiConversation.create({ data }) }
export async function addMessage(data: { conversationId: string; role: string; content: string; model?: string; tokensIn?: number; tokensOut?: number; costUsd?: number; latencyMs?: number }) { return db.aiMessage.create({ data }) }
