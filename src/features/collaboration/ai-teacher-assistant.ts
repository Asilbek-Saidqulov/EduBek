/**
 * EduBek — AI Teacher Assistant.
 *
 * Phase 4F.4: Generates AI-powered recommendations for teachers based
 * on classroom intelligence. Each recommendation includes:
 *
 *   • type            — intervention / enrichment / remediation / announcement / assignment / study_plan
 *   • targetUserIds   — which students it's for (empty = whole class)
 *   • resources       — concrete resources / quizzes / worksheets to use
 *   • rationale       — AI-generated explanation
 *   • confidence      — 0-1 how sure the AI is
 *
 * Reuses:
 *   • Classroom Intelligence (Phase 4F.4) — for at-risk students, weak topics
 *   • Discovery Engine (Phase 4F.1) — for finding relevant resources
 *   • Knowledge Graph (Phase 4F.1) — for prerequisite chains
 *   • AI Workspace (Phase 4A) — for natural-language rationale generation (hook)
 *
 * The AI is deterministic in Phase 4F.4 — a future phase can replace
 * the rationale generator with a real LLM call without changing the
 * DTO shape.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { computeClassInsight } from "./classroom-intelligence";
import type { TeacherRecommendationDto, TeacherRecommendationType } from "./types";

const log = getLogger("ai-teacher-assistant");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateTeacherRecommendations(input: {
  teacherId: string;
  classroomId?: string;
  limit?: number;
}): Promise<TeacherRecommendationDto[]> {
  const { teacherId, limit = 5 } = input;
  const recommendations: TeacherRecommendationDto[] = [];

  // Find classrooms owned by this teacher
  const classrooms = await db.classroom.findMany({
    where: { teacherId, status: "active" },
    select: { id: true, name: true },
  });

  for (const classroom of classrooms) {
    if (recommendations.length >= limit) break;
    if (input.classroomId && classroom.id !== input.classroomId) continue;

    const insight = await computeClassInsight(classroom.id).catch(() => null);
    if (!insight) continue;

    // --- Intervention: at-risk students ---
    for (const atRisk of insight.atRiskStudents.slice(0, 2)) {
      if (recommendations.length >= limit) break;
      const rec = await repo.createTeacherRecommendation({
        teacherId,
        classroomId: classroom.id,
        type: "intervention",
        title: `Intervention for at-risk student`,
        description: `Student has risk score ${Math.round(atRisk.riskScore * 100)}%. Reason: ${atRisk.reason}.`,
        targetUserIds: JSON.stringify([atRisk.userId]),
        resources: JSON.stringify({ suggestedActions: ["1-on-1 session", "review weak topics", "check engagement"] }),
        rationale: `${atRisk.reason}. Recommend a personal check-in and a focused review session.`,
        rationaleKey: "learning.teacher.interventionRationale",
        confidence: Math.min(0.95, 0.6 + atRisk.riskScore * 0.3),
      });
      recommendations.push(mapDto(rec));
    }

    // --- Remediation: weak topics → suggest review resources ---
    for (const weakTopic of insight.weakTopics.slice(0, 2)) {
      if (recommendations.length >= limit) break;
      const rec = await repo.createTeacherRecommendation({
        teacherId,
        classroomId: classroom.id,
        type: "remediation",
        title: `Remediation: ${weakTopic.topic}`,
        description: `${Math.round((1 - weakTopic.mastery) * 100)}% of students are weak on ${weakTopic.topic}.`,
        targetUserIds: JSON.stringify([]), // whole class
        resources: JSON.stringify({
          topic: weakTopic.topic,
          suggestedActions: ["10-minute review", "group practice problems", "AI tutor session"],
        }),
        rationale: `Class mastery on ${weakTopic.topic} is ${Math.round(weakTopic.mastery * 100)}%. A targeted review session would benefit the whole class.`,
        rationaleKey: "learning.teacher.remediationRationale",
        confidence: 0.8,
      });
      recommendations.push(mapDto(rec));
    }

    // --- Enrichment: strong topics → suggest advanced material ---
    for (const strongTopic of insight.strongTopics.slice(0, 1)) {
      if (recommendations.length >= limit) break;
      const rec = await repo.createTeacherRecommendation({
        teacherId,
        classroomId: classroom.id,
        type: "enrichment",
        title: `Enrichment: ${strongTopic.topic}`,
        description: `${Math.round(strongTopic.mastery * 100)}% of students have mastered ${strongTopic.topic}.`,
        targetUserIds: JSON.stringify([]),
        resources: JSON.stringify({
          topic: strongTopic.topic,
          suggestedActions: ["advanced problems", "project-based learning", "peer teaching"],
        }),
        rationale: `Students have mastered ${strongTopic.topic} (avg ${Math.round(strongTopic.mastery * 100)}%). Consider enrichment material to keep them engaged.`,
        rationaleKey: "learning.teacher.enrichmentRationale",
        confidence: 0.7,
      });
      recommendations.push(mapDto(rec));
    }

    // --- Assignment: low assignment completion rate ---
    if (insight.assignmentCompletionRate < 0.6 && recommendations.length < limit) {
      const rec = await repo.createTeacherRecommendation({
        teacherId,
        classroomId: classroom.id,
        type: "assignment",
        title: `Assignment completion is low (${Math.round(insight.assignmentCompletionRate * 100)}%)`,
        description: `Only ${Math.round(insight.assignmentCompletionRate * 100)}% of assignments are being completed.`,
        targetUserIds: JSON.stringify([]),
        resources: JSON.stringify({
          suggestedActions: ["extend deadlines", "send reminders", "review assignment difficulty"],
        }),
        rationale: `Assignment completion rate is ${Math.round(insight.assignmentCompletionRate * 100)}% — below the 60% threshold. Consider extending deadlines or sending reminders.`,
        rationaleKey: "learning.teacher.assignmentRationale",
        confidence: 0.75,
      });
      recommendations.push(mapDto(rec));
    }

    // --- Announcement: engagement rate low ---
    if (insight.engagementRate < 0.5 && recommendations.length < limit) {
      const rec = await repo.createTeacherRecommendation({
        teacherId,
        classroomId: classroom.id,
        type: "announcement",
        title: `Engagement is low — send an announcement`,
        description: `Only ${Math.round(insight.engagementRate * 100)}% of students have been active in the last 7 days.`,
        targetUserIds: JSON.stringify([]),
        resources: JSON.stringify({
          suggestedActions: ["send motivational announcement", "schedule a live session", "remind students of upcoming deadlines"],
        }),
        rationale: `Engagement rate is ${Math.round(insight.engagementRate * 100)}% — below the 50% threshold. A motivational announcement may help re-engage students.`,
        rationaleKey: "learning.teacher.engagementRationale",
        confidence: 0.65,
      });
      recommendations.push(mapDto(rec));
    }
  }

  log.info("ai_teacher.recommendations_generated", {
    teacherId,
    count: recommendations.length,
  });

  return recommendations;
}

export async function listTeacherRecommendations(input: {
  teacherId: string;
  classroomId?: string;
  type?: TeacherRecommendationType;
  status?: string;
  limit?: number;
}): Promise<TeacherRecommendationDto[]> {
  const rows = await repo.findTeacherRecommendations({
    teacherId: input.teacherId,
    classroomId: input.classroomId,
    type: input.type,
    status: input.status,
    limit: input.limit,
  });
  return rows.map(mapDto);
}

export async function applyTeacherRecommendation(id: string): Promise<TeacherRecommendationDto> {
  const updated = await repo.updateTeacherRecommendation(id, {
    status: "applied",
    appliedAt: new Date(),
  });
  return mapDto(updated);
}

export async function dismissTeacherRecommendation(id: string): Promise<TeacherRecommendationDto> {
  const updated = await repo.updateTeacherRecommendation(id, { status: "dismissed" });
  return mapDto(updated);
}

// ---------------------------------------------------------------------------
// Interventions
// ---------------------------------------------------------------------------

export async function createIntervention(input: {
  teacherId: string;
  classroomId?: string;
  studentIds: string[];
  reason: string;
  reasonKey?: string;
  description: string;
  actionPlan?: Record<string, unknown>;
  confidence?: number;
}) {
  return repo.createIntervention({
    teacherId: input.teacherId,
    classroomId: input.classroomId,
    studentIds: JSON.stringify(input.studentIds),
    reason: input.reason,
    reasonKey: input.reasonKey,
    description: input.description,
    actionPlan: JSON.stringify(input.actionPlan ?? {}),
    confidence: input.confidence ?? 0.5,
  });
}

export async function listInterventions(input: {
  teacherId?: string;
  classroomId?: string;
  status?: string;
  limit?: number;
}) {
  const rows = await repo.findInterventions(input);
  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    classroomId: r.classroomId,
    studentIds: safeParseArray<string>(r.studentIds),
    reason: r.reason,
    reasonKey: r.reasonKey,
    description: r.description,
    actionPlan: safeParseRecord(r.actionPlan, {}),
    confidence: r.confidence,
    status: r.status,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function resolveIntervention(id: string) {
  return repo.updateIntervention(id, {
    status: "resolved",
    resolvedAt: new Date(),
  });
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function createAnnouncement(input: {
  authorId: string;
  title: string;
  body: string;
  bodyHtml?: string;
  classroomId?: string;
  groupId?: string;
  organizationId?: string;
  pinned?: boolean;
  publishNow?: boolean;
}) {
  const status = input.publishNow ? "published" : "draft";
  return repo.createAnnouncement({
    authorId: input.authorId,
    classroomId: input.classroomId,
    groupId: input.groupId,
    organizationId: input.organizationId,
    title: input.title,
    body: input.body,
    bodyHtml: input.bodyHtml,
    pinned: input.pinned ?? false,
    status,
    publishedAt: input.publishNow ? new Date() : undefined,
  });
}

export async function listAnnouncements(input: {
  classroomId?: string;
  groupId?: string;
  organizationId?: string;
  authorId?: string;
  status?: string;
  limit?: number;
}) {
  return repo.findAnnouncements(input);
}

export async function publishAnnouncement(id: string) {
  return repo.updateAnnouncement(id, {
    status: "published",
    publishedAt: new Date(),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDto(r: any): TeacherRecommendationDto {
  return {
    id: r.id,
    teacherId: r.teacherId,
    classroomId: r.classroomId,
    type: r.type as TeacherRecommendationType,
    title: r.title,
    description: r.description,
    targetUserIds: safeParseArray<string>(r.targetUserIds),
    resources: safeParseRecord(r.resources, {}),
    rationale: r.rationale,
    rationaleKey: r.rationaleKey,
    confidence: r.confidence,
    status: r.status,
    appliedAt: r.appliedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeParseRecord<T = Record<string, any>>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
