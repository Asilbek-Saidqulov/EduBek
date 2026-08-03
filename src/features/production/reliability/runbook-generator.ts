/**
 * EduBek — Operational Runbook Generator (System 8).
 *
 * Generates runbooks for 10 common operational scenarios. Each runbook
 * includes detection, diagnosis, mitigation, verification, recovery, and
 * postmortem checklist.
 */
import { getLogger } from "@/lib/logger";
import type { OperationalRunbook, RunbookSection } from "./types";

const log = getLogger("runbook-generator");

const RUNBOOK_SCENARIOS = [
  "database_outage",
  "ai_outage",
  "cache_outage",
  "worker_failure",
  "queue_congestion",
  "high_latency",
  "deployment_rollback",
  "certificate_expiration",
  "secret_rotation",
  "disk_full",
] as const;

export async function generateAllRunbooks(): Promise<OperationalRunbook[]> {
  return Promise.all(RUNBOOK_SCENARIOS.map(scenario => generateRunbook(scenario)));
}

export async function generateRunbook(scenario: typeof RUNBOOK_SCENARIOS[number]): Promise<OperationalRunbook> {
  log.debug("runbook.generating", { scenario });
  switch (scenario) {
    case "database_outage":
      return buildDatabaseOutageRunbook();
    case "ai_outage":
      return buildAIOutageRunbook();
    case "cache_outage":
      return buildCacheOutageRunbook();
    case "worker_failure":
      return buildWorkerFailureRunbook();
    case "queue_congestion":
      return buildQueueCongestionRunbook();
    case "high_latency":
      return buildHighLatencyRunbook();
    case "deployment_rollback":
      return buildDeploymentRollbackRunbook();
    case "certificate_expiration":
      return buildCertificateExpirationRunbook();
    case "secret_rotation":
      return buildSecretRotationRunbook();
    case "disk_full":
      return buildDiskFullRunbook();
  }
}

function buildDatabaseOutageRunbook(): OperationalRunbook {
  return {
    id: "runbook-database-outage",
    scenario: "database_outage",
    title: "Database Outage Runbook",
    description: "The primary database is unreachable or returning errors.",
    detection: {
      steps: [
        { order: 1, action: "Check health snapshots for database status", command: "curl /api/production/readiness", expectedOutcome: "Database status is 'down'" },
        { order: 2, action: "Check error spans for database errors", command: "curl /api/orchestrator/observability", expectedOutcome: "Error rate > 50%" },
        { order: 3, action: "Verify database connectivity", command: "npx prisma db execute --stdin <<< 'SELECT 1'", expectedOutcome: "Query returns 1" },
      ],
      tools: ["platform-orchestrator", "prisma-cli"],
      estimatedTimeMinutes: 5,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check database file exists", command: "ls -la db/custom.db", expectedOutcome: "File exists" },
        { order: 2, action: "Check disk space", command: "df -h", expectedOutcome: "Disk has free space" },
        { order: 3, action: "Check database process", command: "ps aux | grep sqlite", expectedOutcome: "Process is running" },
        { order: 4, action: "Check recent migrations", command: "ls prisma/migrations/", expectedOutcome: "No partial migrations" },
      ],
      tools: ["system-cli"],
      estimatedTimeMinutes: 10,
    },
    mitigation: {
      steps: [
        { order: 1, action: "If disk is full, free up space (delete logs, old analytics)", expectedOutcome: "Disk space freed" },
        { order: 2, action: "If database is corrupted, restore from backup", command: "cp db/backup/custom.db.bak db/custom.db", expectedOutcome: "Database restored" },
        { order: 3, action: "Restart the application server", expectedOutcome: "Server reconnects to database" },
        { order: 4, action: "If corruption persists, run Prisma migration reset", command: "npx prisma migrate reset", expectedOutcome: "Database recreated (DESTRUCTIVE)" },
      ],
      tools: ["system-cli", "prisma-cli"],
      estimatedTimeMinutes: 20,
    },
    verification: {
      steps: [
        { order: 1, action: "Run a test query", command: "npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM User'", expectedOutcome: "Query returns a count" },
        { order: 2, action: "Check API health", command: "curl /api/health", expectedOutcome: "200 OK" },
        { order: 3, action: "Monitor error rate for 10 minutes", expectedOutcome: "Error rate returns to 0" },
      ],
      tools: ["api-client"],
      estimatedTimeMinutes: 10,
    },
    recovery: {
      steps: [
        { order: 1, action: "Verify all features are working", expectedOutcome: "No user-reported issues" },
        { order: 2, action: "Check for data consistency issues", expectedOutcome: "No inconsistencies" },
        { order: 3, action: "Schedule a database backup", command: "sqlite3 db/custom.db '.backup db/backup/custom.db.bak'", expectedOutcome: "Backup created" },
      ],
      tools: ["api-client", "sqlite3"],
      estimatedTimeMinutes: 15,
    },
    postmortemChecklist: [
      "Document the root cause",
      "Document the timeline of detection, mitigation, and resolution",
      "Identify what could have been detected faster",
      "Add monitoring to prevent recurrence",
      "Schedule a database backup automation task",
      "Review with the team within 48 hours",
    ],
    estimatedResolutionMinutes: 60,
  };
}

