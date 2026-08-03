/**
 * EduBek — Educational Knowledge Health.
 *
 * Phase 4F.5: Computes org-level knowledge health metrics:
 *
 *   • Coverage score (avg curriculum coverage across frameworks)
 *   • Quality score (avg resource quality)
 *   • Curriculum completeness (fraction of standards with mapped resources)
 *   • Knowledge graph density (edges / max possible edges)
 *   • Resource freshness (fraction updated in last 90 days)
 *   • AI readiness (fraction with AI-extracted concepts)
 *   • Student mastery distribution (mastered / learning / weak / never)
 *   • Teacher contribution analytics (resource count + avg quality per teacher)
 *
 * The snapshot is persisted daily for trend analysis.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { KnowledgeHealthDto, MasteryDistribution, TeacherContribution } from "./types";

const log = getLogger("knowledge-health");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function computeKnowledgeHealth(organizationId: string): Promise<KnowledgeHealthDto> {
  // Fetch all members of the org
  const memberships = await db.organizationMembership.findMany({
    where: { orgId: organizationId },
    select: { userId: true },
  }).catch(() => []);
  const memberIds = memberships.map((m) => m.userId);

  // Fetch all classrooms owned by the org
  const classrooms = await db.classroom.findMany({
    where: { orgId: organizationId, status: "active" },
    select: { id: true, teacherId: true },
  }).catch(() => []);
  const classroomIds = classrooms.map((c) => c.id);
  const teacherIds = Array.from(new Set(classrooms.map((c) => c.teacherId)));

  // Fetch all resources owned by the org
  const resources = await db.resource.findMany({
    where: { orgId: organizationId },
    select: { id: true, ownerId: true, updatedAt: true },
  }).catch(() => []);
  const resourceIds = resources.map((r) => r.id);

  // --- Coverage score (avg across all coverage snapshots for this org) ---
  const coverageRows = await db.knowledgeCoverage.findMany({
    where: { scopeType: "organization", scopeId: organizationId },
    select: { coveragePct: true },
  }).catch(() => []);
  const coverageScore = coverageRows.length > 0
    ? coverageRows.reduce((s, r) => s + r.coveragePct, 0) / coverageRows.length / 100
    : 0;

  // --- Quality score (avg of all ResourceQuality rows for org resources) ---
  const qualityRows = resourceIds.length > 0
    ? await db.resourceQuality.findMany({
        where: { entityType: "resource", entityId: { in: resourceIds } },
        select: { overall: true },
      }).catch(() => [])
    : [];
  const qualityScore = qualityRows.length > 0
    ? qualityRows.reduce((s, r) => s + r.overall, 0) / qualityRows.length
    : 0;

  // --- Curriculum completeness (fraction of standards with ≥1 mapping) ---
  const allStandards = await db.curriculumStandard.count().catch(() => 0);
  const mappedStandards = await db.curriculumMapping.findMany({
    where: { entityType: "resource", entityId: { in: resourceIds } },
    distinct: ["standardId"],
    select: { standardId: true },
  }).catch(() => []);
  const curriculumCompleteness = allStandards > 0
    ? mappedStandards.length / allStandards
    : 0;

  // --- Knowledge graph density (edges / max possible edges among org nodes) ---
  const orgNodes = await db.knowledgeGraphNode.findMany({
    where: {
      OR: [
        { entityType: "resource", entityId: { in: resourceIds } },
        { entityType: "classroom", entityId: { in: classroomIds } },
      ],
    },
    select: { id: true },
  }).catch(() => []);
  const orgNodeIds = orgNodes.map((n) => n.id);
  const edgeCount = orgNodeIds.length > 0
    ? await db.knowledgeGraphEdge.count({
        where: {
          OR: [
            { fromNodeId: { in: orgNodeIds } },
            { toNodeId: { in: orgNodeIds } },
          ],
        },
      }).catch(() => 0)
    : 0;
  const maxPossibleEdges = orgNodeIds.length > 1
    ? (orgNodeIds.length * (orgNodeIds.length - 1)) / 2
    : 1;
  const graphDensity = Math.min(1, edgeCount / maxPossibleEdges);

  // --- Resource freshness (fraction updated in last 90 days) ---
  const ninetyDaysAgo = new Date(Date.now() - 90 * MS_PER_DAY);
  const freshResources = resources.filter((r) => r.updatedAt >= ninetyDaysAgo).length;
  const resourceFreshness = resources.length > 0 ? freshResources / resources.length : 0;

  // --- AI readiness (fraction with AI-extracted concepts) ---
  const resourcesWithConcepts = resourceIds.length > 0
    ? await db.resourceConcept.findMany({
        where: { entityType: "resource", entityId: { in: resourceIds } },
        distinct: ["entityId"],
        select: { entityId: true },
      }).catch(() => [])
    : [];
  const aiReadiness = resources.length > 0 ? resourcesWithConcepts.length / resources.length : 0;

  // --- Student mastery distribution ---
  const masteryDistribution = await computeMasteryDistribution(memberIds);

  // --- Teacher contribution analytics ---
  const teacherContributions = await computeTeacherContributions(teacherIds, resources);

  // Persist snapshot
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await repo.upsertKnowledgeHealthSnapshot({
    organizationId,
    day: today,
    coverageScore: round(coverageScore, 4),
    qualityScore: round(qualityScore, 4),
    curriculumCompleteness: round(curriculumCompleteness, 4),
    graphDensity: round(graphDensity, 4),
    resourceFreshness: round(resourceFreshness, 4),
    aiReadiness: round(aiReadiness, 4),
    masteryDistribution: JSON.stringify(masteryDistribution),
    teacherContributions: JSON.stringify(teacherContributions),
  });

  log.info("health.computed", {
    organizationId,
    coverageScore: round(coverageScore, 2),
    qualityScore: round(qualityScore, 2),
    graphDensity: round(graphDensity, 2),
    aiReadiness: round(aiReadiness, 2),
  });

  return {
    organizationId,
    day: today.toISOString(),
    coverageScore: round(coverageScore, 4),
    qualityScore: round(qualityScore, 4),
    curriculumCompleteness: round(curriculumCompleteness, 4),
    graphDensity: round(graphDensity, 4),
    resourceFreshness: round(resourceFreshness, 4),
    aiReadiness: round(aiReadiness, 4),
    masteryDistribution,
    teacherContributions,
  };
}

export async function getKnowledgeHealth(organizationId: string, refresh = false): Promise<KnowledgeHealthDto | null> {
  if (refresh) {
    return computeKnowledgeHealth(organizationId);
  }
  const row = await repo.findKnowledgeHealthSnapshot(organizationId);
  if (!row) {
    return computeKnowledgeHealth(organizationId);
  }
  return {
    organizationId: row.organizationId,
    day: row.day.toISOString(),
    coverageScore: row.coverageScore,
    qualityScore: row.qualityScore,
    curriculumCompleteness: row.curriculumCompleteness,
    graphDensity: row.graphDensity,
    resourceFreshness: row.resourceFreshness,
    aiReadiness: row.aiReadiness,
    masteryDistribution: safeParseMastery(row.masteryDistribution),
    teacherContributions: safeParseTeachers(row.teacherContributions),
  };
}

// ---------------------------------------------------------------------------
// Sub-aggregations
// ---------------------------------------------------------------------------

async function computeMasteryDistribution(memberIds: string[]): Promise<MasteryDistribution> {
  if (memberIds.length === 0) {
    return { mastered: 0, learning: 0, weak: 0, never: 0 };
  }
  const masteries = await db.conceptMastery.findMany({
    where: { userId: { in: memberIds } },
    select: { level: true },
  }).catch(() => []);

  const distribution: MasteryDistribution = { mastered: 0, learning: 0, weak: 0, never: 0 };
  for (const m of masteries) {
    switch (m.level) {
      case "mastered": distribution.mastered += 1; break;
      case "learning": distribution.learning += 1; break;
      case "weak": distribution.weak += 1; break;
      case "never": case "forgotten": distribution.never += 1; break;
      default: break;
    }
  }
  return distribution;
}

async function computeTeacherContributions(
  teacherIds: string[],
  resources: Array<{ id: string; ownerId: string }>,
): Promise<TeacherContribution[]> {
  if (teacherIds.length === 0) return [];

  const contributions: TeacherContribution[] = [];
  for (const teacherId of teacherIds) {
    const teacherResources = resources.filter((r) => r.ownerId === teacherId);
    if (teacherResources.length === 0) continue;

    const resourceIds = teacherResources.map((r) => r.id);
    const qualityRows = await db.resourceQuality.findMany({
      where: { entityType: "resource", entityId: { in: resourceIds } },
      select: { overall: true },
    }).catch(() => []);

    const avgQuality = qualityRows.length > 0
      ? qualityRows.reduce((s, r) => s + r.overall, 0) / qualityRows.length
      : 0.5;

    contributions.push({
      teacherId,
      resourceCount: teacherResources.length,
      avgQuality: round(avgQuality, 3),
    });
  }

  return contributions.sort((a, b) => b.resourceCount - a.resourceCount);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function safeParseMastery(raw: string | null): MasteryDistribution {
  if (!raw) return { mastered: 0, learning: 0, weak: 0, never: 0 };
  try {
    return JSON.parse(raw) as MasteryDistribution;
  } catch {
    return { mastered: 0, learning: 0, weak: 0, never: 0 };
  }
}

function safeParseTeachers(raw: string | null): TeacherContribution[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
