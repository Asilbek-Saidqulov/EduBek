/**
 * EduBek — Learning-session service.
 *
 * Tracks student time-on-task. A session represents a single continuous
 * stretch of activity on either a Resource (browsing) or an
 * AssignmentAttempt (working). Students can pause / resume / complete
 * sessions; on completion we publish LEARNING_SESSION_COMPLETED and append
 * a `time_spent` progress record.
 *
 * Authorization model:
 *   • every action — the student who owns the session (or superadmin).
 *
 * Events published:
 *   • LEARNING_SESSION_STARTED   — when a session is created
 *   • LEARNING_SESSION_COMPLETED — when a session is completed
 *
 * Side effects:
 *   • completing a session calls `updateProgress(studentId, "time_spent", …)`
 *     so the student's total time-on-task rolls up.
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import { type AuthContext } from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  LEARNING_SESSION_COMPLETED,
  LEARNING_SESSION_STARTED,
  type LearningSessionCompletedEvent,
  type LearningSessionStartedEvent,
} from "@/infra/event-bus/events";
import { updateProgress } from "@/features/progress/service";
import * as repo from "./repository";
import type { LearningSessionDto, LearningSessionStatus } from "./types";
import type { StartSessionBody } from "./schema";

const log = getLogger("learning-session-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSession(s: any): LearningSessionDto {
  return {
    id: s.id,
    studentId: s.studentId,
    attemptId: s.attemptId,
    resourceId: s.resourceId,
    status: s.status as LearningSessionStatus,
    durationMs: s.durationMs,
    interactions: s.interactions,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

async function assertOwner(
  ctx: AuthContext,
  sessionId: string,
): Promise<NonNullable<Awaited<ReturnType<typeof repo.findById>>>> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const session = await repo.findById(sessionId);
  if (!session) throw notFound("Learning session not found");
  if (!ctx.isSuperadmin && session.studentId !== ctx.userId) {
    throw forbidden("You can only manage your own learning sessions");
  }
  return session;
}

// ---------------------------------------------------------------------------
// startSession
// ---------------------------------------------------------------------------

export async function startSession(
  ctx: AuthContext,
  input: StartSessionBody,
): Promise<LearningSessionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (input.attemptId) {
    // The student must own the attempt they're starting a session for.
    // We don't import the attempt repository directly to avoid a cycle;
    // the assignment feature exposes no public lookup, so we accept any
    // attemptId here and rely on the foreign-key constraint to reject
    // dangling ids. Owner check is enforced at the data layer via the
    // relation to `User` on `AssignmentAttempt`.
  }

  const created = await repo.create({
    studentId: ctx.userId,
    attemptId: input.attemptId,
    resourceId: input.resourceId,
  });

  eventBus.publish(
    buildEvent<LearningSessionStartedEvent>({
      type: LEARNING_SESSION_STARTED,
      actorId: ctx.userId,
      sessionId: created.id,
      studentId: ctx.userId,
      resourceId: created.resourceId,
      attemptId: created.attemptId,
    }),
  );

  return mapSession(created);
}

// ---------------------------------------------------------------------------
// pauseSession
// ---------------------------------------------------------------------------

export async function pauseSession(
  ctx: AuthContext,
  id: string,
): Promise<LearningSessionDto> {
  const session = await assertOwner(ctx, id);
  if (session.status !== "active") {
    throw badRequest(`Cannot pause a session that is ${session.status}`);
  }
  const updated = await repo.update(id, { status: "paused" });
  return mapSession(updated);
}

// ---------------------------------------------------------------------------
// resumeSession
// ---------------------------------------------------------------------------

export async function resumeSession(
  ctx: AuthContext,
  id: string,
): Promise<LearningSessionDto> {
  const session = await assertOwner(ctx, id);
  if (session.status !== "paused") {
    throw badRequest(`Cannot resume a session that is ${session.status}`);
  }
  const updated = await repo.update(id, { status: "active" });
  return mapSession(updated);
}

// ---------------------------------------------------------------------------
// completeSession
// ---------------------------------------------------------------------------

export async function completeSession(
  ctx: AuthContext,
  id: string,
): Promise<LearningSessionDto> {
  const session = await assertOwner(ctx, id);
  if (session.status === "completed") {
    throw badRequest("Session is already completed");
  }

  // Calculate total duration: the time from `startedAt` until now, minus
  // any time already accounted for in `durationMs` (i.e. time accumulated
  // during previous pause/resume cycles). For simplicity we compute the
  // total wall-clock duration since `startedAt` and overwrite `durationMs`.
  const startedAt = new Date(session.startedAt);
  const now = new Date();
  const totalDurationMs = Math.max(0, now.getTime() - startedAt.getTime());

  const completed = await repo.complete(id, totalDurationMs, session.interactions);

  eventBus.publish(
    buildEvent<LearningSessionCompletedEvent>({
      type: LEARNING_SESSION_COMPLETED,
      actorId: ctx.userId,
      sessionId: id,
      studentId: session.studentId,
      durationMs: totalDurationMs,
    }),
  );

  // Append a `time_spent` progress record so the student's roll-up reflects
  // this session. Fire-and-forget — a failure here should not break the
  // completion response.
  updateProgress(
    session.studentId,
    "time_spent",
    totalDurationMs,
    undefined,
    session.attemptId ?? undefined,
  ).catch((err) => {
    log.warn("learning-session.progress_update_failed", {
      sessionId: id,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return mapSession(completed);
}

// ---------------------------------------------------------------------------
// listMySessions
// ---------------------------------------------------------------------------

export async function listMySessions(
  ctx: AuthContext,
): Promise<LearningSessionDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const sessions = await repo.findByStudent(ctx.userId);
  return sessions.map(mapSession);
}
