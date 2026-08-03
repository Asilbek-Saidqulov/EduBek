/**
 * EduBek — Engineering Build Optimizer types.
 *
 * Phase 6A.2: Repository scalability, build optimization, and developer
 * experience. Every type is a *diagnostic* surface — this module
 * produces recommendations, never automatic code changes. All endpoints
 * are read-only.
 */

// ===========================================================================
// SYSTEM 1 — TypeScript Build Optimizer
// ===========================================================================

export interface BuildOptimizationReport {
  generatedAt: string;
  /** Project reference analysis. */
  projectReferences: ProjectReferenceAnalysis;
  /** Incremental build recommendations. */
  incrementalBuild: IncrementalBuildAnalysis;
  /** Type dependency graph summary. */
  typeDependencyGraph: TypeDependencyGraphSummary;
  /** Large modules (>500 lines). */
  largeModules: LargeModule[];
  /** Slow compilation suspects. */
  slowCompilation: SlowCompilationSuspect[];
  /** Circular type dependencies. */
  circularTypeDependencies: CircularTypeDependency[];
  /** Memory usage estimates. */
  memoryUsage: MemoryUsageEstimate;
  /** Compiler bottlenecks. */
  compilerBottlenecks: CompilerBottleneck[];
  recommendations: EngineeringRecommendation[];
}

export interface ProjectReferenceAnalysis {
  /** Whether tsconfig uses project references. */
  usesProjectReferences: boolean;
  /** Number of referenced projects. */
  referencedProjectCount: number;
  /** Recommendation. */
  recommendation: string;
}

export interface IncrementalBuildAnalysis {
  incrementalEnabled: boolean;
  buildInfoFile: string | null;
  /** Estimated incremental build time savings (percent). */
  estimatedSavingsPercent: number;
  recommendation: string;
}

export interface TypeDependencyGraphSummary {
  totalTypeFiles: number;
  totalTypeEdges: number;
  /** Average type dependencies per file. */
  averageDependenciesPerFile: number;
  /** Files with the most type imports. */
  mostConnectedFiles: Array<{ file: string; importCount: number }>;
}

export interface LargeModule {
  file: string;
  lines: number;
  /** Estimated type-checking cost (relative). */
  estimatedCost: number;
  recommendation: string;
}

export interface SlowCompilationSuspect {
  file: string;
  reason: string;
  estimatedImpactMs: number;
  recommendation: string;
}

export interface CircularTypeDependency {
  cycle: string[];
  severity: "low" | "medium" | "high";
  recommendation: string;
}

export interface MemoryUsageEstimate {
  /** Estimated TS compiler memory usage in MB. */
  estimatedMb: number;
  /** Whether the project is likely to OOM on machines with <4GB RAM. */
  likelyOOM: boolean;
  recommendation: string;
}

