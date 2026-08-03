/**
 * EduBek — Global Educational Intelligence Network types.
 * Phase 5D.2: Foundation Models, Global Curriculum Graph, Collective AI,
 * Pattern Mining, Synthetic Data, Benchmarking, Reasoning Engine,
 * Knowledge Evolution, Global Observatory, Foundation API.
 */

export interface FoundationModelDto {
  id: string; domain: string; name: string; version: string; description: string | null;
  capabilities: string[]; modelMetadata: Record<string, unknown>;
  trainingInfo: Record<string, unknown>;
  status: "training" | "evaluating" | "deployed" | "deprecated";
  metrics: Record<string, unknown>; languages: string[]; organizationId: string | null;
}

export interface CurriculumEquivalenceDto {
  id: string; sourceFramework: string; sourceStandardId: string; sourceStandardCode: string;
  targetFramework: string; targetStandardId: string; targetStandardCode: string;
  equivalenceScore: number; equivalenceType: string; notes: string | null; aiValidated: boolean;
}

export interface EducationalPatternDto {
  id: string; type: string; title: string; description: string | null;
  subject: string | null; pattern: Record<string, unknown>;
  source: Record<string, unknown>; confidence: number;
  verification: "unverified" | "verified" | "challenged";
}

export interface SyntheticDatasetDto {
  id: string; name: string; description: string | null;
  purpose: string; domain: string | null;
  data: Record<string, unknown>[]; schema: Array<{ name: string; type: string; description?: string }>;
  privacyLevel: string; generationParams: Record<string, unknown>;
  recordCount: number; qualityScore: number;
}

export interface GlobalBenchmarkDto {
  id: string; metric: string; scope: string; scopeValue: string | null;
  period: string; periodStart: string; periodEnd: string;
  statistics: Record<string, number>; participantCount: number; aiSummary: string | null;
}

export interface ReasoningChainDto {
  id: string; query: string; domain: string | null;
  steps: Array<{ step: number; type: string; content: string; evidence?: string; confidence?: number }>;
  conclusion: string | null;
  evidence: Array<{ type: string; id: string; title: string; relevance: number }>;
  curriculumRefs: Array<{ framework: string; standardCode: string; relevance: number }>;
  prerequisiteAnalysis: Array<{ concept: string; masteryRequired: number; currentLevel: string }>;
  alternatives: Array<{ strategy: string; description: string; tradeoffs: string }>;
  confidence: number; modelUsed: string | null; language: string;
}

export interface KnowledgeEvolutionDto {
  id: string; type: string; entity: string; change: string;
  beforeState: Record<string, unknown>; afterState: Record<string, unknown>;
  reason: string | null; impact: Record<string, unknown>;
  detectedAt: string; source: string;
}

export interface GlobalObservatoryDto {
  id: string; day: string;
  emergingSkills: Array<{ skill: string; growthRate: number; region?: string; demandLevel: string }>;
  curriculumTrends: Array<{ subject: string; direction: string; adoptionRate: number }>;
  aiAdoption: Record<string, unknown>;
  assessmentInnovations: Array<{ innovation: string; description: string; adoptionCount: number }>;
  teachingMethods: Array<{ method: string; popularity: number; effectiveness: number }>;
  subjectPopularity: Array<{ subject: string; rank: number; trend: string }>;
  aiSummary: string | null;
}

export interface FoundationApiCallDto {
  id: string; endpoint: string; callerId: string; callerType: string;
  input: Record<string, unknown>; output: Record<string, unknown> | null;
  modelUsed: string | null; latencyMs: number; costCredits: number;
  status: "completed" | "failed" | "timeout"; errorMessage: string | null; occurredAt: string;
}

export interface CollectiveInsightDto {
  id: string; type: string; title: string; description: string;
  domain: string | null; evidence: Array<{ source: string; data: Record<string, unknown>; confidence: number }>;
  source: Record<string, unknown>; confidence: number;
  applicability: Record<string, unknown>;
  status: "active" | "archived" | "challenged";
}

export interface MultilingualAlignmentDto {
  id: string; sourceTerm: string; sourceLanguage: string;
  targetTerm: string; targetLanguage: string;
  confidence: number; context: string; notes: string | null; aiValidated: boolean;
}

export interface NetworkParticipationDto {
  id: string; organizationId: string; level: "observer" | "contributor" | "leader";
  contributions: string[]; privacySettings: Record<string, unknown>;
  patternsShared: number; benchmarksShared: number; modelsShared: number;
  status: "active" | "paused" | "withdrawn"; joinedAt: string;
}
