/** Systems 17-22: Lineage, Quality, Governance, BI Analytics, Developer, Dashboard. */
import { randomUUID } from "node:crypto";
import { publishDataEvent } from "./event-bus-bridge";
import {
  storeLineageNode, getLineageNode, getAllLineageNodes,
  storeLineageEdge, getLineageEdge, getAllLineageEdges,
  storeQualityRule, getQualityRule, getAllQualityRules,
  storeQualityResult, getQualityResults, getAllQualityResults,
  storeGovernancePolicy, getGovernancePolicy, getAllGovernancePolicies,
  getAllDatasets, getAllPipelines, getAllPipelineRuns,
  getAllWarehouseObjects, getAllReports, getAllReportExecutions,
  getAllDashboards, getAllKPIDefs, getAllDataExports,
  getAllLakePartitions, getAllLakeSnapshots,
} from "./repository";
import type {
  LineageNode, LineageEdge, LineageNodeType,
  QualityRule, QualityDimension, QualityStatus, QualityResult,
  GovernancePolicy, GovernanceClassification, GovernanceStatus,
  BIAnalytics,
  DataEventType, DeveloperIntegration,
  AdminDashboard,
} from "./types";

// System 17 — Data Lineage
export function createLineageNode(input: { type: LineageNodeType; refId: string; name: string }): LineageNode {
  const n: LineageNode = { id: randomUUID(), type: input.type, refId: input.refId, name: input.name };
  storeLineageNode(n);
  return n;
}
export function getLineageNodeById(id: string) { return getLineageNode(id); }
export function listLineageNodes(type?: LineageNodeType) { const all = getAllLineageNodes(); return type ? all.filter(n => n.type === type) : all; }
export function createLineageEdge(input: { fromNodeId: string; toNodeId: string; relationship?: "produces" | "consumes" | "derives" | "feeds" }): LineageEdge {
  const e: LineageEdge = { id: randomUUID(), fromNodeId: input.fromNodeId, toNodeId: input.toNodeId, relationship: input.relationship ?? "produces" };
  storeLineageEdge(e);
  return e;
}
export function getLineageEdgeById(id: string) { return getLineageEdge(id); }
export function listLineageEdges() { return getAllLineageEdges(); }
export function getLineageForNode(nodeId: string): { upstream: LineageEdge[]; downstream: LineageEdge[] } {
  const upstream = getAllLineageEdges().filter(e => e.toNodeId === nodeId);
  const downstream = getAllLineageEdges().filter(e => e.fromNodeId === nodeId);
  return { upstream, downstream };
}
export function supportsAllLineageNodeTypes(): LineageNodeType[] { return ["source", "pipeline", "dataset", "report", "dashboard", "kpi", "export"]; }

// System 18 — Data Quality
export function createQualityRule(input: { datasetId: string; name: string; dimension?: QualityDimension; expression: string; threshold?: number; active?: boolean }): QualityRule {
  const now = new Date().toISOString();
  const r: QualityRule = { id: randomUUID(), datasetId: input.datasetId, name: input.name, dimension: input.dimension ?? "completeness", expression: input.expression, threshold: input.threshold ?? 0.95, active: input.active ?? true, createdAt: now, updatedAt: now };
  storeQualityRule(r);
  return r;
}
export function getQualityRuleById(id: string) { return getQualityRule(id); }
export function listQualityRules(active?: boolean) { const all = getAllQualityRules(); return active === undefined ? all : all.filter(r => r.active === active); }
export function runQualityCheck(ruleId: string, value: number): QualityResult {
  const rule = getQualityRule(ruleId); if (!rule) throw new Error(`Quality rule not found: ${ruleId}`);
  const status: QualityStatus = value >= rule.threshold ? "pass" : value >= rule.threshold * 0.9 ? "warn" : "fail";
  const r: QualityResult = { id: randomUUID(), ruleId, datasetId: rule.datasetId, status, value, threshold: rule.threshold, checkedAt: new Date().toISOString(), error: null };
  storeQualityResult(r);
  if (status === "fail") {
    publishDataEvent("DataQualityFailed", null, { ruleId, datasetId: rule.datasetId, value, threshold: rule.threshold });
  }
  return r;
}
export function getQualityHistory(ruleId: string) { return getQualityResults(ruleId); }
export function listQualityResults(status?: QualityStatus) { const all = getAllQualityResults(); return status ? all.filter(r => r.status === status) : all; }
export function supportsAllQualityDimensions(): QualityDimension[] { return ["completeness", "freshness", "duplicates", "integrity", "validation", "accuracy"]; }
export function supportsAllQualityStatuses(): QualityStatus[] { return ["pass", "warn", "fail", "skip"]; }

