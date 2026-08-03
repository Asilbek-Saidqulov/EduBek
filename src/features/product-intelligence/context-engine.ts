/**
 * EduBek — Unified User Context Engine.
 *
 * Phase 5D.5 System 1: Every request automatically builds a unified
 * user context that aggregates organization, classroom, permissions,
 * curriculum, learning goals, active assignments, recommendations,
 * AI history, digital twin summary, planner summary, current workflow,
 * open drafts, notifications, and product memory.
 *
 * REUSES — does NOT duplicate — services from:
 *   • Platform Orchestrator (buildAIContext for AI-facing context)
 *   • Digital Twins (syncStudentTwin / syncClassroomTwin summaries)
 *   • Learning Planner (goals, milestones, streaks)
 *   • Discovery (recommendations)
 *   • Assessment Platform (active assignments)
 *   • AI Workspace (recent AI sessions)
 *   • Education OS (workflow state)
 *   • Product Memory (this module — preferences, layouts)
 */
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import type { AuthContext } from "@/features/rbac";
import type { AIContext } from "@/features/platform-orchestrator/types";
import { buildAIContext } from "@/features/platform-orchestrator/context-builder";
import type {
  UnifiedProductContext, OrganizationContext, ClassroomContext,
  PermissionSummary, CurriculumContext, LearningGoalContext,
  ActiveAssignmentContext, RecommendationContext, AIHistoryContext,
  DigitalTwinSummary, PlannerSummary, CurrentWorkflowContext,
  DraftSummary, NotificationContext, ProductMemorySnapshot,
} from "./types";
import { getMemoryReport } from "./product-memory";
import { listWorkspaces } from "./repository";

const log = getLogger("product-context-engine");

// ===========================================================================
// Public API
// ===========================================================================

export interface BuildUnifiedContextInput {
  ctx: AuthContext;
  /** Primary organization ID (passed separately because AuthContext is org-agnostic). */
  organizationId?: string | null;
  /** Active classroom scope. */
  classroomId?: string | null;
  /** Trace id propagated from the request. */
  traceId?: string;
  /** Skip subsystems the caller doesn't need. */
  skip?: Parameters<typeof buildAIContext>[0]["skip"];
}

