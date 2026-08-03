/** Systems 9-16: Facts, Dimensions, Semantic, KPIs, Reports, Dashboards, Schedules, Export. */
import { randomUUID } from "node:crypto";
import {
  storeFact, getFact, getAllFacts,
  storeDimension, getDimension, getAllDimensions,
  storeSemanticMetric, getSemanticMetric, getAllSemanticMetrics,
  storeKPIDef, getKPIDef, getAllKPIDefs, storeKPIResult, getKPIResults,
  storeReport, getReport, getAllReports, storeReportExecution, getReportExecution, getAllReportExecutions,
  storeDashboard, getDashboard, getAllDashboards,
  storeReportSchedule, getReportSchedule, getAllReportSchedules,
  storeReportSubscription, getReportSubscription, getAllReportSubscriptions,
  storeDataExport, getDataExport, getAllDataExports,
} from "./repository";
import type {
  FactDefinition, FactGrain,
  DimensionDefinition, SCDType,
  SemanticMetric,
  KPIDefinition, KPIResult, KPICategory,
  ReportDefinition, ReportFormat, ReportStatus, ReportExecution,
  DashboardDefinition, DashboardWidget, WidgetType,
  ReportSchedule, ScheduleType, SubscriptionStatus, ReportSubscription,
  DataExport, ExportFormat, ExportStatus,
} from "./types";
import { publishDataEvent } from "./event-bus-bridge";

// System 9 — Fact Registry
export function createFact(input: { key: string; name: string; datasetId: string; grain?: FactGrain; measures?: Array<{ name: string; aggregation: "sum" | "count" | "avg" | "min" | "max" | "distinct"; column: string }>; dimensionKeys?: string[] }): FactDefinition {
  const now = new Date().toISOString();
  const f: FactDefinition = { id: randomUUID(), key: input.key, name: input.name, datasetId: input.datasetId, grain: input.grain ?? "daily", measures: input.measures ?? [], dimensionKeys: input.dimensionKeys ?? [], version: 1, active: true, createdAt: now, updatedAt: now };
  storeFact(f);
  return f;
}
export function getFactById(id: string) { return getFact(id); }
export function listFacts(active?: boolean) { const all = getAllFacts(); return active === undefined ? all : all.filter(f => f.active === active); }
export function supportsAllFactGrains(): FactGrain[] { return ["daily", "hourly", "event", "transaction", "session"]; }

// System 10 — Dimension Registry
export function createDimension(input: { key: string; name: string; datasetId: string; attributes?: string[]; hierarchies?: Array<{ name: string; levels: string[] }>; scdType?: SCDType }): DimensionDefinition {
  const now = new Date().toISOString();
  const d: DimensionDefinition = { id: randomUUID(), key: input.key, name: input.name, datasetId: input.datasetId, attributes: input.attributes ?? [], hierarchies: input.hierarchies ?? [], scdType: input.scdType ?? "type1", version: 1, active: true, createdAt: now, updatedAt: now };
  storeDimension(d);
  return d;
}
export function getDimensionById(id: string) { return getDimension(id); }
export function listDimensions(active?: boolean) { const all = getAllDimensions(); return active === undefined ? all : all.filter(d => d.active === active); }
export function supportsAllSCDTypes(): SCDType[] { return ["type1", "type2", "type3"]; }

// System 11 — Semantic Layer
export function createSemanticMetric(input: { key: string; name: string; description?: string; factKey: string; calculation: string; businessName?: string; category?: string }): SemanticMetric {
  const now = new Date().toISOString();
  const m: SemanticMetric = { id: randomUUID(), key: input.key, name: input.name, description: input.description ?? "", factKey: input.factKey, calculation: input.calculation, businessName: input.businessName ?? input.name, category: input.category ?? "general", active: true, version: 1, createdAt: now, updatedAt: now };
  storeSemanticMetric(m);
  return m;
}
export function getSemanticMetricById(id: string) { return getSemanticMetric(id); }
export function listSemanticMetrics(active?: boolean) { const all = getAllSemanticMetrics(); return active === undefined ? all : all.filter(m => m.active === active); }

