/**
 * EduBek — Global AI Context Builder.
 *
 * Before ANY AI call, this module gathers context from every relevant
 * subsystem and returns a single `AIContext` object that every agent uses.
 *
 * Reuses — does NOT duplicate — services from:
 *   • Knowledge Intelligence   • Learning Planner
 *   • Digital Twins             • Discovery / Semantic Search
 *   • Platform Intelligence     • Civilization Engine
 *   • Research Platform         • Global Intelligence
 *   • Marketplace               • Education OS
 *
 * Every snapshot is intentionally small — we strip DB rows down to the
 * handful of fields an agent actually needs at prompt-build time.
 *
 * Every snapshot builder is wrapped in try/catch so a single subsystem
 * failure never blocks the context build. If a subsystem is unavailable,
 * its snapshot is simply omitted from the returned context.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import type { AuthContext } from "@/features/rbac";
import type {
  AIContext, CurriculumSnapshot, KnowledgeGraphSnapshot,
  LearningHistorySnapshot, DigitalTwinSnapshot, InterestProfileSnapshot,
  MasterySnapshot, RecommendationsSnapshot, PlannerSnapshot,
  MarketplaceSnapshot, CivilizationMemorySnapshot, PlatformIntelligenceSnapshot,
  ResearchSnapshot, GlobalIntelligenceSnapshot,
} from "./types";

const log = getLogger("context-builder");

// ===========================================================================
// Public API
// ===========================================================================

export interface BuildContextInput {
  ctx: AuthContext;
  /** Organization ID (passed separately because AuthContext is org-agnostic). */
  organizationId?: string | null;
  scope?: AIContext["scope"];
  hints?: Record<string, unknown>;
  /** Skip subsystems the caller doesn't need (perf optimization). */
  skip?: Array<"curriculum" | "knowledgeGraph" | "learningHistory" | "digitalTwin" | "interestProfile" | "mastery" | "recommendations" | "planner" | "marketplace" | "civilizationMemory" | "platformIntelligence" | "research" | "globalIntelligence">;
}