function buildAIOutageRunbook(): OperationalRunbook {
  return {
    id: "runbook-ai-outage",
    scenario: "ai_outage",
    title: "AI Provider Outage Runbook",
    description: "The AI inference provider is unavailable or returning errors.",
    detection: {
      steps: [
        { order: 1, action: "Check AI invocation failures", command: "curl /api/orchestrator/observability", expectedOutcome: "AI error rate > 50%" },
        { order: 2, action: "Check circuit breaker state", command: "curl /api/orchestrator/self-healing", expectedOutcome: "AI circuit breaker is open" },
      ],
      tools: ["platform-orchestrator"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Test AI provider directly", command: "curl https://api.openai.com/v1/models", expectedOutcome: "Provider responds" },
        { order: 2, action: "Check API key validity", expectedOutcome: "Key is valid" },
        { order: 3, action: "Check rate limit status", expectedOutcome: "Not rate-limited" },
      ],
      tools: ["api-client"],
      estimatedTimeMinutes: 5,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Verify circuit breaker is open (automatic fallback)", expectedOutcome: "Breaker is open" },
        { order: 2, action: "Verify cognitive-ai deterministic fallback is active", expectedOutcome: "Fallback responses served" },
        { order: 3, action: "If provider is down, switch to a secondary provider", expectedOutcome: "Secondary provider is active" },
        { order: 4, action: "Notify users via in-app banner", expectedOutcome: "Users informed" },
      ],
      tools: ["platform-orchestrator", "cognitive-ai"],
      estimatedTimeMinutes: 10,
    },
    verification: {
      steps: [
        { order: 1, action: "Test AI workspace endpoint", command: "curl /api/ai-workspace", expectedOutcome: "200 OK or fallback response" },
        { order: 2, action: "Monitor error rate for 10 minutes", expectedOutcome: "Error rate stable" },
      ],
      tools: ["api-client"],
      estimatedTimeMinutes: 10,
    },
    recovery: {
      steps: [
        { order: 1, action: "Once provider is back, reset the circuit breaker", expectedOutcome: "Breaker is closed" },
        { order: 2, action: "Verify AI calls are succeeding", expectedOutcome: "Success rate > 95%" },
      ],
      tools: ["platform-orchestrator"],
      estimatedTimeMinutes: 5,
    },
    postmortemChecklist: [
      "Document which provider failed and why",
      "Document how long the fallback was active",
      "Evaluate whether a secondary provider should be configured",
      "Review circuit breaker thresholds",
    ],
    estimatedResolutionMinutes: 30,
  };
}