// System 12 — KPI Registry
export function createKPI(input: { key: string; name: string; description?: string; category: KPICategory; metricKey: string; target: number; unit?: string; owner?: string }): KPIDefinition {
  const now = new Date().toISOString();
  const k: KPIDefinition = { id: randomUUID(), key: input.key, name: input.name, description: input.description ?? "", category: input.category, metricKey: input.metricKey, target: input.target, unit: input.unit ?? "count", owner: input.owner ?? "", active: true, createdAt: now, updatedAt: now };
  storeKPIDef(k);
  return k;
}
export function getKPIById(id: string) { return getKPIDef(id); }
export function listKPIs(category?: KPICategory, active?: boolean) { let all = getAllKPIDefs(); if (category) all = all.filter(k => k.category === category); if (active !== undefined) all = all.filter(k => k.active === active); return all; }
export function calculateKPI(kpiId: string, value: number, period: string): KPIResult {
  const kpi = getKPIDef(kpiId); if (!kpi) throw new Error(`KPI not found: ${kpiId}`);
  const r: KPIResult = { id: randomUUID(), kpiId, value, period, target: kpi.target, achieved: value >= kpi.target, calculatedAt: new Date().toISOString(), correlationId: randomUUID() };
  storeKPIResult(r);
  publishDataEvent("KPICalculated", null, { kpiId, value, target: kpi.target, achieved: r.achieved, period, correlationId: r.correlationId });
  return r;
}
export function getKPIHistory(kpiId: string) { return getKPIResults(kpiId); }
export function supportsAllKPICategories(): KPICategory[] { return ["institution", "gaming", "learning", "commerce", "operational"]; }

// System 13 — Business Reports
export function createReport(input: { key: string; name: string; description?: string; semanticMetricKeys?: string[]; parameters?: Array<{ key: string; type: string; required: boolean; defaultValue: unknown }>; format?: ReportFormat; owner?: string }): ReportDefinition {
  const now = new Date().toISOString();
  const r: ReportDefinition = { id: randomUUID(), key: input.key, name: input.name, description: input.description ?? "", semanticMetricKeys: input.semanticMetricKeys ?? [], parameters: input.parameters ?? [], format: input.format ?? "pdf", status: "draft", version: 1, owner: input.owner ?? "", createdAt: now, updatedAt: now };
  storeReport(r);
  return r;
}
export function getReportById(id: string) { return getReport(id); }
export function listReports(status?: ReportStatus) { const all = getAllReports(); return status ? all.filter(r => r.status === status) : all; }
export function executeReport(id: string, parameters: Record<string, unknown>): ReportExecution {
  const report = getReport(id); if (!report) throw new Error(`Report not found: ${id}`);
  const now = new Date().toISOString();
  const exec: ReportExecution = { id: randomUUID(), reportId: id, status: "running", parameters, format: report.format, outputRef: null, startedAt: now, completedAt: null, error: null, correlationId: randomUUID() };
  storeReportExecution(exec);
  return exec;
}
export function completeReportExecution(id: string, outputRef: string): ReportExecution | null {
  const e = getReportExecution(id); if (!e || e.status !== "running") return null;
  e.status = "completed"; e.completedAt = new Date().toISOString(); e.outputRef = outputRef;
  storeReportExecution(e);
  publishDataEvent("ReportGenerated", null, { reportId: e.reportId, executionId: e.id, correlationId: e.correlationId });
  return e;
}
export function failReportExecution(id: string, error: string): ReportExecution | null {
  const e = getReportExecution(id); if (!e || e.status !== "running") return null;
  e.status = "failed"; e.completedAt = new Date().toISOString(); e.error = error;
  storeReportExecution(e);
  return e;
}
export function getReportExecutionById(id: string) { return getReportExecution(id); }
export function listReportExecutions(status?: string) { const all = getAllReportExecutions(); return status ? all.filter(e => e.status === status) : all; }
export function supportsAllReportFormats(): ReportFormat[] { return ["pdf", "excel", "html", "json", "csv"]; }
export function supportsAllReportStatuses(): ReportStatus[] { return ["draft", "active", "deprecated"]; }

