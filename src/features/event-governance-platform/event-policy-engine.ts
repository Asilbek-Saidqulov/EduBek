/**
 * System 1 — Event Policy Engine.
 *
 * Owns delivery policy ONLY. Never business logic.
 *
 * Policies define HOW events are delivered, not WHAT they contain.
 * Supports: sync, async, ordered, unordered, priority, retry, backoff,
 * dead-letter, batching, persistent, ephemeral, replay eligible, audit
 * required, timeout, max retries, consumer isolation.
 *
 * All policies are configurable. No hardcoded behavior.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storePolicy, getPolicy, getPoliciesForEvent, getAllPolicies, deletePolicy,
  storePolicyViolation, getPolicyViolations, getAllPolicyViolations,
} from "./repository";
import type {
  EventPolicy,
  PolicyViolation,
  DeliveryMode,
  Priority,
  RetryStrategy,
  DeadLetterEligibility,
  RetentionPolicy,
  SLAProfile,
} from "./types";

const log = getLogger("event-governance.policy");

// ===========================================================================
// Default policy values (configurable — not hardcoded behavior)
// ===========================================================================

export const DEFAULT_POLICY_TEMPLATE: Omit<EventPolicy, "policyId" | "displayName" | "description" | "eventId" | "createdAt" | "updatedAt"> = {
  deliveryMode: "async",
  priority: "normal",
  persistent: true,
  ephemeral: false,
  replayEligible: true,
  auditRequired: true,
  retryStrategy: "exponential",
  maxRetries: 3,
  retryInitialDelayMs: 1000,
  retryMaxDelayMs: 30000,
  deadLetterEligibility: "eligible",
  timeoutMs: 30000,
  consumerIsolation: true,
  batchingEnabled: false,
  batchSize: 10,
  batchFlushMs: 5000,
  retention: "days_30",
  sla: "near_realtime",
  active: true,
};

// ===========================================================================
// Policy CRUD
// ===========================================================================

export function createPolicy(input: {
  displayName: string;
  description: string;
  eventId: string;
  deliveryMode?: DeliveryMode;
  priority?: Priority;
  persistent?: boolean;
  ephemeral?: boolean;
  replayEligible?: boolean;
  auditRequired?: boolean;
  retryStrategy?: RetryStrategy;
  maxRetries?: number;
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
  deadLetterEligibility?: DeadLetterEligibility;
  timeoutMs?: number;
  consumerIsolation?: boolean;
  batchingEnabled?: boolean;
  batchSize?: number;
  batchFlushMs?: number;
  retention?: RetentionPolicy;
  sla?: SLAProfile;
  active?: boolean;
}): EventPolicy {
  const now = new Date().toISOString();
  const policy: EventPolicy = {
    policyId: randomUUID(),
    displayName: input.displayName,
    description: input.description,
    eventId: input.eventId,
    ...DEFAULT_POLICY_TEMPLATE,
    deliveryMode: input.deliveryMode ?? DEFAULT_POLICY_TEMPLATE.deliveryMode,
    priority: input.priority ?? DEFAULT_POLICY_TEMPLATE.priority,
    persistent: input.persistent ?? DEFAULT_POLICY_TEMPLATE.persistent,
    ephemeral: input.ephemeral ?? DEFAULT_POLICY_TEMPLATE.ephemeral,
    replayEligible: input.replayEligible ?? DEFAULT_POLICY_TEMPLATE.replayEligible,
    auditRequired: input.auditRequired ?? DEFAULT_POLICY_TEMPLATE.auditRequired,
    retryStrategy: input.retryStrategy ?? DEFAULT_POLICY_TEMPLATE.retryStrategy,
    maxRetries: input.maxRetries ?? DEFAULT_POLICY_TEMPLATE.maxRetries,
    retryInitialDelayMs: input.retryInitialDelayMs ?? DEFAULT_POLICY_TEMPLATE.retryInitialDelayMs,
    retryMaxDelayMs: input.retryMaxDelayMs ?? DEFAULT_POLICY_TEMPLATE.retryMaxDelayMs,
    deadLetterEligibility: input.deadLetterEligibility ?? DEFAULT_POLICY_TEMPLATE.deadLetterEligibility,
    timeoutMs: input.timeoutMs ?? DEFAULT_POLICY_TEMPLATE.timeoutMs,
    consumerIsolation: input.consumerIsolation ?? DEFAULT_POLICY_TEMPLATE.consumerIsolation,
    batchingEnabled: input.batchingEnabled ?? DEFAULT_POLICY_TEMPLATE.batchingEnabled,
    batchSize: input.batchSize ?? DEFAULT_POLICY_TEMPLATE.batchSize,
    batchFlushMs: input.batchFlushMs ?? DEFAULT_POLICY_TEMPLATE.batchFlushMs,
    retention: input.retention ?? DEFAULT_POLICY_TEMPLATE.retention,
    sla: input.sla ?? DEFAULT_POLICY_TEMPLATE.sla,
    active: input.active ?? DEFAULT_POLICY_TEMPLATE.active,
    createdAt: now,
    updatedAt: now,
  };
  // Validate: ephemeral and persistent are mutually exclusive
  if (policy.ephemeral && policy.persistent) {
    policy.persistent = false;
  }
  storePolicy(policy);
  log.info("policy.created", { policyId: policy.policyId, eventId: policy.eventId });
  return policy;
}

export function getPolicyById(policyId: string): EventPolicy | null {
  return getPolicy(policyId);
}

export function getPolicies(eventId?: string): EventPolicy[] {
  if (eventId) return getPoliciesForEvent(eventId);
  return getAllPolicies();
}

export function updatePolicy(policyId: string, updates: Partial<EventPolicy>): EventPolicy | null {
  const existing = getPolicy(policyId);
  if (!existing) return null;
  const updated: EventPolicy = {
    ...existing,
    ...updates,
    policyId: existing.policyId, // immutable
    createdAt: existing.createdAt, // immutable
    updatedAt: new Date().toISOString(),
  };
  // Re-validate: ephemeral and persistent are mutually exclusive
  if (updated.ephemeral && updated.persistent) {
    updated.persistent = false;
  }
  storePolicy(updated);
  log.info("policy.updated", { policyId });
  return updated;
}

export function removePolicy(policyId: string): boolean {
  return deletePolicy(policyId);
}

// ===========================================================================
// Policy evaluation
// ===========================================================================

/**
 * Evaluate a policy for a given event.
 * Returns the effective policy (or default if none configured).
 */
