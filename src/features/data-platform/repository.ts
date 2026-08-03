/** In-memory repository for Data Platform. Phase 6G.25. */
import type {
  DatasetDefinition, CatalogEntry,
  LakePartition, LakeSnapshotMeta, LakeRetentionPolicy,
  WarehouseObject, WarehouseRefreshLog,
  ETLJob, ELTJob,
  Pipeline, PipelineRun,
  SnapshotRecord,
  FactDefinition, DimensionDefinition, SemanticMetric,
  KPIDefinition, KPIResult,
  ReportDefinition, ReportExecution,
  DashboardDefinition,
  ReportSchedule, ReportSubscription,
  DataExport,
  LineageNode, LineageEdge,
  QualityRule, QualityResult,
  GovernancePolicy,
} from "./types";

const datasets = new Map<string, DatasetDefinition>();
const catalog = new Map<string, CatalogEntry>();
const lakePartitions = new Map<string, LakePartition>();
const lakeSnapshots = new Map<string, LakeSnapshotMeta>();
const lakeRetention = new Map<string, LakeRetentionPolicy>();
const warehouseObjects = new Map<string, WarehouseObject>();
const warehouseRefreshLogs = new Map<string, WarehouseRefreshLog[]>();
const etlJobs = new Map<string, ETLJob>();
const eltJobs = new Map<string, ELTJob>();
const pipelines = new Map<string, Pipeline>();
const pipelineRuns = new Map<string, PipelineRun>();
const snapshots = new Map<string, SnapshotRecord>();
const facts = new Map<string, FactDefinition>();
const dimensions = new Map<string, DimensionDefinition>();
const semanticMetrics = new Map<string, SemanticMetric>();
const kpiDefs = new Map<string, KPIDefinition>();
const kpiResults = new Map<string, KPIResult[]>();
const reports = new Map<string, ReportDefinition>();
const reportExecutions = new Map<string, ReportExecution>();
const dashboards = new Map<string, DashboardDefinition>();
const reportSchedules = new Map<string, ReportSchedule>();
const reportSubscriptions = new Map<string, ReportSubscription>();
const dataExports = new Map<string, DataExport>();
const lineageNodes = new Map<string, LineageNode>();
const lineageEdges = new Map<string, LineageEdge>();
const qualityRules = new Map<string, QualityRule>();
const qualityResults = new Map<string, QualityResult[]>();
const governancePolicies = new Map<string, GovernancePolicy>();

