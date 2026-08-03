/**
 * EduBek — Live Quiz Reward feature barrel export.
 */
export {
  grantReward,
  getMyRewards,
  getSessionRewards,
  listRewards,
  getMySummary,
} from "./service";

export {
  listRewardsQuerySchema,
  rewardTypeSchema,
  type ListRewardsQuery,
} from "./schema";

export type {
  RewardType,
  GameRewardDto,
  GrantRewardInput,
  UserRewardSummaryDto,
} from "./types";