export async function buildUnifiedContext(input: BuildUnifiedContextInput): Promise<UnifiedProductContext> {
  const traceId = input.traceId ?? randomUUID();
  const userId = input.ctx.userId ?? null;
  const startedAt = Date.now();
  log.debug("unified_context.build_start", { traceId, userId, organizationId: input.organizationId });

  // 1. Build the AI-facing context in parallel (this also fetches curriculum,
  //    knowledge graph, mastery, planner, etc.).
  const aiContext: AIContext = await buildAIContext({
    ctx: input.ctx,
    organizationId: input.organizationId,
    scope: input.classroomId ? { classroomId: input.classroomId } : {},
    hints: { traceId },
    skip: input.skip,
  }).catch(err => {
    log.warn("unified_context.ai_context_failed", { error: (err as Error).message });
    return null as unknown as AIContext;
  });

  // 2. Run all product-specific aggregations in parallel. Each uses
  //    non-null fallbacks so a subsystem failure doesn't poison the rest.
  const [organization, classroom, permissions, curriculum, learningGoals,
    activeAssignments, recommendations, aiHistory, digitalTwin,
    planner, currentWorkflow, openDrafts, notifications, productMemory] = await Promise.all([
    safe("organization", () => fetchOrganization(input.organizationId ?? null, input.ctx), null),
    safe("classroom", () => fetchClassroom(input.classroomId ?? null, userId), null),
    safe("permissions", () => fetchPermissions(input.ctx), { canCreate: false, canGrade: false, canPublish: false, canManageOrg: false, canViewAnalytics: false, canUseAI: false, total: 0 }),
    safe("curriculum", () => Promise.resolve(extractCurriculum(aiContext)), { conceptsCovered: 0, frameworksAligned: [], coveragePercent: 0, pendingTopics: [] }),
    safe("learningGoals", () => fetchLearningGoals(userId), { activeGoals: 0, completedGoals: 0, overdueTasks: 0, nextMilestone: null }),
    safe("activeAssignments", () => fetchActiveAssignments(userId, input.classroomId ?? null), { asStudent: 0, asTeacher: 0, nextDue: null }),
    safe("recommendations", () => Promise.resolve(extractRecommendations(aiContext)), { personalized: [], nextSteps: [] }),
    safe("aiHistory", () => fetchAIHistory(userId), { sessionsToday: 0, totalSessions: 0, lastPrompt: null, lastInvocationAt: null }),
    safe("digitalTwin", () => Promise.resolve(extractDigitalTwin(aiContext)), { twinType: null, twinId: null, topPredictions: [], lastSyncedAt: null }),
    safe("planner", () => Promise.resolve(extractPlanner(aiContext)), { activeGoals: 0, streakDays: 0, burnoutRisk: 0, completionRate: 0, nextMilestone: null }),
    safe("currentWorkflow", () => fetchCurrentWorkflow(userId), null),
    safe("openDrafts", () => fetchOpenDrafts(userId), []),
    safe("notifications", () => fetchNotifications(userId), { unread: 0, highPriority: 0, latest: [] }),
    safe("productMemory", () => fetchProductMemory(userId), { favoriteViews: [], hiddenWidgets: [], dashboardLayout: {}, preferredAIStyle: "balanced", lastVisitedPages: [] }),
  ]);

  const context: UnifiedProductContext = {
    traceId,
    user: userId ? {
      id: userId,
      email: input.ctx.email,
      locale: input.ctx.locale,
      roles: input.ctx.platformRoles,
      isSuperadmin: input.ctx.isSuperadmin,
    } : { id: "", roles: [], isSuperadmin: false },
    organization,
    classroom,
    permissions,
    curriculum,
    learningGoals,
    activeAssignments,
    recommendations,
    aiHistory,
    digitalTwin,
    planner,
    currentWorkflow,
    openDrafts,
    notifications,
    productMemory,
    assembledAt: new Date().toISOString(),
  };

  log.debug("unified_context.build_done", { traceId, durationMs: Date.now() - startedAt });
  return context;
}

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); }
  catch (err) {
    log.warn("unified_context.snapshot_failed", { label, error: (err as Error).message });
    return fallback;
  }
}

// ===========================================================================
// Subsystem fetchers — each reuses an existing service or queries the DB
// ===========================================================================

async function fetchOrganization(orgId: string | null | undefined, _ctx: AuthContext): Promise<OrganizationContext | null> {
  if (!orgId) return null;
  try {
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    if (!org) return null;
    const memberCount = await db.organizationMembership.count({ where: { orgId } }).catch(() => 0);
    return { id: org.id, name: org.name, role: "member", memberCount };
  } catch {
    return null;
  }
}

async function fetchClassroom(classroomId: string | null | undefined, userId: string | null): Promise<ClassroomContext | null> {
  if (!classroomId || !userId) return null;
  try {
    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, name: true, teacherId: true },
    });
    if (!classroom) return null;
    const studentCount = await db.classroomStudent.count({ where: { classroomId } }).catch(() => 0);
    const activeAssignmentCount = await db.assignment.count({
      where: { classroomId, status: "published" },
    }).catch(() => 0);
    const role: ClassroomContext["role"] = classroom.teacherId === userId ? "teacher" : "student";
    return { id: classroom.id, name: classroom.name, role, studentCount, activeAssignmentCount };
  } catch {
    return null;
  }
}

async function fetchPermissions(ctx: AuthContext): Promise<PermissionSummary> {
  const perms = ctx.personalPermissionOverrides.filter(p => p.granted).map(p => p.permission);
  const orgPerms = Array.from(ctx.orgPermissions.values()).flatMap(m => m.permissions ?? []);
  const allPerms = new Set([...perms, ...orgPerms]);
  const has = (p: string) => allPerms.has(p) || ctx.isSuperadmin;
  return {
    canCreate: has("content.create") || has("resource.create") || ctx.isSuperadmin,
    canGrade: has("assessment.grade") || has("submission.grade") || ctx.isSuperadmin,
    canPublish: has("assessment.publish") || has("assignment.publish") || ctx.isSuperadmin,
    canManageOrg: has("organization.manage") || ctx.isSuperadmin,
    canViewAnalytics: has("analytics.view") || has("organization.analytics") || ctx.isSuperadmin,
    canUseAI: has("ai.use") || ctx.isSuperadmin,
    total: allPerms.size,
  };
}

