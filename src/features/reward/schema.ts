/**
 * EduBek — Live Quiz Reward Zod schemas.
 */
import { z } from "zod";

export const rewardTypeSchema = z.enum([
  "xp", "coins", "achievement", "streak", "badge", "season_points", "title",
]);

export const listRewardsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  playerId: z.string().min(1).optional(),
  rewardType: rewardTypeSchema.optional(),
  code: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListRewardsQuery = z.infer<typeof listRewardsQuerySchema>;
