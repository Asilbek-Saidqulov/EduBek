/**
 * EduBek — Plagiarism service.
 *
 * Architecture-only — no external API integration yet. The internal
 * provider uses trigram overlap, which is fast and good enough for the
 * "did two students copy each other?" use case. Future providers
 * (Turnitin, Copyleaks) should implement the `PlagiarismProvider`
 * interface and be registered in the providers map.
 *
 * Authorization model:
 *   • compareSubmissions / flagSubmission — caller must be the teacher of
 *     the classroom the attempt's assessment belongs to (or superadmin)
 *     with PersonalPermission.PLAGIARISM_VIEW.
 *   • getReport / listReports — same.
 *
 * Events published:
 *   • PLAGIARISM_FLAGGED — when a report's similarityScore >= threshold.
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  PLAGIARISM_FLAGGED,
  type PlagiarismFlaggedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import type {
  PlagiarismProvider,
  PlagiarismReportDto,
  SimilarityResult,
} from "./types";

const log = getLogger("plagiarism-service");

// ---------------------------------------------------------------------------
// Internal provider (trigram-based similarity)
// ---------------------------------------------------------------------------

function buildTrigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (normalized.length < 3) return new Set([normalized]);
  const set = new Set<string>();
  for (let i = 0; i <= normalized.length - 3; i++) {
    set.add(normalized.slice(i, i + 3));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const internalProvider: PlagiarismProvider = {
  name: "internal",
  compare(a: string, b: string): SimilarityResult {
    const trigramsA = buildTrigrams(a);
    const trigramsB = buildTrigrams(b);
    const j = jaccard(trigramsA, trigramsB);
    return {
      similarityScore: Math.round(j * 100),
      details: {
        trigramsA: trigramsA.size,
        trigramsB: trigramsB.size,
        method: "jaccard-trigram",
      },
    };
  },
};

const providers: Record<string, PlagiarismProvider> = {
  internal: internalProvider,
};

export function registerProvider(name: string, provider: PlagiarismProvider): void {
  providers[name] = provider;
}

export function getProvider(name = "internal"): PlagiarismProvider {
  const provider = providers[name];
  if (!provider) throw badRequest(`Unknown plagiarism provider: ${name}`);
  return provider;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParseDetails(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function mapReport(r: any): PlagiarismReportDto {
  let comparedWith: string[] = [];
  try { comparedWith = JSON.parse(r.comparedWith); } catch {}
  return {
    id: r.id,
    attemptId: r.attemptId,
    studentId: r.studentId,
    sourceResponseId: r.sourceResponseId,
    comparedWith,
    similarityScore: r.similarityScore,
    threshold: r.threshold,
    flagged: r.flagged,
    details: safeParseDetails(r.details),
    provider: r.provider,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

async function assertTeacherOfAttempt(ctx: AuthContext, attemptId: string): Promise<void> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.PLAGIARISM_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view plagiarism reports");
  }
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      assessment: { select: { ownerId: true, classroomId: true } },
    },
  });
  if (!attempt) throw notFound("Attempt not found");
  const isOwner = attempt.assessment.ownerId === ctx.userId;
  let isClassroomTeacher = false;
  if (attempt.assessment.classroomId) {
    const classroom = await db.classroom.findUnique({
      where: { id: attempt.assessment.classroomId },
      select: { teacherId: true },
    });
    isClassroomTeacher = classroom?.teacherId === ctx.userId;
  }
  if (!isOwner && !isClassroomTeacher && !ctx.isSuperadmin) {
    throw forbidden("Only the assessment owner or classroom teacher can run plagiarism checks");
  }
}

// ---------------------------------------------------------------------------
// compareSubmissions
// ---------------------------------------------------------------------------

/**
 * Compare a source response (e.g. an essay answer on the current attempt)
 * against a set of other responses (e.g. every other student's answer to
 * the same question in the same classroom). Persists a PlagiarismReport
 * with the highest similarity score found.
 *
 * If the score exceeds the threshold, publishes PLAGIARISM_FLAGGED and
 * marks the attempt as plagiarismFlagged.
 */
