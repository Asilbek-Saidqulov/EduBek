/**
 * EduBek — Product Intelligence repository.
 *
 * Thin Prisma-only layer. All business logic lives in the dedicated
 * subsystem files (context-engine, journey-engine, etc.).
 */
import { db } from "@/lib/db";

// ===========================================================================
// Workspaces
// ===========================================================================

export async function createWorkspace(input: {
  userId: string; kind: string; title: string;
  tabs?: unknown[]; history?: unknown[]; undoStack?: unknown[];
  draft?: unknown; active?: boolean;
}) {
  return db.productWorkspace.create({
    data: {
      userId: input.userId, kind: input.kind, title: input.title,
      tabs: JSON.stringify(input.tabs ?? []),
      history: JSON.stringify(input.history ?? []),
      undoStack: JSON.stringify(input.undoStack ?? []),
      draft: JSON.stringify(input.draft ?? {}),
      active: input.active ?? true,
    },
  });
}

export async function findWorkspace(id: string) {
  return db.productWorkspace.findUnique({ where: { id } });
}

export async function findActiveWorkspace(userId: string) {
  return db.productWorkspace.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listWorkspaces(userId: string, kind?: string) {
  const where: Record<string, unknown> = { userId };
  if (kind) where.kind = kind;
  return db.productWorkspace.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function updateWorkspace(id: string, input: {
  title?: string; tabs?: unknown[]; history?: unknown[]; undoStack?: unknown[];
  draft?: unknown; active?: boolean; autosavedAt?: Date | null;
}) {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.tabs !== undefined) data.tabs = JSON.stringify(input.tabs);
  if (input.history !== undefined) data.history = JSON.stringify(input.history);
  if (input.undoStack !== undefined) data.undoStack = JSON.stringify(input.undoStack);
  if (input.draft !== undefined) data.draft = JSON.stringify(input.draft);
  if (input.active !== undefined) data.active = input.active;
  if (input.autosavedAt !== undefined) data.autosavedAt = input.autosavedAt;
  return db.productWorkspace.update({ where: { id }, data });
}

export async function deleteWorkspace(id: string) {
  return db.productWorkspace.delete({ where: { id } });
}

// ===========================================================================
// Journeys
// ===========================================================================

export async function createJourney(input: {
  userId: string; kind: string; title: string;
  steps?: unknown[]; suggestions?: unknown[]; blockedSteps?: unknown[];
  completionPercent?: number; estimatedRemainingMinutes?: number;
}) {
  return db.productJourney.create({
    data: {
      userId: input.userId, kind: input.kind, title: input.title,
      steps: JSON.stringify(input.steps ?? []),
      suggestions: JSON.stringify(input.suggestions ?? []),
      blockedSteps: JSON.stringify(input.blockedSteps ?? []),
      completionPercent: input.completionPercent ?? 0,
      estimatedRemainingMinutes: input.estimatedRemainingMinutes ?? 0,
    },
  });
}

export async function findJourney(id: string) {
  return db.productJourney.findUnique({ where: { id } });
}

export async function findActiveJourney(userId: string) {
  return db.productJourney.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listJourneys(userId: string) {
  return db.productJourney.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}

export async function updateJourney(id: string, input: {
  currentStepIndex?: number; steps?: unknown[]; suggestions?: unknown[];
  blockedSteps?: unknown[]; completionPercent?: number;
  estimatedRemainingMinutes?: number; status?: string; completedAt?: Date | null;
}) {
  const data: Record<string, unknown> = {};
  if (input.currentStepIndex !== undefined) data.currentStepIndex = input.currentStepIndex;
  if (input.steps !== undefined) data.steps = JSON.stringify(input.steps);
  if (input.suggestions !== undefined) data.suggestions = JSON.stringify(input.suggestions);
  if (input.blockedSteps !== undefined) data.blockedSteps = JSON.stringify(input.blockedSteps);
  if (input.completionPercent !== undefined) data.completionPercent = input.completionPercent;
  if (input.estimatedRemainingMinutes !== undefined) data.estimatedRemainingMinutes = input.estimatedRemainingMinutes;
  if (input.status !== undefined) data.status = input.status;
  if (input.completedAt !== undefined) data.completedAt = input.completedAt;
  return db.productJourney.update({ where: { id }, data });
}

// ===========================================================================
// Attention items
// ===========================================================================

export async function createAttentionItem(input: {
  userId: string; kind: string; title: string; description: string;
  priority?: number; entityId?: string | null; module?: string | null;
  requiresAction?: boolean; suggestedAction?: string | null;
}) {
  return db.productAttentionItem.create({
    data: {
      userId: input.userId, kind: input.kind, title: input.title,
      description: input.description, priority: input.priority ?? 0,
      entityId: input.entityId ?? null, module: input.module ?? null,
      requiresAction: input.requiresAction ?? false,
      suggestedAction: input.suggestedAction ?? null,
    },
  });
}

export async function listOpenAttentionItems(userId: string) {
  return db.productAttentionItem.findMany({
    where: { userId, acknowledgedAt: null },
    orderBy: { priority: "desc" },
    take: 100,
  });
}

export async function acknowledgeAttentionItem(id: string) {
  return db.productAttentionItem.update({
    where: { id },
    data: { acknowledgedAt: new Date() },
  });
}

export async function resolveAttentionItem(id: string) {
  return db.productAttentionItem.update({
    where: { id },
    data: { resolvedAt: new Date(), acknowledgedAt: new Date() },
  });
}

// ===========================================================================
// Intents
// ===========================================================================

export async function createIntent(input: {
  userId: string; query: string; intent: string; confidence?: number;
  requiredSystems?: unknown[]; requiredAgents?: unknown[];
  requiredWorkflows?: unknown[]; recommendedActions?: unknown[]; detected?: boolean;
}) {
  return db.productIntent.create({
    data: {
      userId: input.userId, query: input.query, intent: input.intent,
      confidence: input.confidence ?? 0,
      requiredSystems: JSON.stringify(input.requiredSystems ?? []),
      requiredAgents: JSON.stringify(input.requiredAgents ?? []),
      requiredWorkflows: JSON.stringify(input.requiredWorkflows ?? []),
      recommendedActions: JSON.stringify(input.recommendedActions ?? []),
      detected: input.detected ?? false,
    },
  });
}

export async function listIntents(userId: string, limit = 20) {
  return db.productIntent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ===========================================================================
// Product memory
// ===========================================================================

export async function findMemoryEntry(userId: string, key: string) {
  return db.productMemory.findUnique({
    where: { userId_key: { userId, key } },
  });
}

export async function listMemoryEntries(userId: string, category?: string) {
  const where: Record<string, unknown> = { userId };
  if (category) where.category = category;
  return db.productMemory.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export async function upsertMemoryEntry(input: {
  userId: string; key: string; value: unknown; category: string;
}) {
  return db.productMemory.upsert({
    where: { userId_key: { userId: input.userId, key: input.key } },
    update: {
      value: JSON.stringify(input.value),
      category: input.category,
      lastAccessedAt: new Date(),
    },
    create: {
      userId: input.userId, key: input.key,
      value: JSON.stringify(input.value), category: input.category,
    },
  });
}

export async function deleteMemoryEntry(userId: string, key: string) {
  return db.productMemory.delete({
    where: { userId_key: { userId, key } },
  }).catch(() => null);
}

// ===========================================================================
// Analytics events
// ===========================================================================

export async function createAnalyticsEvent(input: {
  userId?: string | null; eventType: string; feature?: string | null;
  location?: string | null; metadata?: unknown; frictionScore?: number;
  durationMs?: number | null;
}) {
  return db.productAnalyticsEvent.create({
    data: {
      userId: input.userId ?? null,
      eventType: input.eventType,
      feature: input.feature ?? null,
      location: input.location ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      frictionScore: input.frictionScore ?? 0,
      durationMs: input.durationMs ?? null,
    },
  });
}

export async function listAnalyticsEvents(opts: {
  userId?: string; eventType?: string; feature?: string;
  since?: Date; limit?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (opts.userId) where.userId = opts.userId;
  if (opts.eventType) where.eventType = opts.eventType;
  if (opts.feature) where.feature = opts.feature;
  if (opts.since) where.createdAt = { gte: opts.since };
  return db.productAnalyticsEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 500,
  });
}

export async function countAnalyticsEvents(opts: {
  eventType?: string; feature?: string; since?: Date;
} = {}) {
  const where: Record<string, unknown> = {};
  if (opts.eventType) where.eventType = opts.eventType;
  if (opts.feature) where.feature = opts.feature;
  if (opts.since) where.createdAt = { gte: opts.since };
  return db.productAnalyticsEvent.count({ where });
}

// ===========================================================================
// Notification clusters
// ===========================================================================

export async function createNotificationCluster(input: {
  userId: string; title: string; body: string;
  notificationIds?: string[]; priority?: number; kind: string;
  delivery?: string; deliverAt?: Date; count?: number;
}) {
  return db.productNotificationCluster.create({
    data: {
      userId: input.userId, title: input.title, body: input.body,
      notificationIds: JSON.stringify(input.notificationIds ?? []),
      priority: input.priority ?? 0, kind: input.kind,
      delivery: input.delivery ?? "now",
      deliverAt: input.deliverAt ?? new Date(),
      count: input.count ?? 1,
    },
  });
}

export async function listPendingClusters(userId: string) {
  return db.productNotificationCluster.findMany({
    where: { userId, deliveredAt: null, deliverAt: { lte: new Date() } },
    orderBy: { priority: "desc" },
    take: 50,
  });
}

export async function markClusterDelivered(id: string) {
  return db.productNotificationCluster.update({
    where: { id },
    data: { deliveredAt: new Date() },
  });
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
