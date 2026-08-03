/**
 * EduBek — Attention Engine.
 *
 * Phase 5D.5 System 4: Instead of showing everything, rank everything
 * needing attention. Items are scored 0..100 — higher = more
 * important. Detected items include:
 *
 *   • Students at risk
 *   • Pending grading
 *   • Curriculum delays
 *   • Upcoming exams
 *   • Marketplace sales
 *   • Unread discussions
 *   • AI generations waiting
 *   • Expired certificates
 *   • Overdue assignments
 *   • Platform alerts
 *
 * Each detector REUSES existing services — we never duplicate logic.
 * Detectors query the DB directly for counts and recent rows.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type { AttentionItem, AttentionKind, AttentionReport } from "./types";

const log = getLogger("attention-engine");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateAttentionReport(userId: string, organizationId?: string | null): Promise<AttentionReport> {
  const items: AttentionItem[] = [];
  const detectors = [
    detectStudentsAtRisk,
    detectPendingGrading,
    detectCurriculumDelays,
    detectUpcomingExams,
    detectMarketplaceSales,
    detectUnreadDiscussions,
    detectAIGenerationsWaiting,
    detectExpiredCertificates,
    detectOverdueAssignments,
    detectPlatformAlerts,
  ];
  for (const detector of detectors) {
    try {
      const detected = await detector(userId, organizationId);
      items.push(...detected);
    } catch (err) {
      log.warn("attention.detector_failed", { detector: detector.name, error: (err as Error).message });
    }
  }
  // Sort by priority desc, then by detectedAt desc
  items.sort((a, b) => b.priority - a.priority || new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  const countsByKind = countByKind(items);
  const criticalItems = items.filter(i => i.priority >= 80).slice(0, 5);
  // Persist detected items (best-effort — duplicates are fine, they get deduplicated by the UI)
  for (const item of items.slice(0, 20)) {
    repo.createAttentionItem({
      userId, kind: item.kind, title: item.title, description: item.description,
      priority: item.priority, entityId: item.entityId ?? null,
      module: item.module ?? null, requiresAction: item.requiresAction,
      suggestedAction: item.suggestedAction?.label ?? null,
    }).catch(() => { /* ignore dupes */ });
  }
  log.info("attention.report_generated", { userId, total: items.length });
  return {
    items,
    criticalItems,
    countsByKind,
    total: items.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function listOpenAttentionItems(userId: string): Promise<AttentionItem[]> {
  const rows = await repo.listOpenAttentionItems(userId);
  return rows.map(r => ({
    id: r.id, kind: r.kind as AttentionKind, title: r.title, description: r.description,
    priority: r.priority, detectedAt: r.detectedAt.toISOString(),
    entityId: r.entityId ?? undefined, module: r.module ?? undefined,
    requiresAction: r.requiresAction,
    suggestedAction: r.suggestedAction ? { label: r.suggestedAction } : undefined,
    userId: r.userId,
  }));
}

export async function acknowledgeAttentionItem(id: string): Promise<void> {
  await repo.acknowledgeAttentionItem(id);
}

export async function resolveAttentionItem(id: string): Promise<void> {
  await repo.resolveAttentionItem(id);
}

// ===========================================================================
// Detectors
// ===========================================================================

async function detectStudentsAtRisk(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Find classrooms where this user is the teacher, then find at-risk students.
  const classrooms = await db.classroom.findMany({
    where: { teacherId: userId },
    select: { id: true, name: true },
  }).catch(() => []);
  if (classrooms.length === 0) return [];
  const items: AttentionItem[] = [];
  for (const c of classrooms) {
    // At-risk = students in this classroom who have any ConceptMastery with mastery < 0.4.
    // ConceptMastery has `userId` directly — we count distinct students who appear in both
    // ClassroomStudent and ConceptMastery with low mastery.
    const classroomStudents = await db.classroomStudent.findMany({
      where: { classroomId: c.id, status: "active" },
      select: { studentId: true },
    }).catch(() => []);
    if (classroomStudents.length === 0) continue;
    const studentIds = classroomStudents.map(s => s.studentId);
    const atRiskCount = await db.conceptMastery.groupBy({
      by: ["userId"],
      where: { userId: { in: studentIds }, mastery: { lt: 0.4 } },
      _count: { _all: true },
    }).catch(() => []);
    if (atRiskCount.length > 0) {
      items.push({
        id: `at_risk:${c.id}`,
        kind: "student_at_risk",
        title: `${atRiskCount.length} at-risk student(s) in ${c.name}`,
        description: `${atRiskCount.length} student(s) in ${c.name} have mastery below 40% in at least one concept. Consider scheduling remediation.`,
        priority: 85,
        detectedAt: new Date().toISOString(),
        entityId: c.id, module: "digital-twins",
        requiresAction: true,
        suggestedAction: { label: "Generate remediation plan", url: `/classroom/${c.id}/remediation` },
        userId,
      });
    }
  }
  return items;
}

async function detectPendingGrading(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Submissions with status 'submitted' or 'resubmitted' are awaiting grading.
  // Filter by the teacher's classrooms via the attempt → assignment → classroom join.
  const pending = await db.submission.count({
    where: {
      status: { in: ["submitted", "resubmitted"] },
      attempt: { assignment: { classroom: { teacherId: userId } } },
    },
  }).catch(() => 0);
  if (pending === 0) return [];
  return [{
    id: `pending_grading:${userId}`,
    kind: "pending_grading",
    title: `${pending} submission(s) need grading`,
    description: `${pending} submission(s) are waiting for your review.`,
    priority: 75,
    detectedAt: new Date().toISOString(),
    module: "assessment-platform",
    requiresAction: true,
    suggestedAction: { label: "Open grading queue", url: "/gradebook" },
    userId,
  }];
}

async function detectCurriculumDelays(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Curriculum delay = coverage analysis showing <50% coverage for an active framework
  const delays = await db.knowledgeCoverage.findMany({
    where: { scopeType: "classroom", coveragePct: { lt: 50 } },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, scopeId: true, frameworkId: true, coveragePct: true },
  }).catch(() => []);
  if (delays.length === 0) return [];
  return delays.map(d => ({
    id: `curriculum_delay:${d.id}`,
    kind: "curriculum_delay" as const,
    title: `Curriculum coverage at ${Math.round(d.coveragePct)}%`,
    description: `Classroom ${d.scopeId} has only ${Math.round(d.coveragePct)}% coverage of framework ${d.frameworkId}.`,
    priority: 65,
    detectedAt: new Date().toISOString(),
    entityId: d.scopeId, module: "knowledge-intelligence",
    requiresAction: true,
    suggestedAction: { label: "Review coverage gaps", url: `/coverage/${d.id}` },
    userId,
  }));
}

