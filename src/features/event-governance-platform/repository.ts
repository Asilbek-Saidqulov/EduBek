/**
 * EduBek — Event Governance Platform in-memory repository.
 *
 * Centralized state store for all governance data. All in-memory Maps
 * can be swapped for Redis in production without changing the API.
 *
 * This repository NEVER owns gameplay state, engine state, or business
 * logic. It only owns governance metadata (policies, rules, classifications,
 * metrics, health records, correlation graphs).
 */
import type {
  EventPolicy,
  PolicyViolation,
  DeliveryRule,
  DeliveryResult,
  EventClassification,
  CorrelationNode,
  CorrelationEdge,
  ProducerHealth,
  ConsumerHealth,
  EventMetrics,
} from "./types";

// ===========================================================================
// In-memory state stores
// ===========================================================================

// System 1 — Policy Engine
const policies = new Map<string, EventPolicy>();                    // policyId → policy
const policiesByEvent = new Map<string, Set<string>>();             // eventId → policyIds
const policyViolations = new Map<string, PolicyViolation[]>();      // policyId → violations

// System 2 — Delivery Rules
const deliveryRules = new Map<string, DeliveryRule>();              // ruleId → rule
const deliveryRulesByEvent = new Map<string, string>();             // eventId → ruleId
const deliveryResults = new Map<string, DeliveryResult[]>();        // eventId → results

// System 3 — Classification
const classifications = new Map<string, EventClassification>();     // eventId → classification

// System 5 — Correlation Graph
const correlationNodes = new Map<string, CorrelationNode>();        // eventInstanceId → node
const correlationEdges: CorrelationEdge[] = [];                     // all edges
const traceRoots = new Map<string, string>();                       // traceId → rootEventInstanceId

// Systems 6, 7 — Producer + Consumer Health
const producerHealth = new Map<string, ProducerHealth>();           // producer → health
const consumerHealth = new Map<string, ConsumerHealth>();           // consumer → health

// System 8 — Event Metrics
const eventMetrics = new Map<string, EventMetrics>();               // eventId → metrics

// ===========================================================================
// Policy store operations
// ===========================================================================

export function storePolicy(policy: EventPolicy): void {
  policies.set(policy.policyId, policy);
  const eventSet = policiesByEvent.get(policy.eventId) ?? new Set<string>();
  eventSet.add(policy.policyId);
  policiesByEvent.set(policy.eventId, eventSet);
}

export function getPolicy(policyId: string): EventPolicy | null {
  return policies.get(policyId) ?? null;
}

export function getPoliciesForEvent(eventId: string): EventPolicy[] {
  const ids = policiesByEvent.get(eventId);
  if (!ids) return [];
  return Array.from(ids).map(id => policies.get(id)!).filter(Boolean);
}

export function getAllPolicies(): EventPolicy[] {
  return Array.from(policies.values());
}

export function deletePolicy(policyId: string): boolean {
  const policy = policies.get(policyId);
  if (!policy) return false;
  policies.delete(policyId);
  const eventSet = policiesByEvent.get(policy.eventId);
  if (eventSet) {
    eventSet.delete(policyId);
    if (eventSet.size === 0) policiesByEvent.delete(policy.eventId);
  }
  return true;
}

export function storePolicyViolation(violation: PolicyViolation): void {
  const list = policyViolations.get(violation.policyId) ?? [];
  list.push(violation);
  policyViolations.set(violation.policyId, list);
}

export function getPolicyViolations(policyId: string): PolicyViolation[] {
  return policyViolations.get(policyId) ?? [];
}

export function getAllPolicyViolations(): PolicyViolation[] {
  const all: PolicyViolation[] = [];
  for (const list of policyViolations.values()) all.push(...list);
  return all;
}

// ===========================================================================
// Delivery rule store operations
// ===========================================================================

export function storeDeliveryRule(rule: DeliveryRule): void {
  deliveryRules.set(rule.ruleId, rule);
  deliveryRulesByEvent.set(rule.eventId, rule.ruleId);
}

export function getDeliveryRule(ruleId: string): DeliveryRule | null {
  return deliveryRules.get(ruleId) ?? null;
}