export async function buildAIContext(input: BuildContextInput): Promise<AIContext> {
  const traceId = (input.hints?.traceId as string | undefined) ?? randomUUID();
  const skip = new Set(input.skip ?? []);
  const userId = input.ctx.userId ?? null;
  const orgId = input.organizationId ?? null;

  const startedAt = Date.now();
  log.debug("context.build_start", { traceId, userId, orgId, scope: input.scope });

  const context: AIContext = {
    traceId,
    user: userId ? {
      id: userId,
      email: input.ctx.email,
      locale: input.ctx.locale,
      roles: input.ctx.platformRoles,
      permissions: input.ctx.personalPermissionOverrides.map(p => p.permission),
    } : null,
    organizationId: orgId,
    scope: input.scope ?? {},
    hints: input.hints ?? {},
    assembledAt: new Date().toISOString(),
  };

  // Run all subsystem snapshots in parallel — each is wrapped in try/catch
  // so a single failure never blocks the context build.
  const tasks: Array<Promise<void>> = [];

  if (!skip.has("curriculum")) tasks.push(safe("curriculum", async () => {
    context.curriculum = await buildCurriculumSnapshot(userId, orgId);
  }));
  if (!skip.has("knowledgeGraph")) tasks.push(safe("knowledgeGraph", async () => {
    context.knowledgeGraph = await buildKnowledgeGraphSnapshot();
  }));
  if (!skip.has("learningHistory")) tasks.push(safe("learningHistory", async () => {
    context.learningHistory = await buildLearningHistorySnapshot(userId);
  }));
  if (!skip.has("digitalTwin")) tasks.push(safe("digitalTwin", async () => {
    context.digitalTwin = await buildDigitalTwinSnapshot(input.scope ?? {});
  }));
  if (!skip.has("interestProfile")) tasks.push(safe("interestProfile", async () => {
    context.interestProfile = await buildInterestProfileSnapshot(userId);
  }));
  if (!skip.has("mastery")) tasks.push(safe("mastery", async () => {
    context.mastery = await buildMasterySnapshot(userId);
  }));
  if (!skip.has("recommendations")) tasks.push(safe("recommendations", async () => {
    context.recommendations = await buildRecommendationsSnapshot(userId);
  }));
  if (!skip.has("planner")) tasks.push(safe("planner", async () => {
    context.planner = await buildPlannerSnapshot(userId);
  }));
  if (!skip.has("marketplace")) tasks.push(safe("marketplace", async () => {
    context.marketplace = await buildMarketplaceSnapshot(userId);
  }));
  if (!skip.has("civilizationMemory")) tasks.push(safe("civilizationMemory", async () => {
    context.civilizationMemory = await buildCivilizationMemorySnapshot(orgId);
  }));
  if (!skip.has("platformIntelligence")) tasks.push(safe("platformIntelligence", async () => {
    context.platformIntelligence = await buildPlatformIntelligenceSnapshot();
  }));
  if (!skip.has("research")) tasks.push(safe("research", async () => {
    context.research = await buildResearchSnapshot(userId);
  }));
  if (!skip.has("globalIntelligence")) tasks.push(safe("globalIntelligence", async () => {
    context.globalIntelligence = await buildGlobalIntelligenceSnapshot();
  }));

  await Promise.allSettled(tasks);
  log.debug("context.build_done", { traceId, durationMs: Date.now() - startedAt });
  return context;
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<void> {
  try { await fn(); }
  catch (err) {
    log.warn("context.snapshot_failed", { label, error: (err as Error).message });
  }
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// Per-subsystem snapshot builders
// ===========================================================================

async function buildCurriculumSnapshot(userId: string | null, orgId: string | null): Promise<CurriculumSnapshot> {
  try {
    const conceptCount = await db.concept.count();
    const coverageRows = orgId
      ? await db.knowledgeCoverage.findMany({
        where: { scopeType: "organization", scopeId: orgId },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { frameworkId: true, coveragePct: true, details: true },
      })
      : [];
    const frameworksAligned = Array.from(new Set(coverageRows.map(r => r.frameworkId).filter(Boolean))) as string[];
    const coveragePercent = coverageRows.length > 0
      ? Math.round(coverageRows.reduce((s, r) => s + (r.coveragePct ?? 0), 0) / coverageRows.length)
      : 0;
    const pendingTopics: string[] = [];
    for (const r of coverageRows) {
      const details = safeParse<Record<string, unknown>>(r.details, {});
      const uncovered = Array.isArray(details.uncoveredStandardIds) ? details.uncoveredStandardIds : [];
      for (const u of uncovered) {
        if (typeof u === "string") pendingTopics.push(u);
      }
    }
    return {
      conceptsCovered: conceptCount,
      frameworksAligned,
      coveragePercent,
      pendingTopics: pendingTopics.slice(0, 10),
    };
  } catch {
    return { conceptsCovered: 0, frameworksAligned: [], coveragePercent: 0, pendingTopics: [] };
  }
}

async function buildKnowledgeGraphSnapshot(): Promise<KnowledgeGraphSnapshot> {
  try {
    const totalNodes = await db.concept.count();
    const totalEdges = await db.conceptRelationship.count();
    const healthRows = await db.knowledgeHealthSnapshot.findMany({
      take: 10,
      orderBy: { day: "desc" },
      select: { coverageScore: true, qualityScore: true, organizationId: true },
    });
    const weakTopics = healthRows
      .filter(r => r.coverageScore < 0.6)
      .map(r => ({ topic: `org:${r.organizationId}`, score: r.coverageScore }))
      .slice(0, 5);
    const gapRows = await db.knowledgeGap.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { description: true, type: true },
    });
    const prerequisiteGaps = gapRows
      .filter(r => r.type === "missing_prerequisite")
      .map(r => r.description)
      .slice(0, 10);
    return { totalNodes, totalEdges, weakTopics, prerequisiteGaps };
  } catch {
    return { totalNodes: 0, totalEdges: 0, weakTopics: [], prerequisiteGaps: [] };
  }
}

