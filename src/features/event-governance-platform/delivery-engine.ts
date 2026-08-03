/**
 * System 2 — Event Delivery Rules.
 *
 * Determines delivery guarantees, ordering requirements, consumer
 * concurrency, queue strategy, buffer strategy, QoS, retry strategy,
 * deduplication strategy, delivery timeout.
 *
 * NEVER mutates event payloads.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeDeliveryRule, getDeliveryRule, getDeliveryRuleForEvent,
  getAllDeliveryRules, storeDeliveryResult, getDeliveryResults,
} from "./repository";
import type {
  DeliveryRule,
  DeliveryResult,
  QoSLevel,
  QueueStrategy,
  BufferStrategy,
  RetryStrategy,
  DeduplicationStrategy,
} from "./types";

const log = getLogger("event-governance.delivery");

// ===========================================================================
// Default delivery rule template
// ===========================================================================

export const DEFAULT_DELIVERY_RULE_TEMPLATE: Omit<DeliveryRule, "ruleId" | "eventId" | "active"> = {
  deliveryGuarantee: "at_least_once",
  ordering: "none",
  consumerConcurrency: 1,
  queueStrategy: "fifo",
  bufferStrategy: "bounded",
  bufferSize: 1000,
  retryStrategy: "exponential",
  deduplication: "event_id",
  deliveryTimeoutMs: 30000,
  maxDeliveryAttempts: 3,
};

// ===========================================================================
// Delivery rule CRUD
// ===========================================================================

export function createDeliveryRule(input: {
  eventId: string;
  deliveryGuarantee?: QoSLevel;
  ordering?: "strict" | "causal" | "none";
  consumerConcurrency?: number;
  queueStrategy?: QueueStrategy;
  bufferStrategy?: BufferStrategy;
  bufferSize?: number;
  retryStrategy?: RetryStrategy;
  deduplication?: DeduplicationStrategy;
  deliveryTimeoutMs?: number;
  maxDeliveryAttempts?: number;
  active?: boolean;
}): DeliveryRule {
  const rule: DeliveryRule = {
    ruleId: randomUUID(),
    eventId: input.eventId,
    ...DEFAULT_DELIVERY_RULE_TEMPLATE,
    deliveryGuarantee: input.deliveryGuarantee ?? DEFAULT_DELIVERY_RULE_TEMPLATE.deliveryGuarantee,
    ordering: input.ordering ?? DEFAULT_DELIVERY_RULE_TEMPLATE.ordering,
    consumerConcurrency: input.consumerConcurrency ?? DEFAULT_DELIVERY_RULE_TEMPLATE.consumerConcurrency,
    queueStrategy: input.queueStrategy ?? DEFAULT_DELIVERY_RULE_TEMPLATE.queueStrategy,
    bufferStrategy: input.bufferStrategy ?? DEFAULT_DELIVERY_RULE_TEMPLATE.bufferStrategy,
    bufferSize: input.bufferSize ?? DEFAULT_DELIVERY_RULE_TEMPLATE.bufferSize,
    retryStrategy: input.retryStrategy ?? DEFAULT_DELIVERY_RULE_TEMPLATE.retryStrategy,
    deduplication: input.deduplication ?? DEFAULT_DELIVERY_RULE_TEMPLATE.deduplication,
    deliveryTimeoutMs: input.deliveryTimeoutMs ?? DEFAULT_DELIVERY_RULE_TEMPLATE.deliveryTimeoutMs,
    maxDeliveryAttempts: input.maxDeliveryAttempts ?? DEFAULT_DELIVERY_RULE_TEMPLATE.maxDeliveryAttempts,
    active: input.active ?? true,
  };
  storeDeliveryRule(rule);
  log.info("delivery.rule.created", { ruleId: rule.ruleId, eventId: rule.eventId });
  return rule;
}

export function getDeliveryRuleById(ruleId: string): DeliveryRule | null {
  return getDeliveryRule(ruleId);
}

export function getRuleForEvent(eventId: string): DeliveryRule | null {
  return getDeliveryRuleForEvent(eventId);
}

export function getAllRules(): DeliveryRule[] {
  return getAllDeliveryRules();
}

// ===========================================================================
// Delivery simulation (does NOT actually deliver — governance only)
// ===========================================================================

/**
 * Record a delivery result. This does NOT perform actual delivery —
 * it only records the outcome for observability.
 */
export function recordDeliveryResult(input: {
  eventId: string;
  consumerId: string;
  success: boolean;
  attempts: number;
  latencyMs: number;
  error?: string | null;
}): DeliveryResult {
  const result: DeliveryResult = {
    eventId: input.eventId,
    consumerId: input.consumerId,
    success: input.success,
    attempts: input.attempts,
    latencyMs: input.latencyMs,
    deliveredAt: new Date().toISOString(),
    error: input.error ?? null,
  };
  storeDeliveryResult(result);
  return result;
}

export function getResultsForEvent(eventId: string): DeliveryResult[] {
  return getDeliveryResults(eventId);
}

// ===========================================================================
// Delivery validation
// ===========================================================================

export function validateDeliveryRule(rule: DeliveryRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!rule.ruleId) errors.push("ruleId is required");
  if (!rule.eventId) errors.push("eventId is required");
  if (rule.consumerConcurrency < 1) errors.push("consumerConcurrency must be >= 1");
  if (rule.bufferSize < 1) errors.push("bufferSize must be >= 1");
  if (rule.deliveryTimeoutMs <= 0) errors.push("deliveryTimeoutMs must be > 0");
  if (rule.maxDeliveryAttempts < 1) errors.push("maxDeliveryAttempts must be >= 1");
  if (rule.deliveryGuarantee === "exactly_once" && rule.deduplication === "none") {
    errors.push("exactly_once QoS requires a deduplication strategy");
  }
  return { valid: errors.length === 0, errors };
}

// ===========================================================================
// Delivery statistics
// ===========================================================================

export function getDeliveryStats(eventId?: string): {
  totalDeliveries: number;
  successRate: number;
  avgLatencyMs: number;
  totalRetries: number;
  deadLetters: number;
} {
  const allResults = eventId ? getDeliveryResults(eventId) : getAllDeliveryRules().flatMap(r => getDeliveryResults(r.eventId));
  const total = allResults.length;
  const success = allResults.filter(r => r.success).length;
  const totalLatency = allResults.reduce((s, r) => s + r.latencyMs, 0);
  const totalRetries = allResults.reduce((s, r) => s + Math.max(0, r.attempts - 1), 0);
  const deadLetters = allResults.filter(r => !r.success && r.attempts >= 3).length;
  return {
    totalDeliveries: total,
    successRate: total > 0 ? Math.round((success / total) * 100) / 100 : 0,
    avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
    totalRetries,
    deadLetters,
  };
}

// ===========================================================================
// QoS helpers
// ===========================================================================

export function requiresAcknowledgment(qos: QoSLevel): boolean {
  return qos === "at_least_once" || qos === "exactly_once";
}

export function requiresDeduplication(qos: QoSLevel): boolean {
  return qos === "exactly_once";
}

export function supportsOrdering(queueStrategy: QueueStrategy): boolean {
  return queueStrategy === "fifo" || queueStrategy === "priority";
}