export async function compareSubmissions(
  ctx: AuthContext,
  input: {
    attemptId: string;
    sourceResponseId: string;
    comparedWithResponseIds: string[];
    threshold?: number; // 0-100, default 60
    providerName?: string;
  },
): Promise<PlagiarismReportDto> {
  await assertTeacherOfAttempt(ctx, input.attemptId);
  if (input.comparedWithResponseIds.length === 0) {
    throw badRequest("Must provide at least one response to compare against");
  }
  const threshold = input.threshold ?? 60;
  const provider = getProvider(input.providerName);

  // Fetch source and comparison responses.
  const sourceResponse = await db.assessmentResponse.findUnique({
    where: { id: input.sourceResponseId },
    select: { id: true, answer: true, attemptId: true, questionType: true },
  });
  if (!sourceResponse) throw notFound("Source response not found");

  const compared = await db.assessmentResponse.findMany({
    where: { id: { in: input.comparedWithResponseIds } },
    select: { id: true, answer: true, attemptId: true },
  });

  const sourceText = sourceResponse.answer ?? "";
  let maxScore = 0;
  let bestMatch: { responseId: string; score: number; details: unknown } | null = null;
  const perPair: Array<{ responseId: string; score: number }> = [];

  for (const c of compared) {
    const result = provider.compare(sourceText, c.answer ?? "");
    perPair.push({ responseId: c.id, score: result.similarityScore });
    if (result.similarityScore > maxScore) {
      maxScore = result.similarityScore;
      bestMatch = { responseId: c.id, score: result.similarityScore, details: result.details };
    }
  }

  const flagged = maxScore >= threshold;
  const report = await db.plagiarismReport.create({
    data: {
      attemptId: input.attemptId,
      studentId: (await db.assessmentAttempt.findUnique({
        where: { id: input.attemptId },
        select: { studentId: true },
      }))!.studentId,
      sourceResponseId: input.sourceResponseId,
      comparedWith: JSON.stringify(input.comparedWithResponseIds),
      similarityScore: maxScore,
      threshold,
      flagged,
      details: JSON.stringify({ perPair, bestMatch, provider: provider.name }),
      provider: provider.name,
      status: "completed",
    },
  });

  if (flagged) {
    await db.assessmentAttempt.update({
      where: { id: input.attemptId },
      data: {
        plagiarismScore: maxScore,
        plagiarismFlagged: true,
      },
    });

    eventBus.publish(
      buildEvent<PlagiarismFlaggedEvent>({
        type: PLAGIARISM_FLAGGED,
        actorId: ctx.userId,
        reportId: report.id,
        attemptId: input.attemptId,
        studentId: report.studentId,
        similarityScore: maxScore,
        threshold,
      }),
    );

    log.warn("plagiarism.flagged", {
      attemptId: input.attemptId,
      similarityScore: maxScore,
      threshold,
    });
  } else {
    // Even if not flagged, record the score for visibility.
    await db.assessmentAttempt.update({
      where: { id: input.attemptId },
      data: { plagiarismScore: maxScore },
    });
  }

  return mapReport(report);
}

// ---------------------------------------------------------------------------
// calculateSimilarity (stateless helper)
// ---------------------------------------------------------------------------

export function calculateSimilarity(a: string, b: string, providerName = "internal"): SimilarityResult {
  return getProvider(providerName).compare(a, b);
}

// ---------------------------------------------------------------------------
// flagSubmission (manual flag by teacher)
// ---------------------------------------------------------------------------

export async function flagSubmission(
  ctx: AuthContext,
  attemptId: string,
  reason: string,
): Promise<PlagiarismReportDto> {
  await assertTeacherOfAttempt(ctx, attemptId);
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { studentId: true },
  });
  if (!attempt) throw notFound("Attempt not found");

  const report = await db.plagiarismReport.create({
    data: {
      attemptId,
      studentId: attempt.studentId,
      sourceResponseId: null,
      comparedWith: JSON.stringify([]),
      similarityScore: 100, // manual flag = maximum severity
      threshold: 60,
      flagged: true,
      details: JSON.stringify({ reason, manual: true }),
      provider: "manual",
      status: "completed",
    },
  });

  await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: { plagiarismFlagged: true, plagiarismScore: 100 },
  });

  eventBus.publish(
    buildEvent<PlagiarismFlaggedEvent>({
      type: PLAGIARISM_FLAGGED,
      actorId: ctx.userId,
      reportId: report.id,
      attemptId,
      studentId: attempt.studentId,
      similarityScore: 100,
      threshold: 60,
    }),
  );

  return mapReport(report);
}

// ---------------------------------------------------------------------------
// getReport / listReports
// ---------------------------------------------------------------------------

export async function getReport(
  ctx: AuthContext,
  reportId: string,
): Promise<PlagiarismReportDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.PLAGIARISM_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view plagiarism reports");
  }
  const report = await db.plagiarismReport.findUnique({ where: { id: reportId } });
  if (!report) throw notFound("Report not found");
  return mapReport(report);
}

export async function listReportsByAttempt(
  ctx: AuthContext,
  attemptId: string,
): Promise<PlagiarismReportDto[]> {
  await assertTeacherOfAttempt(ctx, attemptId);
  const reports = await db.plagiarismReport.findMany({
    where: { attemptId },
    orderBy: { createdAt: "desc" },
  });
  return reports.map(mapReport);
}