async function buildLearningHistorySnapshot(userId: string | null): Promise<LearningHistorySnapshot> {
  if (!userId) return { recentSessions: 0, averageScore: 0, timeSpentMinutes: 0, lastActive: null };
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions = await db.learningSession.findMany({
      where: { studentId: userId, startedAt: { gte: since } },
      take: 50,
      orderBy: { startedAt: "desc" },
      select: { durationMs: true, startedAt: true },
    });
    const attempts = await db.assessmentAttempt.findMany({
      where: { studentId: userId, status: "graded" },
      take: 30,
      orderBy: { updatedAt: "desc" },
      select: { score: true },
    });
    const totalScore = attempts.reduce((s, a) => s + (a.score ?? 0), 0);
    const averageScore = attempts.length > 0 ? Math.round((totalScore / attempts.length) * 100) / 100 : 0;
    const totalMs = sessions.reduce((s, x) => s + (x.durationMs ?? 0), 0);
    const lastActive = sessions[0]?.startedAt?.toISOString() ?? null;
    return {
      recentSessions: sessions.length,
      averageScore,
      timeSpentMinutes: Math.round(totalMs / 60000),
      lastActive,
    };
  } catch {
    return { recentSessions: 0, averageScore: 0, timeSpentMinutes: 0, lastActive: null };
  }
}

async function buildDigitalTwinSnapshot(scope: AIContext["scope"]): Promise<DigitalTwinSnapshot> {
  try {
    let twinType: "student" | "classroom" | null = null;
    let entityId: string | null = null;
    if (scope?.studentId) {
      twinType = "student";
      entityId = scope.studentId;
    } else if (scope?.classroomId) {
      twinType = "classroom";
      entityId = scope.classroomId;
    }
    if (!twinType || !entityId) {
      return { twinType: null, twinId: null, stateSummary: {}, predictions: [] };
    }
    const twin = await db.digitalTwin.findFirst({
      where: { twinType, entityId, active: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, state: true },
    });
    if (!twin) {
      return { twinType: null, twinId: null, stateSummary: {}, predictions: [] };
    }
    const state = safeParse<Record<string, unknown>>(twin.state, {});
    return {
      twinType,
      twinId: twin.id,
      stateSummary: state,
      predictions: Array.isArray((state as Record<string, unknown>).predictions)
        ? ((state as Record<string, unknown>).predictions as DigitalTwinSnapshot["predictions"])
        : [],
    };
  } catch {
    return { twinType: null, twinId: null, stateSummary: {}, predictions: [] };
  }
}

async function buildInterestProfileSnapshot(userId: string | null): Promise<InterestProfileSnapshot> {
  if (!userId) return { topInterests: [], preferredFormats: [], preferredDifficulty: "intermediate" };
  try {
    // Pull from UserInterestProfile if available — note this model only has interests/mastery/topicAffinity
    const profile = await db.userInterestProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { interests: true, mastery: true, topicAffinity: true },
    });
    if (profile) {
      const interestsMap = safeParse<Record<string, number>>(profile.interests, {});
      const topInterests = Object.entries(interestsMap)
        .map(([tag, weight]) => ({ tag, weight: Number(weight) }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);
      return {
        topInterests,
        preferredFormats: [], // not stored in this model
        preferredDifficulty: "intermediate",
      };
    }
    // Fallback — derive from recent resource interactions
    const recent = await db.learningSession.findMany({
      where: { studentId: userId },
      take: 20,
      orderBy: { startedAt: "desc" },
      select: { resourceId: true },
    });
    const resourceIds = Array.from(new Set(recent.map(r => r.resourceId).filter(Boolean))) as string[];
    const resources = resourceIds.length > 0
      ? await db.resource.findMany({
        where: { id: { in: resourceIds } },
        select: { resourceType: true, metadata: true },
      })
      : [];
    const formatCounts = new Map<string, number>();
    for (const r of resources) {
      formatCounts.set(r.resourceType, (formatCounts.get(r.resourceType) ?? 0) + 1);
    }
    const preferredFormats = Array.from(formatCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f);
    return { topInterests: [], preferredFormats, preferredDifficulty: "intermediate" };
  } catch {
    return { topInterests: [], preferredFormats: [], preferredDifficulty: "intermediate" };
  }
}

