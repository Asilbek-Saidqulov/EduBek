/**
 * EduBek — Resource Usage Analyzer (System 6).
 *
 * Tracks RAM, CPU, GPU, network, storage, cache, AI credits, database
 * connections, and worker utilization. Produces optimization suggestions.
 *
 * REUSES Cloud Infrastructure's InfraMetric, CostSnapshot, and
 * CloudWorker tables.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ResourceUsageReport, ResourceMetric, OptimizationRecommendation } from "./types";

const log = getLogger("resource-analyzer");

export async function generateResourceReport(): Promise<ResourceUsageReport> {
  const generatedAt = new Date().toISOString();
  const [infraMetrics, costSnapshots, workers] = await Promise.all([
    repo.fetchInfraMetrics({ limit: 500 }),
    repo.fetchCostSnapshots({ limit: 100 }),
    repo.fetchCloudWorkers(),
  ]);
  const ram = computeRamMetric();
  const cpu = computeCpuMetric(infraMetrics);
  const gpu = computeGpuMetric(infraMetrics);
  const network = computeNetworkMetric(infraMetrics);
  const storage = computeStorageMetric(infraMetrics);
  const cache = computeCacheMetric(infraMetrics);
  const aiCredits = computeAiCreditsMetric(costSnapshots);
  const dbConnections = computeDbConnectionsMetric(infraMetrics);
  const workerUtilization = computeWorkerUtilizationMetric(workers);
  const recommendations = generateResourceRecommendations({
    ram, cpu, cache, aiCredits, dbConnections, workerUtilization,
  });
  log.info("resource.audit_complete", {
    ramStatus: ram.status, cpuStatus: cpu.status,
    workerStatus: workerUtilization.status,
  });
  return {
    generatedAt,
    ram, cpu, gpu, network, storage, cache, aiCredits,
    databaseConnections: dbConnections, workerUtilization,
    recommendations,
  };
}

function computeRamMetric(): ResourceMetric {
  const mem = process.memoryUsage();
  const max = mem.rss; // Resident Set Size — approximate max
  const current = mem.heapUsed;
  const utilizationPercent = Math.round((current / (mem.heapTotal || 1)) * 100);
  return {
    current, max, unit: "bytes",
    utilizationPercent,
    trend: "stable",
    status: utilizationPercent > 85 ? "critical" : utilizationPercent > 70 ? "warning" : "healthy",
    recommendation: utilizationPercent > 85
      ? "RAM utilization is critical — investigate memory leaks or increase heap size."
      : utilizationPercent > 70
        ? "RAM utilization is elevated — monitor for leaks."
        : "RAM utilization is healthy.",
  };
}

function computeCpuMetric(metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  const cpuMetrics = metrics.filter(m => m.metric.includes("cpu") || m.metric.includes("event_loop"));
  const latest = cpuMetrics[0];
  const current = latest?.value ?? 0;
  const utilizationPercent = Math.min(100, Math.round(current * 100));
  return {
    current, max: 1, unit: "fraction",
    utilizationPercent,
    trend: "stable",
    status: utilizationPercent > 80 ? "critical" : utilizationPercent > 60 ? "warning" : "healthy",
    recommendation: utilizationPercent > 80
      ? "CPU utilization is critical — offload work to worker threads or scale horizontally."
      : "CPU utilization is healthy.",
  };
}

function computeGpuMetric(_metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  // GPU metrics aren't tracked at the application layer — return a placeholder
  return {
    current: 0, max: 0, unit: "n/a",
    utilizationPercent: 0, trend: "stable", status: "healthy",
    recommendation: "GPU usage is not tracked at the application layer. Add GPU metrics if AI inference uses GPUs.",
  };
}

function computeNetworkMetric(metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  const netMetrics = metrics.filter(m => m.metric.includes("network") || m.metric.includes("bandwidth"));
  const current = netMetrics[0]?.value ?? 0;
  return {
    current, max: 1000, unit: "Mbps",
    utilizationPercent: Math.round((current / 1000) * 100),
    trend: "stable", status: "healthy",
    recommendation: "Network utilization is within normal range.",
  };
}

function computeStorageMetric(metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  const storageMetrics = metrics.filter(m => m.metric.includes("storage") || m.metric.includes("disk"));
  const current = storageMetrics[0]?.value ?? 0;
  return {
    current, max: 100, unit: "GB",
    utilizationPercent: Math.round((current / 100) * 100),
    trend: "stable",
    status: current > 80 ? "warning" : "healthy",
    recommendation: current > 80
      ? "Storage usage exceeds 80% — consider archiving old data."
      : "Storage usage is healthy.",
  };
}

function computeCacheMetric(metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  const cacheMetrics = metrics.filter(m => m.metric.includes("cache"));
  const current = cacheMetrics[0]?.value ?? 0;
  return {
    current, max: 500, unit: "MB",
    utilizationPercent: Math.round((current / 500) * 100),
    trend: "stable",
    status: current > 450 ? "warning" : "healthy",
    recommendation: current > 450
      ? "Cache is near capacity — increase TTL or evict cold entries."
      : "Cache usage is healthy.",
  };
}

function computeAiCreditsMetric(costs: Awaited<ReturnType<typeof repo.fetchCostSnapshots>>): ResourceMetric {
  // CostSnapshot uses `estimatedUsd` (not amount) and `byService` (not category)
  const total = costs.reduce((s, c) => s + c.estimatedUsd, 0);
  const max = 100; // $100 budget per day
  return {
    current: total, max, unit: "USD",
    utilizationPercent: Math.round((total / max) * 100),
    trend: "stable",
    status: total > max * 0.8 ? "critical" : total > max * 0.6 ? "warning" : "healthy",
    recommendation: total > max * 0.8
      ? "AI credit usage is critical — implement stricter caching and deterministic shortcuts."
      : "AI credit usage is healthy.",
  };
}

function computeDbConnectionsMetric(metrics: Awaited<ReturnType<typeof repo.fetchInfraMetrics>>): ResourceMetric {
  const connMetrics = metrics.filter(m => m.metric.includes("connection") || m.metric.includes("db_pool"));
  const current = connMetrics[0]?.value ?? 5;
  const max = 20; // typical Prisma connection limit
  return {
    current, max, unit: "connections",
    utilizationPercent: Math.round((current / max) * 100),
    trend: "stable",
    status: current > max * 0.8 ? "critical" : current > max * 0.6 ? "warning" : "healthy",
    recommendation: current > max * 0.8
      ? "Database connection pool is near capacity — reduce concurrent queries or increase pool size."
      : "Database connection usage is healthy.",
  };
}

function computeWorkerUtilizationMetric(workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>): ResourceMetric {
  const total = workers.length;
  const active = workers.filter(w => w.status === "active").length;
  const utilizationPercent = total > 0 ? Math.round((active / total) * 100) : 0;
  return {
    current: active, max: total, unit: "workers",
    utilizationPercent,
    trend: "stable",
    status: utilizationPercent > 90 ? "critical" : utilizationPercent > 70 ? "warning" : "healthy",
    recommendation: utilizationPercent > 90
      ? "Worker utilization is critical — add more workers to handle the load."
      : "Worker utilization is healthy.",
  };
}

function generateResourceRecommendations(input: {
  ram: ResourceMetric; cpu: ResourceMetric; cache: ResourceMetric;
  aiCredits: ResourceMetric; dbConnections: ResourceMetric; workerUtilization: ResourceMetric;
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `resource-${++id}`;
  if (input.ram.status === "critical") {
    recs.push({
      id: nextId(), category: "resource",
      title: "RAM usage is critical",
      description: `RAM utilization is ${input.ram.utilizationPercent}%.`,
      impact: "critical", effort: "medium",
      recommendation: "Investigate memory leaks, increase heap size, or scale horizontally.",
    });
  }
  if (input.aiCredits.status === "critical") {
    recs.push({
      id: nextId(), category: "resource",
      title: "AI credit usage is critical",
      description: `AI credits at ${input.aiCredits.utilizationPercent}% of budget.`,
      impact: "critical", effort: "low",
      recommendation: "Implement stricter caching, prefer deterministic algorithms, and audit AI call necessity.",
    });
  }
  if (input.dbConnections.status === "critical") {
    recs.push({
      id: nextId(), category: "resource",
      title: "Database connection pool is near capacity",
      description: `${input.dbConnections.current}/${input.dbConnections.max} connections in use.`,
      impact: "high", effort: "low",
      recommendation: "Reduce concurrent queries, increase connection pool size, or use connection pooling.",
    });
  }
  if (input.workerUtilization.status === "critical") {
    recs.push({
      id: nextId(), category: "resource",
      title: "Worker utilization is critical",
      description: `${input.workerUtilization.current}/${input.workerUtilization.max} workers active.`,
      impact: "high", effort: "low",
      recommendation: "Add more workers to handle the load.",
    });
  }
  return recs;
}
