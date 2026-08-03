/**
 * System 12 — Documentation Generator.
 *
 * Automatically generates Markdown, JSON, Developer Portal metadata,
 * Architecture diagrams, Ownership tables, Version tables, Classification
 * tables, Policy tables.
 *
 * Derived entirely from the Event Registry. No LLM.
 */
import { listEvents, listDeprecatedEvents } from "@/features/game-engine/events";
import { getPolicies, getPolicyStats } from "./event-policy-engine";
import { getAllRules, getDeliveryStats } from "./delivery-engine";
import { generateCatalog, getCatalogStats, getAllClassifiedEvents } from "./classification-catalog";
import { getCorrelationStats } from "./correlation-graph";
import { getOverallHealthStats } from "./producer-consumer-monitor";
import { getAllMetrics, generateLifecycleDashboard, generateObservabilityDashboard, generateGovernanceDashboard } from "./metrics-dashboard";
import type { GovernanceDocumentation, OwnershipTable, VersionTable, ClassificationTable, PolicyTable } from "./types";
import type { EventProducer } from "@/features/game-engine/events";

// ===========================================================================
// Documentation generation
// ===========================================================================

export function generateGovernanceDocumentation(): GovernanceDocumentation {
  const contracts = listEvents();
  const catalog = generateCatalog();
  const deprecated = listDeprecatedEvents();
  const policies = getPolicies();
  const rules = getAllRules();
  const classifications = getAllClassifiedEvents();
  const correlationStats = getCorrelationStats();
  const healthStats = getOverallHealthStats();
  const lifecycle = generateLifecycleDashboard();
  const observability = generateObservabilityDashboard();
  const governance = generateGovernanceDashboard();
  const metricsStats = getAllMetrics();
  const policyStats = getPolicyStats();
  const deliveryStats = getDeliveryStats();

  const ownershipTables: OwnershipTable[] = contracts.map(c => ({
    eventId: c.eventId,
    producer: c.producer,
    consumers: c.consumers,
    valid: !governance.ownership.find(o => o.eventId === c.eventId && !o.valid),
  }));

  const versionTables: VersionTable[] = contracts.map(c => ({
    eventId: c.eventId,
    version: c.version,
    status: c.status,
    deprecated: c.deprecated,
    replacement: c.replacementEventId,
  }));

  const classificationTables: ClassificationTable[] = contracts.map(c => {
    const classification = classifications.find(cl => cl.eventId === c.eventId);
    return {
      eventId: c.eventId,
      eventClass: classification?.classification.eventClass ?? null,
      severity: classification?.classification.severity ?? null,
      sla: classification?.classification.slaProfile ?? null,
    };
  });

  const policyTables: PolicyTable[] = policies.map(p => ({
    eventId: p.eventId,
    policyId: p.policyId,
    deliveryMode: p.deliveryMode,
    priority: p.priority,
    sla: p.sla,
    active: p.active,
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: contracts.length,
    architecture: generateArchitectureDoc(catalog.totalEvents, policies.length, rules.length),
    policyEngine: generatePolicyEngineDoc(policyStats, policies.length),
    deliveryRules: generateDeliveryDoc(deliveryStats, rules.length),
    classification: generateClassificationDoc(getCatalogStats(), classifications.length),
    catalog: generateCatalogDoc(catalog.totalEvents, deprecated.length),
    correlation: generateCorrelationDoc(correlationStats),
    metrics: generateMetricsDoc(metricsStats.length, observability),
    dashboards: generateDashboardsDoc(lifecycle, observability, governance, healthStats),
    ownershipTables,
    versionTables,
    classificationTables,
    policyTables,
  };
}

// ===========================================================================
// Section generators
// ===========================================================================

function generateArchitectureDoc(totalEvents: number, totalPolicies: number, totalRules: number): string {
  return `Enterprise Event Governance Platform oversees ${totalEvents} registered events, ${totalPolicies} policies, and ${totalRules} delivery rules. The platform sits alongside the Universal Game Engine Event Bus, providing governance, delivery, classification, correlation, monitoring, metrics, and documentation without owning any gameplay or business logic.`;
}

function generatePolicyEngineDoc(stats: ReturnType<typeof getPolicyStats>, totalPolicies: number): string {
  return `Policy Engine manages ${totalPolicies} event delivery policies (${stats.activePolicies} active). ${stats.totalViolations} violations detected (${stats.violationsBySeverity.error ?? 0} errors, ${stats.violationsBySeverity.warning ?? 0} warnings, ${stats.violationsBySeverity.info ?? 0} info). Policies define delivery mode, priority, retry strategy, dead-letter eligibility, timeout, and SLA — never business logic.`;
}

function generateDeliveryDoc(stats: ReturnType<typeof getDeliveryStats>, totalRules: number): string {
  return `Delivery Engine enforces ${totalRules} delivery rules. ${stats.totalDeliveries} deliveries recorded with ${Math.round(stats.successRate * 100)}% success rate, ${stats.avgLatencyMs}ms average latency, ${stats.totalRetries} retries, and ${stats.deadLetters} dead letters.`;
}

function generateClassificationDoc(stats: ReturnType<typeof getCatalogStats>, totalClassified: number): string {
  return `Classification Engine has classified ${totalClassified} events. Distribution: ${stats.byClass.mission_critical} mission-critical, ${stats.byClass.business_critical} business-critical, ${stats.byClass.operational} operational, ${stats.byClass.analytics} analytics, ${stats.byClass.informational} informational. ${stats.deprecatedCount} deprecated events.`;
}

function generateCatalogDoc(totalEvents: number, deprecatedCount: number): string {
  return `Event Catalog contains ${totalEvents} automatically-generated entries derived from the Event Registry. ${deprecatedCount} events are deprecated. The catalog includes purpose, producer, consumers, schema, examples, version history, and documentation for every event — no manual entries, no duplicated contracts.`;
}

function generateCorrelationDoc(stats: ReturnType<typeof getCorrelationStats>): string {
  return `Correlation Graph tracks ${stats.totalNodes} event instances across ${stats.totalTraces} traces, with ${stats.totalEdges} relationships. Average chain length: ${stats.avgChainLength}. Max fan-out: ${stats.maxFanOut}, max fan-in: ${stats.maxFanIn}. Supports traceId, correlationId, causationId, parent-child relationships, and timeline reconstruction.`;
}

function generateMetricsDoc(totalMetrics: number, obs: ReturnType<typeof generateObservabilityDashboard>): string {
  return `Event Metrics tracks ${totalMetrics} events. Throughput: ${obs.throughput.eventsPerSecond} events/sec. Error rate: ${Math.round(obs.errorRate * 1000) / 10}%. Average processing latency: ${obs.avgProcessingLatency}ms. SLA compliance: ${obs.slaCompliance}%. Top producer throughput and slow consumers are monitored in real-time.`;
}

function generateDashboardsDoc(
  lifecycle: ReturnType<typeof generateLifecycleDashboard>,
  observability: ReturnType<typeof generateObservabilityDashboard>,
  governance: ReturnType<typeof generateGovernanceDashboard>,
  health: ReturnType<typeof getOverallHealthStats>,
): string {
  return `Dashboards: Lifecycle (${lifecycle.totalEvents} events, ${lifecycle.deprecatedEvents.length} deprecated, ${lifecycle.experimentalEvents.length} experimental), Observability (${observability.topProducers.length} top producers, ${observability.slowConsumers.length} slow consumers, ${observability.slaCompliance}% SLA), Governance (${governance.ownership.length} ownership records, ${governance.policyViolations.length} policy violations, ${governance.validationIssues.length} validation issues). Average health score: ${health.avgProducerHealthScore}% (producers), ${health.avgConsumerHealthScore}% (consumers).`;
}

// ===========================================================================
// Markdown generation
// ===========================================================================

export function generateMarkdownDocumentation(): string {
  const doc = generateGovernanceDocumentation();
  const lines: string[] = [];
  lines.push("# EduBek Enterprise Event Governance Platform");
  lines.push("");
  lines.push(`> Auto-generated documentation. ${doc.totalEvents} events governed.`);
  lines.push("");
  lines.push("## Architecture");
  lines.push("");
  lines.push(doc.architecture);
  lines.push("");
  lines.push("## Policy Engine");
  lines.push("");
  lines.push(doc.policyEngine);
  lines.push("");
  lines.push("## Delivery Rules");
  lines.push("");
  lines.push(doc.deliveryRules);
  lines.push("");
  lines.push("## Classification");
  lines.push("");
  lines.push(doc.classification);
  lines.push("");
  lines.push("## Event Catalog");
  lines.push("");
  lines.push(doc.catalog);
  lines.push("");
  lines.push("## Correlation Graph");
  lines.push("");
  lines.push(doc.correlation);
  lines.push("");
  lines.push("## Metrics");
  lines.push("");
  lines.push(doc.metrics);
  lines.push("");
  lines.push("## Dashboards");
  lines.push("");
  lines.push(doc.dashboards);
  lines.push("");
  // Ownership table
  lines.push("## Ownership Table");
  lines.push("");
  lines.push("| Event ID | Producer | Consumers | Valid |");
  lines.push("|----------|----------|-----------|-------|");
  for (const t of doc.ownershipTables) {
    lines.push(`| ${t.eventId} | ${t.producer} | ${t.consumers.join(", ") || "none"} | ${t.valid ? "✓" : "✗"} |`);
  }
  lines.push("");
  // Version table
  lines.push("## Version Table");
  lines.push("");
  lines.push("| Event ID | Version | Status | Deprecated | Replacement |");
  lines.push("|----------|---------|--------|------------|-------------|");
  for (const t of doc.versionTables) {
    lines.push(`| ${t.eventId} | ${t.version} | ${t.status} | ${t.deprecated ? "✓" : ""} | ${t.replacement ?? "—"} |`);
  }
  lines.push("");
  // Classification table
  lines.push("## Classification Table");
  lines.push("");
  lines.push("| Event ID | Class | Severity | SLA |");
  lines.push("|----------|-------|----------|-----|");
  for (const t of doc.classificationTables) {
    lines.push(`| ${t.eventId} | ${t.eventClass ?? "—"} | ${t.severity ?? "—"} | ${t.sla ?? "—"} |`);
  }
  lines.push("");
  // Policy table
  lines.push("## Policy Table");
  lines.push("");
  lines.push("| Event ID | Policy ID | Delivery Mode | Priority | SLA | Active |");
  lines.push("|----------|-----------|---------------|----------|-----|--------|");
  for (const t of doc.policyTables) {
    lines.push(`| ${t.eventId} | ${t.policyId} | ${t.deliveryMode} | ${t.priority} | ${t.sla} | ${t.active ? "✓" : ""} |`);
  }
  return lines.join("\n");
}

// ===========================================================================
// JSON generation
// ===========================================================================

export function generateJsonDocumentation(): string {
  const doc = generateGovernanceDocumentation();
  return JSON.stringify(doc, null, 2);
}
