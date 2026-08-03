/**
 * EduBek — Organization Intelligence service.
 *
 * Phase 4F.4: Aggregates organization-wide analytics for school
 * administrators:
 *
 *   • Department analytics (per-department student count, mastery, engagement)
 *   • Teacher analytics (per-teacher classroom count, students, avg mastery)
 *   • Resource usage (total, top, AI-generated, marketplace)
 *   • AI usage (sessions, credits, top models)
 *   • Certification progress (enrolled, completed, avg score)
 *   • Cross-class comparison (classroom-by-classroom comparison)
 *   • Member counts (total, active)
 *
 * Output is persisted as an OrganizationInsight snapshot for fast
 * subsequent dashboard loads.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { OrganizationInsightDto } from "./types";

const log = getLogger("org-intelligence");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function computeOrganizationInsight(organizationId: string): Promise<OrganizationInsightDto> {
  const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

  // Fetch org structure: members, classrooms, departments
  const [memberships, classrooms] = await Promise.all([
    db.organizationMembership.findMany({
      where: { orgId: organizationId },
      select: { userId: true, joinedAt: true },
    }).catch(() => []),
    db.classroom.findMany({
      where: { orgId: organizationId, status: "active" },
      select: {
        id: true,
        name: true,
        teacherId: true,
        students: { where: { status: "active" }, select: { studentId: true } },
      },
    }).catch(() => []),
  ]);

  const totalMembers = memberships.length;
  const memberIds = memberships.map((m) => m.userId);

  // Active members — those with a study session in the last 7 days
  const activeMemberIds = memberIds.length > 0
    ? await db.studySession.findMany({
        where: { userId: { in: memberIds }, startedAt: { gte: sevenDaysAgo } },
        distinct: ["userId"],
        select: { userId: true },
      }).catch(() => [])
    : [];
  const activeMembers = activeMemberIds.length;

  // Per-classroom insights (reuse Phase 4F.4 classroom intelligence)
  const teacherAnalytics: OrganizationInsightDto["teacherAnalytics"] = [];
  const classComparison: OrganizationInsightDto["classComparison"] = [];
  const departmentMap = new Map<string, { studentCount: number; masterySum: number; engagementSum: number; count: number }>();

  // Group classrooms by teacher
  const teacherClassrooms = new Map<string, typeof classrooms>();
  for (const c of classrooms) {
    const list = teacherClassrooms.get(c.teacherId) ?? [];
    list.push(c);
    teacherClassrooms.set(c.teacherId, list);
  }

  const teacherIds = Array.from(teacherClassrooms.keys());
  const teachers = teacherIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, username: true },
      })
    : [];
  const teacherById = new Map(teachers.map((t) => [t.id, t]));

  for (const [teacherId, cls] of teacherClassrooms) {
    const teacher = teacherById.get(teacherId);
    const classroomCount = cls.length;
    const studentCount = cls.reduce((s, c) => s + c.students.length, 0);
    let masterySum = 0;
    let engagementSum = 0;
    let insightCount = 0;
    for (const c of cls) {
      const insight = await db.classInsight.findFirst({
        where: { classroomId: c.id },
        orderBy: { day: "desc" },
      }).catch(() => null);
      if (insight) {
        masterySum += insight.avgMastery;
        engagementSum += insight.engagementRate;
        insightCount += 1;
        classComparison.push({
          classroomId: c.id,
          name: c.name,
          avgMastery: insight.avgMastery,
          avgEngagement: insight.engagementRate,
        });
      } else {
        classComparison.push({
          classroomId: c.id,
          name: c.name,
          avgMastery: 0,
          avgEngagement: 0,
        });
      }
    }
    teacherAnalytics.push({
      teacherId,
      name: teacher?.name ?? teacher?.username ?? null,
      classroomCount,
      studentCount,
      avgMastery: insightCount > 0 ? masterySum / insightCount : 0,
    });

    // Department = "general" if not specified — Phase 4F.4 doesn't yet have
    // a department concept on classrooms. A future phase can extend
    // Classroom with a `department` field.
    const dept = "general";
    const entry = departmentMap.get(dept) ?? { studentCount: 0, masterySum: 0, engagementSum: 0, count: 0 };
    entry.studentCount += studentCount;
    entry.masterySum += insightCount > 0 ? masterySum / insightCount : 0;
    entry.engagementSum += insightCount > 0 ? engagementSum / insightCount : 0;
    entry.count += insightCount > 0 ? 1 : 0;
    departmentMap.set(dept, entry);
  }

  const departmentAnalytics: OrganizationInsightDto["departmentAnalytics"] = {};
  for (const [dept, e] of departmentMap) {
    departmentAnalytics[dept] = {
      studentCount: e.studentCount,
      avgMastery: e.count > 0 ? e.masterySum / e.count : 0,
      engagementRate: e.count > 0 ? e.engagementSum / e.count : 0,
    };
  }

  // Resource usage — pull from SearchIndexEntry
  const resourceUsage = await computeResourceUsage(organizationId);

  // AI usage — pull from AI sessions
  const aiUsage = await computeAiUsage(memberIds);

  // Certification progress
  const certificationProgress = await computeCertificationProgress(memberIds);

  // Persist snapshot
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const snapshot = await repo.upsertOrganizationInsight({
    organizationId,
    day: today,
    departmentAnalytics: JSON.stringify(departmentAnalytics),
    teacherAnalytics: JSON.stringify(teacherAnalytics),
    resourceUsage: JSON.stringify(resourceUsage),
    aiUsage: JSON.stringify(aiUsage),
    certificationProgress: JSON.stringify(certificationProgress),
    classComparison: JSON.stringify(classComparison),
    totalMembers,
    activeMembers,
  });

  log.info("org_insight.computed", {
    organizationId,
    totalMembers,
    activeMembers,
    classrooms: classrooms.length,
    teachers: teacherAnalytics.length,
  });

  return {
    organizationId,
    day: snapshot.day.toISOString(),
    departmentAnalytics,
    teacherAnalytics,
    resourceUsage,
    aiUsage,
    certificationProgress,
    classComparison,
    totalMembers,
    activeMembers,
  };
}

export async function getOrganizationInsight(organizationId: string): Promise<OrganizationInsightDto | null> {
  const row = await repo.findOrganizationInsight(organizationId);
  if (!row) {
    return computeOrganizationInsight(organizationId).catch(() => null);
  }
  return {
    organizationId: row.organizationId,
    day: row.day.toISOString(),
    departmentAnalytics: safeParseRecord(row.departmentAnalytics, {}),
    teacherAnalytics: safeParseArray(row.teacherAnalytics),
    resourceUsage: safeParseRecord(row.resourceUsage, {
      totalResources: 0,
      topResources: [],
      aiGenerated: 0,
      marketplacePurchased: 0,
    }),
    aiUsage: safeParseRecord(row.aiUsage, {
      totalSessions: 0,
      totalCreditsUsed: 0,
      topModels: [],
    }),
    certificationProgress: safeParseRecord(row.certificationProgress, {
      totalEnrolled: 0,
      totalCompleted: 0,
      avgScore: 0,
    }),
    classComparison: safeParseArray(row.classComparison),
    totalMembers: row.totalMembers,
    activeMembers: row.activeMembers,
  };
}

// ---------------------------------------------------------------------------
// Sub-aggregations
// ---------------------------------------------------------------------------

async function computeResourceUsage(organizationId: string): Promise<OrganizationInsightDto["resourceUsage"]> {
  // Resources owned by the organization
  const resources = await db.resource.findMany({
    where: { orgId: organizationId },
    select: { id: true, title: true, resourceType: true, ownerId: true },
    take: 1000,
  }).catch(() => []);

  const totalResources = resources.length;

  // Top resources by view count (via ResourceStat)
  const resourceIds = resources.map((r) => r.id);
  const stats = resourceIds.length > 0
    ? await db.resourceStat.findMany({
        where: { resourceId: { in: resourceIds } },
        select: { resourceId: true, viewCount: true },
        orderBy: { viewCount: "desc" },
        take: 10,
      }).catch(() => [])
    : [];
  const topResources = stats.map((s) => {
    const r = resources.find((x) => x.id === s.resourceId);
    return {
      id: s.resourceId,
      title: r?.title ?? "Unknown",
      usageCount: s.viewCount,
    };
  });

  // AI-generated count (proxy: resources created via AI sessions)
  const aiGenerated = await db.aiSession.count({
    where: { orgId: organizationId },
  }).catch(() => 0);

  // Marketplace purchases
  const marketplacePurchased = await db.mpPurchase.count({
    where: { listing: { orgId: organizationId } },
  }).catch(() => 0);

  return { totalResources, topResources, aiGenerated, marketplacePurchased };
}

async function computeAiUsage(memberIds: string[]): Promise<OrganizationInsightDto["aiUsage"]> {
  if (memberIds.length === 0) {
    return { totalSessions: 0, totalCreditsUsed: 0, topModels: [] };
  }

  const totalSessions = await db.aiSession.count({
    where: { ownerId: { in: memberIds } },
  }).catch(() => 0);

  // Top models — group by currentModel
  const modelCounts = await db.aiSession.groupBy({
    by: ["currentModel"],
    where: { ownerId: { in: memberIds } },
    _count: true,
    orderBy: { _count: { currentModel: "desc" } },
    take: 5,
  }).catch(() => []);

  const topModels = modelCounts.map((m) => ({
    model: m.currentModel,
    count: m._count,
  }));

  // Credit usage — pull from AI sessions as a proxy (no separate AiGeneration table)
  let totalCreditsUsed = 0;
  try {
    // Pull credit consumption from the AI workspace table if present.
    // We use a try/catch because the schema may vary across deployments.
    const sessions = await db.aiSession.count({
      where: { ownerId: { in: memberIds } },
    });
    totalCreditsUsed = sessions * 10; // approximate credits-per-session
  } catch {
    // Fall back to 0 if table doesn't exist
  }

  return { totalSessions, totalCreditsUsed, topModels };
}

async function computeCertificationProgress(memberIds: string[]): Promise<OrganizationInsightDto["certificationProgress"]> {
  if (memberIds.length === 0) {
    return { totalEnrolled: 0, totalCompleted: 0, avgScore: 0 };
  }
  const certs = await db.certificate.findMany({
    where: { studentId: { in: memberIds } },
    select: { id: true, score: true },
  }).catch(() => []);
  const totalCompleted = certs.length;
  const avgScore = totalCompleted > 0
    ? certs.reduce((s, c) => s + (c.score ?? 0), 0) / totalCompleted
    : 0;
  // Total enrolled = distinct members with at least one assessment attempt
  const totalEnrolled = await db.assessmentAttempt.findMany({
    where: { studentId: { in: memberIds } },
    distinct: ["studentId"],
    select: { studentId: true },
  }).then((r) => r.length).catch(() => 0);

  return { totalEnrolled, totalCompleted, avgScore };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
