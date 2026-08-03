/** System 24 — Documentation Generator. */
import type { DataEventType, DataPlatformDocumentation } from "./types";

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Dataset Registry", description: "Dataset metadata, ownership, categories, versioning.", endpoints: ["/api/data-platform/datasets"], events: ["DatasetCreated", "DatasetUpdated"] },
  { id: 2, name: "Data Catalog", description: "Searchable datasets, tags, classifications, descriptions.", endpoints: ["/api/data-platform/catalog"], events: [] },
  { id: 3, name: "Data Lake Metadata", description: "Owns ONLY metadata. Never raw storage. Partitions, retention, snapshots, formats.", endpoints: ["/api/data-platform/lake"], events: [] },
  { id: 4, name: "Data Warehouse Metadata", description: "Warehouse schemas, tables, views, materialized views, refresh history.", endpoints: ["/api/data-platform/warehouse"], events: ["WarehouseRefreshed"] },
  { id: 5, name: "ETL Engine", description: "Extraction, transformation, loading metadata, scheduling, monitoring.", endpoints: ["/api/data-platform/etl"], events: [] },
  { id: 6, name: "ELT Engine", description: "Warehouse-native transformations, dependencies, execution history.", endpoints: ["/api/data-platform/elt"], events: [] },
  { id: 7, name: "Pipeline Orchestration", description: "Pipeline DAG, dependencies, retries, scheduling, failure handling.", endpoints: ["/api/data-platform/pipelines"], events: ["PipelineCompleted", "PipelineFailed"] },
  { id: 8, name: "Snapshot Platform", description: "Incremental, point-in-time snapshots, retention, restoration metadata.", endpoints: ["/api/data-platform/snapshots"], events: ["SnapshotCreated"] },
  { id: 9, name: "Fact Registry", description: "Fact definitions, measures, aggregations, versioning.", endpoints: ["/api/data-platform/facts"], events: [] },
  { id: 10, name: "Dimension Registry", description: "Dimensions, hierarchies, attributes, slowly changing dimension metadata.", endpoints: ["/api/data-platform/dimensions"], events: [] },
  { id: 11, name: "Semantic Layer", description: "Business metrics, reusable measures, business-friendly names, calculation metadata.", endpoints: ["/api/data-platform/semantic"], events: [] },
  { id: 12, name: "KPI Registry", description: "Institution, gaming, learning, commerce, operational KPIs.", endpoints: ["/api/data-platform/kpis"], events: ["KPICalculated"] },
  { id: 13, name: "Business Reports", description: "Versioned reports, templates, schedules, parameters.", endpoints: ["/api/data-platform/reports"], events: ["ReportGenerated"] },
  { id: 14, name: "Dashboard Registry", description: "Dashboard metadata, widgets, layouts, permissions.", endpoints: ["/api/data-platform/dashboards"], events: ["DashboardPublished"] },
  { id: 15, name: "Scheduled Reporting", description: "Schedules, subscriptions, delivery metadata, execution history.", endpoints: ["/api/data-platform/schedules"], events: [] },
  { id: 16, name: "Data Export Platform", description: "CSV, Excel, JSON, Parquet metadata, streaming metadata.", endpoints: ["/api/data-platform/export"], events: [] },
  { id: 17, name: "Data Lineage", description: "Track source, pipeline, dataset, report, dashboard dependencies.", endpoints: ["/api/data-platform/lineage"], events: [] },
  { id: 18, name: "Data Quality", description: "Completeness, freshness, duplicates, integrity, validation.", endpoints: ["/api/data-platform/quality"], events: ["DataQualityFailed"] },
  { id: 19, name: "Governance Platform", description: "Classification, retention, ownership, approval, compliance metadata.", endpoints: ["/api/data-platform/governance"], events: [] },
  { id: 20, name: "BI Analytics", description: "Query statistics, dataset usage, dashboard usage, pipeline performance, storage growth.", endpoints: ["/api/data-platform/analytics"], events: [] },
  { id: 21, name: "Developer Integration", description: "SDK metadata, schemas, extension hooks, warehouse metadata.", endpoints: ["/api/data-platform/developer"], events: [] },
  { id: 22, name: "Administration Dashboard", description: "Datasets, pipelines, warehouse, quality, governance, KPIs, reports, dashboards.", endpoints: ["/api/data-platform/dashboard"], events: [] },
  { id: 23, name: "Event Bus Bridge", description: "Passive consumer + producer. Consumes events from every platform.", endpoints: [], events: ["DatasetCreated", "DatasetUpdated", "PipelineCompleted", "PipelineFailed", "SnapshotCreated", "ReportGenerated", "DashboardPublished", "DataQualityFailed", "KPICalculated", "WarehouseRefreshed"] },
  { id: 24, name: "Documentation Generator", description: "Deterministic Markdown + JSON. Documents all 24 systems, events, ownership matrix, pipeline architecture, dataset catalog, API documentation. No LLM.", endpoints: ["/api/data-platform/documentation"], events: [] },
];
const EVENT_PAYLOADS: Record<DataEventType, string[]> = {
  DatasetCreated: ["datasetId", "key", "category"],
  DatasetUpdated: ["datasetId", "status"],
  PipelineCompleted: ["pipelineId", "runId", "correlationId"],
  PipelineFailed: ["pipelineId", "runId", "error", "correlationId"],
  SnapshotCreated: ["snapshotId", "datasetId", "type"],
  ReportGenerated: ["reportId", "executionId", "correlationId"],
  DashboardPublished: ["dashboardId", "version"],
  DataQualityFailed: ["ruleId", "datasetId", "value", "threshold"],
  KPICalculated: ["kpiId", "value", "target", "achieved", "period"],
  WarehouseRefreshed: ["objectId"],
};
const EVENT_DESCRIPTIONS: Record<DataEventType, string> = {
  DatasetCreated: "Emitted when a dataset is created.",
  DatasetUpdated: "Emitted when a dataset is updated.",
  PipelineCompleted: "Emitted when a pipeline run completes.",
  PipelineFailed: "Emitted when a pipeline run fails.",
  SnapshotCreated: "Emitted when a snapshot is created.",
  ReportGenerated: "Emitted when a report execution completes.",
  DashboardPublished: "Emitted when a dashboard is published.",
  DataQualityFailed: "Emitted when a data quality check fails.",
  KPICalculated: "Emitted when a KPI is calculated.",
  WarehouseRefreshed: "Emitted when a warehouse object is refreshed.",
};

