/**
 * EduBek — Failure Scenario Simulator (System 1).
 *
 * Simulates 12 failure scenarios in dry-run mode. Each scenario
 * describes the expected impact, affected systems, existing mitigations,
 * and recommended additional mitigations.
 *
 * REUSES Platform Orchestrator's circuit breakers, self-healing, and
 * Cloud Infrastructure's health snapshots to determine existing
 * mitigations.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  FailureScenario, FailureSimulationReport, FailureScenarioKind,
  ReliabilityRecommendation,
} from "./types";

const log = getLogger("failure-simulator");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateFailureReport(): Promise<FailureSimulationReport> {
  const generatedAt = new Date().toISOString();
  const [breakers, healthSnapshots, workers, webhookDeliveries, aiFailures] = await Promise.all([
    repo.fetchCircuitBreakers(),
    repo.fetchLatestHealthPerSubsystem(),
    repo.fetchCloudWorkers(),
    repo.fetchWebhookDeliveries({ limit: 50 }),
    repo.fetchAIInvocationFailures({ limit: 50 }),
  ]);
  const scenarios: FailureScenario[] = [];
  for (const kind of FAILURE_SCENARIO_KINDS) {
    scenarios.push(buildScenario(kind, { breakers, healthSnapshots, workers, webhookDeliveries, aiFailures }));
  }
  const summary = computeSummary(scenarios);
  const recommendations = generateFailureRecommendations(scenarios);
  log.info("failure.audit_complete", {
    scenarios: scenarios.length, critical: summary.critical,
    unmitigated: summary.unmitigated,
  });
  return { generatedAt, scenarios, summary, recommendations };
}

// ===========================================================================
// Scenario builders
// ===========================================================================

const FAILURE_SCENARIO_KINDS: FailureScenarioKind[] = [
  "database_unavailable", "redis_unavailable", "ai_provider_unavailable",
  "webhook_failure", "worker_crash", "queue_overflow",
  "disk_full", "memory_exhaustion", "network_partition",
  "partial_infrastructure_outage", "external_api_timeout", "event_bus_failure",
];

function buildScenario(kind: FailureScenarioKind, data: {
  breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>;
  healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>;
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
  webhookDeliveries: Awaited<ReturnType<typeof repo.fetchWebhookDeliveries>>;
  aiFailures: Awaited<ReturnType<typeof repo.fetchAIInvocationFailures>>;
}): FailureScenario {
  const mitigations = detectMitigations(kind, data);
  switch (kind) {
    case "database_unavailable":
      return {
        kind, title: "Database Unavailable",
        description: "The primary SQLite/PostgreSQL database becomes unreachable or corrupted.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 100,
          dataLossRisk: "medium", readonlyFallback: false,
          degradationLevel: "total",
        },
        affectedSystems: ["database", "all-features", "auth", "api"],
        estimatedDowntimeMinutes: mitigations.length > 0 ? 15 : 60,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Deploy a read replica for read-only fallback",
          "Implement database connection pooling with retry",
          "Set up automated database backups with point-in-time recovery",
          "Add a health check endpoint that probes database connectivity",
        ],
        severity: "critical",
      };
    case "redis_unavailable":
      return {
        kind, title: "Cache (Redis) Unavailable",
        description: "The cache layer becomes unreachable, causing increased database load.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 80,
          dataLossRisk: "none", readonlyFallback: true,
          degradationLevel: "moderate",
        },
        affectedSystems: ["cache", "search", "recommendations", "dashboards"],
        estimatedDowntimeMinutes: mitigations.length > 0 ? 5 : 30,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Implement circuit breaker on cache reads with DB fallback",
          "Add a local in-memory cache fallback for critical data",
          "Monitor cache hit rate and alert when it drops below 50%",
          "Cache warm-up procedure after cache restart",
        ],
        severity: "high",
      };
    case "ai_provider_unavailable":
      return {
        kind, title: "AI Provider Unavailable",
        description: "The primary AI inference provider (ZAI/OpenAI) becomes unavailable or rate-limited.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 60,
          dataLossRisk: "none", readonlyFallback: true,
          degradationLevel: "moderate",
        },
        affectedSystems: ["ai-workspace", "cognitive-ai", "assessment-platform", "learning-studio"],
        estimatedDowntimeMinutes: mitigations.length > 0 ? 2 : 30,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Configure multiple AI providers with automatic failover",
          "Cache AI responses for common queries",
          "Implement deterministic fallbacks for critical AI features",
          "Show graceful 'AI temporarily unavailable' message to users",
        ],
        severity: "high",
      };
    case "webhook_failure":
      return {
        kind, title: "Webhook Delivery Failure",
        description: "Outgoing webhooks fail to deliver to external endpoints.",
        dryRun: true,
        expectedImpact: {
          userFacing: false, affectedUserPercent: 10,
          dataLossRisk: "low", readonlyFallback: false,
          degradationLevel: "minor",
        },
        affectedSystems: ["enterprise-integration", "platform-sdk"],
        estimatedDowntimeMinutes: 0,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Implement exponential backoff with dead-letter queue",
          "Add webhook delivery monitoring with alerting",
          "Provide a webhook replay mechanism for missed deliveries",
        ],
        severity: "low",
      };
    case "worker_crash":
      return {
        kind, title: "Background Worker Crash",
        description: "A cloud worker crashes, causing background jobs to queue up.",
        dryRun: true,
        expectedImpact: {
          userFacing: false, affectedUserPercent: 30,
          dataLossRisk: "none", readonlyFallback: true,
          degradationLevel: "minor",
        },
        affectedSystems: ["cloud-infra", "education-os", "data-fabric"],
        estimatedDowntimeMinutes: mitigations.length > 0 ? 5 : 20,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Deploy multiple workers for redundancy",
          "Implement automatic worker restart on crash",
          "Add job idempotency to prevent duplicate processing",
          "Monitor queue depth and auto-scale workers",
        ],
        severity: "medium",
      };
    case "queue_overflow":
      return {
        kind, title: "Queue Overflow",
        description: "A job queue grows beyond capacity, causing delays and potential data loss.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 50,
          dataLossRisk: "low", readonlyFallback: true,
          degradationLevel: "moderate",
        },
        affectedSystems: ["cloud-infra", "education-os"],
        estimatedDowntimeMinutes: 15,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Implement queue depth alerting with auto-scaling",
          "Add a dead-letter queue for overflow",
          "Prioritize critical jobs over non-critical",
          "Implement backpressure on producers",
        ],
        severity: "high",
      };
    case "disk_full":
      return {
        kind, title: "Disk Full",
        description: "The server's disk runs out of space, causing writes to fail.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 100,
          dataLossRisk: "high", readonlyFallback: false,
          degradationLevel: "severe",
        },
        affectedSystems: ["database", "storage", "media-pipeline"],
        estimatedDowntimeMinutes: 30,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Set up disk usage alerting at 80% threshold",
          "Implement automated log rotation and cleanup",
          "Move media uploads to object storage (S3)",
          "Regular pruning of old analytics events",
        ],
        severity: "critical",
      };
    case "memory_exhaustion":
      return {
        kind, title: "Memory Exhaustion",
        description: "The Node.js process runs out of memory and crashes.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 100,
          dataLossRisk: "low", readonlyFallback: false,
          degradationLevel: "total",
        },
        affectedSystems: ["all"],
        estimatedDowntimeMinutes: 10,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Increase Node.js heap size (--max-old-space-size)",
          "Implement memory leak detection in CI",
          "Add memory usage monitoring with alerting",
          "Use streaming for large data processing",
        ],
        severity: "high",
      };
    case "network_partition":
      return {
        kind, title: "Network Partition",
        description: "Network connectivity to external services is lost.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 70,
          dataLossRisk: "none", readonlyFallback: true,
          degradationLevel: "severe",
        },
        affectedSystems: ["ai-providers", "marketplace", "external-integrations"],
        estimatedDowntimeMinutes: 20,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Implement circuit breakers on all external calls",
          "Cache external API responses",
          "Queue external calls for retry when network recovers",
          "Monitor external endpoint reachability",
        ],
        severity: "high",
      };
    case "partial_infrastructure_outage":
      return {
        kind, title: "Partial Infrastructure Outage",
        description: "Some (but not all) infrastructure components fail simultaneously.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 50,
          dataLossRisk: "medium", readonlyFallback: true,
          degradationLevel: "severe",
        },
        affectedSystems: ["multiple"],
        estimatedDowntimeMinutes: 45,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Implement dependency-aware health checks",
          "Deploy across multiple availability zones",
          "Document a partial-outage runbook",
          "Test failover procedures regularly",
        ],
        severity: "critical",
      };
    case "external_api_timeout":
      return {
        kind, title: "External API Timeout",
        description: "An external API becomes slow or unresponsive.",
        dryRun: true,
        expectedImpact: {
          userFacing: true, affectedUserPercent: 40,
          dataLossRisk: "none", readonlyFallback: true,
          degradationLevel: "moderate",
        },
        affectedSystems: ["ai-workspace", "enterprise-integration"],
        estimatedDowntimeMinutes: 10,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Set aggressive timeouts on all external calls",
          "Implement circuit breakers with fallback responses",
          "Cache successful responses for short periods",
          "Monitor external API latency and alert on degradation",
        ],
        severity: "medium",
      };
    case "event_bus_failure":
      return {
        kind, title: "Event Bus Failure",
        description: "The in-process event bus stops delivering events.",
        dryRun: true,
        expectedImpact: {
          userFacing: false, affectedUserPercent: 80,
          dataLossRisk: "medium", readonlyFallback: false,
          degradationLevel: "severe",
        },
        affectedSystems: ["platform-orchestrator", "education-os", "product-intelligence"],
        estimatedDowntimeMinutes: 15,
        existingMitigations: mitigations,
        recommendedMitigations: [
          "Persist critical events to the event store before publishing",
          "Implement event bus health monitoring",
          "Add a retry mechanism for failed event deliveries",
          "Consider a message queue for critical events",
        ],
        severity: "high",
      };
  }
}

function detectMitigations(kind: FailureScenarioKind, data: {
  breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>;
  healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>;
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
  webhookDeliveries: Awaited<ReturnType<typeof repo.fetchWebhookDeliveries>>;
  aiFailures: Awaited<ReturnType<typeof repo.fetchAIInvocationFailures>>;
}): string[] {
  const mitigations: string[] = [];
  // Check circuit breakers
  const hasAiBreaker = data.breakers.some(b => b.module === "ai-workspace" && b.state !== "open");
  if (hasAiBreaker && (kind === "ai_provider_unavailable" || kind === "external_api_timeout")) {
    mitigations.push("Circuit breaker on AI provider calls");
  }
  const hasWebhookBreaker = data.breakers.some(b => b.module === "enterprise-integration");
  if (hasWebhookBreaker && kind === "webhook_failure") {
    mitigations.push("Circuit breaker on webhook deliveries");
  }
  // Check worker redundancy
  const activeWorkers = data.workers.filter(w => w.status === "active").length;
  if (activeWorkers > 1 && kind === "worker_crash") {
    mitigations.push(`${activeWorkers} active workers — redundancy available`);
  }
  // Check health monitoring
  const hasHealthMonitoring = data.healthSnapshots.length > 0;
  if (hasHealthMonitoring) {
    mitigations.push("Health monitoring is active");
  }
  // Check AI provider fallback (cognitive-ai has deterministic fallback)
  if (kind === "ai_provider_unavailable") {
    mitigations.push("Cognitive AI layer has deterministic fallback mode");
  }
  return mitigations;
}

function computeSummary(scenarios: FailureScenario[]) {
  const critical = scenarios.filter(s => s.severity === "critical").length;
  const high = scenarios.filter(s => s.severity === "high").length;
  const medium = scenarios.filter(s => s.severity === "medium").length;
  const low = scenarios.filter(s => s.severity === "low").length;
  const mitigated = scenarios.filter(s => s.existingMitigations.length > 0).length;
  const unmitigated = scenarios.length - mitigated;
  return { total: scenarios.length, critical, high, medium, low, mitigated, unmitigated };
}

function generateFailureRecommendations(scenarios: FailureScenario[]): ReliabilityRecommendation[] {
  const recs: ReliabilityRecommendation[] = [];
  let id = 0;
  const nextId = () => `failure-${++id}`;
  const critical = scenarios.filter(s => s.severity === "critical" && s.existingMitigations.length < 2);
  if (critical.length > 0) {
    recs.push({
      id: nextId(), category: "failure",
      title: "Address critical failure scenarios with insufficient mitigations",
      description: `${critical.length} critical scenario(s) have fewer than 2 existing mitigations.`,
      impact: "critical", effort: "high",
      recommendation: "Implement the recommended mitigations for each critical scenario.",
    });
  }
  const unmitigated = scenarios.filter(s => s.existingMitigations.length === 0);
  if (unmitigated.length > 0) {
    recs.push({
      id: nextId(), category: "failure",
      title: "Add mitigations for unmitigated scenarios",
      description: `${unmitigated.length} scenario(s) have no existing mitigations.`,
      impact: "high", effort: "medium",
      recommendation: "Prioritize adding circuit breakers, fallbacks, and monitoring.",
    });
  }
  return recs;
}
