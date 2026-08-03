/**
 * EduBek — audit listeners.
 *
 * Subscribes to *every* domain event and writes a corresponding row to the
 * `AuditLog` table via the `auditLogger`. The mapping from event-type to
 * audit-action is straightforward: the event's `type` string is reused
 * verbatim as the audit `action` — this keeps the audit table greppable
 * from the event catalogue.
 *
 * Each handler is wrapped in a `try/catch` by the event bus, but we still
 * keep the per-event work minimal (one DB write) so that producers aren't
 * blocked by audit overhead.
 */

import { auditLogger } from "@/infra/audit";
import { eventBus } from "@/infra/event-bus";
import type { DomainEvent, DomainEventType } from "@/infra/event-bus/events";

function entityTypeFor(type: string): string | undefined {
  if (type.startsWith("user.")) return "user";
  if (type.startsWith("organization.")) return "organization";
  if (type.startsWith("resource.")) return "resource";
  if (type.startsWith("collection.")) return "collection";
  if (type.startsWith("sharing.")) return "resource";
  if (type.startsWith("ai.")) return "ai_resource";
  if (type.startsWith("marketplace.")) return "listing";
  if (type.startsWith("commerce.")) return "transaction";
  if (type.startsWith("subscription.")) return "subscription";
  if (type.startsWith("coupon.")) return "coupon";
  if (type.startsWith("payment.")) return "transaction";
  if (type.startsWith("creator.")) return "creator";
  if (type.startsWith("analytics.")) return "analytics";
  if (type.startsWith("billing.")) return "invoice";
  // Phase 4A — Student Learning Platform
  if (type.startsWith("classroom.")) return "classroom";
  if (type.startsWith("assignment.")) return "assignment";
  if (type.startsWith("submission.")) return "submission";
  if (type.startsWith("learning.")) return "learning_session";
  if (type.startsWith("progress.")) return "progress";
  // Phase 4B — Assessment Engine
  if (type.startsWith("question.")) return "question";
  if (type.startsWith("rubric.")) return "rubric";
  if (type.startsWith("assessment.")) return "assessment";
  if (type.startsWith("exam.")) return "exam_attempt";
  if (type.startsWith("certificate.")) return "certificate";
  if (type.startsWith("proctoring.")) return "proctoring_incident";
  if (type.startsWith("plagiarism.")) return "plagiarism_report";
  if (type.startsWith("gradebook.")) return "gradebook_entry";
  // Phase 4C — Live Quiz Engine
  if (type.startsWith("live.")) return "live_session";
  return undefined;
}

function entityIdFor(event: DomainEvent): string | undefined {
  // The broad union of event interfaces all carry an entity id under one of
  // a small set of keys. We probe them defensively rather than building a
  // per-type switch — new events should follow the same convention.
  const candidates = [
    "userId",
    "orgId",
    "resourceId",
    "collectionId",
    "listingId",
    "purchaseId",
    "walletId",
    "ledgerEntryId",
    "reviewId",
    "subscriptionId",
    "couponId",
    "transactionId",
    "invoiceId",
    "creatorId",
    "conversationId",
    "entityId",
    // Phase 4A
    "classroomId",
    "assignmentId",
    "attemptId",
    "submissionId",
    "sessionId",
    "studentId",
    // Phase 4B
    "questionId",
    "rubricId",
    "assessmentId",
    "certificateId",
    "reportId",
    "entryId",
    // Phase 4C
    "lobbyId",
    "tournamentId",
    "matchId",
    "rewardId",
    "replayId",
    "roundId",
  ] as const;
  for (const key of candidates) {
    const value = (event as unknown as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function statusFor(type: string): "success" | "failure" | "pending" {
  if (type.endsWith(".failed")) return "failure";
  if (type.endsWith(".started") || type.endsWith(".submitted")) return "pending";
  return "success";
}

function buildEntry(event: DomainEvent) {
  return {
    actorId: event.actorId,
    actorType: (event.actorId ? "user" : "system") as
      | "user"
      | "system"
      | "api",
    action: event.type,
    entityType: entityTypeFor(event.type),
    entityId: entityIdFor(event),
    status: statusFor(event.type),
    metadata: event as unknown as Record<string, unknown>,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  };
}

export function registerAuditListeners(): void {
  // Wildcard subscription — every event becomes an audit row. We do NOT
  // filter by event type here; that keeps the audit table complete and
  // lets the analytics layer derive any subset it needs later.
  eventBus.subscribe("*", (event) => {
    // Fire-and-forget: the event bus does not await handlers, and we don't
    // want a slow DB write to block the producer anyway.
    void auditLogger.log(buildEntry(event));
  });
}
