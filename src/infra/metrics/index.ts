/**
 * EduBek — Metrics collection.
 *
 * A lightweight in-process metrics collector. Counters, gauges, and
 * histograms are tracked in memory and exposed via the
 * `/api/health/metrics` endpoint in Prometheus text format.
 *
 * In production, replace the in-memory store with a Prometheus
 * client (prom-client) or OpenTelemetry metrics. The interface
 * stays the same.
 *
 * Metric naming convention: `edubek_<subsystem>_<metric>_<unit>`
 * e.g. `edubek_live_quiz_sessions_active_count`
 */
import { getLogger } from "@/lib/logger";

const log = getLogger("metrics");

type MetricType = "counter" | "gauge" | "histogram";

interface MetricEntry {
  type: MetricType;
  help: string;
  value: number;
  labels?: Record<string, string>;
  buckets?: { le: number; count: number }[]; // for histograms
  count?: number; // for histograms (total observations)
  sum?: number; // for histograms (sum of observations)
}

const metrics = new Map<string, MetricEntry>();

function key(name: string, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) return name;
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
  return `${name}{${labelStr}}`;
}

/** Increment a counter by `by` (default 1). */
export function incrementCounter(name: string, by = 1, labels?: Record<string, string>): void {
  const k = key(name, labels);
  const existing = metrics.get(k);
  if (existing && existing.type === "counter") {
    existing.value += by;
  } else {
    metrics.set(k, {
      type: "counter",
      help: name,
      value: by,
      labels,
    });
  }
}

/** Set a gauge to `value`. */
export function setGauge(name: string, value: number, labels?: Record<string, string>): void {
  const k = key(name, labels);
  metrics.set(k, {
    type: "gauge",
    help: name,
    value,
    labels,
  });
}

/** Observe a value in a histogram. */
export function observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
  const k = key(name, labels);
  const bucketBoundaries = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];
  let entry = metrics.get(k);
  if (!entry || entry.type !== "histogram") {
    entry = {
      type: "histogram",
      help: name,
      value: 0,
      labels,
      buckets: bucketBoundaries.map((le) => ({ le, count: 0 })),
      count: 0,
      sum: 0,
    };
    metrics.set(k, entry);
  }
  entry.count = (entry.count ?? 0) + 1;
  entry.sum = (entry.sum ?? 0) + value;
  if (entry.buckets) {
    for (const b of entry.buckets) {
      if (value <= b.le) b.count += 1;
    }
  }
}

/** Export all metrics in Prometheus text format. */
export function exportPrometheusMetrics(): string {
  const lines: string[] = [];
  const seenTypes = new Set<string>();

  for (const [k, entry] of metrics) {
    const baseName = entry.labels ? k.split("{")[0]! : k;
    if (!seenTypes.has(baseName)) {
      lines.push(`# HELP ${baseName} ${entry.help}`);
      lines.push(`# TYPE ${baseName} ${entry.type}`);
      seenTypes.add(baseName);
    }
    if (entry.type === "histogram") {
      for (const b of entry.buckets ?? []) {
        const labelStr = entry.labels
          ? `${Object.entries(entry.labels).map(([lk, lv]) => `${lk}="${lv}"`).join(",")},le="${b.le}"`
          : `le="${b.le}"`;
        lines.push(`${baseName}_bucket{${labelStr}} ${b.count}`);
      }
      const infLabel = entry.labels
        ? `${Object.entries(entry.labels).map(([lk, lv]) => `${lk}="${lv}"`).join(",")},le="+Inf"`
        : `le="+Inf"`;
      lines.push(`${baseName}_bucket{${infLabel}} ${entry.count ?? 0}`);
      const sumLabel = entry.labels
        ? `{${Object.entries(entry.labels).map(([lk, lv]) => `${lk}="${lv}"`).join(",")}}`
        : "";
      lines.push(`${baseName}_sum${sumLabel} ${entry.sum ?? 0}`);
      lines.push(`${baseName}_count${sumLabel} ${entry.count ?? 0}`);
    } else {
      lines.push(`${k} ${entry.value}`);
    }
  }
  return lines.join("\n");
}

/** Reset all metrics (for tests). */
export function resetMetrics(): void {
  metrics.clear();
}

// ---------------------------------------------------------------------------
// Common metrics helpers
// ---------------------------------------------------------------------------

/** Time an async operation and record it as a histogram (in ms). */
export async function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    observeHistogram(name, Date.now() - start);
  }
}
