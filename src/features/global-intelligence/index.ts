/** EduBek — Global Intelligence barrel export. Phase 5D.2. */
export {
  registerFoundationModel, deployFoundationModel, listFoundationModels,
  createEquivalence, listEquivalences, findEquivalentStandards,
  discoverPattern, listPatterns,
  generateSyntheticDataset, listSyntheticDatasets,
  recordBenchmark, listBenchmarks,
  reason, getReasoningChain, listReasoningChains,
  recordEvolution, listEvolutions,
  captureObservatory, getLatestObservatory, listObservatories,
  callFoundationApi, listApiCalls,
  publishInsight, listInsights,
  createAlignment, listAlignments,
  joinNetwork, listParticipations,
} from "./service";

export type {
  FoundationModelDto, CurriculumEquivalenceDto, EducationalPatternDto,
  SyntheticDatasetDto, GlobalBenchmarkDto, ReasoningChainDto,
  KnowledgeEvolutionDto, GlobalObservatoryDto, FoundationApiCallDto,
  CollectiveInsightDto, MultilingualAlignmentDto, NetworkParticipationDto,
} from "./types";