// System 19 — Governance Platform
export function createGovernancePolicy(input: { datasetId: string; classification?: GovernanceClassification; retentionDays?: number; owner?: string; complianceTags?: string[] }): GovernancePolicy {
  const now = new Date().toISOString();
  const g: GovernancePolicy = { id: randomUUID(), datasetId: input.datasetId, classification: input.classification ?? "internal", retentionDays: input.retentionDays ?? 365, owner: input.owner ?? "", complianceTags: input.complianceTags ?? [], status: "pending", approvedBy: null, approvedAt: null, createdAt: now, updatedAt: now };
  storeGovernancePolicy(g);
  return g;
}
export function getGovernancePolicyById(id: string) { return getGovernancePolicy(id); }
export function listGovernancePolicies(status?: GovernanceStatus) { const all = getAllGovernancePolicies(); return status ? all.filter(g => g.status === status) : all; }
export function approveGovernancePolicy(id: string, approverId: string): GovernancePolicy | null {
  const g = getGovernancePolicy(id); if (!g || g.status !== "pending") return null;
  g.status = "approved"; g.approvedBy = approverId; g.approvedAt = new Date().toISOString(); g.updatedAt = g.approvedAt;
  storeGovernancePolicy(g);
  return g;
}
export function rejectGovernancePolicy(id: string, reviewerId: string): GovernancePolicy | null {
  const g = getGovernancePolicy(id); if (!g || g.status !== "pending") return null;
  g.status = "rejected"; g.approvedBy = reviewerId; g.updatedAt = new Date().toISOString();
  storeGovernancePolicy(g);
  return g;
}
export function supportsAllGovernanceClassifications(): GovernanceClassification[] { return ["public", "internal", "confidential", "restricted", "pii", "phi"]; }
export function supportsAllGovernanceStatuses(): GovernanceStatus[] { return ["pending", "approved", "rejected", "review"]; }

// System 20 — BI Analytics
export function generateBIAnalytics(): BIAnalytics {
  const pipelines = getAllPipelineRuns();
  const completedPipelines = pipelines.filter(p => p.status === "completed");
  const partitions = getAllLakePartitions();
  const exports = getAllDataExports();
  const storageByFormat: Record<string, number> = {};
  for (const p of partitions) { storageByFormat[p.format] = (storageByFormat[p.format] ?? 0) + p.sizeBytes; }
  return {
    queries: { total: 0, avgDurationMs: 0, byDataset: {} },
    dashboards: { totalViews: 0, byDashboard: {} },
    pipelines: { totalRuns: pipelines.length, successRate: pipelines.length > 0 ? completedPipelines.length / pipelines.length : 0, avgDurationMs: 0 },
    storage: { totalBytes: partitions.reduce((s, p) => s + p.sizeBytes, 0), byFormat: storageByFormat },
    exports: { total: exports.length, byFormat: exports.reduce((acc, e) => { acc[e.format] = (acc[e.format] ?? 0) + 1; return acc; }, {} as Record<string, number>) },
    updatedAt: new Date().toISOString(),
  };
}