function extractCurriculum(aiContext: AIContext | null): CurriculumContext {
  if (!aiContext?.curriculum) {
    return { conceptsCovered: 0, frameworksAligned: [], coveragePercent: 0, pendingTopics: [] };
  }
  return {
    conceptsCovered: aiContext.curriculum.conceptsCovered,
    frameworksAligned: aiContext.curriculum.frameworksAligned,
    coveragePercent: aiContext.curriculum.coveragePercent,
    pendingTopics: aiContext.curriculum.pendingTopics,
  };
}

async function fetchLearningGoals(userId: string | null): Promise<LearningGoalContext> {
  if (!userId) return { activeGoals: 0, completedGoals: 0, overdueTasks: 0, nextMilestone: null };
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [activeGoals, completedGoals, overdueTasks, nextMilestoneRow] = await Promise.all([
      db.learningGoal.count({ where: { userId, achievedAt: null } }).catch(() => 0),
      db.learningGoal.count({ where: { userId, achievedAt: { gte: since } } }).catch(() => 0),
      db.learningPlanItem.count({
        where: { plan: { userId }, status: { not: "completed" } },
      }).catch(() => 0),
      db.learningMilestone.findFirst({
        where: { userId },
        orderBy: { achievedAt: "desc" },
        select: { title: true, achievedAt: true },
      }).catch(() => null),
    ]);
    return {
      activeGoals,
      completedGoals,
      overdueTasks,
      nextMilestone: nextMilestoneRow
        ? { title: nextMilestoneRow.title, date: nextMilestoneRow.achievedAt.toISOString() }
        : null,
    };
  } catch {
    return { activeGoals: 0, completedGoals: 0, overdueTasks: 0, nextMilestone: null };
  }
}

async function fetchActiveAssignments(userId: string | null, classroomId: string | null): Promise<ActiveAssignmentContext> {
  if (!userId) return { asStudent: 0, asTeacher: 0, nextDue: null };
  try {
    const asStudent = await db.assignmentAttempt.count({
      where: { studentId: userId, status: { in: ["not_started", "in_progress"] } },
    }).catch(() => 0);
    const asTeacher = await db.assignment.count({
      where: { classroom: { teacherId: userId }, status: "published" },
    }).catch(() => 0);
    const nextDueRow = await db.assignment.findFirst({
      where: classroomId ? { classroomId, status: "published" } : { status: "published" },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, dueDate: true },
    }).catch(() => null);
    return {
      asStudent,
      asTeacher,
      nextDue: nextDueRow && nextDueRow.dueDate ? {
        id: nextDueRow.id, title: nextDueRow.title, dueAt: nextDueRow.dueDate.toISOString(),
      } : null,
    };
  } catch {
    return { asStudent: 0, asTeacher: 0, nextDue: null };
  }
}

function extractRecommendations(aiContext: AIContext | null): RecommendationContext {
  if (!aiContext?.recommendations) return { personalized: [], nextSteps: [] };
  return {
    personalized: aiContext.recommendations.personalized,
    nextSteps: aiContext.recommendations.nextSteps,
  };
}

async function fetchAIHistory(userId: string | null): Promise<AIHistoryContext> {
  if (!userId) return { sessionsToday: 0, totalSessions: 0, lastPrompt: null, lastInvocationAt: null };
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [sessionsToday, totalSessions, lastInvocation] = await Promise.all([
      db.orchestratorAIInvocation.count({
        where: { userId, createdAt: { gte: since24h } },
      }).catch(() => 0),
      db.orchestratorAIInvocation.count({ where: { userId } }).catch(() => 0),
      db.orchestratorAIInvocation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, input: true },
      }).catch(() => null),
    ]);
    let lastPrompt: string | null = null;
    if (lastInvocation) {
      try {
        const inputObj = JSON.parse(lastInvocation.input) as { prompt?: string };
        lastPrompt = inputObj.prompt ?? null;
      } catch { /* noop */ }
    }
    return {
      sessionsToday, totalSessions, lastPrompt,
      lastInvocationAt: lastInvocation?.createdAt.toISOString() ?? null,
    };
  } catch {
    return { sessionsToday: 0, totalSessions: 0, lastPrompt: null, lastInvocationAt: null };
  }
}