export interface CompilerBottleneck {
  bottleneck: string;
  description: string;
  estimatedImpactMs: number;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 2 — Repository Structure Analyzer
// ===========================================================================

export interface RepositoryStructureReport {
  generatedAt: string;
  folderDepth: FolderDepthAnalysis;
  moduleSizes: ModuleSizeAnalysis;
  featureBoundaries: FeatureBoundaryAnalysis;
  barrelExports: BarrelExportAnalysis;
  sharedUtilities: SharedUtilityAnalysis;
  duplicatedHelpers: DuplicatedHelper[];
  importPatterns: ImportPatternAnalysis;
  dependencyLayering: DependencyLayeringAnalysis;
  violations: StructureViolation[];
  recommendations: EngineeringRecommendation[];
}

export interface FolderDepthAnalysis {
  maxDepth: number;
  averageDepth: number;
  deepestFolders: Array<{ path: string; depth: number }>;
  recommendation: string;
}

export interface ModuleSizeAnalysis {
  totalFiles: number;
  totalLines: number;
  averageLinesPerFile: number;
  largestFiles: Array<{ file: string; lines: number }>;
  recommendation: string;
}

export interface FeatureBoundaryAnalysis {
  featureCount: number;
  crossFeatureImports: number;
  violations: Array<{ from: string; to: string; reason: string }>;
  recommendation: string;
}

export interface BarrelExportAnalysis {
  barrelsChecked: number;
  barrelsWithSideEffects: number;
  barrelsMissingDefaultExport: number;
  recommendation: string;
}

export interface SharedUtilityAnalysis {
  sharedUtilityCount: number;
  utilitiesByCategory: Record<string, number>;
  recommendation: string;
}

export interface DuplicatedHelper {
  name: string;
  locations: string[];
  similarity: number;
  recommendation: string;
}

export interface ImportPatternAnalysis {
  totalImports: number;
  relativeImports: number;
  aliasImports: number;
  bareImports: number;
  deepImports: number;
  recommendation: string;
}

export interface DependencyLayeringAnalysis {
  layers: Array<{ name: string; moduleCount: number; allowedDependencies: string[] }>;
  violations: Array<{ from: string; to: string; reason: string }>;
  recommendation: string;
}

export interface StructureViolation {
  type: "deep_nesting" | "cross_feature" | "missing_barrel" | "circular" | "deep_import";
  description: string;
  severity: "low" | "medium" | "high";
  location: string;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 3 — Bundle Analyzer
// ===========================================================================

export interface BundleAnalysisReport {
  generatedAt: string;
  /** Estimated bundle size (KB). */
  estimatedBundleSizeKb: number;
  /** Largest modules in the bundle. */
  largestModules: BundleModule[];
  /** Duplicate packages detected. */
  duplicatePackages: DuplicatePackage[];
  /** Tree-shaking opportunities. */
  treeShakingOpportunities: TreeShakingOpportunity[];
  /** Lazy-loading candidates. */
  lazyLoadingCandidates: LazyLoadingCandidate[];
  /** Dynamic import candidates. */
  dynamicImportCandidates: DynamicImportCandidate[];
  recommendations: EngineeringRecommendation[];
}

export interface BundleModule {
  name: string;
  estimatedSizeKb: number;
  /** Percentage of total bundle. */
  percent: number;
  recommendation: string;
}

export interface DuplicatePackage {
  name: string;
  versions: string[];
  estimatedWasteKb: number;
  recommendation: string;
}

export interface TreeShakingOpportunity {
  module: string;
  unusedExports: number;
  estimatedSavingsKb: number;
  recommendation: string;
}

export interface LazyLoadingCandidate {
  route: string;
  module: string;
  estimatedSavingsKb: number;
  recommendation: string;
}

export interface DynamicImportCandidate {
  module: string;
  reason: string;
  estimatedSavingsKb: number;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 4 — Dependency Hygiene
// ===========================================================================

export interface DependencyHygieneReport {
  generatedAt: string;
  totalPackages: number;
  unusedPackages: UnusedPackage[];
  duplicatePackages: DuplicatePackage[];
  versionInconsistencies: VersionInconsistency[];
  heavyDependencies: HeavyDependency[];
  securityUpdates: SecurityUpdate[];
  licenseCompatibility: LicenseCompatibility[];
  recommendations: EngineeringRecommendation[];
}

export interface UnusedPackage {
  name: string;
  type: "dependency" | "devDependency";
  recommendation: string;
}

export interface VersionInconsistency {
  name: string;
  versions: Array<{ version: string; dependents: string[] }>;
  recommendation: string;
}

export interface HeavyDependency {
  name: string;
  estimatedSizeKb: number;
  transitiveCount: number;
  recommendation: string;
}

export interface SecurityUpdate {
  name: string;
  currentVersion: string;
  recommendedVersion: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

export interface LicenseCompatibility {
  name: string;
  license: string;
  compatible: boolean;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 5 — Test Infrastructure Analyzer
// ===========================================================================

export interface TestInfrastructureReport {
  generatedAt: string;
  totalTests: number;
  totalRuntimeMs: number;
  slowTests: SlowTest[];
  duplicateTests: DuplicateTest[];
  coverageGaps: CoverageGap[];
  parallelizationOpportunities: ParallelizationOpportunity[];
  fixtureReuse: FixtureReuseAnalysis;
  mockReuse: MockReuseAnalysis;
  recommendations: EngineeringRecommendation[];
}

export interface SlowTest {
  file: string;
  testName: string;
  durationMs: number;
  recommendation: string;
}

export interface DuplicateTest {
  testName: string;
  files: string[];
  recommendation: string;
}

export interface CoverageGap {
  module: string;
  coveragePercent: number;
  uncoveredFiles: string[];
  recommendation: string;
}

export interface ParallelizationOpportunity {
  description: string;
  estimatedSpeedup: number;
  recommendation: string;
}

export interface FixtureReuseAnalysis {
  totalFixtures: number;
  duplicatedFixtures: number;
  recommendation: string;
}

export interface MockReuseAnalysis {
  totalMocks: number;
  duplicatedMocks: number;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 6 — CI/CD Readiness Analyzer
// ===========================================================================

export interface CICDReadinessReport {
  generatedAt: string;
  lint: CICDStageStatus;
  tests: CICDStageStatus;
  typeChecking: CICDStageStatus;
  build: CICDStageStatus;
  deployment: CICDStageStatus;
  migrationSafety: MigrationSafetyReport;
  rollbackReadiness: RollbackReadinessReport;
  artifactSize: ArtifactSizeReport;
  pipelineDuration: PipelineDurationReport;
  recommendations: EngineeringRecommendation[];
}

export interface CICDStageStatus {
  stage: string;
  configured: boolean;
  estimatedDurationMs: number;
  blocking: boolean;
  recommendation: string;
}

export interface MigrationSafetyReport {
  hasMigrations: boolean;
  migrationCount: number;
  hasDownMigrations: boolean;
  hasSeedData: boolean;
  recommendation: string;
}

export interface RollbackReadinessReport {
  hasRollbackPlan: boolean;
  rollbackSteps: string[];
  estimatedRollbackTimeMinutes: number;
  recommendation: string;
}

export interface ArtifactSizeReport {
  estimatedSizeMb: number;
  largestContributors: Array<{ component: string; sizeMb: number }>;
  recommendation: string;
}

export interface PipelineDurationReport {
  estimatedTotalMs: number;
  stages: Array<{ stage: string; estimatedMs: number; percent: number }>;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 7 — Configuration Analyzer
// ===========================================================================

export interface ConfigurationReport {
  generatedAt: string;
  tsconfig: ConfigAnalysis;
  eslint: ConfigAnalysis;
  prettier: ConfigAnalysis;
  vitest: ConfigAnalysis;
  nextConfig: ConfigAnalysis;
  environmentVariables: EnvVarAnalysis;
  featureFlags: FeatureFlagAnalysis;
  configurationDuplication: ConfigurationDuplication[];
  recommendations: EngineeringRecommendation[];
}

export interface ConfigAnalysis {
  file: string;
  exists: boolean;
  issues: string[];
  recommendation: string;
}

export interface EnvVarAnalysis {
  total: number;
  documented: number;
  undocumented: string[];
  recommendation: string;
}

export interface FeatureFlagAnalysis {
  totalFlags: number;
  documented: number;
  flagsInCode: number;
  recommendation: string;
}

export interface ConfigurationDuplication {
  setting: string;
  locations: string[];
  recommendation: string;
}

// ===========================================================================
// SYSTEM 8 — Documentation Coverage Analyzer
// ===========================================================================

export interface DocumentationCoverageReport {
  generatedAt: string;
  publicApiDocs: DocumentationMetric;
  internalModuleDocs: DocumentationMetric;
  readmeCoverage: DocumentationMetric;
  architectureDocs: DocumentationMetric;
  endpointDocs: DocumentationMetric;
  missingExamples: string[];
  documentationScore: number;
  recommendations: EngineeringRecommendation[];
}

export interface DocumentationMetric {
  total: number;
  documented: number;
  coveragePercent: number;
  missing: string[];
  recommendation: string;
}

// ===========================================================================
// SYSTEM 9 — Technical Debt Analyzer
// ===========================================================================

export interface TechnicalDebtReport {
  generatedAt: string;
  todos: DebtItem[];
  fixmes: DebtItem[];
  deprecatedApis: DebtItem[];
  temporaryWorkarounds: DebtItem[];
  unusedCode: DebtItem[];
  deadBranches: DebtItem[];
  duplicateLogic: DebtItem[];
  highComplexityFunctions: ComplexityItem[];
  largeClasses: SizeItem[];
  longFiles: SizeItem[];
  debtBacklog: PrioritizedDebtItem[];
  recommendations: EngineeringRecommendation[];
}

export interface DebtItem {
  file: string;
  line: number;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

export interface ComplexityItem {
  file: string;
  function: string;
  complexity: number;
  lines: number;
  recommendation: string;
}

export interface SizeItem {
  file: string;
  lines: number;
  threshold: number;
  recommendation: string;
}

export interface PrioritizedDebtItem {
  item: DebtItem | ComplexityItem | SizeItem;
  priority: number;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
}

// ===========================================================================
// SYSTEM 10 — Engineering Readiness Dashboard
// ===========================================================================

export interface EngineeringReadinessDashboard {
  generatedAt: string;
  repositoryHealthScore: number;
  buildHealth: DimensionScore;
  typescriptHealth: DimensionScore;
  testHealth: DimensionScore;
  dependencyHealth: DimensionScore;
  documentationHealth: DimensionScore;
  technicalDebtScore: DimensionScore;
  developerExperienceScore: DimensionScore;
  maintainabilityScore: DimensionScore;
  overallEngineeringReadiness: number;
  grade: string;
  topStrengths: string[];
  topWeaknesses: string[];
  priorityActions: Array<{ action: string; impact: number; effort: number; priority: number }>;
}

export interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  strengths: string[];
  weaknesses: string[];
}

// ===========================================================================
// Shared
// ===========================================================================

export interface EngineeringRecommendation {
  id: string;
  category: "build" | "repository" | "bundle" | "dependency" | "test" | "ci" | "config" | "documentation" | "debt";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  recommendation: string;
}
