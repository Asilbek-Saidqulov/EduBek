/** Systems 6, 7, 8 — Sanctions, Appeals, Trust Score. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeSanction, getSanction, getAllSanctions,
  storeAppeal, getAppeal, getAllAppeals,
  storeTrustScoreRule, getTrustScoreRule, getTrustScoreRuleByKey, getAllTrustScoreRules,
  storeTrustScore, getTrustScore, getAllTrustScores,
  appendAudit,
} from "./repository";
import type {
  Sanction, SanctionType, SanctionStatus,
  Appeal, AppealStatus,
  TrustScoreRule, TrustScore, TrustScoreBand,
  PolicySeverity,
} from "./types";
import { publishTrustEvent } from "./event-bus-bridge";

const log = getLogger("trust.sanctions");

// ===== System 6 — Sanction Platform =====

export function createSanction(input: {
  type: SanctionType;
  targetId: string;
  targetType?: "user" | "organization" | "service_account";
  reason: string;
  policyKey?: string | null;
  investigationId?: string | null;
  issuedBy?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  features?: string[];
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Sanction {
  // ALL sanctions require manual approval — never automatic
  const now = new Date().toISOString();
  const sanction: Sanction = {
    id: randomUUID(),
    type: input.type,
    status: "pending_approval",
    targetId: input.targetId,
    targetType: input.targetType ?? "user",
    reason: input.reason,
    policyKey: input.policyKey ?? null,
    investigationId: input.investigationId ?? null,
    issuedBy: input.issuedBy ?? null,
    issuedAt: now,
    approvedBy: null,
    approvedAt: null,
    startsAt: input.startsAt ?? now,
    endsAt: input.endsAt ?? null,
    revokedAt: null,
    revocationReason: null,
    features: input.features ?? [],
    manualApprovalRequired: true,
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeSanction(sanction);
  log.info("sanction.created", { id: sanction.id, type: sanction.type, status: sanction.status });
  return sanction;
}

export function getSanctionById(id: string): Sanction | null { return getSanction(id); }
export function listSanctions(status?: SanctionStatus, type?: SanctionType): Sanction[] {
  let all = getAllSanctions();
  if (status) all = all.filter(s => s.status === status);
  if (type) all = all.filter(s => s.type === type);
  return all.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function approveSanction(id: string, approverId: string): Sanction | null {
  const s = getSanction(id);
  if (!s) return null;
  if (s.status !== "pending_approval") return null;
  const now = new Date().toISOString();
  s.status = "approved";
  s.approvedBy = approverId;
  s.approvedAt = now;
  // If startsAt is now or past, activate
  if (new Date(s.startsAt).getTime() <= Date.now()) {
    s.status = "active";
  }
  storeSanction(s);
  appendAudit({
    id: randomUUID(), action: "sanction.approved",
    actorId: approverId, itemType: "sanction", itemId: s.id,
    before: { status: "pending_approval" }, after: { status: s.status },
    reason: "Manual approval", correlationId: s.correlationId,
    approvalRef: null, occurredAt: now, immutable: true, metadata: {},
  });
  publishTrustEvent("SanctionIssued", approverId, {
    sanctionId: s.id, type: s.type, targetId: s.targetId,
    correlationId: s.correlationId,
  });
  return s;
}

export function activateSanction(id: string): Sanction | null {
  const s = getSanction(id);
  if (!s) return null;
  if (s.status !== "approved") return null;
  s.status = "active";
  storeSanction(s);
  return s;
}

export function expireSanction(id: string): Sanction | null {
  const s = getSanction(id);
  if (!s) return null;
  if (s.status !== "active" && s.status !== "approved") return null;
  s.status = "expired";
  storeSanction(s);
  return s;
}

export function revokeSanction(id: string, revokerId: string, reason: string): Sanction | null {
  const s = getSanction(id);
  if (!s) return null;
  if (s.status === "revoked") return null;
  const before = s.status;
  s.status = "revoked";
  s.revokedAt = new Date().toISOString();
  s.revocationReason = reason;
  storeSanction(s);
  appendAudit({
    id: randomUUID(), action: "sanction.revoked",
    actorId: revokerId, itemType: "sanction", itemId: s.id,
    before: { status: before }, after: { status: "revoked" },
    reason, correlationId: s.correlationId,
    approvalRef: null, occurredAt: s.revokedAt, immutable: true, metadata: {},
  });
  publishTrustEvent("SanctionRevoked", revokerId, {
    sanctionId: s.id, reason, correlationId: s.correlationId,
  });
  return s;
}

export function markSanctionAppealed(id: string, appealId: string): Sanction | null {
  const s = getSanction(id);
  if (!s) return null;
  s.status = "appealed";
  s.metadata.appealId = appealId;
  storeSanction(s);
  return s;
}

export function supportsAllSanctionTypes(): SanctionType[] {
  return ["warning", "temporary_restriction", "temporary_suspension", "organization_restriction", "feature_restriction", "permanent_ban"];
}
export function supportsAllSanctionStatuses(): SanctionStatus[] {
  return ["pending_approval", "approved", "active", "expired", "revoked", "appealed"];
}

// ===== System 7 — Appeal Platform =====

export function submitAppeal(input: {
  sanctionId: string;
  appellantId: string;
  reason: string;
  evidenceRefs?: string[];
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Appeal {
  const sanction = getSanction(input.sanctionId);
  if (!sanction) throw new Error(`Sanction not found: ${input.sanctionId}`);
  const now = new Date().toISOString();
  const appeal: Appeal = {
    id: randomUUID(),
    sanctionId: input.sanctionId,
    status: "submitted",
    appellantId: input.appellantId,
    reason: input.reason,
    evidenceRefs: input.evidenceRefs ?? [],
    submittedAt: now,
    assignedReviewerId: null,
    assignedAt: null,
    reviewedAt: null,
    decision: null,
    decisionReason: null,
    decidedBy: null,
    history: [{ id: randomUUID(), timestamp: now, action: "submitted", actorId: input.appellantId, note: "Appeal submitted" }],
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeAppeal(appeal);
  markSanctionAppealed(input.sanctionId, appeal.id);
  publishTrustEvent("AppealSubmitted", input.appellantId, {
    appealId: appeal.id, sanctionId: input.sanctionId,
    correlationId: appeal.correlationId,
  });
  log.info("appeal.submitted", { id: appeal.id, sanctionId: input.sanctionId });
  return appeal;
}

export function getAppealById(id: string): Appeal | null { return getAppeal(id); }
export function listAppeals(status?: AppealStatus): Appeal[] {
  const all = getAllAppeals();
  return (status ? all.filter(a => a.status === status) : all).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

const VALID_APPEAL_TRANSITIONS: Record<AppealStatus, AppealStatus[]> = {
  submitted: ["assigned", "withdrawn"],
  assigned: ["under_review", "withdrawn"],
  under_review: ["approved", "rejected", "escalated", "withdrawn"],
  approved: [],
  rejected: [],
  escalated: ["under_review", "approved", "rejected"],
  withdrawn: [],
};

export function canTransitionAppeal(from: AppealStatus, to: AppealStatus): boolean {
  return VALID_APPEAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assignAppeal(id: string, reviewerId: string, assignedBy: string): Appeal | null {
  const a = getAppeal(id);
  if (!a) return null;
  if (a.status !== "submitted") return null;
  a.status = "assigned";
  a.assignedReviewerId = reviewerId;
  a.assignedAt = new Date().toISOString();
  a.history.push({ id: randomUUID(), timestamp: a.assignedAt, action: "assigned", actorId: assignedBy, note: `Assigned to ${reviewerId}` });
  storeAppeal(a);
  return a;
}

export function startAppealReview(id: string, reviewerId: string): Appeal | null {
  const a = getAppeal(id);
  if (!a) return null;
  if (!canTransitionAppeal(a.status, "under_review")) return null;
  a.status = "under_review";
  a.history.push({ id: randomUUID(), timestamp: new Date().toISOString(), action: "review_started", actorId: reviewerId, note: "Review started" });
  storeAppeal(a);
  return a;
}

export function decideAppeal(id: string, decision: "approved" | "rejected", reason: string, decidedBy: string): Appeal | null {
  const a = getAppeal(id);
  if (!a) return null;
  if (!canTransitionAppeal(a.status, decision)) return null;
  const before = a.status;
  a.status = decision;
  a.decision = decision;
  a.decisionReason = reason;
  a.decidedBy = decidedBy;
  a.reviewedAt = new Date().toISOString();
  a.history.push({ id: randomUUID(), timestamp: a.reviewedAt, action: `decided:${decision}`, actorId: decidedBy, note: reason });
  storeAppeal(a);
  appendAudit({
    id: randomUUID(), action: `appeal.decided:${decision}`,
    actorId: decidedBy, itemType: "appeal", itemId: a.id,
    before: { status: before }, after: { status: decision },
    reason, correlationId: a.correlationId,
    approvalRef: null, occurredAt: a.reviewedAt, immutable: true, metadata: {},
  });
  if (decision === "approved") {
    // Revoke the underlying sanction
    revokeSanction(a.sanctionId, decidedBy, "Appeal approved");
    publishTrustEvent("AppealApproved", decidedBy, {
      appealId: a.id, sanctionId: a.sanctionId, correlationId: a.correlationId,
    });
  } else {
    publishTrustEvent("AppealRejected", decidedBy, {
      appealId: a.id, sanctionId: a.sanctionId, correlationId: a.correlationId,
    });
  }
  return a;
}

export function escalateAppeal(id: string, actorId: string, reason: string): Appeal | null {
  const a = getAppeal(id);
  if (!a) return null;
  if (!canTransitionAppeal(a.status, "escalated")) return null;
  a.status = "escalated";
  a.history.push({ id: randomUUID(), timestamp: new Date().toISOString(), action: "escalated", actorId, note: reason });
  storeAppeal(a);
  return a;
}

export function withdrawAppeal(id: string, appellantId: string): Appeal | null {
  const a = getAppeal(id);
  if (!a) return null;
  if (!canTransitionAppeal(a.status, "withdrawn")) return null;
  a.status = "withdrawn";
  a.history.push({ id: randomUUID(), timestamp: new Date().toISOString(), action: "withdrawn", actorId: appellantId, note: "Appeal withdrawn" });
  storeAppeal(a);
  return a;
}

export function supportsAllAppealStatuses(): AppealStatus[] {
  return ["submitted", "assigned", "under_review", "approved", "rejected", "escalated", "withdrawn"];
}

// ===== System 8 — Trust Score Platform =====

export function createTrustScoreRule(input: {
  key: string;
  description?: string;
  signalType: string;
  weight: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
}): TrustScoreRule {
  if (getTrustScoreRuleByKey(input.key)) throw new Error(`Rule key already exists: ${input.key}`);
  const rule: TrustScoreRule = {
    id: randomUUID(), key: input.key,
    description: input.description ?? "",
    signalType: input.signalType,
    weight: input.weight,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeTrustScoreRule(rule);
  return rule;
}

export function getTrustScoreRuleById(id: string): TrustScoreRule | null { return getTrustScoreRule(id); }
export function listTrustScoreRules(active?: boolean): TrustScoreRule[] {
  const all = getAllTrustScoreRules();
  return active === undefined ? all : all.filter(r => r.active === active);
}

export function computeTrustScore(targetId: string, signals: Array<{ ruleKey: string; severity: PolicySeverity }>): TrustScore {
  const rules = getAllTrustScoreRules().filter(r => r.active);
  const ruleByKey = new Map(rules.map(r => [r.key, r]));
  let totalDeduction = 0;
  const factors: TrustScore["factors"] = [];
  for (const sig of signals) {
    const rule = ruleByKey.get(sig.ruleKey);
    if (!rule) continue;
    const severityMultiplier: Record<PolicySeverity, number> = { info: 1, minor: 2, major: 4, critical: 8 };
    const contribution = rule.weight * (severityMultiplier[sig.severity] ?? 1);
    totalDeduction += contribution;
    factors.push({ ruleKey: rule.key, weight: rule.weight, contribution, timestamp: new Date().toISOString() });
  }
  const score = Math.max(0, 100 - totalDeduction);
  const band: TrustScoreBand = score >= 80 ? "trusted" : score >= 50 ? "neutral" : score >= 25 ? "at_risk" : "high_risk";
  const existing = getTrustScore(targetId);
  const trustScore: TrustScore = {
    id: existing?.id ?? randomUUID(),
    targetId,
    score,
    band,
    factors,
    computedAt: new Date().toISOString(),
    version: (existing?.version ?? 0) + 1,
    metadata: {},
  };
  storeTrustScore(trustScore);
  publishTrustEvent("TrustScoreUpdated", null, {
    targetId, score, band, correlationId: randomUUID(),
  });
  return trustScore;
}

export function getTrustScoreForTarget(targetId: string): TrustScore | null { return getTrustScore(targetId); }
export function listTrustScores(): TrustScore[] { return getAllTrustScores(); }

export function supportsAllTrustScoreBands(): TrustScoreBand[] {
  return ["trusted", "neutral", "at_risk", "high_risk"];
}
