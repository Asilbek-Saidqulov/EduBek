/**
 * EduBek — Live Quiz Reward module types.
 *
 * Rewards are the post-Quiz-Session currency: XP, coins, achievements,
 * streaks, badges, season points, and titles. They are granted by
 * Game Mode strategies via `applyRewards()` at Quiz Session end.
 */

export type RewardType =
  | "xp"
  | "coins"
  | "achievement"
  | "streak"
  | "badge"
  | "season_points"
  | "title";

export interface GameRewardDto {
  id: string;
  sessionId: string | null;
  playerId: string | null;
  userId: string;
  rewardType: RewardType;
  amount: number | null;
  code: string | null;
  metadata: Record<string, unknown> | null;
  /** English reason text (backward-compatible fallback). */
  reason: string | null;
  /**
   * Phase 4E.3: Translation key for the reason (e.g. "backend.rewards.classic.win").
   * The frontend resolves this to a localized string using the user's locale.
   * Stored inside the `metadata` JSON column as `reasonKey`.
   */
  reasonKey?: string | null;
  /**
   * Phase 4E.3: Interpolation params for `reasonKey` (e.g. { rank: 1 }).
   * Stored inside the `metadata` JSON column as `reasonParams`.
   */
  reasonParams?: Record<string, unknown> | null;
  grantedAt: string;
  createdAt: string;
}

export interface GrantRewardInput {
  userId: string;
  sessionId?: string;
  playerId?: string;
  rewardType: RewardType;
  amount?: number;
  code?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  /** Phase 4E.3: Translation key for the reason. */
  reasonKey?: string;
  /** Phase 4E.3: Interpolation params for the reason key. */
  reasonParams?: Record<string, unknown>;
}

export interface UserRewardSummaryDto {
  userId: string;
  totalXp: number;
  totalCoins: number;
  totalSeasonPoints: number;
  achievements: Array<{ code: string; grantedAt: string; reason: string | null }>;
  titles: Array<{ code: string; grantedAt: string }>;
  badges: Array<{ code: string; grantedAt: string }>;
  longestStreak: number;
}