async function buildMasterySnapshot(userId: string | null): Promise<MasterySnapshot> {
  if (!userId) return { overallMastery: 0, masteredTopics: [], developingTopics: [], strugglingTopics: [] };
  try {
    const rows = await db.conceptMastery.findMany({
      where: { userId },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: { conceptId: true, mastery: true },
    });
    if (rows.length === 0) {
      return { overallMastery: 0, masteredTopics: [], developingTopics: [], strugglingTopics: [] };
    }
    const mastered: string[] = [];
    const developing: string[] = [];
    const struggling: string[] = [];
    let total = 0;
    for (const r of rows) {
      total += r.mastery;
      if (r.mastery >= 0.8) mastered.push(r.conceptId);
      else if (r.mastery >= 0.5) developing.push(r.conceptId);
      else struggling.push(r.conceptId);
    }
    return {
      overallMastery: Math.round((total / rows.length) * 100) / 100,
      masteredTopics: mastered.slice(0, 10),
      developingTopics: developing.slice(0, 10),
      strugglingTopics: struggling.slice(0, 10),
    };
  } catch {
    return { overallMastery: 0, masteredTopics: [], developingTopics: [], strugglingTopics: [] };
  }
}

async function buildRecommendationsSnapshot(userId: string | null): Promise<RecommendationsSnapshot> {
  if (!userId) return { personalized: [], nextSteps: [] };
  try {
    const rows = await db.recommendation.findMany({
      where: { userId },
      take: 10,
      orderBy: { score: "desc" },
      select: { id: true, entityId: true, entityType: true, score: true, reason: true },
    });
    return {
      personalized: rows.map(r => ({
        id: r.id, title: `${r.entityType}:${r.entityId}`, score: r.score, reason: r.reason ?? "",
      })),
      nextSteps: rows.slice(0, 3).map(r => ({ id: r.id, title: r.entityId, type: r.entityType })),
    };
  } catch {
    return { personalized: [], nextSteps: [] };
  }
}

async function buildPlannerSnapshot(userId: string | null): Promise<PlannerSnapshot> {
  if (!userId) return { activeGoals: 0, overdueTasks: 0, streakDays: 0, burnoutRisk: 0, nextMilestone: null };
  try {
    const activeGoals = await db.learningGoal.count({
      where: { userId, achievedAt: null },
    });
    const streak = await db.userStreak.findUnique({ where: { userId } });
    const milestone = await db.learningMilestone.findFirst({
      where: { userId },
      orderBy: { achievedAt: "desc" },
      select: { title: true, achievedAt: true },
    });
    return {
      activeGoals,
      overdueTasks: 0, // computed by planner service; left as 0 here
      streakDays: streak?.currentStreak ?? 0,
      burnoutRisk: 0,
      nextMilestone: milestone ? { title: milestone.title, date: milestone.achievedAt.toISOString() } : null,
    };
  } catch {
    return { activeGoals: 0, overdueTasks: 0, streakDays: 0, burnoutRisk: 0, nextMilestone: null };
  }
}