export function getDeliveryRuleForEvent(eventId: string): DeliveryRule | null {
  const ruleId = deliveryRulesByEvent.get(eventId);
  if (!ruleId) return null;
  return deliveryRules.get(ruleId) ?? null;
}

export function getAllDeliveryRules(): DeliveryRule[] {
  return Array.from(deliveryRules.values());
}

export function storeDeliveryResult(result: DeliveryResult): void {
  const list = deliveryResults.get(result.eventId) ?? [];
  list.push(result);
  // Cap at 1000 results per event to bound memory
  if (list.length > 1000) list.shift();
  deliveryResults.set(result.eventId, list);
}

export function getDeliveryResults(eventId: string): DeliveryResult[] {
  return deliveryResults.get(eventId) ?? [];
}

// ===========================================================================
// Classification store operations
// ===========================================================================

export function storeClassification(classification: EventClassification): void {
  classifications.set(classification.eventId, classification);
}

export function getClassification(eventId: string): EventClassification | null {
  return classifications.get(eventId) ?? null;
}

export function getAllClassifications(): EventClassification[] {
  return Array.from(classifications.values());
}

// ===========================================================================
// Correlation graph store operations
// ===========================================================================

export function storeCorrelationNode(node: CorrelationNode): void {
  correlationNodes.set(node.eventId, node);
  // If this node has a traceId and no parent, it's a root
  if (node.traceId && !node.parentEventId) {
    traceRoots.set(node.traceId, node.eventId);
  }
}

export function getCorrelationNode(eventInstanceId: string): CorrelationNode | null {
  return correlationNodes.get(eventInstanceId) ?? null;
}

export function getAllCorrelationNodes(): CorrelationNode[] {
  return Array.from(correlationNodes.values());
}

export function storeCorrelationEdge(edge: CorrelationEdge): void {
  correlationEdges.push(edge);
}

export function getAllCorrelationEdges(): CorrelationEdge[] {
  return [...correlationEdges];
}

export function getCorrelationNodesByTrace(traceId: string): CorrelationNode[] {
  return Array.from(correlationNodes.values()).filter(n => n.traceId === traceId);
}

export function getRootEventForTrace(traceId: string): string | null {
  return traceRoots.get(traceId) ?? null;
}

// ===========================================================================
// Producer health store operations
// ===========================================================================

export function storeProducerHealth(health: ProducerHealth): void {
  producerHealth.set(health.producer, health);
}

export function getProducerHealth(producer: string): ProducerHealth | null {
  return producerHealth.get(producer as ProducerHealth["producer"]) ?? null;
}

export function getAllProducerHealth(): ProducerHealth[] {
  return Array.from(producerHealth.values());
}

// ===========================================================================
// Consumer health store operations
// ===========================================================================

export function storeConsumerHealth(health: ConsumerHealth): void {
  consumerHealth.set(health.consumer, health);
}

export function getConsumerHealth(consumer: string): ConsumerHealth | null {
  return consumerHealth.get(consumer as ConsumerHealth["consumer"]) ?? null;
}

export function getAllConsumerHealth(): ConsumerHealth[] {
  return Array.from(consumerHealth.values());
}

// ===========================================================================
// Event metrics store operations
// ===========================================================================

export function storeEventMetrics(metrics: EventMetrics): void {
  eventMetrics.set(metrics.eventId, metrics);
}

export function getEventMetrics(eventId: string): EventMetrics | null {
  return eventMetrics.get(eventId) ?? null;
}

export function getAllEventMetrics(): EventMetrics[] {
  return Array.from(eventMetrics.values());
}

// ===========================================================================
// Reset for testing
// ===========================================================================

export function _resetRepositoryForTesting(): void {
  policies.clear();
  policiesByEvent.clear();
  policyViolations.clear();
  deliveryRules.clear();
  deliveryRulesByEvent.clear();
  deliveryResults.clear();
  classifications.clear();
  correlationNodes.clear();
  correlationEdges.length = 0;
  traceRoots.clear();
  producerHealth.clear();
  consumerHealth.clear();
  eventMetrics.clear();
}
