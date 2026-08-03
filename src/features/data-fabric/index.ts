/** EduBek — Data Fabric barrel export. Phase 5B.3. */
export {
  registerEntity, getEntity, listEntities, updateEntityState,
  appendEvent, getEvents, reconstructState,
  getReadModel, listReadModels,
  createStreamSubscription, listStreamSubscriptions,
  syncFromNode, getSyncCheckpoints,
  indexEntity, globalSearch, getSearchIndexSize,
  createFederatedJob, contributeToFederatedJob, aggregateFederatedJob, listFederatedJobs,
  generateBenchmarkReport, listBenchmarks,
  recordTrace, listTraces,
  createGovernancePolicy, listGovernancePolicies, enforceRetentionPolicies,
  captureIntelligenceSnapshot, listIntelligenceSnapshots,
  getFabricOverview,
} from "./service";

export type {
  FabricEntityType, DataFabricEntityDto, EventStoreDto,
  ReadModelType, ReadModelDto, SyncCheckpointDto,
  GlobalSearchIndexDto, GlobalSearchResult,
  FederatedLearningJobDto, BenchmarkReportDto,
  ObservabilityTraceDto, GovernancePolicyDto,
  IntelligenceLakeSnapshotDto, StreamSubscriptionDto, FabricOverviewDto,
} from "./types";
