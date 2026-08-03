/**
 * EduBek — Platform Intelligence repository.
 *
 * Direct Prisma access for the 12 Phase 4F.7 models:
 *   FeedbackEvent, LearningSignal, RecommendationOutcome, SearchOutcome,
 *   PromptEvaluation, PlatformExperiment, ExperimentAssignment,
 *   OptimizationSnapshot, ForecastSnapshot, HealthSnapshot,
 *   AuditEvent, PlatformInsight.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Feedback Events
// ---------------------------------------------------------------------------

export async function createFeedbackEvent(input: {
  type: string;
  userId?: string;
  scopeType?: string;
  scopeId?: string;
  entityType?: string;
  entityId?: string;
  payload?: string;
  outcome?: string;
  value?: number;
  experimentId?: string;
  variant?: string;
}) {
  return db.feedbackEvent.create({ data: input });
}

export async function findFeedbackEvents(input: {
  type?: string;
  userId?: string;
  scopeType?: string;
  scopeId?: string;
  entityType?: string;
  entityId?: string;
  outcome?: string;
  experimentId?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.type) where.type = input.type;
  if (input.userId) where.userId = input.userId;
  if (input.scopeType) where.scopeType = input.scopeType;
  if (input.scopeId) where.scopeId = input.scopeId;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.outcome) where.outcome = input.outcome;
  if (input.experimentId) where.experimentId = input.experimentId;
  if (input.since) where.occurredAt = { gte: input.since };
  return db.feedbackEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: input.limit ?? 100,
  });
}

export async function countFeedbackEvents(since?: Date): Promise<number> {
  return db.feedbackEvent.count({
    where: since ? { occurredAt: { gte: since } } : undefined,
  });
}

export async function countFeedbackEventsByType(since?: Date): Promise<Record<string, number>> {
  const rows = await db.feedbackEvent.groupBy({
    by: ["type"],
    where: since ? { occurredAt: { gte: since } } : undefined,
    _count: true,
  });
  const result: Record<string, number> = {};
  for (const r of rows) result[r.type] = r._count;
  return result;
}

// ---------------------------------------------------------------------------
// Learning Signals
// ---------------------------------------------------------------------------

export async function findLearningSignal(input: {
  signalType: string;
  entityType: string;
  entityId: string;
  secondaryEntityType?: string | null;
  secondaryEntityId?: string | null;
}) {
  return db.learningSignal.findUnique({
    where: {
      signalType_entityType_entityId_secondaryEntityType_secondaryEntityId: {
        signalType: input.signalType,
        entityType: input.entityType,
        entityId: input.entityId,
        secondaryEntityType: (input.secondaryEntityType ?? null) as any,
        secondaryEntityId: (input.secondaryEntityId ?? null) as any,
      },
    },
  });
}

export async function upsertLearningSignal(input: {
  signalType: string;
  entityType: string;
  entityId: string;
  secondaryEntityType?: string | null;
  secondaryEntityId?: string | null;
  impressions?: number;
  clicks?: number;
  completions?: number;
  dismissals?: number;
  ignores?: number;
  ctr?: number;
  satisfaction?: number;
  recentOutcomes?: string;
  lastComputedAt?: Date;
}) {
  return db.learningSignal.upsert({
    where: {
      signalType_entityType_entityId_secondaryEntityType_secondaryEntityId: {
        signalType: input.signalType,
        entityType: input.entityType,
        entityId: input.entityId,
        secondaryEntityType: (input.secondaryEntityType ?? null) as any,
        secondaryEntityId: (input.secondaryEntityId ?? null) as any,
      },
    },
    create: input as any,
    update: input as any,
  });
}

export async function findLearningSignals(input: {
  signalType?: string;
  entityType?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.learningSignal.findMany({
    where,
    orderBy: { lastComputedAt: "desc" },
    take: limit ?? 100,
  });
}

export async function countLearningSignals(): Promise<number> {
  return db.learningSignal.count();
}

// ---------------------------------------------------------------------------
// Recommendation Outcomes
// ---------------------------------------------------------------------------

export async function createRecommendationOutcome(input: {
  userId: string;
  entityType: string;
  entityId: string;
  strategy: string;
  position: number;
  outcome: string;
  timeSpentMs?: number;
  confidence?: number;
  experimentId?: string;
  variant?: string;
}) {
  return db.recommendationOutcome.create({ data: input });
}

export async function findRecommendationOutcomes(input: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  strategy?: string;
  outcome?: string;
  experimentId?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.userId) where.userId = input.userId;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.strategy) where.strategy = input.strategy;
  if (input.outcome) where.outcome = input.outcome;
  if (input.experimentId) where.experimentId = input.experimentId;
  if (input.since) where.occurredAt = { gte: input.since };
  return db.recommendationOutcome.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: input.limit ?? 500,
  });
}

// ---------------------------------------------------------------------------
// Search Outcomes
// ---------------------------------------------------------------------------

export async function createSearchOutcome(input: {
  userId?: string;
  query: string;
  resultCount: number;
  clickedPosition?: number;
  clickedEntityId?: string;
  clickedEntityType?: string;
  reformulated?: boolean;
  abandoned?: boolean;
  timeSpentMs?: number;
  outcome?: string;
  experimentId?: string;
  variant?: string;
}) {
  return db.searchOutcome.create({ data: input });
}

export async function findSearchOutcomes(input: {
  userId?: string;
  query?: string;
  outcome?: string;
  experimentId?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.userId) where.userId = input.userId;
  if (input.query) where.query = { contains: input.query };
  if (input.outcome) where.outcome = input.outcome;
  if (input.experimentId) where.experimentId = input.experimentId;
  if (input.since) where.occurredAt = { gte: input.since };
  return db.searchOutcome.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: input.limit ?? 500,
  });
}

// ---------------------------------------------------------------------------
// Prompt Evaluations
// ---------------------------------------------------------------------------

export async function createPromptEvaluation(input: {
  promptTemplateId?: string;
  promptVersion?: string;
  provider: string;
  model: string;
  generationId?: string;
  acceptanceScore?: number;
  regenerationRate?: number;
  editRate?: number;
  userRating?: number;
  costCredits?: number;
  latencyMs?: number;
  locale?: string;
  overallQuality?: number;
}) {
  return db.promptEvaluation.create({ data: input });
}

export async function findPromptEvaluations(input: {
  promptTemplateId?: string;
  promptVersion?: string;
  provider?: string;
  model?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.promptTemplateId) where.promptTemplateId = input.promptTemplateId;
  if (input.promptVersion) where.promptVersion = input.promptVersion;
  if (input.provider) where.provider = input.provider;
  if (input.model) where.model = input.model;
  if (input.since) where.occurredAt = { gte: input.since };
  return db.promptEvaluation.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: input.limit ?? 100,
  });
}

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------

export async function createExperiment(input: {
  name: string;
  description?: string;
  type: string;
  variants?: string;
  rolloutPct?: number;
  successMetric?: string;
  status?: string;
  ownerId: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  return db.platformExperiment.create({ data: input });
}

export async function findExperiment(id: string) {
  return db.platformExperiment.findUnique({ where: { id } });
}

export async function findExperiments(input: {
  type?: string;
  status?: string;
  ownerId?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.platformExperiment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit ?? 50,
  });
}

export async function updateExperiment(id: string, data: Record<string, unknown>) {
  return db.platformExperiment.update({ where: { id }, data });
}

export async function countExperiments(status?: string): Promise<number> {
  return db.platformExperiment.count({ where: status ? { status } : undefined });
}

// Experiment assignments
export async function findExperimentAssignment(experimentId: string, userId: string) {
  return db.experimentAssignment.findUnique({
    where: { experimentId_userId: { experimentId, userId } },
  });
}

export async function createExperimentAssignment(input: {
  experimentId: string;
  userId: string;
  variant: string;
}) {
  return db.experimentAssignment.create({ data: input });
}

export async function findExperimentAssignments(input: {
  experimentId?: string;
  userId?: string;
  variant?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.experimentAssignment.findMany({
    where,
    orderBy: { assignedAt: "desc" },
    take: limit ?? 500,
  });
}

export async function countExperimentAssignments(experimentId?: string): Promise<number> {
  return db.experimentAssignment.count({ where: experimentId ? { experimentId } : undefined });
}

// ---------------------------------------------------------------------------
// Optimization Snapshots
// ---------------------------------------------------------------------------

export async function createOptimizationSnapshot(input: {
  parameter: string;
  previousValue?: string;
  newValue: string;
  metric: string;
  improvementPct?: number;
  confidence?: number;
  autoApplied?: boolean;
  appliedAt?: Date;
}) {
  return db.optimizationSnapshot.create({ data: input });
}

export async function findOptimizationSnapshots(input: {
  parameter?: string;
  autoApplied?: boolean;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.optimizationSnapshot.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit ?? 50,
  });
}

export async function countOptimizations(): Promise<number> {
  return db.optimizationSnapshot.count();
}

// ---------------------------------------------------------------------------
// Forecast Snapshots
// ---------------------------------------------------------------------------

export async function createForecastSnapshot(input: {
  forecastType: string;
  scopeType?: string;
  scopeId?: string;
  predictedValue?: number;
  horizon?: string;
  confidence?: number;
  metadata?: string;
  explanation?: string;
}) {
  return db.forecastSnapshot.create({ data: input });
}

export async function findForecastSnapshots(input: {
  forecastType?: string;
  scopeType?: string;
  scopeId?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.forecastSnapshot.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit ?? 20,
  });
}

export async function countForecasts(): Promise<number> {
  return db.forecastSnapshot.count();
}

// ---------------------------------------------------------------------------
// Health Snapshots
// ---------------------------------------------------------------------------

export async function upsertHealthSnapshot(input: {
  subsystem: string;
  status?: string;
  score?: number;
  details?: string;
  responseMs?: number;
}) {
  // Upsert by (subsystem, checkedAt=now) — but since checkedAt changes each
  // time, we just create a new row per check (append-only time series).
  return db.healthSnapshot.create({ data: input });
}

export async function findLatestHealthSnapshots(): Promise<any[]> {
  // Get the latest snapshot per subsystem
  const subsystems = [
    "discovery", "search", "recommendations", "ai", "marketplace",
    "knowledge_graph", "education_os", "learning_planner", "localization",
    "automation", "knowledge_intelligence", "collaboration",
  ];
  const results: any[] = [];
  for (const subsystem of subsystems) {
    const latest = await db.healthSnapshot.findFirst({
      where: { subsystem },
      orderBy: { checkedAt: "desc" },
    });
    if (latest) results.push(latest);
  }
  return results;
}

export async function findHealthSnapshots(input: {
  subsystem?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.subsystem) where.subsystem = input.subsystem;
  if (input.since) where.checkedAt = { gte: input.since };
  return db.healthSnapshot.findMany({
    where,
    orderBy: { checkedAt: "desc" },
    take: input.limit ?? 100,
  });
}

// ---------------------------------------------------------------------------
// Audit Events
// ---------------------------------------------------------------------------

export async function createAuditEvent(input: {
  actionType: string;
  actorType?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  affectedUserId?: string;
  scopeType?: string;
  scopeId?: string;
  reasoning?: string;
  confidence?: number;
  outcome?: string;
}) {
  return db.auditEvent.create({ data: input });
}

export async function findAuditEvents(input: {
  actionType?: string;
  actorType?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  affectedUserId?: string;
  scopeType?: string;
  scopeId?: string;
  outcome?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.actionType) where.actionType = input.actionType;
  if (input.actorType) where.actorType = input.actorType;
  if (input.actorId) where.actorId = input.actorId;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.affectedUserId) where.affectedUserId = input.affectedUserId;
  if (input.scopeType) where.scopeType = input.scopeType;
  if (input.scopeId) where.scopeId = input.scopeId;
  if (input.outcome) where.outcome = input.outcome;
  if (input.since) where.occurredAt = { gte: input.since };
  return db.auditEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: input.limit ?? 100,
  });
}

export async function countAuditEvents(): Promise<number> {
  return db.auditEvent.count();
}

// ---------------------------------------------------------------------------
// Platform Insights
// ---------------------------------------------------------------------------

export async function createPlatformInsight(input: {
  category: string;
  type: string;
  title: string;
  description: string;
  titleKey?: string;
  descriptionKey?: string;
  evidence?: string;
  confidence?: number;
  severity?: string;
  scopeType?: string;
  scopeId?: string;
}) {
  return db.platformInsight.create({ data: input });
}

export async function findPlatformInsights(input: {
  category?: string;
  type?: string;
  severity?: string;
  scopeType?: string;
  scopeId?: string;
  acknowledgedOnly?: boolean;
  unacknowledgedOnly?: boolean;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.category) where.category = input.category;
  if (input.type) where.type = input.type;
  if (input.severity) where.severity = input.severity;
  if (input.scopeType) where.scopeType = input.scopeType;
  if (input.scopeId) where.scopeId = input.scopeId;
  if (input.acknowledgedOnly) where.acknowledgedAt = { not: null };
  if (input.unacknowledgedOnly) where.acknowledgedAt = null;
  return db.platformInsight.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function acknowledgePlatformInsight(id: string): Promise<void> {
  await db.platformInsight.update({
    where: { id },
    data: { acknowledgedAt: new Date() },
  });
}

export async function countInsights(unacknowledgedOnly = false): Promise<number> {
  return db.platformInsight.count({
    where: unacknowledgedOnly ? { acknowledgedAt: null } : undefined,
  });
}