function buildCacheOutageRunbook(): OperationalRunbook {
  return {
    id: "runbook-cache-outage",
    scenario: "cache_outage",
    title: "Cache Outage Runbook",
    description: "The cache layer is unavailable or returning errors.",
    detection: {
      steps: [
        { order: 1, action: "Check cache hit rate", command: "curl /api/production/cache", expectedOutcome: "Hit rate dropped to 0" },
        { order: 2, action: "Check database load", expectedOutcome: "Load increased significantly" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check cache entries", command: "curl /api/cloud/cache", expectedOutcome: "No entries or errors" },
        { order: 2, action: "Check cache process", expectedOutcome: "Process is running" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 5,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Restart the cache service", expectedOutcome: "Cache is back online" },
        { order: 2, action: "Trigger cache warm-up", command: "curl -X POST /api/cloud/cache/warmup", expectedOutcome: "Cache is warming up" },
        { order: 3, action: "Monitor database load during warm-up", expectedOutcome: "Load stays within limits" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 15,
    },
    verification: {
      steps: [
        { order: 1, action: "Check cache hit rate", expectedOutcome: "Hit rate > 50%" },
        { order: 2, action: "Check response times", expectedOutcome: "Latency back to normal" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 10,
    },
    recovery: {
      steps: [
        { order: 1, action: "Wait for full cache warm-up", expectedOutcome: "Hit rate > 80%" },
        { order: 2, action: "Review cache configuration", expectedOutcome: "TTLs are optimal" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 20,
    },
    postmortemChecklist: [
      "Document why the cache failed",
      "Evaluate whether a cache replica should be added",
      "Review cache warm-up procedure",
    ],
    estimatedResolutionMinutes: 45,
  };
}

function buildWorkerFailureRunbook(): OperationalRunbook {
  return {
    id: "runbook-worker-failure",
    scenario: "worker_failure",
    title: "Background Worker Failure Runbook",
    description: "A cloud worker has crashed or is not processing jobs.",
    detection: {
      steps: [
        { order: 1, action: "Check worker status", command: "curl /api/cloud/workers", expectedOutcome: "Worker status is 'failed'" },
        { order: 2, action: "Check queue depth", expectedOutcome: "Queue is growing" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check worker logs for errors", expectedOutcome: "Error identified" },
        { order: 2, action: "Check if the worker ran out of memory", expectedOutcome: "OOM confirmed or denied" },
        { order: 3, action: "Check the job that caused the crash", expectedOutcome: "Problematic job identified" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Restart the failed worker", command: "curl -X POST /api/cloud/workers/{id}/restart", expectedOutcome: "Worker is back online" },
        { order: 2, action: "Move problematic jobs to dead-letter queue", expectedOutcome: "Queue depth decreasing" },
        { order: 3, action: "Scale up workers if queue is deep", expectedOutcome: "Queue draining" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 15,
    },
    verification: {
      steps: [
        { order: 1, action: "Check worker heartbeat", expectedOutcome: "Heartbeat is current" },
        { order: 2, action: "Check queue depth", expectedOutcome: "Queue is draining" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    recovery: {
      steps: [
        { order: 1, action: "Review dead-letter queue", expectedOutcome: "Problematic jobs identified" },
        { order: 2, action: "Fix or discard dead-letter jobs", expectedOutcome: "Queue is clean" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 15,
    },
    postmortemChecklist: [
      "Document why the worker crashed",
      "Add monitoring for the specific failure mode",
      "Review job idempotency",
    ],
    estimatedResolutionMinutes: 40,
  };
}

function buildQueueCongestionRunbook(): OperationalRunbook {
  return {
    id: "runbook-queue-congestion",
    scenario: "queue_congestion",
    title: "Queue Congestion Runbook",
    description: "A job queue is growing beyond capacity.",
    detection: {
      steps: [
        { order: 1, action: "Check queue depth", command: "curl /api/production/resources", expectedOutcome: "Queue depth > 100" },
        { order: 2, action: "Check job processing rate", expectedOutcome: "Throughput is low" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check worker count", expectedOutcome: "Enough workers" },
        { order: 2, action: "Check for stuck jobs", expectedOutcome: "Stuck jobs identified" },
        { order: 3, action: "Check job duration", expectedOutcome: "Jobs are taking too long" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Cancel stuck jobs", command: "curl -X DELETE /api/cloud/jobs/{id}", expectedOutcome: "Stuck jobs removed" },
        { order: 2, action: "Scale up workers", expectedOutcome: "More workers processing" },
        { order: 3, action: "Prioritize critical jobs", expectedOutcome: "Critical jobs processed first" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 15,
    },
    verification: {
      steps: [
        { order: 1, action: "Monitor queue depth", expectedOutcome: "Depth is decreasing" },
        { order: 2, action: "Check job success rate", expectedOutcome: "Success rate > 95%" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 15,
    },
    recovery: {
      steps: [
        { order: 1, action: "Process dead-letter queue", expectedOutcome: "Dead-letter queue is empty" },
        { order: 2, action: "Scale workers back to normal", expectedOutcome: "Worker count is optimal" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 20,
    },
    postmortemChecklist: [
      "Document why the queue congested",
      "Add auto-scaling for the affected queue",
      "Review job priorities",
    ],
    estimatedResolutionMinutes: 50,
  };
}

function buildHighLatencyRunbook(): OperationalRunbook {
  return {
    id: "runbook-high-latency",
    scenario: "high_latency",
    title: "High Latency Runbook",
    description: "API response times are elevated beyond acceptable thresholds.",
    detection: {
      steps: [
        { order: 1, action: "Check API performance report", command: "curl /api/production/performance", expectedOutcome: "p95 > 1000ms" },
        { order: 2, action: "Check slow endpoints", expectedOutcome: "Slow endpoints identified" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check database query times", expectedOutcome: "Slow queries identified" },
        { order: 2, action: "Check CPU and memory usage", expectedOutcome: "Resources are constrained" },
        { order: 3, action: "Check for N+1 queries", expectedOutcome: "N+1 patterns identified" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 15,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Add caching for slow endpoints", expectedOutcome: "Latency reduced" },
        { order: 2, action: "Optimize slow database queries", expectedOutcome: "Query time reduced" },
        { order: 3, action: "Scale up the web server", expectedOutcome: "More capacity" },
      ],
      tools: ["cloud-infra", "production-audit"],
      estimatedTimeMinutes: 30,
    },
    verification: {
      steps: [
        { order: 1, action: "Monitor p95 latency", expectedOutcome: "p95 < 500ms" },
        { order: 2, action: "Check error rate", expectedOutcome: "No new errors" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 15,
    },
    recovery: {
      steps: [
        { order: 1, action: "Review optimization changes", expectedOutcome: "Changes are stable" },
        { order: 2, action: "Scale back resources if over-provisioned", expectedOutcome: "Resources right-sized" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    postmortemChecklist: [
      "Document the root cause of high latency",
      "Add latency monitoring with alerting",
      "Review query optimization opportunities",
    ],
    estimatedResolutionMinutes: 60,
  };
}

function buildDeploymentRollbackRunbook(): OperationalRunbook {
  return {
    id: "runbook-deployment-rollback",
    scenario: "deployment_rollback",
    title: "Deployment Rollback Runbook",
    description: "A deployment has introduced issues and needs to be rolled back.",
    detection: {
      steps: [
        { order: 1, action: "Check error rate after deployment", expectedOutcome: "Error rate increased" },
        { order: 2, action: "Check health snapshots", expectedOutcome: "Subsystems degraded" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Check git log for recent changes", command: "git log --oneline -5", expectedOutcome: "Recent commit identified" },
        { order: 2, action: "Check if a Prisma migration was applied", expectedOutcome: "Migration identified" },
      ],
      tools: ["git"],
      estimatedTimeMinutes: 5,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Revert to the previous deployment", command: "git revert HEAD && npm run build && deploy", expectedOutcome: "Previous version deployed" },
        { order: 2, action: "If migration was applied, roll it back", command: "npx prisma migrate resolve --rolled-back <migration>", expectedOutcome: "Migration rolled back" },
        { order: 3, action: "Verify the application is healthy", expectedOutcome: "Health check passes" },
      ],
      tools: ["git", "prisma-cli"],
      estimatedTimeMinutes: 20,
    },
    verification: {
      steps: [
        { order: 1, action: "Check error rate", expectedOutcome: "Error rate back to normal" },
        { order: 2, action: "Check health snapshots", expectedOutcome: "All subsystems healthy" },
        { order: 3, action: "Monitor for 30 minutes", expectedOutcome: "No new issues" },
      ],
      tools: ["production-audit"],
      estimatedTimeMinutes: 30,
    },
    recovery: {
      steps: [
        { order: 1, action: "Document what went wrong", expectedOutcome: "Root cause documented" },
        { order: 2, action: "Fix the issue in a new deployment", expectedOutcome: "Fixed version deployed" },
      ],
      tools: ["git"],
      estimatedTimeMinutes: 60,
    },
    postmortemChecklist: [
      "Document the deployment that caused the issue",
      "Document the rollback timeline",
      "Add deployment tests to prevent recurrence",
      "Review the CI/CD pipeline",
    ],
    estimatedResolutionMinutes: 90,
  };
}

function buildCertificateExpirationRunbook(): OperationalRunbook {
  return {
    id: "runbook-cert-expiration",
    scenario: "certificate_expiration",
    title: "Certificate Expiration Runbook",
    description: "An SSL/TLS certificate is about to expire or has expired.",
    detection: {
      steps: [
        { order: 1, action: "Check certificate expiration dates", command: "openssl s_client -connect edubek.com:443 | openssl x509 -noout -dates", expectedOutcome: "Expiration date identified" },
        { order: 2, action: "Check secrets due for rotation", command: "curl /api/cloud/secrets", expectedOutcome: "Expiring secrets listed" },
      ],
      tools: ["openssl", "cloud-infra"],
      estimatedTimeMinutes: 5,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Identify which certificate is expiring", expectedOutcome: "Certificate identified" },
        { order: 2, action: "Check the certificate authority", expectedOutcome: "CA identified" },
      ],
      tools: ["openssl"],
      estimatedTimeMinutes: 5,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Renew the certificate via the CA", expectedOutcome: "New certificate obtained" },
        { order: 2, action: "Install the new certificate", expectedOutcome: "Certificate installed" },
        { order: 3, action: "Restart the web server", expectedOutcome: "Server using new certificate" },
      ],
      tools: ["openssl", "system-cli"],
      estimatedTimeMinutes: 30,
    },
    verification: {
      steps: [
        { order: 1, action: "Verify the new certificate is active", command: "openssl s_client -connect edubek.com:443", expectedOutcome: "New certificate is served" },
        { order: 2, action: "Check HTTPS is working", expectedOutcome: "No SSL errors" },
      ],
      tools: ["openssl"],
      estimatedTimeMinutes: 5,
    },
    recovery: {
      steps: [
        { order: 1, action: "Set up auto-renewal", command: "certbot renew --dry-run", expectedOutcome: "Auto-renewal configured" },
      ],
      tools: ["certbot"],
      estimatedTimeMinutes: 10,
    },
    postmortemChecklist: [
      "Document why the certificate was not renewed earlier",
      "Set up certificate expiration monitoring",
      "Configure auto-renewal",
    ],
    estimatedResolutionMinutes: 45,
  };
}

function buildSecretRotationRunbook(): OperationalRunbook {
  return {
    id: "runbook-secret-rotation",
    scenario: "secret_rotation",
    title: "Secret Rotation Runbook",
    description: "API keys, database credentials, or other secrets need rotation.",
    detection: {
      steps: [
        { order: 1, action: "Check secrets due for rotation", command: "curl /api/cloud/secrets/rotation", expectedOutcome: "Secrets listed" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Identify which secrets need rotation", expectedOutcome: "Secrets identified" },
        { order: 2, action: "Check where each secret is used", expectedOutcome: "Usage mapped" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Generate new secret values", expectedOutcome: "New secrets generated" },
        { order: 2, action: "Update secrets in the secret store", command: "curl -X PUT /api/cloud/secrets/{name}", expectedOutcome: "Secrets updated" },
        { order: 3, action: "Restart affected services", expectedOutcome: "Services using new secrets" },
        { order: 4, action: "Verify services are healthy", expectedOutcome: "All services healthy" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 30,
    },
    verification: {
      steps: [
        { order: 1, action: "Test that services can access new secrets", expectedOutcome: "Access confirmed" },
        { order: 2, action: "Monitor for authentication errors", expectedOutcome: "No errors" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    recovery: {
      steps: [
        { order: 1, action: "Schedule the next rotation cycle", expectedOutcome: "Rotation scheduled" },
        { order: 2, action: "Document the rotation procedure", expectedOutcome: "Procedure documented" },
      ],
      tools: ["cloud-infra"],
      estimatedTimeMinutes: 10,
    },
    postmortemChecklist: [
      "Document the rotation procedure",
      "Set up automated rotation reminders",
      "Review secret access policies",
    ],
    estimatedResolutionMinutes: 50,
  };
}

function buildDiskFullRunbook(): OperationalRunbook {
  return {
    id: "runbook-disk-full",
    scenario: "disk_full",
    title: "Disk Full Runbook",
    description: "The server's disk is full or nearly full.",
    detection: {
      steps: [
        { order: 1, action: "Check disk usage", command: "df -h", expectedOutcome: "Disk usage > 90%" },
        { order: 2, action: "Check resource report", command: "curl /api/production/resources", expectedOutcome: "Storage status is 'critical'" },
      ],
      tools: ["system-cli", "production-audit"],
      estimatedTimeMinutes: 3,
    },
    diagnosis: {
      steps: [
        { order: 1, action: "Find large files", command: "du -sh /var/log/* | sort -rh | head -10", expectedOutcome: "Large files identified" },
        { order: 2, action: "Check database size", command: "ls -lh db/custom.db", expectedOutcome: "Database size identified" },
        { order: 3, action: "Check for large media uploads", expectedOutcome: "Large files identified" },
      ],
      tools: ["system-cli"],
      estimatedTimeMinutes: 10,
    },
    mitigation: {
      steps: [
        { order: 1, action: "Delete old log files", command: "find /var/log -name '*.log' -mtime +7 -delete", expectedOutcome: "Logs cleaned up" },
        { order: 2, action: "Prune old analytics events", command: "npx prisma db execute --stdin <<< 'DELETE FROM AnalyticsEvent WHERE createdAt < date(\"-30 days\")'", expectedOutcome: "Old events deleted" },
        { order: 3, action: "Move media uploads to object storage", expectedOutcome: "Disk space freed" },
        { order: 4, action: "Compress the database", command: "sqlite3 db/custom.db 'VACUUM'", expectedOutcome: "Database compacted" },
      ],
      tools: ["system-cli", "sqlite3", "prisma-cli"],
      estimatedTimeMinutes: 30,
    },
    verification: {
      steps: [
        { order: 1, action: "Check disk usage", command: "df -h", expectedOutcome: "Disk usage < 80%" },
        { order: 2, action: "Verify the application is healthy", expectedOutcome: "No errors" },
      ],
      tools: ["system-cli"],
      estimatedTimeMinutes: 5,
    },
    recovery: {
      steps: [
        { order: 1, action: "Set up disk usage monitoring with alerting at 80%", expectedOutcome: "Monitoring configured" },
        { order: 2, action: "Schedule regular cleanup tasks", expectedOutcome: "Cleanup automated" },
      ],
      tools: ["system-cli"],
      estimatedTimeMinutes: 15,
    },
    postmortemChecklist: [
      "Document what consumed the disk space",
      "Set up disk usage alerting",
      "Automate cleanup procedures",
      "Consider moving to object storage for large files",
    ],
    estimatedResolutionMinutes: 50,
  };
}
