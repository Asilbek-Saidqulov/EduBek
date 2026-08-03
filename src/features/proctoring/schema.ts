/**
 * EduBek — Proctoring Zod schemas.
 */
import { z } from "zod";

export const incidentTypeSchema = z.enum([
  "tab_switch",
  "fullscreen_exit",
  "disconnect",
  "copy",
  "paste",
  "multiple_devices",
  "window_blur",
]);

export const severitySchema = z.enum(["info", "warning", "critical"]);

export const listIncidentsQuerySchema = z.object({
  attemptId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  severity: severitySchema.optional(),
  incidentType: incidentTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;
