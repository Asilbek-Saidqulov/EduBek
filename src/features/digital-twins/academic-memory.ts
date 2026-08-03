/**
 * EduBek — Long-Term Academic Memory.
 *
 * Phase 5A.1: Remembers across years — previous teachers, previous
 * classes, curriculum history, interventions, achievements, learning
 * trajectories. Enables true longitudinal analytics.
 *
 * Memory types:
 *   • enrollment         — student enrollment history
 *   • curriculum_history — what curriculum was taught when
 *   • intervention       — past interventions + outcomes
 *   • achievement        — milestones, certificates, awards
 *   • trajectory         — learning progression over time
 *   • teacher_assignment — which teacher taught which class when
 *   • class_composition  — who was in which class
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AcademicMemoryDto, AcademicMemoryScope, AcademicMemoryType } from "./types";

const log = getLogger("academic-memory");

// ---------------------------------------------------------------------------
// Store memory
// ---------------------------------------------------------------------------

export async function storeAcademicMemory(input: {
  scopeType: AcademicMemoryScope;
  scopeId: string;
  academicYear: string;
  type: AcademicMemoryType;
  summary: string;
  payload?: Record<string, unknown>;
  importance?: number;
}): Promise<AcademicMemoryDto> {
  const row = await repo.createAcademicMemory({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    academicYear: input.academicYear,
    type: input.type,
    summary: input.summary,
    payload: JSON.stringify(input.payload ?? {}),
    importance: input.importance ?? 0.5,
  });
  log.info("memory.stored", {
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    academicYear: input.academicYear,
    type: input.type,
  });
  return mapMemory(row);
}

// ---------------------------------------------------------------------------
// Recall memory
// ---------------------------------------------------------------------------

export async function recallAcademicMemory(input: {
  scopeType?: AcademicMemoryScope;
  scopeId?: string;
  academicYear?: string;
  type?: AcademicMemoryType;
  limit?: number;
}): Promise<AcademicMemoryDto[]> {
  const rows = await repo.findAcademicMemories(input);
  return rows.map(mapMemory);
}

/**
 * Get the full longitudinal history for a student — all academic years.
 */
export async function getStudentTrajectory(studentId: string): Promise<{
  memories: AcademicMemoryDto[];
  yearsActive: string[];
  totalAchievements: number;
  totalInterventions: number;
}> {
  const memories = await repo.findAcademicMemories({
    scopeType: "student",
    scopeId: studentId,
    limit: 500,
  });
  const yearsActive = Array.from(new Set(memories.map((m) => m.academicYear))).sort();
  const totalAchievements = memories.filter((m) => m.type === "achievement").length;
  const totalInterventions = memories.filter((m) => m.type === "intervention").length;
  return { memories: memories.map(mapMemory), yearsActive, totalAchievements, totalInterventions };
}

/**
 * Get the full history for a classroom across years — who taught it,
 * who was in it, what curriculum was covered.
 */
export async function getClassroomHistory(classroomId: string): Promise<{
  memories: AcademicMemoryDto[];
  previousTeachers: Array<{ year: string; teacherId: string; teacherName: string }>;
  curriculumHistory: Array<{ year: string; summary: string }>;
}> {
  const memories = await repo.findAcademicMemories({
    scopeType: "classroom",
    scopeId: classroomId,
    limit: 500,
  });
  const previousTeachers = memories
    .filter((m) => m.type === "teacher_assignment")
    .map((m) => ({
      year: m.academicYear,
      teacherId: (m.payload as any)?.teacherId ?? "unknown",
      teacherName: (m.payload as any)?.teacherName ?? "Unknown",
    }));
  const curriculumHistory = memories
    .filter((m) => m.type === "curriculum_history")
    .map((m) => ({ year: m.academicYear, summary: m.summary }));
  return {
    memories: memories.map(mapMemory),
    previousTeachers,
    curriculumHistory,
  };
}

export async function getAcademicMemoryById(id: string): Promise<AcademicMemoryDto | null> {
  const row = await repo.findAcademicMemoryById(id);
  return row ? mapMemory(row) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapMemory(m: any): AcademicMemoryDto {
  return {
    id: m.id,
    scopeType: m.scopeType as AcademicMemoryScope,
    scopeId: m.scopeId,
    academicYear: m.academicYear,
    type: m.type as AcademicMemoryType,
    summary: m.summary,
    payload: safeParseRecord(m.payload),
    importance: m.importance,
    createdAt: m.createdAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
