/**
 * EduBek — Knowledge Intelligence barrel export.
 *
 * Phase 4F.5: Concept Extraction, Curriculum Mapping, Knowledge
 * Coverage, Automatic Prerequisite Discovery, Learning Outcome
 * Prediction, Resource Quality Analysis, Duplicate & Similarity
 * Detection, Automatic Content Relationships, AI Curriculum
 * Assistant, and Educational Knowledge Health.
 *
 * Everything is additive — no breaking changes to prior phases.
 */
// Main service (full entity analysis pipeline + concept CRUD)
export {
  analyzeEntity,
  listConcepts,
  getConcept,
  searchConcepts,
  // Re-exports of all sub-module public APIs
  extractConcepts,
  analyzeAndIndexEntity,
  ensureBuiltinFrameworks,
  listFrameworks,
  getFramework,
  createCustomFramework,
  createStandard,
  listStandards,
  getStandard,
  autoMapEntityToStandards,
  listMappings,
  getMappingsForEntity,
  computeCoverage,
  getCoverage,
  listKnowledgeGaps,
  resolveKnowledgeGap,
  ignoreKnowledgeGap,
  discoverPrerequisites,
  discoverAllPrerequisitesForSubject,
  predictLearningOutcome,
  getPrediction,
  listPredictionsForUser,
  analyzeResourceQuality,
  getResourceQuality,
  findSimilarEntities,
  createSimilarityCluster,
  listSimilarityClusters,
  scanForDuplicates,
  autoLinkEntity,
  createRelationship,
  answerCurriculumQuestion,
  computeKnowledgeHealth,
  getKnowledgeHealth,
} from "./service";

// Types
export type {
  BloomLevel,
  ConceptAttributes,
  ConceptDto,
  LearningObjectiveDto,
  CurriculumFrameworkCode,
  CurriculumFrameworkDto,
  CurriculumStandardDto,
  CoverageLevel,
  CurriculumMappingDto,
  ConceptRelationshipType,
  ConceptRelationshipDto,
  ConceptMasteryLevel,
  ConceptMasteryDto,
  ResourceConceptRelationship,
  ResourceConceptDto,
  CoverageDetails,
  KnowledgeCoverageDto,
  KnowledgeGapType,
  KnowledgeGapDto,
  ResourceQualityAnalysis,
  ResourceQualityDto,
  SimilarityClusterType,
  SimilarityClusterMember,
  SimilarityClusterDto,
  PredictionSignals,
  LearningPredictionDto,
  MasteryDistribution,
  TeacherContribution,
  KnowledgeHealthDto,
  CurriculumAnswerDto,
  ConceptExtractionResult,
  DiscoveredPrerequisite,
} from "./types";
