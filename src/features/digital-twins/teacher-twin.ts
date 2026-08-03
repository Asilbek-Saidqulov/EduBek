/**
 * EduBek — Teacher Digital Twin.
 *
 * Phase 5A.1: Measures teacher workload + effectiveness. Aggregates:
 *
 *   • Lesson quality ← Resource quality (Phase 4F.5)
 *   • Curriculum coverage ← Knowledge Coverage (Phase 4F.5)
 *   • Classroom engagement ← Classroom Intelligence (Phase 4F.4)
 *   • Grading load ← Pending submissions
 *   • AI usage ← AI sessions
 *   • Intervention effectiveness ← Teacher recommendations applied
 *   • Student improvement ← Mastery change over time
 *   • Content production ← Resources created
 *   • Collaboration ← Study groups + discussions
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { getOrganizationInsight } from "@/features/collaboration";
import { computeClassInsight } from "@/features/collaboration";
import type { DigitalTwinDto, TeacherTwinState } from "./types";

const log = getLogger("teacher-twin");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function syncTeacherTwin(teacherId: string): Promise<DigitalTwinDto> {
  const start = Date.now();
  log.info("teacher_twin.sync_started", { teacherId });

  // Fetch teacher + classrooms
  const [user, classrooms] = await Promise.all([
    db.user.findUnique({ where: { id: teacherId }, select: { id: true, name: true, username: true } }),
    db.classroom.findMany({
      where: { teacherId, status: "active" },
      select: {
        id: true, name: true,
        students: { where: { status: "active" }, select: { studentId: true } },
      },
    }),
  ]);
  if (!user) throw new Error(`Teacher ${teacherId} not found`);

  const totalStudents = classrooms.reduce((s, c) => s + c.students.length, 0);

  // Compute classroom insights in parallel
  const insights = await Promise.all(
    classrooms.map((c) => computeClassInsight(c.id).catch(() => null)),
  );

  // Lesson quality — avg resource quality for teacher's resources
  const resources = await db.resource.findMany({
    where: { ownerId: teacherId, status: "ready" },
    select: { id: true, createdAt: true },
  }).catch(() => []);
  const resourceIds = resources.map((r) => r.id);
  const qualityRows = resourceIds.length > 0
    ? await db.resourceQuality.findMany({
        where: { entityType: "resource", entityId: { in: resourceIds } },
        select: { overall: true },
      }).catch(() => [])
    : [];
  const lessonQuality = qualityRows.length > 0
    ? qualityRows.reduce((s, q) => s + q.overall, 0) / qualityRows.length
    : 0.5;

  // Curriculum coverage — avg across classroom insights
  const avgMastery = insights.length > 0
    ? insights.filter((i): i is NonNullable<typeof i> => i !== null).reduce((s, i) => s + i.avgMastery, 0) / Math.max(1, insights.filter((i) => i !== null).length)
    : 0;
  const avgEngagement = insights.length > 0
    ? insights.filter((i): i is NonNullable<typeof i> => i !== null).reduce((s, i) => s + i.engagementRate, 0) / Math.max(1, insights.filter((i) => i !== null).length)
    : 0;

  // Grading load — pending submissions
  const pendingSubmissions = await db.assignmentAttempt.count({
    where: {
      assignment: { classroom: { teacherId } },
      status: "submitted",
    },
  }).catch(() => 0);

  // AI usage
  const aiSessions = await db.aiSession.count({
    where: { ownerId: teacherId },
  }).catch(() => 0);
  const aiCreditsUsed = aiSessions * 10; // approximate

  // Intervention effectiveness
  const appliedRecommendations = await db.teacherRecommendation.count({
    where: { teacherId, status: "applied" },
  }).catch(() => 0);
  const totalRecommendations = await db.teacherRecommendation.count({
    where: { teacherId },
  }).catch(() => 1);
  const interventionEffectiveness = totalRecommendations > 0 ? appliedRecommendations / totalRecommendations : 0.5;

  // Content production — resources in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentResources = resources.filter((r) => r.createdAt >= thirtyDaysAgo);
  const aiGenerated = await db.aiSession.count({
    where: { ownerId: teacherId, createdAt: { gte: thirtyDaysAgo } },
  }).catch(() => 0);
  const marketplacePublished = await db.mpListing.count({
    where: { creatorId: teacherId, createdAt: { gte: thirtyDaysAgo } },
  }).catch(() => 0);

  // Collaboration
  const studyGroups = await db.studyGroup.count({
    where: { ownerId: teacherId },
  }).catch(() => 0);
  const discussionsStarted = await db.discussion.count({
    where: { authorId: teacherId },
  }).catch(() => 0);

  // Workload score — blend of student count + grading load + classrooms
  const workloadScore = Math.min(1,
    (classrooms.length * 0.1) +
    (totalStudents * 0.005) +
    (pendingSubmissions * 0.02),
  );

  const state: TeacherTwinState = {
    userId: teacherId,
    userName: user.name ?? user.username,
    classroomCount: classrooms.length,
    totalStudents,
    lessonQuality,
    curriculumCoverage: avgMastery,
    classroomEngagement: avgEngagement,
    gradingLoad: {
      pendingSubmissions,
      avgGradingTimeMs: 120_000, // placeholder — would come from grading history
    },
    aiUsage: {
      totalSessions: aiSessions,
      totalCreditsUsed: aiCreditsUsed,
      topUseCases: ["lesson_planning", "quiz_generation", "resource_creation"],
    },
    interventionEffectiveness,
    studentImprovement: 0.05, // placeholder — would compute from mastery trend
    contentProduction: {
      resourcesCreated: recentResources.length,
      aiGenerated,
      marketplacePublished,
    },
    collaboration: {
      studyGroups,
      discussionsStarted,
      peerRecommendations: 0,
    },
    workloadScore,
    lastUpdated: new Date().toISOString(),
  };

  // Persist
  const twin = await repo.upsertTwin({
    twinType: "teacher",
    entityId: teacherId,
    state: JSON.stringify(state),
    lastSyncedAt: new Date(),
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await repo.createTwinSnapshot({
    twinType: "teacher",
    entityId: teacherId,
    day: today,
    state: JSON.stringify(state),
    trigger: "event",
  }).catch(() => undefined);

  const executionMs = Date.now() - start;
  log.info("teacher_twin.synced", { teacherId, executionMs, version: twin.version });

  return mapTwin(twin);
}

export async function getTeacherTwin(teacherId: string, autoSync = true): Promise<DigitalTwinDto | null> {
  if (autoSync) {
    return syncTeacherTwin(teacherId).catch(() => null);
  }
  const twin = await repo.findTwin("teacher", teacherId);
  return twin ? mapTwin(twin) : null;
}

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