// System 21 — Developer Integration
export function getDeveloperIntegration(): DeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/data-platform/datasets", method: "GET", description: "List datasets", authRequired: true, scope: "read" },
      { path: "/api/data-platform/datasets", method: "POST", description: "Create dataset", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/catalog", method: "GET", description: "List catalog", authRequired: true, scope: "read" },
      { path: "/api/data-platform/lake", method: "GET", description: "List lake metadata", authRequired: true, scope: "read" },
      { path: "/api/data-platform/warehouse", method: "GET", description: "List warehouse objects", authRequired: true, scope: "read" },
      { path: "/api/data-platform/pipelines", method: "GET", description: "List pipelines", authRequired: true, scope: "read" },
      { path: "/api/data-platform/pipelines", method: "POST", description: "Create pipeline", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/pipelines/run", method: "POST", description: "Run pipeline", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/snapshots", method: "GET", description: "List snapshots", authRequired: true, scope: "read" },
      { path: "/api/data-platform/facts", method: "GET", description: "List facts", authRequired: true, scope: "read" },
      { path: "/api/data-platform/dimensions", method: "GET", description: "List dimensions", authRequired: true, scope: "read" },
      { path: "/api/data-platform/semantic", method: "GET", description: "List semantic metrics", authRequired: true, scope: "read" },
      { path: "/api/data-platform/reports", method: "GET", description: "List reports", authRequired: true, scope: "read" },
      { path: "/api/data-platform/reports/execute", method: "POST", description: "Execute report", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/dashboards", method: "GET", description: "List dashboards", authRequired: true, scope: "read" },
      { path: "/api/data-platform/kpis", method: "GET", description: "List KPIs", authRequired: true, scope: "read" },
      { path: "/api/data-platform/kpis/calculate", method: "POST", description: "Calculate KPI", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/lineage", method: "GET", description: "List lineage", authRequired: true, scope: "read" },
      { path: "/api/data-platform/quality", method: "GET", description: "List quality rules", authRequired: true, scope: "read" },
      { path: "/api/data-platform/governance", method: "GET", description: "List governance", authRequired: true, scope: "read" },
      { path: "/api/data-platform/export", method: "POST", description: "Create export", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/analytics", method: "GET", description: "BI analytics", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/dashboard", method: "GET", description: "Admin dashboard", authRequired: true, scope: "admin" },
      { path: "/api/data-platform/developer", method: "GET", description: "Developer integration", authRequired: false, scope: "read" },
      { path: "/api/data-platform/status", method: "GET", description: "Status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_dataset_created", name: "On Dataset Created", triggerEvent: "DatasetCreated", description: "Triggered when a dataset is created" },
      { id: "hook_pipeline_completed", name: "On Pipeline Completed", triggerEvent: "PipelineCompleted", description: "Triggered when a pipeline completes" },
      { id: "hook_pipeline_failed", name: "On Pipeline Failed", triggerEvent: "PipelineFailed", description: "Triggered when a pipeline fails" },
      { id: "hook_snapshot_created", name: "On Snapshot Created", triggerEvent: "SnapshotCreated", description: "Triggered when a snapshot is created" },
      { id: "hook_report_generated", name: "On Report Generated", triggerEvent: "ReportGenerated", description: "Triggered when a report is generated" },
      { id: "hook_dashboard_published", name: "On Dashboard Published", triggerEvent: "DashboardPublished", description: "Triggered when a dashboard is published" },
      { id: "hook_kpi_calculated", name: "On KPI Calculated", triggerEvent: "KPICalculated", description: "Triggered when a KPI is calculated" },
      { id: "hook_quality_failed", name: "On Quality Failed", triggerEvent: "DataQualityFailed", description: "Triggered when data quality fails" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/data-platform", capabilities: ["datasets", "catalog", "lake", "warehouse", "etl", "elt", "pipelines", "snapshots", "facts", "dimensions", "semantic", "kpis", "reports", "dashboards", "schedules", "exports", "lineage", "quality", "governance", "analytics"] },
    webhooks: [
      { id: "wh_pipeline_completed", event: "PipelineCompleted", description: "Fired when a pipeline completes" },
      { id: "wh_pipeline_failed", event: "PipelineFailed", description: "Fired when a pipeline fails" },
      { id: "wh_report_generated", event: "ReportGenerated", description: "Fired when a report is generated" },
      { id: "wh_kpi_calculated", event: "KPICalculated", description: "Fired when a KPI is calculated" },
    ],
    warehouseSchemas: [
      { name: "WarehouseObject", columns: ["id", "datasetId", "name", "type", "schema", "columns", "version", "lastRefreshedAt"] },
      { name: "FactDefinition", columns: ["id", "key", "name", "datasetId", "grain", "measures", "dimensionKeys"] },
      { name: "DimensionDefinition", columns: ["id", "key", "name", "datasetId", "attributes", "hierarchies", "scdType"] },
    ],
  };
}

// System 22 — Administration Dashboard
export function generateAdminDashboard(): AdminDashboard {
  const datasets = getAllDatasets();
  const pipelines = getAllPipelines();
  const pipelineRuns = getAllPipelineRuns();
  const warehouse = getAllWarehouseObjects();
  const qualityResults = getAllQualityResults();
  const governance = getAllGovernancePolicies();
  const kpis = getAllKPIDefs();
  const reports = getAllReports();
  const reportExecs = getAllReportExecutions();
  const dashboards = getAllDashboards();
  const day = 24 * 3600 * 1000; const now = Date.now();
  return {
    datasets: { total: datasets.length, active: datasets.filter(d => d.status === "active").length, deprecated: datasets.filter(d => d.status === "deprecated").length, archived: datasets.filter(d => d.status === "archived").length },
    pipelines: { total: pipelines.length, running: pipelines.filter(p => p.status === "running").length, completed24h: pipelineRuns.filter(r => r.status === "completed" && r.completedAt && now - new Date(r.completedAt).getTime() < day).length, failed24h: pipelineRuns.filter(r => r.status === "failed" && r.completedAt && now - new Date(r.completedAt).getTime() < day).length },
    warehouse: { objects: warehouse.length, lastRefresh: warehouse.filter(w => w.lastRefreshedAt).sort((a, b) => (b.lastRefreshedAt ?? "").localeCompare(a.lastRefreshedAt ?? ""))[0]?.lastRefreshedAt ?? null },
    quality: { rules: getAllQualityRules().length, passRate: qualityResults.length > 0 ? qualityResults.filter(r => r.status === "pass").length / qualityResults.length : 1, failing: qualityResults.filter(r => r.status === "fail").length },
    governance: { pending: governance.filter(g => g.status === "pending").length, approved: governance.filter(g => g.status === "approved").length, rejected: governance.filter(g => g.status === "rejected").length },
    kpis: { total: kpis.length, achieved: 0, pending: 0 },
    reports: { total: reports.length, executed24h: reportExecs.filter(e => e.completedAt && now - new Date(e.completedAt).getTime() < day).length },
    dashboards: { total: dashboards.length, active: dashboards.filter(d => d.active).length },
    updatedAt: new Date().toISOString(),
  };
}
