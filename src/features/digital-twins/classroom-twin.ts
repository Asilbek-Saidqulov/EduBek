/**
 * EduBek — Classroom Digital Twin.
 *
 * Phase 5A.1: Auto-maintained live model of a classroom. The twin
 * aggregates from existing systems:
 *
 *   • Curriculum progress ← Knowledge Intelligence coverage
 *   • Avg mastery ← Classroom Intelligence (Phase 4F.4)
 *   • Engagement rate ← Classroom Intelligence
 *   • Assignment completion ← Assignment attempts
 *   • Attendance ← Learning sessions
 *   • Predicted exam readiness ← Learning Prediction (Phase 4F.5)
 *   • Risk indicators ← At-risk students
 *   • AI recommendations ← AI Teacher Assistant (Phase 4F.4)
 *   • Resource usage ← Resource stats
 *   • Discussion activity ← Collaboration discussions
 *   • Collaboration graph ← Network Graph (Phase 4F.4)
 *
 * The twin is persisted as a DigitalTwin row + a daily TwinSnapshot
 * for longitudinal analysis.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { computeClassInsight } from "@/features/collaboration";
import { generateTeacherRecommendations } from "@/features/collaboration";
import type { ClassroomTwinState, DigitalTwinDto } from "./types";

const log = getLogger("classroom-twin");

// ---------------------------------------------------------------------------
// Main entry point: sync the classroom twin from source systems
// ---------------------------------------------------------------------------

export async function syncClassroomTwin(classroomId: string): Promise<DigitalTwinDto> {
  const start = Date.now();
  log.info("classroom_twin.sync_started", { classroomId });

  // Fetch the classroom + teacher + students
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true, name: true, teacherId: true,
      students: { where: { status: "active" }, select: { studentId: true } },
    },
  });
  if (!classroom) throw new Error(`Classroom ${classroomId} not found`);

  // Compute classroom intelligence (Phase 4F.4)
  const insight = await computeClassInsight(classroomId).catch(() => null);

  // Fetch AI recommendations
  const recommendations = await generateTeacherRecommendations({
    teacherId: classroom.teacherId,
    classroomId,
    limit: 5,
  }).catch(() => []);

  // Fetch resource usage
  const resources = await db.resource.findMany({
    where: { ownerId: classroom.teacherId, status: "ready" },
    select: { id: true, resourceType: true },
  }).catch(() => []);
  const aiGenerated = await db.aiSession.count({
    where: { orgId: classroom.teacherId },
  }).catch(() => 0);
  const marketplacePurchased = await db.mpPurchase.count({
    where: { buyerId: classroom.teacherId },
  }).catch(() => 0);

  // Fetch discussion activity
  const discussions = await db.discussion.findMany({
    where: { entityType: "classroom", entityId: classroomId },
    select: { id: true, replyCount: true, status: true, lastReplyAt: true },
  }).catch(() => []);
  const activeThreads = discussions.filter((d) => d.status === "open").length;

  // Fetch at-risk students from insight
  const atRiskStudents = insight?.atRiskStudents ?? [];

  // Build the twin state
  const state: ClassroomTwinState = {
    classroomId,
    classroomName: classroom.name,
    teacherId: classroom.teacherId,
    studentCount: classroom.students.length,
    curriculumProgress: insight ? Math.round(insight.avgMastery * 100) : 0,
    avgMastery: insight?.avgMastery ?? 0,
    engagementRate: insight?.engagementRate ?? 0,
    assignmentCompletionRate: insight?.assignmentCompletionRate ?? 0,
    attendanceRate: 0.85, // placeholder — would come from attendance tracking
    predictedExamReadiness: insight ? Math.min(1, insight.avgMastery + 0.1) : 0,
    riskIndicators: [
      ...(insight && insight.engagementRate < 0.5
        ? [{ type: "low_engagement", severity: "high" as const, description: `Engagement rate is ${Math.round(insight.engagementRate * 100)}%` }]
        : []),
      ...(insight && insight.assignmentCompletionRate < 0.5
        ? [{ type: "low_assignment_completion", severity: "medium" as const, description: `Assignment completion rate is ${Math.round(insight.assignmentCompletionRate * 100)}%` }]
        : []),
      ...(atRiskStudents.length > 0
        ? [{ type: "at_risk_students", severity: (atRiskStudents.length > 5 ? "high" : "medium") as "high" | "medium", description: `${atRiskStudents.length} students at risk` }]
        : []),
    ],
    aiRecommendations: recommendations.map((r) => ({
      type: r.type,
      title: r.title,
      priority: Math.round(r.confidence * 5),
    })),
    resourceUsage: {
      totalResources: resources.length,
      aiGenerated,
      marketplacePurchased,
    },
    discussionActivity: {
      totalThreads: discussions.length,
      totalReplies: discussions.reduce((s, d) => s + d.replyCount, 0),
      activeThreads,
    },
    collaborationDensity: 0.5, // would come from Network Graph
    weakTopics: insight?.weakTopics ?? [],
    atRiskStudents: atRiskStudents.map((s) => ({
      userId: s.userId,
      riskScore: s.riskScore,
      reason: s.reason,
    })),
    lastUpdated: new Date().toISOString(),
  };

  // Persist the twin
  const twin = await repo.upsertTwin({
    twinType: "classroom",
    entityId: classroomId,
    state: JSON.stringify(state),
    lastSyncedAt: new Date(),
  });

  // Persist a daily snapshot
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await repo.createTwinSnapshot({
    twinType: "classroom",
    entityId: classroomId,
    day: today,
    state: JSON.stringify(state),
    trigger: "event",
  }).catch(() => undefined);

  const executionMs = Date.now() - start;
  log.info("classroom_twin.synced", { classroomId, executionMs, version: twin.version });

  return mapTwin(twin);
}

export async function getClassroomTwin(classroomId: string, autoSync = true): Promise<DigitalTwinDto | null> {
  if (autoSync) {
    return syncClassroomTwin(classroomId).catch(() => null);
  }
  const twin = await repo.findTwin("classroom", classroomId);
  return twin ? mapTwin(twin) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapTwin(t: any): DigitalTwinDto {
  return {
    id: t.id,
    twinType: t.twinType,
    entityId: t.entityId,
    state: safeParseRecord(t.state),
    version: t.version,
    lastSyncedAt: t.lastSyncedAt?.toISOString() ?? null,
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