export function evaluatePolicy(eventId: string): EventPolicy | null {
  const policies = getPoliciesForEvent(eventId);
  if (policies.length === 0) return null;
  // Return the first active policy
  return policies.find(p => p.active) ?? policies[0];
}

/**
 * Check if an event meets its SLA.
 */
export function checkSLACompliance(eventId: string, actualLatencyMs: number): boolean {
  const policy = evaluatePolicy(eventId);
  if (!policy) return true;
  const slaThresholds: Record<SLAProfile, number> = {
    realtime: 100,
    interactive: 1000,
    near_realtime: 5000,
    batch: 60000,
    best_effort: Number.MAX_SAFE_INTEGER,
  };
  const threshold = slaThresholds[policy.sla];
  return actualLatencyMs <= threshold;
}

/**
 * Calculate the retry delay for a given attempt.
 */
export function calculateRetryDelay(policy: EventPolicy, attempt: number): number {
  switch (policy.retryStrategy) {
    case "none":
      return 0;
    case "fixed":
      return policy.retryInitialDelayMs;
    case "linear":
      return policy.retryInitialDelayMs * attempt;
    case "exponential":
      return Math.min(
        policy.retryMaxDelayMs,
        policy.retryInitialDelayMs * Math.pow(2, attempt - 1),
      );
    default:
      return policy.retryInitialDelayMs;
  }
}

/**
 * Determine if an event should be sent to the dead-letter queue.
 */
export function shouldDeadLetter(policy: EventPolicy, attemptCount: number): boolean {
  if (policy.deadLetterEligibility === "ineligible") return false;
  if (policy.deadLetterEligibility === "drop") return false;
  return attemptCount > policy.maxRetries;
}

// ===========================================================================
// Policy violations
// ===========================================================================

export function recordPolicyViolation(input: {
  policyId: string;
  eventId: string;
  violationType: string;
  description: string;
  severity: "error" | "warning" | "info";
}): PolicyViolation {
  const violation: PolicyViolation = {
    id: randomUUID(),
    policyId: input.policyId,
    eventId: input.eventId,
    violationType: input.violationType,
    description: input.description,
    severity: input.severity,
    detectedAt: new Date().toISOString(),
  };
  storePolicyViolation(violation);
  log.warn("policy.violation", { policyId: input.policyId, type: input.violationType });
  return violation;
}

export function getViolations(policyId?: string): PolicyViolation[] {
  if (policyId) return getPolicyViolations(policyId);
  return getAllPolicyViolations();
}

// ===========================================================================
// Policy validation
// ===========================================================================

export function validatePolicy(policy: EventPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!policy.policyId) errors.push("policyId is required");
  if (!policy.eventId) errors.push("eventId is required");
  if (policy.ephemeral && policy.persistent) errors.push("ephemeral and persistent are mutually exclusive");
  if (policy.maxRetries < 0) errors.push("maxRetries must be >= 0");
  if (policy.retryInitialDelayMs < 0) errors.push("retryInitialDelayMs must be >= 0");
  if (policy.retryMaxDelayMs < policy.retryInitialDelayMs) errors.push("retryMaxDelayMs must be >= retryInitialDelayMs");
  if (policy.timeoutMs <= 0) errors.push("timeoutMs must be > 0");
  if (policy.batchSize < 1) errors.push("batchSize must be >= 1");
  if (policy.batchFlushMs <= 0) errors.push("batchFlushMs must be > 0");
  return { valid: errors.length === 0, errors };
}

// ===========================================================================
// Policy statistics
// ===========================================================================

export function getPolicyStats(): {
  totalPolicies: number;
  activePolicies: number;
  totalViolations: number;
  violationsBySeverity: Record<string, number>;
} {
  const all = getAllPolicies();
  const violations = getAllPolicyViolations();
  const bySeverity: Record<string, number> = { error: 0, warning: 0, info: 0 };
  for (const v of violations) {
    bySeverity[v.severity] = (bySeverity[v.severity] ?? 0) + 1;
  }
  return {
    totalPolicies: all.length,
    activePolicies: all.filter(p => p.active).length,
    totalViolations: violations.length,
    violationsBySeverity: bySeverity,
  };
}
