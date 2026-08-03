/**
 * EduBek — Cognitive AI repository.
 *
 * Thin Prisma-only layer. All business logic lives in the dedicated
 * subsystem files (working-memory, episodic-memory, etc.).
 */
import { db } from "@/lib/db";

// ===========================================================================
// Working memory
// ===========================================================================

export async function createWorkingMemory(input: {
  scopeType: string; scopeId: string; kind: string;
  payload: unknown; expiresAt: Date;
}) {
  return db.cognitiveWorkingMemory.create({
    data: {
      scopeType: input.scopeType, scopeId: input.scopeId, kind: input.kind,
      payload: JSON.stringify(input.payload), expiresAt: input.expiresAt,
    },
  });
}

export async function findActiveWorkingMemory(scopeType: string, scopeId: string) {
  return db.cognitiveWorkingMemory.findMany({
    where: { scopeType, scopeId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function deleteExpiredWorkingMemory() {
  return db.cognitiveWorkingMemory.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

export async function deleteWorkingMemory(id: string) {
  return db.cognitiveWorkingMemory.delete({ where: { id } });
}

// ===========================================================================
// Episodic memory
// ===========================================================================

export async function createEpisodicMemory(input: {
  scopeType: string; scopeId: string; kind: string; summary: string;
  payload: unknown; importance?: number;
  linkedEntities?: unknown[]; tags?: string[]; occurredAt?: Date;
}) {
  return db.cognitiveEpisodicMemory.create({
    data: {
      scopeType: input.scopeType, scopeId: input.scopeId, kind: input.kind,
      summary: input.summary, payload: JSON.stringify(input.payload),
      importance: input.importance ?? 0.5,
      linkedEntities: JSON.stringify(input.linkedEntities ?? []),
      tags: JSON.stringify(input.tags ?? []),
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function findEpisodicMemoryByScope(scopeType: string, scopeId: string, limit = 50) {
  return db.cognitiveEpisodicMemory.findMany({
    where: { scopeType, scopeId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function searchEpisodicMemory(scopeType: string, scopeId: string, query: string, limit = 20) {
  // Simple LIKE search — cognitive retrieval layer ranks results
  return db.cognitiveEpisodicMemory.findMany({
    where: {
      scopeType, scopeId,
      OR: [
        { summary: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function findSimilarEpisodes(tags: string[], limit = 10) {
  // Find episodes sharing any of the tags
  const rows = await db.cognitiveEpisodicMemory.findMany({
    where: { tags: { contains: tags[0] ?? "" } },
    orderBy: { importance: "desc" },
    take: limit * 3,
  });
  // Rank by tag overlap
  return rows
    .map(r => {
      const eTags = safeParse<string[]>(r.tags, []);
      const overlap = eTags.filter(t => tags.includes(t)).length;
      return { row: r, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || b.row.importance - a.row.importance)
    .slice(0, limit)
    .map(x => x.row);
}

// ===========================================================================
// Semantic memory
// ===========================================================================

export async function createSemanticMemory(input: {
  domain: string; kind: string; statement: string; explanation: string;
  source: string; confidence?: number; tags?: string[];
}) {
  return db.cognitiveSemanticMemory.create({
    data: {
      domain: input.domain, kind: input.kind, statement: input.statement,
      explanation: input.explanation, source: input.source,
      confidence: input.confidence ?? 0.5, tags: JSON.stringify(input.tags ?? []),
    },
  });
}

export async function findSemanticMemory(domain?: string, kind?: string, limit = 50) {
  const where: Record<string, unknown> = {};
  if (domain) where.domain = domain;
  if (kind) where.kind = kind;
  return db.cognitiveSemanticMemory.findMany({
    where,
    orderBy: { confidence: "desc" },
    take: limit,
  });
}

export async function searchSemanticMemory(query: string, limit = 20) {
  return db.cognitiveSemanticMemory.findMany({
    where: {
      OR: [
        { statement: { contains: query } },
        { explanation: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    orderBy: { confidence: "desc" },
    take: limit,
  });
}

export async function touchSemanticMemory(id: string) {
  return db.cognitiveSemanticMemory.update({
    where: { id },
    data: { lastAccessedAt: new Date() },
  });
}

// ===========================================================================
// Plans
// ===========================================================================

export async function createPlan(input: {
  objective: string; nodes: unknown[]; dependencies: unknown[];
  executionOrder: string[]; estimatedCost?: number; estimatedDuration?: number;
  confidence?: number; supportedGoals?: string[]; createdBy?: string | null;
}) {
  return db.cognitivePlan.create({
    data: {
      objective: input.objective,
      nodes: JSON.stringify(input.nodes),
      dependencies: JSON.stringify(input.dependencies),
      executionOrder: JSON.stringify(input.executionOrder),
      estimatedCost: input.estimatedCost ?? 0,
      estimatedDuration: input.estimatedDuration ?? 0,
      confidence: input.confidence ?? 0.5,
      supportedGoals: JSON.stringify(input.supportedGoals ?? []),
      createdBy: input.createdBy ?? null,
    },
  });
}

export async function findPlan(id: string) {
  return db.cognitivePlan.findUnique({ where: { id } });
}

export async function listPlans(limit = 20) {
  return db.cognitivePlan.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function updatePlan(id: string, input: {
  nodes?: unknown[]; dependencies?: unknown[]; executionOrder?: string[];
  estimatedCost?: number; estimatedDuration?: number; confidence?: number;
  supportedGoals?: string[]; status?: string;
}) {
  const data: Record<string, unknown> = {};
  if (input.nodes !== undefined) data.nodes = JSON.stringify(input.nodes);
  if (input.dependencies !== undefined) data.dependencies = JSON.stringify(input.dependencies);
  if (input.executionOrder !== undefined) data.executionOrder = JSON.stringify(input.executionOrder);
  if (input.estimatedCost !== undefined) data.estimatedCost = input.estimatedCost;
  if (input.estimatedDuration !== undefined) data.estimatedDuration = input.estimatedDuration;
  if (input.confidence !== undefined) data.confidence = input.confidence;
  if (input.supportedGoals !== undefined) data.supportedGoals = JSON.stringify(input.supportedGoals);
  if (input.status !== undefined) data.status = input.status;
  return db.cognitivePlan.update({ where: { id }, data });
}

// ===========================================================================
// Goals
// ===========================================================================

export async function createGoal(input: {
  kind: string; title: string; description?: string;
  target?: unknown; priority?: number; conflictsWith?: string[];
  contributingModules?: string[];
}) {
  return db.cognitiveGoal.create({
    data: {
      kind: input.kind, title: input.title, description: input.description ?? "",
      target: JSON.stringify(input.target ?? {}),
      priority: input.priority ?? 50,
      conflictsWith: JSON.stringify(input.conflictsWith ?? []),
      contributingModules: JSON.stringify(input.contributingModules ?? []),
    },
  });
}

export async function findGoal(id: string) {
  return db.cognitiveGoal.findUnique({ where: { id } });
}

export async function listGoals(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  return db.cognitiveGoal.findMany({
    where,
    orderBy: { priority: "desc" },
  });
}

export async function updateGoal(id: string, input: {
  priority?: number; progress?: number; status?: string; target?: unknown;
}) {
  const data: Record<string, unknown> = {};
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.progress !== undefined) data.progress = input.progress;
  if (input.status !== undefined) data.status = input.status;
  if (input.target !== undefined) data.target = JSON.stringify(input.target);
  return db.cognitiveGoal.update({ where: { id }, data });
}

// ===========================================================================
// Decisions
// ===========================================================================

export async function createDecision(input: {
  title: string; options: unknown[]; chosenOptionId?: string | null;
  rationale: string; confidence?: number;
  userId?: string | null; organizationId?: string | null;
}) {
  return db.cognitiveDecision.create({
    data: {
      title: input.title, options: JSON.stringify(input.options),
      chosenOptionId: input.chosenOptionId ?? null,
      rationale: input.rationale, confidence: input.confidence ?? 0.5,
      userId: input.userId ?? null, organizationId: input.organizationId ?? null,
    },
  });
}

export async function listDecisions(limit = 20) {
  return db.cognitiveDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Reflections
// ===========================================================================

export async function createReflection(input: {
  actionType: string; traceId: string; reflections: unknown[];
  overallScore: number; lessons?: string[]; memoryUpdateRecommended?: boolean;
}) {
  return db.cognitiveReflection.create({
    data: {
      actionType: input.actionType, traceId: input.traceId,
      reflections: JSON.stringify(input.reflections),
      overallScore: input.overallScore,
      lessons: JSON.stringify(input.lessons ?? []),
      memoryUpdateRecommended: input.memoryUpdateRecommended ?? false,
    },
  });
}

export async function listReflections(limit = 20) {
  return db.cognitiveReflection.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Conversation state
// ===========================================================================

export async function createConversationState(input: {
  userId: string; objective?: string | null; currentTask?: string | null;
}) {
  return db.cognitiveConversationState.create({
    data: {
      userId: input.userId, objective: input.objective ?? null,
      currentTask: input.currentTask ?? null,
    },
  });
}

export async function findConversationState(id: string) {
  return db.cognitiveConversationState.findUnique({ where: { id } });
}

export async function findActiveConversationState(userId: string) {
  return db.cognitiveConversationState.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateConversationState(id: string, input: {
  objective?: string | null; currentTask?: string | null;
  entities?: unknown[]; assumptions?: string[];
  pendingQuestions?: string[]; followUpOpportunities?: unknown[];
  status?: string;
}) {
  const data: Record<string, unknown> = {};
  if (input.objective !== undefined) data.objective = input.objective;
  if (input.currentTask !== undefined) data.currentTask = input.currentTask;
  if (input.entities !== undefined) data.entities = JSON.stringify(input.entities);
  if (input.assumptions !== undefined) data.assumptions = JSON.stringify(input.assumptions);
  if (input.pendingQuestions !== undefined) data.pendingQuestions = JSON.stringify(input.pendingQuestions);
  if (input.followUpOpportunities !== undefined) data.followUpOpportunities = JSON.stringify(input.followUpOpportunities);
  if (input.status !== undefined) data.status = input.status;
  return db.cognitiveConversationState.update({ where: { id }, data });
}

// ===========================================================================
// Cognitive events (analytics)
// ===========================================================================

export async function createCognitiveEvent(input: {
  eventType: string; traceId?: string | null; userId?: string | null;
  module?: string | null; payload?: unknown; durationMs?: number | null;
  confidence?: number | null; llmInvoked?: boolean; costUsd?: number;
}) {
  return db.cognitiveEvent.create({
    data: {
      eventType: input.eventType, traceId: input.traceId ?? null,
      userId: input.userId ?? null, module: input.module ?? null,
      payload: JSON.stringify(input.payload ?? {}),
      durationMs: input.durationMs ?? null,
      confidence: input.confidence ?? null,
      llmInvoked: input.llmInvoked ?? false,
      costUsd: input.costUsd ?? 0,
    },
  });
}

export async function listCognitiveEvents(opts: {
  eventType?: string; traceId?: string; userId?: string;
  since?: Date; limit?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (opts.eventType) where.eventType = opts.eventType;
  if (opts.traceId) where.traceId = opts.traceId;
  if (opts.userId) where.userId = opts.userId;
  if (opts.since) where.createdAt = { gte: opts.since };
  return db.cognitiveEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
  });
}

export async function countCognitiveEvents(eventType: string, since?: Date) {
  const where: Record<string, unknown> = { eventType };
  if (since) where.createdAt = { gte: since };
  return db.cognitiveEvent.count({ where });
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
