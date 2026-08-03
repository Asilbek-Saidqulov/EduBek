/**
 * EduBek — Platform Analytics Aggregators.
 *
 * Phase 4F.7: Cross-cutting intelligence aggregators that combine
 * signals from multiple subsystems into actionable insights.
 *
 *   • Curriculum Intelligence — missing/overrepresented standards,
 *     underrepresented concepts, demand trends
 *   • Marketplace Intelligence — best sellers, seasonality, pricing,
 *     refund risks, emerging subjects, underserved categories
 *   • Organization Intelligence — long-term trends in velocity, growth,
 *     quality, AI adoption, curriculum completion
 *
 * Reuses:
 *   • Phase 4F.5 Knowledge Intelligence (curriculum + concepts)
 *   • Phase 4F.4 Collaboration (org insights)
 *   • Phase 4F.7 FeedbackEvent (demand signals)
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  CurriculumIntelligenceDto,
  MarketplaceIntelligenceDto,
  OrganizationIntelligenceDto,
  PlatformInsightDto,
  InsightCategory,
  InsightSeverity,
} from "./types";

const log = getLogger("analytics");

// ---------------------------------------------------------------------------
// Curriculum Intelligence
// ---------------------------------------------------------------------------

export async function computeCurriculumIntelligence(input: {
  frameworkId?: string;
}): Promise<CurriculumIntelligenceDto> {
  const frameworkFilter = input.frameworkId ? { frameworkId: input.frameworkId } : undefined;

  // Missing standards (in KnowledgeGap with type 'uncovered_standard')
  const gaps = await db.knowledgeGap.findMany({
    where: { type: "uncovered_standard", status: "open" },
    select: { standardId: true, description: true, metadata: true },
    take: 100,
  }).catch(() => []);
  const missingStandards = await Promise.all(gaps.slice(0, 20).map(async (g) => {
    const std = g.standardId ? await db.curriculumStandard.findUnique({ where: { id: g.standardId }, select: { code: true, title: true } }).catch(() => null) : null;
    return {
      standardId: g.standardId ?? "",
      code: std?.code ?? "unknown",
      title: std?.title ?? g.description,
      demand: 1, // each gap represents 1 unit of demand
    };
  }));

  // Overrepresented standards (mapped to 3+ resources)
  const mappings = await db.curriculumMapping.findMany({
    where: frameworkFilter as any,
    select: { standardId: true, entityId: true },
  }).catch(() => []);
  const standardCounts = new Map<string, number>();
  for (const m of mappings) {
    standardCounts.set(m.standardId, (standardCounts.get(m.standardId) ?? 0) + 1);
  }
  const overrepresentedStandards = Array.from(standardCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([standardId, resourceCount]) => ({ standardId, code: standardId, resourceCount }))
    .sort((a, b) => b.resourceCount - a.resourceCount)
    .slice(0, 20);

  // Underrepresented concepts (concepts with 0-1 resources)
  const concepts = await db.concept.findMany({
    select: { id: true, name: true },
    take: 500,
  }).catch(() => []);
  const conceptResourceCounts = await db.resourceConcept.findMany({
    select: { conceptId: true },
    take: 5000,
  }).catch(() => []);
  const conceptCountMap = new Map<string, number>();
  for (const rc of conceptResourceCounts) {
    conceptCountMap.set(rc.conceptId, (conceptCountMap.get(rc.conceptId) ?? 0) + 1);
  }
  const underrepresentedConcepts = concepts
    .map((c) => ({ conceptId: c.id, name: c.name, resourceCount: conceptCountMap.get(c.id) ?? 0 }))
    .filter((c) => c.resourceCount <= 1)
    .slice(0, 20);

  // Curriculum drift — fraction of standards with no mappings
  const totalStandards = await db.curriculumStandard.count({ where: frameworkFilter as any }).catch(() => 0);
  const coveredStandards = standardCounts.size;
  const curriculumDrift = totalStandards > 0 ? 1 - coveredStandards / totalStandards : 0;

  // Demand (from feedback events — what subjects are users searching/studying)
  const recentFeedback = await db.feedbackEvent.findMany({
    where: {
      type: { in: ["lesson_opened", "quiz_completed", "search_success"] },
      occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { payload: true },
    take: 1000,
  }).catch(() => []);
  const subjectDemand = new Map<string, number>();
  for (const f of recentFeedback) {
    try {
      const payload = JSON.parse(f.payload || "{}");
      const subject = payload.subject ?? payload.query ?? "unknown";
      subjectDemand.set(subject, (subjectDemand.get(subject) ?? 0) + 1);
    } catch {
      // skip
    }
  }
  const teacherDemand = Array.from(subjectDemand.entries())
    .map(([subject, demand]) => ({ subject, demand }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 10);
  const studentDemand = teacherDemand; // same signal for now
  const aiDemand = teacherDemand; // same signal for now

  return {
    missingStandards,
    overrepresentedStandards,
    underrepresentedConcepts,
    curriculumDrift,
    teacherDemand,
    studentDemand,
    aiDemand,
  };
}

// ---------------------------------------------------------------------------
// Marketplace Intelligence
// ---------------------------------------------------------------------------

export async function computeMarketplaceIntelligence(): Promise<MarketplaceIntelligenceDto> {
  // Best sellers (by purchase count in last 30 days)
  const purchases = await db.feedbackEvent.findMany({
    where: { type: "marketplace_purchase", occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { entityId: true, payload: true },
    take: 5000,
  }).catch(() => []);
  const listingSales = new Map<string, { sales: number; revenue: number }>();
  for (const p of purchases) {
    try {
      const payload = JSON.parse(p.payload || "{}");
      const revenue = payload.pricePaid ?? 0;
      const entry = listingSales.get(p.entityId!) ?? { sales: 0, revenue: 0 };
      entry.sales += 1;
      entry.revenue += revenue;
      listingSales.set(p.entityId!, entry);
    } catch {
      // skip
    }
  }
  const bestSellers = await Promise.all(
    Array.from(listingSales.entries())
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 10)
      .map(async ([listingId, data]) => {
        const listing = await db.mpListing.findUnique({ where: { id: listingId }, select: { title: true } }).catch(() => null);
        return { listingId, title: listing?.title ?? "Unknown", sales: data.sales, revenue: data.revenue };
      }),
  );

  // Refund risks
  const refunds = await db.feedbackEvent.findMany({
    where: { type: "marketplace_refund", occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { entityId: true },
    take: 1000,
  }).catch(() => []);
  const refundCounts = new Map<string, number>();
  for (const r of refunds) {
    refundCounts.set(r.entityId!, (refundCounts.get(r.entityId!) ?? 0) + 1);
  }
  const refundRisks = await Promise.all(
    Array.from(refundCounts.entries())
      .map(async ([listingId, refundCount]) => {
        const listing = await db.mpListing.findUnique({ where: { id: listingId }, select: { title: true } }).catch(() => null);
        const sales = listingSales.get(listingId)?.sales ?? 1;
        const refundRate = refundCount / (sales + refundCount);
        return {
          listingId,
          title: listing?.title ?? "Unknown",
          refundRate,
          risk: refundRate > 0.3 ? "high" as const : refundRate > 0.1 ? "medium" as const : "low" as const,
        };
      }),
  );

  // Buyer satisfaction (from feedback events)
  const positiveEvents = await db.feedbackEvent.count({
    where: { type: "marketplace_purchase", outcome: "positive", occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  }).catch(() => 0);
  const totalEvents = await db.feedbackEvent.count({
    where: { type: "marketplace_purchase", occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  }).catch(() => 1);
  const buyerSatisfaction = totalEvents > 0 ? positiveEvents / totalEvents : 0.5;

  return {
    bestSellers,
    seasonality: [], // would require historical data
    pricingTrends: [], // would require price history
    refundRisks,
    emergingSubjects: [], // would require trend analysis
    underservedCategories: [], // would require category supply/demand analysis
    creatorQuality: [], // would require creator-level aggregation
    buyerSatisfaction,
  };
}

// ---------------------------------------------------------------------------
// Organization Intelligence
// ---------------------------------------------------------------------------

export async function computeOrganizationIntelligence(input: {
  organizationId: string;
}): Promise<OrganizationIntelligenceDto> {
  const { organizationId } = input;

  // Fetch historical snapshots (KnowledgeHealthSnapshot per day for 12 weeks)
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const healthSnapshots = await db.knowledgeHealthSnapshot.findMany({
    where: { organizationId, day: { gte: twelveWeeksAgo } },
    orderBy: { day: "asc" },
    select: { day: true, coverageScore: true, qualityScore: true, curriculumCompleteness: true, aiReadiness: true },
  }).catch(() => []);

  const trends = {
    learningVelocity: [] as Array<{ week: string; value: number }>,
    teacherGrowth: [] as Array<{ week: string; value: number }>,
    resourceQuality: healthSnapshots.map((s) => ({ week: s.day.toISOString().slice(0, 10), value: s.qualityScore })),
    aiAdoption: healthSnapshots.map((s) => ({ week: s.day.toISOString().slice(0, 10), value: s.aiReadiness })),
    curriculumCompletion: healthSnapshots.map((s) => ({ week: s.day.toISOString().slice(0, 10), value: s.curriculumCompleteness })),
  };

  // Department comparison
  const orgInsight = await db.organizationInsight.findFirst({
    where: { organizationId },
    orderBy: { day: "desc" },
    select: { departmentAnalytics: true },
  }).catch(() => null);
  let departmentComparison: Array<{ department: string; mastery: number; engagement: number }> = [];
  if (orgInsight) {
    try {
      const deptData = JSON.parse(orgInsight.departmentAnalytics || "{}");
      departmentComparison = Object.entries(deptData).map(([dept, metrics]: [string, any]) => ({
        department: dept,
        mastery: metrics.avgMastery ?? 0,
        engagement: metrics.engagementRate ?? 0,
      }));
    } catch {
      // skip
    }
  }

  // School comparison (within the org — compare classrooms)
  const classrooms = await db.classroom.findMany({
    where: { orgId: organizationId, status: "active" },
    select: { id: true, name: true },
  }).catch(() => []);
  const schoolComparison = await Promise.all(
    classrooms.map(async (c) => {
      const insight = await db.classInsight.findFirst({
        where: { classroomId: c.id },
        orderBy: { day: "desc" },
        select: { avgMastery: true, engagementRate: true },
      }).catch(() => null);
      return {
        schoolId: c.id,
        name: c.name,
        mastery: insight?.avgMastery ?? 0,
        engagement: insight?.engagementRate ?? 0,
      };
    }),
  );

  return {
    organizationId,
    trends,
    departmentComparison,
    schoolComparison,
    districtComparison: [], // would require multi-org aggregation
  };
}

// ---------------------------------------------------------------------------
// Platform Insights — generate cross-cutting insights
// ---------------------------------------------------------------------------

export async function generatePlatformInsights(): Promise<PlatformInsightDto[]> {
  const insights: PlatformInsightDto[] = [];

  // Curriculum insights
  const curriculum = await computeCurriculumIntelligence({}).catch(() => null);
  if (curriculum && curriculum.missingStandards.length > 0) {
    insights.push({
      id: "temp-curriculum-gaps",
      category: "curriculum" as InsightCategory,
      type: "missing_standards",
      title: `${curriculum.missingStandards.length} curriculum standards have no resources`,
      description: `The following standards need resources: ${curriculum.missingStandards.slice(0, 5).map((s) => s.code).join(", ")}.`,
      titleKey: "platformIntelligence.insight.curriculumGaps.title",
      descriptionKey: "platformIntelligence.insight.curriculumGaps.description",
      evidence: { evidence: [], metrics: { gapCount: curriculum.missingStandards.length }, recommendations: ["Generate resources for the top missing standards"] },
      confidence: 0.85,
      severity: "warning" as InsightSeverity,
      scopeType: null,
      scopeId: null,
      acknowledgedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  // Marketplace insights
  const marketplace = await computeMarketplaceIntelligence().catch(() => null);
  if (marketplace && marketplace.refundRisks.some((r) => r.risk === "high")) {
    insights.push({
      id: "temp-marketplace-refund-risk",
      category: "marketplace" as InsightCategory,
      type: "refund_risk",
      title: `${marketplace.refundRisks.filter((r) => r.risk === "high").length} listings have high refund risk`,
      description: `High refund rates detected on ${marketplace.refundRisks.filter((r) => r.risk === "high").length} listings.`,
      titleKey: "platformIntelligence.insight.refundRisk.title",
      descriptionKey: "platformIntelligence.insight.refundRisk.description",
      evidence: { evidence: [], metrics: { highRiskCount: marketplace.refundRisks.filter((r) => r.risk === "high").length }, recommendations: ["Review listing quality", "Consider delisting high-refund items"] },
      confidence: 0.8,
      severity: "warning" as InsightSeverity,
      scopeType: null,
      scopeId: null,
      acknowledgedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  // Search insights — high abandonment rate
  const searchOutcomes = await repo.findSearchOutcomes({ limit: 500 });
  if (searchOutcomes.length > 50) {
    const abandonedRate = searchOutcomes.filter((o) => o.abandoned).length / searchOutcomes.length;
    if (abandonedRate > 0.3) {
      insights.push({
        id: "temp-search-abandonment",
        category: "search" as InsightCategory,
        type: "high_abandonment",
        title: `Search abandonment rate is ${Math.round(abandonedRate * 100)}%`,
        description: `Users are abandoning ${Math.round(abandonedRate * 100)}% of searches without clicking — relevance may be low.`,
        titleKey: "platformIntelligence.insight.searchAbandonment.title",
        descriptionKey: "platformIntelligence.insight.searchAbandonment.description",
        evidence: { evidence: [], metrics: { abandonedRate }, recommendations: ["Boost semantic search weight", "Add more search aliases"] },
        confidence: 0.75,
        severity: "warning" as InsightSeverity,
        scopeType: null,
        scopeId: null,
        acknowledgedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Persist the insights
  for (const insight of insights) {
    await repo.createPlatformInsight({
      category: insight.category,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      titleKey: insight.titleKey ?? undefined,
      descriptionKey: insight.descriptionKey ?? undefined,
      evidence: JSON.stringify(insight.evidence),
      confidence: insight.confidence,
      severity: insight.severity,
    }).catch(() => undefined);
  }

  log.info("insights.generated", { count: insights.length });
  return insights;
}

export async function listPlatformInsights(input: {
  category?: InsightCategory;
  severity?: InsightSeverity;
  unacknowledgedOnly?: boolean;
  limit?: number;
}): Promise<PlatformInsightDto[]> {
  const rows = await repo.findPlatformInsights({
    category: input.category,
    severity: input.severity,
    unacknowledgedOnly: input.unacknowledgedOnly,
    limit: input.limit,
  });
  return rows.map((r) => ({
    id: r.id,
    category: r.category as InsightCategory,
    type: r.type,
    title: r.title,
    description: r.description,
    titleKey: r.titleKey,
    descriptionKey: r.descriptionKey,
    evidence: safeParseEvidence(r.evidence),
    confidence: r.confidence,
    severity: r.severity as InsightSeverity,
    scopeType: r.scopeType,
    scopeId: r.scopeId,
    acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function acknowledgeInsight(id: string): Promise<void> {
  await repo.acknowledgePlatformInsight(id);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseEvidence(raw: string | null): PlatformInsightDto["evidence"] {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
