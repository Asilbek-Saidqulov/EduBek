/**
 * EduBek — Game Mode schema.
 */
import { z } from "zod";

export const gameModeIdSchema = z.enum([
  "classic",
  "treasure",
  "empire",
  "royale",
  "battle",
]);

export const gameModeConfigSchema = z.object({
  totalRounds: z.number().int().min(1).max(100).default(10),
  questionDurationMs: z.number().int().min(5_000).max(300_000).default(30_000),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  revealAfterRound: z.boolean().default(true),
  leaderboardAfterRound: z.boolean().default(true),
  modeParams: z.record(z.string(), z.unknown()).optional(),
});
export type GameModeConfigInput = z.infer<typeof gameModeConfigSchema>;