export const storeDataset = (d: DatasetDefinition) => datasets.set(d.id, d);
export const getDataset = (id: string) => datasets.get(id) ?? null;
export const getDatasetByKey = (k: string) => Array.from(datasets.values()).find(d => d.key === k) ?? null;
export const getAllDatasets = () => Array.from(datasets.values());
export const storeCatalogEntry = (c: CatalogEntry) => catalog.set(c.id, c);
export const getCatalogEntry = (id: string) => catalog.get(id) ?? null;
export const getAllCatalogEntries = () => Array.from(catalog.values());
export const storeLakePartition = (p: LakePartition) => lakePartitions.set(p.id, p);
export const getLakePartition = (id: string) => lakePartitions.get(id) ?? null;
export const getAllLakePartitions = () => Array.from(lakePartitions.values());
export const storeLakeSnapshot = (s: LakeSnapshotMeta) => lakeSnapshots.set(s.id, s);
export const getLakeSnapshot = (id: string) => lakeSnapshots.get(id) ?? null;
export const getAllLakeSnapshots = () => Array.from(lakeSnapshots.values());
export const storeLakeRetention = (r: LakeRetentionPolicy) => lakeRetention.set(r.id, r);
export const getLakeRetention = (id: string) => lakeRetention.get(id) ?? null;
export const getAllLakeRetentions = () => Array.from(lakeRetention.values());
export const storeWarehouseObject = (w: WarehouseObject) => warehouseObjects.set(w.id, w);
export const getWarehouseObject = (id: string) => warehouseObjects.get(id) ?? null;
export const getAllWarehouseObjects = () => Array.from(warehouseObjects.values());
export const storeWarehouseRefreshLog = (l: WarehouseRefreshLog) => { const arr = warehouseRefreshLogs.get(l.objectId) ?? []; arr.push(l); warehouseRefreshLogs.set(l.objectId, arr); };
export const getWarehouseRefreshLogs = (objectId: string) => warehouseRefreshLogs.get(objectId) ?? [];
export const storeETLJob = (j: ETLJob) => etlJobs.set(j.id, j);
export const getETLJob = (id: string) => etlJobs.get(id) ?? null;
export const getAllETLJobs = () => Array.from(etlJobs.values());
export const storeELTJob = (j: ELTJob) => eltJobs.set(j.id, j);
export const getELTJob = (id: string) => eltJobs.get(id) ?? null;
export const getAllELTJobs = () => Array.from(eltJobs.values());
export const storePipeline = (p: Pipeline) => pipelines.set(p.id, p);
export const getPipeline = (id: string) => pipelines.get(id) ?? null;
export const getAllPipelines = () => Array.from(pipelines.values());
export const storePipelineRun = (r: PipelineRun) => pipelineRuns.set(r.id, r);
export const getPipelineRun = (id: string) => pipelineRuns.get(id) ?? null;
export const getAllPipelineRuns = () => Array.from(pipelineRuns.values());
export const storeSnapshot = (s: SnapshotRecord) => snapshots.set(s.id, s);
export const getSnapshot = (id: string) => snapshots.get(id) ?? null;
export const getAllSnapshots = () => Array.from(snapshots.values());
export const storeFact = (f: FactDefinition) => facts.set(f.id, f);
export const getFact = (id: string) => facts.get(id) ?? null;
export const getAllFacts = () => Array.from(facts.values());
export const storeDimension = (d: DimensionDefinition) => dimensions.set(d.id, d);
export const getDimension = (id: string) => dimensions.get(id) ?? null;
export const getAllDimensions = () => Array.from(dimensions.values());
export const storeSemanticMetric = (m: SemanticMetric) => semanticMetrics.set(m.id, m);
export const getSemanticMetric = (id: string) => semanticMetrics.get(id) ?? null;
export const getAllSemanticMetrics = () => Array.from(semanticMetrics.values());
export const storeKPIDef = (k: KPIDefinition) => kpiDefs.set(k.id, k);
export const getKPIDef = (id: string) => kpiDefs.get(id) ?? null;
export const getAllKPIDefs = () => Array.from(kpiDefs.values());
export const storeKPIResult = (r: KPIResult) => { const arr = kpiResults.get(r.kpiId) ?? []; arr.push(r); kpiResults.set(r.kpiId, arr); };
export const getKPIResults = (kpiId: string) => kpiResults.get(kpiId) ?? [];
export const storeReport = (r: ReportDefinition) => reports.set(r.id, r);
export const getReport = (id: string) => reports.get(id) ?? null;
export const getAllReports = () => Array.from(reports.values());
export const storeReportExecution = (e: ReportExecution) => reportExecutions.set(e.id, e);
export const getReportExecution = (id: string) => reportExecutions.get(id) ?? null;
export const getAllReportExecutions = () => Array.from(reportExecutions.values());
export const storeDashboard = (d: DashboardDefinition) => dashboards.set(d.id, d);
export const getDashboard = (id: string) => dashboards.get(id) ?? null;
export const getAllDashboards = () => Array.from(dashboards.values());
export const storeReportSchedule = (s: ReportSchedule) => reportSchedules.set(s.id, s);
export const getReportSchedule = (id: string) => reportSchedules.get(id) ?? null;
export const getAllReportSchedules = () => Array.from(reportSchedules.values());
export const storeReportSubscription = (s: ReportSubscription) => reportSubscriptions.set(s.id, s);
export const getReportSubscription = (id: string) => reportSubscriptions.get(id) ?? null;
export const getAllReportSubscriptions = () => Array.from(reportSubscriptions.values());
export const storeDataExport = (e: DataExport) => dataExports.set(e.id, e);
export const getDataExport = (id: string) => dataExports.get(id) ?? null;
export const getAllDataExports = () => Array.from(dataExports.values());
export const storeLineageNode = (n: LineageNode) => lineageNodes.set(n.id, n);
export const getLineageNode = (id: string) => lineageNodes.get(id) ?? null;
export const getAllLineageNodes = () => Array.from(lineageNodes.values());
export const storeLineageEdge = (e: LineageEdge) => lineageEdges.set(e.id, e);
export const getLineageEdge = (id: string) => lineageEdges.get(id) ?? null;
export const getAllLineageEdges = () => Array.from(lineageEdges.values());
export const storeQualityRule = (r: QualityRule) => qualityRules.set(r.id, r);
export const getQualityRule = (id: string) => qualityRules.get(id) ?? null;
export const getAllQualityRules = () => Array.from(qualityRules.values());
export const storeQualityResult = (r: QualityResult) => { const arr = qualityResults.get(r.ruleId) ?? []; arr.push(r); qualityResults.set(r.ruleId, arr); };
export const getQualityResults = (ruleId: string) => qualityResults.get(ruleId) ?? [];
export const getAllQualityResults = () => { const all: QualityResult[] = []; for (const arr of qualityResults.values()) all.push(...arr); return all; };
export const storeGovernancePolicy = (g: GovernancePolicy) => governancePolicies.set(g.id, g);
export const getGovernancePolicy = (id: string) => governancePolicies.get(id) ?? null;
export const getAllGovernancePolicies = () => Array.from(governancePolicies.values());

export function _resetRepositoryForTesting() {
  datasets.clear(); catalog.clear();
  lakePartitions.clear(); lakeSnapshots.clear(); lakeRetention.clear();
  warehouseObjects.clear(); warehouseRefreshLogs.clear();
  etlJobs.clear(); eltJobs.clear();
  pipelines.clear(); pipelineRuns.clear();
  snapshots.clear();
  facts.clear(); dimensions.clear(); semanticMetrics.clear();
  kpiDefs.clear(); kpiResults.clear();
  reports.clear(); reportExecutions.clear();
  dashboards.clear();
  reportSchedules.clear(); reportSubscriptions.clear();
  dataExports.clear();
  lineageNodes.clear(); lineageEdges.clear();
  qualityRules.clear(); qualityResults.clear();
  governancePolicies.clear();
}
