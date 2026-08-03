/**
 * EduBek — Build Optimizer barrel export.
 *
 * Phase 6A.2: Repository Scalability, Build Optimization & Developer
 * Experience.
 *
 * 10 systems:
 *   1. TypeScript Build Optimizer (build-analyzer)
 *   2. Repository Structure Analyzer (repository-analyzer)
 *   3. Bundle Analyzer (bundle-analyzer)
 *   4. Dependency Hygiene (dependency-hygiene)
 *   5. Test Infrastructure Analyzer (test-analyzer)
 *   6. CI/CD Readiness Analyzer (ci-analyzer)
 *   7. Configuration Analyzer (config-analyzer)
 *   8. Documentation Coverage Analyzer (documentation-analyzer)
 *   9. Technical Debt Analyzer (debt-analyzer)
 *  10. Engineering Readiness Dashboard (readiness-dashboard)
 *
 * All endpoints are READ-ONLY diagnostics. This module produces
 * recommendations, never automatic code changes. It reuses every
 * existing subsystem without duplicating diagnostics.
 */

export {
  generateBuildReport,
  generateRepositoryReport,
  generateBundleReport,
  generateDependencyReport,
  generateTestReport,
  generateCIReport,
  generateConfigReport,
  generateDocumentationReport,
  generateDebtReport,
  generateReadinessDashboard,
  generateFullEngineeringAudit,
} from "./service";

export type {
  BuildOptimizationReport, ProjectReferenceAnalysis, IncrementalBuildAnalysis,
  TypeDependencyGraphSummary, LargeModule, SlowCompilationSuspect,
  CircularTypeDependency, MemoryUsageEstimate, CompilerBottleneck,
  RepositoryStructureReport, FolderDepthAnalysis, ModuleSizeAnalysis,
  FeatureBoundaryAnalysis, BarrelExportAnalysis, SharedUtilityAnalysis,
  DuplicatedHelper, ImportPatternAnalysis, DependencyLayeringAnalysis,
  StructureViolation,
  BundleAnalysisReport, BundleModule, DuplicatePackage,
  TreeShakingOpportunity, LazyLoadingCandidate, DynamicImportCandidate,
  DependencyHygieneReport, UnusedPackage, VersionInconsistency,
  HeavyDependency, SecurityUpdate, LicenseCompatibility,
  TestInfrastructureReport, SlowTest, DuplicateTest, CoverageGap,
  ParallelizationOpportunity, FixtureReuseAnalysis, MockReuseAnalysis,
  CICDReadinessReport, CICDStageStatus, MigrationSafetyReport,
  RollbackReadinessReport, ArtifactSizeReport, PipelineDurationReport,
  ConfigurationReport, ConfigAnalysis, EnvVarAnalysis, FeatureFlagAnalysis,
  ConfigurationDuplication,
  DocumentationCoverageReport, DocumentationMetric,
  TechnicalDebtReport, DebtItem, ComplexityItem, SizeItem, PrioritizedDebtItem,
  EngineeringReadinessDashboard, DimensionScore,
  EngineeringRecommendation,
} from "./types";