async function detectUpcomingExams(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Upcoming exams in the next 7 days where the user is teacher or student
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const exams = await db.assessment.findMany({
    where: {
      status: "published",
      OR: [
        { classroom: { teacherId: userId } },
        { attempts: { some: { studentId: userId } } },
      ],
      // Use createdAt as a proxy for "scheduled" — assessments don't have a dedicated scheduledAt field
      createdAt: { gte: now, lte: soon },
    },
    take: 5,
    select: { id: true, title: true, createdAt: true },
  }).catch(() => []);
  if (exams.length === 0) return [];
  return exams.map(e => ({
    id: `upcoming_exam:${e.id}`,
    kind: "upcoming_exam" as const,
    title: `Upcoming: ${e.title}`,
    description: `Assessment "${e.title}" is scheduled soon.`,
    priority: 70,
    detectedAt: new Date().toISOString(),
    entityId: e.id, module: "assessment-platform",
    requiresAction: false,
    suggestedAction: { label: "View assessment", url: `/assessments/${e.id}` },
    userId,
  }));
}

async function detectMarketplaceSales(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Recent purchases of this user's listings (MarketplaceListing uses `sellerId`)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sales = await db.marketplacePurchase.count({
    where: { listing: { sellerId: userId }, purchasedAt: { gte: since } },
  }).catch(() => 0);
  if (sales === 0) return [];
  return [{
    id: `marketplace_sale:${userId}`,
    kind: "marketplace_sale",
    title: `${sales} new sale(s) in the last 24h`,
    description: `You have ${sales} new marketplace sale(s) in the last 24 hours.`,
    priority: 55,
    detectedAt: new Date().toISOString(),
    module: "marketplace",
    requiresAction: false,
    suggestedAction: { label: "View sales", url: "/creator/analytics" },
    userId,
  }];
}