// System 14 — Dashboard Registry
export function createDashboard(input: { key: string; name: string; description?: string; widgets?: DashboardWidget[]; owner?: string; audience?: string[] }): DashboardDefinition {
  const now = new Date().toISOString();
  const d: DashboardDefinition = { id: randomUUID(), key: input.key, name: input.name, description: input.description ?? "", widgets: input.widgets ?? [], owner: input.owner ?? "", audience: input.audience ?? [], active: true, version: 1, createdAt: now, updatedAt: now };
  storeDashboard(d);
  return d;
}
export function getDashboardById(id: string) { return getDashboard(id); }
export function listDashboards(active?: boolean) { const all = getAllDashboards(); return active === undefined ? all : all.filter(d => d.active === active); }
export function publishDashboard(id: string): DashboardDefinition | null {
  const d = getDashboard(id); if (!d) return null;
  d.active = true; d.updatedAt = new Date().toISOString(); d.version += 1; storeDashboard(d);
  publishDataEvent("DashboardPublished", null, { dashboardId: d.id, version: d.version });
  return d;
}
export function supportsAllWidgetTypes(): WidgetType[] { return ["chart", "table", "kpi", "gauge", "text", "filter", "image"]; }

// System 15 — Scheduled Reporting
export function createReportSchedule(input: { reportId: string; type?: ScheduleType; cronExpression?: string | null; intervalMinutes?: number | null }): ReportSchedule {
  const now = new Date().toISOString();
  const s: ReportSchedule = { id: randomUUID(), reportId: input.reportId, type: input.type ?? "manual", cronExpression: input.cronExpression ?? null, intervalMinutes: input.intervalMinutes ?? null, nextRunAt: now, lastRunAt: null, status: "active", runCount: 0, createdAt: now, updatedAt: now };
  storeReportSchedule(s);
  return s;
}
export function getReportScheduleById(id: string) { return getReportSchedule(id); }
export function listReportSchedules(status?: SubscriptionStatus) { const all = getAllReportSchedules(); return status ? all.filter(s => s.status === status) : all; }
export function recordScheduleRun(id: string): ReportSchedule | null {
  const s = getReportSchedule(id); if (!s || s.status !== "active") return null;
  s.runCount += 1; s.lastRunAt = new Date().toISOString(); s.updatedAt = s.lastRunAt;
  if (s.type === "one_time") s.status = "cancelled";
  storeReportSchedule(s);
  return s;
}
export function createSubscription(input: { scheduleId: string; userId: string; deliveryMethod?: "email" | "slack" | "webhook" | "dashboard"; deliveryRef: string }): ReportSubscription {
  const now = new Date().toISOString();
  const sub: ReportSubscription = { id: randomUUID(), scheduleId: input.scheduleId, userId: input.userId, deliveryMethod: input.deliveryMethod ?? "email", deliveryRef: input.deliveryRef, status: "active", createdAt: now, updatedAt: now };
  storeReportSubscription(sub);
  return sub;
}
export function getSubscriptionById(id: string) { return getReportSubscription(id); }
export function listSubscriptions(status?: SubscriptionStatus) { const all = getAllReportSubscriptions(); return status ? all.filter(s => s.status === status) : all; }
export function supportsAllScheduleTypes(): ScheduleType[] { return ["cron", "interval", "one_time"]; }

// System 16 — Data Export Platform
export function createDataExport(input: { datasetId: string; format?: ExportFormat; filter?: Record<string, unknown> | null; totalRecords?: number; destinationRef: string }): DataExport {
  const now = new Date().toISOString();
  const e: DataExport = { id: randomUUID(), datasetId: input.datasetId, format: input.format ?? "csv", status: "queued", filter: input.filter ?? null, totalRecords: input.totalRecords ?? 0, exportedRecords: 0, destinationRef: input.destinationRef, startedAt: now, completedAt: null, error: null, correlationId: randomUUID() };
  storeDataExport(e);
  return e;
}
export function getDataExportById(id: string) { return getDataExport(id); }
export function listDataExports(status?: ExportStatus) { const all = getAllDataExports(); return status ? all.filter(e => e.status === status) : all; }
export function startDataExport(id: string): DataExport | null {
  const e = getDataExport(id); if (!e || e.status !== "queued") return null;
  e.status = "processing"; storeDataExport(e); return e;
}
export function completeDataExport(id: string, exportedRecords: number): DataExport | null {
  const e = getDataExport(id); if (!e || e.status !== "processing") return null;
  e.status = "completed"; e.completedAt = new Date().toISOString(); e.exportedRecords = exportedRecords; storeDataExport(e); return e;
}
export function supportsAllExportFormats(): ExportFormat[] { return ["csv", "excel", "json", "parquet"]; }
export function supportsAllExportStatuses(): ExportStatus[] { return ["queued", "processing", "completed", "failed", "streaming"]; }
