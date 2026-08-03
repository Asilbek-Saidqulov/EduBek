/**
 * EduBek — Exam Zod schemas.
 */
import { z } from "zod";

export const startExamBodySchema = z.object({
  assessmentId: z.string().min(1),
});
export type StartExamBody = z.infer<typeof startExamBodySchema>;

export const recordProctoringBodySchema = z.object({
  incidentType: z.enum([
    "tab_switch",
    "fullscreen_exit",
    "disconnect",
    "copy",
    "paste",
    "multiple_devices",
    "window_blur",
  ]),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  description: z.string().max(2_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});
export type RecordProctoringBody = z.infer<typeof recordProctoringBodySchema>;