async function detectUnreadDiscussions(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Discussions authored by the user with recent replies (no `participants` relation)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const unread = await db.discussion.count({
    where: { authorId: userId, lastReplyAt: { gte: since } },
  }).catch(() => 0);
  if (unread === 0) return [];
  return [{
    id: `unread_discussions:${userId}`,
    kind: "unread_discussion",
    title: `${unread} unread discussion(s)`,
    description: `${unread} discussion(s) you authored have new replies.`,
    priority: 40,
    detectedAt: new Date().toISOString(),
    module: "collaboration",
    requiresAction: false,
    suggestedAction: { label: "Open discussions", url: "/discussions" },
    userId,
  }];
}

async function detectAIGenerationsWaiting(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Check for in-progress AI invocations
  const waiting = await db.orchestratorAIInvocation.count({
    where: { userId, status: "partial" },
  }).catch(() => 0);
  if (waiting === 0) return [];
  return [{
    id: `ai_waiting:${userId}`,
    kind: "ai_generation_waiting",
    title: `${waiting} AI generation(s) awaiting review`,
    description: `${waiting} AI generation(s) completed partially and need your review.`,
    priority: 50,
    detectedAt: new Date().toISOString(),
    module: "ai-workspace",
    requiresAction: true,
    suggestedAction: { label: "Review AI outputs", url: "/ai/history" },
    userId,
  }];
}

async function detectExpiredCertificates(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  const expired = await db.digitalCredential.count({
    where: { userId, status: "expired" },
  }).catch(() => 0);
  if (expired === 0) return [];
  return [{
    id: `expired_cert:${userId}`,
    kind: "expired_certificate",
    title: `${expired} expired certificate(s)`,
    description: `${expired} of your digital credentials have expired and may need renewal.`,
    priority: 45,
    detectedAt: new Date().toISOString(),
    module: "assessment-platform",
    requiresAction: true,
    suggestedAction: { label: "View credentials", url: "/credentials" },
    userId,
  }];
}

async function detectOverdueAssignments(userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // For students: assignments past due but not submitted (Assignment uses `dueDate`)
  const overdue = await db.assignmentAttempt.count({
    where: {
      studentId: userId,
      status: { in: ["not_started", "in_progress"] },
      assignment: { dueDate: { lt: new Date() } },
    },
  }).catch(() => 0);
  if (overdue === 0) return [];
  return [{
    id: `overdue_assignment:${userId}`,
    kind: "overdue_assignment",
    title: `${overdue} overdue assignment(s)`,
    description: `${overdue} assignment(s) are past due and not yet submitted.`,
    priority: 90,
    detectedAt: new Date().toISOString(),
    module: "classroom",
    requiresAction: true,
    suggestedAction: { label: "View assignments", url: "/assignments" },
    userId,
  }];
}

async function detectPlatformAlerts(_userId: string, _orgId?: string | null): Promise<AttentionItem[]> {
  // Reuse Platform Intelligence health snapshots
  const alerts = await db.healthSnapshot.findMany({
    where: { status: { in: ["down", "degraded"] }, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, subsystem: true, status: true, createdAt: true },
  }).catch(() => []);
  if (alerts.length === 0) return [];
  return alerts.map(a => ({
    id: `platform_alert:${a.id}`,
    kind: "platform_alert" as const,
    title: `${a.subsystem} is ${a.status}`,
    description: `Subsystem "${a.subsystem}" is currently ${a.status}.`,
    priority: a.status === "down" ? 95 : 60,
    detectedAt: a.createdAt.toISOString(),
    module: "platform-intelligence",
    requiresAction: false,
    userId: _userId,
  }));
}

// ===========================================================================
// Helpers
// ===========================================================================

function countByKind(items: AttentionItem[]): Record<AttentionKind, number> {
  const counts: Record<AttentionKind, number> = {
    student_at_risk: 0, pending_grading: 0, curriculum_delay: 0,
    upcoming_exam: 0, marketplace_sale: 0, unread_discussion: 0,
    ai_generation_waiting: 0, expired_certificate: 0,
    overdue_assignment: 0, platform_alert: 0,
  };
  for (const item of items) {
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  }
  return counts;
}