function extractDigitalTwin(aiContext: AIContext | null): DigitalTwinSummary {
  if (!aiContext?.digitalTwin) {
    return { twinType: null, twinId: null, topPredictions: [], lastSyncedAt: null };
  }
  return {
    twinType: aiContext.digitalTwin.twinType,
    twinId: aiContext.digitalTwin.twinId,
    topPredictions: aiContext.digitalTwin.predictions.slice(0, 3),
    lastSyncedAt: null, // twin sync time not surfaced in the AIContext snapshot
  };
}

function extractPlanner(aiContext: AIContext | null): PlannerSummary {
  if (!aiContext?.planner) {
    return { activeGoals: 0, streakDays: 0, burnoutRisk: 0, completionRate: 0, nextMilestone: null };
  }
  return {
    activeGoals: aiContext.planner.activeGoals,
    streakDays: aiContext.planner.streakDays,
    burnoutRisk: aiContext.planner.burnoutRisk,
    completionRate: 0, // not in AIContext snapshot
    nextMilestone: aiContext.planner.nextMilestone,
  };
}

async function fetchCurrentWorkflow(userId: string | null): Promise<CurrentWorkflowContext | null> {
  if (!userId) return null;
  try {
    const row = await db.orchestratorWorkflowExecution.findFirst({
      where: { status: "running" },
      orderBy: { startedAt: "desc" },
    });
    if (!row) return null;
    const steps = (() => { try { return JSON.parse(row.steps) as unknown[]; } catch { return []; } })();
    return {
      workflowId: row.workflowId,
      stepIndex: steps.findIndex(s => (s as { status?: string })?.status === "running"),
      totalSteps: steps.length,
      startedAt: row.startedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchOpenDrafts(userId: string | null): Promise<DraftSummary[]> {
  if (!userId) return [];
  try {
    const workspaces = await listWorkspaces(userId);
    return workspaces
      .filter(w => w.active)
      .map(w => ({
        id: w.id, kind: w.kind, title: w.title,
        updatedAt: w.updatedAt.toISOString(),
        autosaved: w.autosavedAt !== null,
      }));
  } catch {
    return [];
  }
}

async function fetchNotifications(userId: string | null): Promise<NotificationContext> {
  if (!userId) return { unread: 0, highPriority: 0, latest: [] };
  try {
    const [unread, recent] = await Promise.all([
      db.userNotification.count({ where: { userId, readAt: null } }).catch(() => 0),
      db.userNotification.findMany({
        where: { userId, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, title: true, createdAt: true },
      }).catch(() => []),
    ]);
    return {
      unread,
      highPriority: recent.filter(n => isHighPriority(n.type)).length,
      latest: recent.map(n => ({
        id: n.id, type: n.type, title: n.title,
        createdAt: n.createdAt.toISOString(),
        priority: isHighPriority(n.type) ? 80 : 40,
      })),
    };
  } catch {
    return { unread: 0, highPriority: 0, latest: [] };
  }
}

function isHighPriority(type: string): boolean {
  return ["assessment_submitted", "grading_required", "deadline", "alert", "incident"].includes(type);
}

async function fetchProductMemory(userId: string | null): Promise<ProductMemorySnapshot> {
  if (!userId) {
    return { favoriteViews: [], hiddenWidgets: [], dashboardLayout: {}, preferredAIStyle: "balanced", lastVisitedPages: [] };
  }
  try {
    return await getMemoryReport(userId);
  } catch {
    return { favoriteViews: [], hiddenWidgets: [], dashboardLayout: {}, preferredAIStyle: "balanced", lastVisitedPages: [] };
  }
}
