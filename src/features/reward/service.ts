/**
 * EduBek — Live Quiz Reward service.
 *
 * Internal API: `grantReward(input)` is called by Game Mode strategies
 * (via the Quiz Session service's `finishSessionInternal`) at Quiz
 * Session end.
 *
 * Read API: `getMyRewards`, `getSessionRewards`, `getMySummary`.
 *
 * Events published:
 *   • REWARD_GRANTED — for every reward created.
 *
 * Side effects on the User:
 *   • XP rewards update the user's Profile.xp + recompute level.
 *   • Coin rewards create a wallet transaction (best-effort — if the
 *     wallet service is unavailable, the reward row is still persisted).
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  REWARD_GRANTED,
  type RewardGrantedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type {
  GameRewardDto,
  GrantRewardInput,
  RewardType,
  UserRewardSummaryDto,
} from "./types";
import type { ListRewardsQuery } from "./schema";

const log = getLogger("reward-service");

function safeParseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function mapReward(r: any): GameRewardDto {
  const metadata = safeParseMetadata(r.metadata);
  return {
    id: r.id,
    sessionId: r.sessionId,
    playerId: r.playerId,
    userId: r.userId,
    rewardType: r.rewardType as RewardType,
    amount: r.amount,
    code: r.code,
    metadata,
    reason: r.reason,
    // Phase 4E.3: extract reasonKey + reasonParams from metadata JSON
    reasonKey: (metadata as any)?.reasonKey ?? null,
    reasonParams: (metadata as any)?.reasonParams ?? null,
    grantedAt: r.grantedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// grantReward (internal API)
// ---------------------------------------------------------------------------

export async function grantReward(input: GrantRewardInput): Promise<GameRewardDto> {
  if (!input.userId) throw badRequest("userId required");
  // Phase 4E.3: store reasonKey + reasonParams inside the metadata JSON
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.reasonKey ? { reasonKey: input.reasonKey } : {}),
    ...(input.reasonParams ? { reasonParams: input.reasonParams } : {}),
  };
  const reward = await repo.createReward({
    userId: input.userId,
    sessionId: input.sessionId,
    playerId: input.playerId,
    rewardType: input.rewardType,
    amount: input.amount,
    code: input.code,
    reason: input.reason,
    metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined,
  });

  // Side-effect: update Profile XP + level for XP rewards
  if (input.rewardType === "xp" && input.amount) {
    try {
      const profile = await db.profile.findUnique({ where: { userId: input.userId } });
      if (profile) {
        const newXp = profile.xp + input.amount;
        // Level = floor(sqrt(xp / 100)) — quadratic progression
        const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)));
        await db.profile.update({
          where: { userId: input.userId },
          data: { xp: newXp, level: newLevel },
        });
      }
    } catch (err) {
      log.warn("reward.xp_apply_failed", {
        userId: input.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Side-effect: credit coins to the wallet
  if (input.rewardType === "coins" && input.amount) {
    try {
      const { credit } = await import("@/features/wallet/wallet.service");
      await credit(
        input.userId,
        input.amount,
        input.reason ?? "Live quiz reward",
        "game_reward",
        reward.id,
      );
    } catch (err) {
      // Wallet may not exist yet for the user — that's fine, the reward row
      // is still persisted and the user can claim later.
      log.warn("reward.coin_apply_failed", {
        userId: input.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  eventBus.publish(
    buildEvent<RewardGrantedEvent>({
      type: REWARD_GRANTED,
      actorId: input.userId,
      rewardId: reward.id,
      userId: input.userId,
      rewardType: input.rewardType,
      amount: input.amount ?? null,
      code: input.code ?? null,
      sessionId: input.sessionId ?? null,
    }),
  );

  log.info("reward.granted", {
    rewardId: reward.id,
    userId: input.userId,
    type: input.rewardType,
    amount: input.amount,
    code: input.code,
  });

  return mapReward(reward);
}

// ---------------------------------------------------------------------------
// getMyRewards
// ---------------------------------------------------------------------------

export async function getMyRewards(
  ctx: AuthContext,
  limit = 100,
): Promise<GameRewardDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rewards = await repo.findByUser(ctx.userId, limit);
  return rewards.map(mapReward);
}

// ---------------------------------------------------------------------------
// getSessionRewards
// ---------------------------------------------------------------------------

export async function getSessionRewards(
  ctx: AuthContext,
  sessionId: string,
): Promise<GameRewardDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rewards = await repo.findBySession(sessionId);
  return rewards.map(mapReward);
}

// ---------------------------------------------------------------------------
// listRewards (admin / host scope)
// ---------------------------------------------------------------------------

export async function listRewards(
  ctx: AuthContext,
  query: ListRewardsQuery,
): Promise<{ rewards: GameRewardDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_MANAGE) && !ctx.isSuperadmin) {
    // Non-admins can only see their own rewards
    if (query.userId && query.userId !== ctx.userId) {
      throw forbidden("Cannot view other users' rewards");
    }
    query.userId = ctx.userId;
  }
  const result = await repo.findByFilters({
    userId: query.userId,
    sessionId: query.sessionId,
    playerId: query.playerId,
    rewardType: query.rewardType,
    code: query.code,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    rewards: result.items.map(mapReward),
    total: result.total,
  };
}

// ---------------------------------------------------------------------------
// getMySummary
// ---------------------------------------------------------------------------

export async function getMySummary(ctx: AuthContext): Promise<UserRewardSummaryDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const rows = await repo.findAggregateByUser(ctx.userId);
  let totalXp = 0;
  let totalCoins = 0;
  let totalSeasonPoints = 0;
  let longestStreak = 0;
  const achievements: Array<{ code: string; grantedAt: string; reason: string | null }> = [];
  const titles: Array<{ code: string; grantedAt: string }> = [];
  const badges: Array<{ code: string; grantedAt: string }> = [];
  for (const r of rows) {
    switch (r.rewardType) {
      case "xp":
        totalXp += r.amount ?? 0;
        break;
      case "coins":
        totalCoins += r.amount ?? 0;
        break;
      case "season_points":
        totalSeasonPoints += r.amount ?? 0;
        break;
      case "streak":
        longestStreak = Math.max(longestStreak, r.amount ?? 0);
        break;
      case "achievement":
        if (r.code) {
          achievements.push({
            code: r.code,
            grantedAt: r.grantedAt.toISOString(),
            reason: r.reason,
          });
        }
        break;
      case "title":
        if (r.code) {
          titles.push({ code: r.code, grantedAt: r.grantedAt.toISOString() });
        }
        break;
      case "badge":
        if (r.code) {
          badges.push({ code: r.code, grantedAt: r.grantedAt.toISOString() });
        }
        break;
    }
  }
  return {
    userId: ctx.userId,
    totalXp,
    totalCoins,
    totalSeasonPoints,
    achievements,
    titles,
    badges,
    longestStreak,
  };
}
