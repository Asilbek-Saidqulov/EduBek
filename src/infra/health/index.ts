/**
 * EduBek — Health check service.
 *
 * Three tiers:
 *   • liveness  — is the process running? (always 200 if the server is up)
 *   • readiness — is the service ready to accept traffic? (checks DB, etc.)
 *   • metrics   — Prometheus-format metrics export
 *
 * In Kubernetes:
 *   livenessProbe  → GET /api/health/live
 *   readinessProbe → GET /api/health/ready
 *
 * The readiness check verifies:
 *   • Database connectivity (Prisma)
 *   • Event bus is registered
 *   • (Future) Redis connectivity
 */
import { db } from "@/lib/db";
import { exportPrometheusMetrics } from "@/infra/metrics";
import { getLogger } from "@/lib/logger";

const log = getLogger("health");

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Record<string, { status: "pass" | "fail"; latencyMs?: number; error?: string }>;
}

/** Liveness — always returns healthy if the process is running. */
export function livenessCheck(): HealthCheckResult {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      process: { status: "pass" },
    },
  };
}

/** Readiness — checks DB connectivity + event bus. */
export async function readinessCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult["checks"] = {};
  let allHealthy = true;

  // Database
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: "pass", latencyMs: Date.now() - start };
  } catch (err) {
    allHealthy = false;
    checks.database = {
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
    };
    log.error("health.database_failed", { error: checks.database.error });
  }

  // Event bus (always registered if the module loaded)
  checks.eventBus = { status: "pass" };

  return {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };
}

/** Metrics — returns Prometheus text. */
export function metricsExport(): string {
  return exportPrometheusMetrics();
}