async function buildMarketplaceSnapshot(userId: string | null): Promise<MarketplaceSnapshot> {
  try {
    const installedApps = userId
      ? await db.extensionInstall.count({ where: { userId, status: { not: "uninstalled" } } })
      : 0;
    const totalApps = await db.marketplaceApp.count({ where: { status: "published" } });
    return {
      relevantApps: totalApps,
      installedApps,
      trendingTopics: [],
    };
  } catch {
    return { relevantApps: 0, installedApps: 0, trendingTopics: [] };
  }
}

async function buildCivilizationMemorySnapshot(orgId: string | null): Promise<CivilizationMemorySnapshot> {
  if (!orgId) return { totalMemories: 0, recentDecisions: 0, activePolicies: 0, strategicHorizon: null };
  try {
    const totalMemories = await db.institutionalMemory.count({ where: { organizationId: orgId } });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDecisions = await db.decisionAnalysis.count({
      where: { organizationId: orgId, createdAt: { gte: since } },
    });
    const activePolicies = await db.educationalPolicy.count({
      where: { organizationId: orgId, status: "active" },
    });
    const latestPlan = await db.strategicPlan.findFirst({
      where: { organizationId: orgId, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { horizon: true },
    });
    return {
      totalMemories, recentDecisions, activePolicies,
      strategicHorizon: latestPlan?.horizon ?? null,
    };
  } catch {
    return { totalMemories: 0, recentDecisions: 0, activePolicies: 0, strategicHorizon: null };
  }
}

async function buildPlatformIntelligenceSnapshot(): Promise<PlatformIntelligenceSnapshot> {
  try {
    const latestHealth = await db.healthSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
      select: { status: true },
    });
    const activeExperiments = await db.platformExperiment.count({
      where: { status: "running" },
    });
    const recentInsights = await db.platformInsight.count({
      where: { acknowledgedAt: null },
    });
    const recentOpt = await db.optimizationSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
      select: { confidence: true, improvementPct: true },
    });
    const rawStatus = latestHealth?.status ?? "unknown";
    // Map "down" → "critical"; everything else passes through
    const healthStatus: PlatformIntelligenceSnapshot["healthStatus"] =
      rawStatus === "down" ? "critical"
      : rawStatus === "healthy" || rawStatus === "degraded" || rawStatus === "critical"
        ? rawStatus
        : "unknown";
    return {
      healthStatus,
      activeExperiments,
      recentInsights,
      optimizationScore: recentOpt?.confidence ?? 0,
    };
  } catch {
    return { healthStatus: "unknown", activeExperiments: 0, recentInsights: 0, optimizationScore: 0 };
  }
}

async function buildResearchSnapshot(userId: string | null): Promise<ResearchSnapshot> {
  if (!userId) return { activeProjects: 0, recentPublications: 0, pendingReviews: 0 };
  try {
    // ResearchProject uses `principalInvestigator` (string userId) instead of ownerId
    const activeProjects = await db.researchProject.count({
      where: { principalInvestigator: userId, status: "active" },
    });
    // PublicationDraft doesn't have ownerId — count by status only
    const recentPublications = await db.publicationDraft.count({
      where: { status: "published" },
    });
    const pendingReviews = await db.peerReview.count({
      where: { reviewerId: userId, status: "pending" },
    });
    return { activeProjects, recentPublications, pendingReviews };
  } catch {
    return { activeProjects: 0, recentPublications: 0, pendingReviews: 0 };
  }
}

async function buildGlobalIntelligenceSnapshot(): Promise<GlobalIntelligenceSnapshot> {
  try {
    const foundationModels = await db.foundationModel.count({ where: { status: "active" } });
    const globalBenchmarks = await db.globalBenchmark.count();
    const collectiveInsights = await db.collectiveInsight.count();
    const networkParticipation = await db.networkParticipation.count();
    return {
      networkParticipation, foundationModelsAvailable: foundationModels,
      globalBenchmarks, collectiveInsights,
    };
  } catch {
    return { networkParticipation: 0, foundationModelsAvailable: 0, globalBenchmarks: 0, collectiveInsights: 0 };
  }
}
