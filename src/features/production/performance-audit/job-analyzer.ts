/**
 * EduBek — Background Job Analyzer (System 5).
 *
 * Inspects background jobs in Education OS, Cloud Infrastructure,
 * Automation Engine, Data Fabric, Digital Twins, and Platform
 * Intelligence. Measures execution duration, retries, queue depth,
 * throughput, and bottlenecks.
 *
 * REUSES CloudJob + OrchestratorWorkflowExecution tables.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  BackgroundJobReport, JobQueueSummary, JobTypeSummary,
  JobBottleneck, JobRetryStats, OptimizationRecommendation,
} from "./types";

const log = getLogger("job-analyzer");

export async function generateJobReport(): Promise<BackgroundJobReport> {
  const generatedAt = new Date().toISOString();
  const [cloudJobs, workflowExecutions] = await Promise.all([
    repo.fetchCloudJobs({ limit: 1000 }),
    repo.fetchWorkflowExecutions({ limit: 200 }),
  ]);
  const queues = summarizeQueues(cloudJobs);
  const jobTypes = summarizeJobTypes(cloudJobs);
  const bottlenecks = identifyBottlenecks(cloudJobs, workflowExecutions);
  const retryStats = computeRetryStats(cloudJobs);
  const recommendations = generateJobRecommendations({ queues, bottlenecks, retryStats });
  log.info("job.audit_complete", {
    jobs: cloudJobs.length, workflows: workflowExecutions.length,
    queues: queues.length, bottlenecks: bottlenecks.length,
  });
  return { generatedAt, queues, jobTypes, bottlenecks, retryStats, recommendations };
}

function summarizeQueues(jobs: Awaited<ReturnType<typeof repo.fetchCloudJobs>>): JobQueueSummary[] {
  const byQueue = new Map<string, { depth: number; processing: number; completed: number; failed: number; durations: number[] }>();
  for (const j of jobs) {
    const q = byQueue.get(j.queue) ?? { depth: 0, processing: 0, completed: 0, failed: 0, durations: [] };
    if (j.status === "queued") q.depth++;
    if (j.status === "running") q.processing++;
    if (j.status === "completed") q.completed++;
    if (j.status === "failed" || j.status === "dead_letter") q.failed++;
    if (j.startedAt && j.completedAt) {
      const dur = new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime();
      if (dur > 0) q.durations.push(dur);
    }
    byQueue.set(j.queue, q);
  }
  return Array.from(byQueue.entries()).map(([queue, s]) => ({
    queue, depth: s.depth, processing: s.processing,
    completed24h: s.completed, failed24h: s.failed,
    avgDurationMs: s.durations.length > 0 ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length) : 0,
    throughputPerMin: Math.round(s.completed / (24 * 60)),
  }));
}

function summarizeJobTypes(jobs: Awaited<ReturnType<typeof repo.fetchCloudJobs>>): JobTypeSummary[] {
  const byType = new Map<string, { count: number; durations: number[]; failures: number; retries: number }>();
  for (const j of jobs) {
    const t = byType.get(j.type) ?? { count: 0, durations: [], failures: 0, retries: 0 };
    t.count++;
    if (j.startedAt && j.completedAt) {
      const dur = new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime();
      if (dur > 0) t.durations.push(dur);
    }
    if (j.status === "failed" || j.status === "dead_letter") t.failures++;
    t.retries += j.retryCount;
    byType.set(j.type, t);
  }
  return Array.from(byType.entries()).map(([type, s]) => ({
    type, count24h: s.count,
    avgDurationMs: s.durations.length > 0 ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length) : 0,
    p95DurationMs: repo.percentile(s.durations, 0.95),
    failureRate: s.count > 0 ? Math.round((s.failures / s.count) * 100) / 100 : 0,
    retryRate: s.count > 0 ? Math.round((s.retries / s.count) * 100) / 100 : 0,
  }));
}

function identifyBottlenecks(
  jobs: Awaited<ReturnType<typeof repo.fetchCloudJobs>>,
  workflows: Awaited<ReturnType<typeof repo.fetchWorkflowExecutions>>,
): JobBottleneck[] {
  const bottlenecks: JobBottleneck[] = [];
  // Slowest cloud jobs
  for (const j of jobs) {
    if (!j.startedAt || !j.completedAt) continue;
    const dur = new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime();
    if (dur > 30000) { // > 30 seconds
      bottlenecks.push({
        jobId: j.id, type: j.type, durationMs: dur,
        queue: j.queue, workerId: j.workerId,
        recommendation: `Job ${j.id} (${j.type}) took ${dur}ms — investigate the worker or the payload.`,
      });
    }
  }
  // Slowest workflows
  for (const w of workflows) {
    if (w.totalDurationMs && w.totalDurationMs > 10000) {
      bottlenecks.push({
        jobId: w.id, type: `workflow:${w.workflowId}`,
        durationMs: w.totalDurationMs, queue: "orchestrator",
        workerId: null,
        recommendation: `Workflow ${w.workflowId} took ${w.totalDurationMs}ms — review the workflow steps.`,
      });
    }
  }
  return bottlenecks.sort((a, b) => b.durationMs - a.durationMs).slice(0, 15);
}

function computeRetryStats(jobs: Awaited<ReturnType<typeof repo.fetchCloudJobs>>): JobRetryStats {
  let totalRetries = 0, jobsWithRetries = 0, maxRetryCount = 0, deadLetterCount = 0;
  for (const j of jobs) {
    totalRetries += j.retryCount;
    if (j.retryCount > 0) jobsWithRetries++;
    if (j.retryCount > maxRetryCount) maxRetryCount = j.retryCount;
    if (j.status === "dead_letter") deadLetterCount++;
  }
  return {
    totalRetries24h: totalRetries,
    jobsWithRetries,
    avgRetryCount: jobs.length > 0 ? Math.round((totalRetries / jobs.length) * 100) / 100 : 0,
    maxRetryCount,
    deadLetterCount,
  };
}

function generateJobRecommendations(input: {
  queues: JobQueueSummary[];
  bottlenecks: JobBottleneck[];
  retryStats: JobRetryStats;
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `job-${++id}`;
  if (input.bottlenecks.length > 0) {
    recs.push({
      id: nextId(), category: "job",
      title: "Investigate slow background jobs",
      description: `${input.bottlenecks.length} job(s) took longer than 30 seconds.`,
      impact: "high", effort: "medium",
      recommendation: "Profile the slowest jobs, optimize their payloads, or split them into smaller tasks.",
    });
  }
  if (input.retryStats.avgRetryCount > 1) {
    recs.push({
      id: nextId(), category: "job",
      title: "Reduce job retry rate",
      description: `Average retry count is ${input.retryStats.avgRetryCount} per job.`,
      impact: "medium", effort: "medium",
      recommendation: "Investigate the root cause of failures. Consider exponential backoff or dead-letter queues.",
    });
  }
  if (input.retryStats.deadLetterCount > 0) {
    recs.push({
      id: nextId(), category: "job",
      title: "Process dead-letter queue",
      description: `${input.retryStats.deadLetterCount} job(s) are in the dead-letter queue.`,
      impact: "high", effort: "low",
      recommendation: "Review and reprocess or discard dead-letter jobs to free resources.",
    });
  }
  const deepQueues = input.queues.filter(q => q.depth > 10);
  if (deepQueues.length > 0) {
    recs.push({
      id: nextId(), category: "job",
      title: "Scale workers for deep queues",
      description: `${deepQueues.length} queue(s) have depth > 10.`,
      impact: "medium", effort: "low",
      recommendation: "Add more workers to the affected queues or increase worker concurrency.",
    });
  }
  return recs;
}
