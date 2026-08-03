/**
 * EduBek — Live Quiz Analytics Zod schemas.
 */
import { z } from "zod";

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  gameMode: z.enum(["classic", "treasure", "empire", "royale", "battle"]).optional(),
  classroomId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
});
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
