/**
 * EduBek — Proctoring feature domain types (DTOs).
 *
 * Lightweight architecture only — NO webcam, NO face recognition, NO
 * screen recording. We track client-reported integrity incidents:
 *
 *   • tab_switch        — student switched browser tabs
 *   • fullscreen_exit   — student exited fullscreen mode
 *   • disconnect        — student's network dropped briefly
 *   • copy / paste      — clipboard activity during the exam
 *   • multiple_devices  — same account on two devices simultaneously
 *   • window_blur       — exam window lost focus
 *
 * Each incident is recorded with severity + metadata. The attempt row
 * keeps a denormalized count and a "flagged" boolean (>= 3 incidents or
 * any critical incident).
 */

export type ProctoringIncidentType =
  | "tab_switch"
  | "fullscreen_exit"
  | "disconnect"
  | "copy"
  | "paste"
  | "multiple_devices"
  | "window_blur";

export type ProctoringSeverity = "info" | "warning" | "critical";

export interface ProctoringIncidentDto {
  id: string;
  attemptId: string;
  studentId: string;
  incidentType: ProctoringIncidentType;
  severity: ProctoringSeverity;
  description: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

export interface ProctoringSummaryDto {
  attemptId: string;
  studentId: string;
  incidentCount: number;
  flagged: boolean;
  bySeverity: Record<ProctoringSeverity, number>;
  byType: Partial<Record<ProctoringIncidentType, number>>;
  recent: ProctoringIncidentDto[];
}