export function generateDocumentation(): DataPlatformDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as DataEventType, payload: EVENT_PAYLOADS[type as DataEventType], description: EVENT_DESCRIPTIONS[type as DataEventType] })),
    ownership: {
      owns: ["Datasets", "Warehouse Metadata", "Lake Metadata", "ETL", "ELT", "Pipelines", "Snapshots", "Semantic Layer", "Reports", "Dashboards", "KPIs", "Lineage", "Governance", "Data Quality", "BI Metadata"],
      doesNotOwn: ["Gameplay", "Quizzes", "Users", "Organizations", "Commerce", "Inventory", "AI", "Notifications", "Identity", "Analytics produced by business platforms", "Workflows", "Search Indexes"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateDocumentation();
  let md = `# EduBek — Data Platform, Lakehouse & Business Intelligence\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.25\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for analytical data across EduBek. It owns ONLY analytical copies, datasets, pipelines, warehouse metadata, reporting, semantic models, BI, and enterprise reporting. It NEVER owns operational data. Every platform remains the owner of its own business data. No analytical writes ever flow back into business platforms.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getDataPlatformVersion(): string { return "1.0.0"; }
export function getDataPlatformStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } { return { operational: true, systems: 24, bridgeSubscribed: false, updatedAt: new Date().toISOString() }; }
