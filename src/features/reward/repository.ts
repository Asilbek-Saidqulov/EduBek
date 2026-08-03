/**
 * EduBek — Live Quiz Reward repository.
 */
import { db } from "@/lib/db";

export interface CreateRewardInput {
  userId: string;
  sessionId?: string;
  playerId?: string;
  rewardType: string;
  amount?: number;
  code?: string;
  reason?: string;
  metadata?: string;
}

export async function createReward(input: CreateRewardInput) {
  return db.gameReward.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId ?? null,
      playerId: input.playerId ?? null,
      rewardType: input.rewardType,
      amount: input.amount ?? null,
      code: input.code ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata ?? null,
    },
  });
}

export async function findRewardById(id: string) {
  return db.gameReward.findUnique({ where: { id } });
}

export async function findByUser(userId: string, limit = 100) {
  return db.gameReward.findMany({
    where: { userId },
    orderBy: { grantedAt: "desc" },
    take: limit,
  });
}

export async function findBySession(sessionId: string) {
  return db.gameReward.findMany({
    where: { sessionId },
    orderBy: { grantedAt: "desc" },
  });
}

export async function findByFilters(input: {
  userId?: string;
  sessionId?: string;
  playerId?: string;
  rewardType?: string;
  code?: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.userId) where.userId = input.userId;
  if (input.sessionId) where.sessionId = input.sessionId;
  if (input.playerId) where.playerId = input.playerId;
  if (input.rewardType) where.rewardType = input.rewardType;
  if (input.code) where.code = input.code;
  const [items, total] = await Promise.all([
    db.gameReward.findMany({
      where,
      orderBy: { grantedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.gameReward.count({ where }),
  ]);
  return { items, total };
}

export async function findByUserAndCode(userId: string, code: string) {
  return db.gameReward.findFirst({
    where: { userId, code },
  });
}

export async function findAggregateByUser(userId: string) {
  return db.gameReward.findMany({
    where: { userId },
    select: { rewardType: true, amount: true, code: true, grantedAt: true, reason: true },
  });
}
