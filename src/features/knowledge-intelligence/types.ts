/**
 * EduBek — Knowledge Intelligence types.
 *
 * Phase 4F.5: Concept Extraction, Curriculum Mapping, Knowledge
 * Coverage Analysis, Automatic Prerequisite Discovery, Learning
 * Outcome Prediction, Resource Quality Analysis, Duplicate /
 * Similarity Detection, Automatic Content Relationships, AI
 * Curriculum Assistant, and Educational Knowledge Health.
 *
 * All DTOs are JSON-serializable so they can flow through API
 * routes and the notification system without transformation.
 */

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export interface ConceptAttributes {
  formulas?: string[];
  definitions?: string[];
  keywords?: string[];
  skills?: string[];
  examples?: string[];
  vocabulary?: string[];
  misconceptions?: string[];
}

export interface ConceptDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string | null;
  bloomLevel: BloomLevel | null;
  difficulty: number;
  estimatedMinutes: number;
  attributes: ConceptAttributes;
  language: string;
  aiConfidence: number;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Learning Objectives
// ---------------------------------------------------------------------------

export interface LearningObjectiveDto {
  id: string;
  frameworkId: string | null;
  code: string;
  title: string;
  description: string | null;
  subject: string;
  grade: string;
  bloomLevel: BloomLevel | null;
  conceptIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Curriculum Frameworks + Standards
// ---------------------------------------------------------------------------

export type CurriculumFrameworkCode =
  | "uzbekistan"
  | "cambridge"
  | "ib"
  | "ap"
  | "sat"
  | "gcse"
  | "custom";

export interface CurriculumFrameworkDto {
  id: string;
  code: CurriculumFrameworkCode;
  name: string;
  description: string | null;
  region: string | null;
  language: string;
  organizationId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumStandardDto {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  subject: string;
  grade: string;
  strand: string | null;
  outcomes: string[];
  bloomLevel: BloomLevel | null;
  createdAt: string;
  updatedAt: string;
}

export type CoverageLevel =
  | "partial"
  | "full"
  | "introduces"
  | "reinforces"
  | "assesses";

export interface CurriculumMappingDto {
  id: string;
  standardId: string;
  entityType: string;
  entityId: string;
  alignmentScore: number;
  coverageLevel: CoverageLevel;
  rationale: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Concept Relationships
// ---------------------------------------------------------------------------

export type ConceptRelationshipType =
  | "prerequisite"
  | "next"
  | "related"
  | "part_of"
  | "derived_from"
  | "reinforces";

export interface ConceptRelationshipDto {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  type: ConceptRelationshipType;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Concept Mastery
// ---------------------------------------------------------------------------

export type ConceptMasteryLevel = "never" | "learning" | "weak" | "mastered" | "forgotten";

export interface ConceptMasteryDto {
  id: string;
  userId: string;
  conceptId: string;
  mastery: number;
  level: ConceptMasteryLevel;
  practiceCount: number;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Resource ↔ Concept
// ---------------------------------------------------------------------------

export type ResourceConceptRelationship =
  | "teaches"
  | "assesses"
  | "references"
  | "requires";

export interface ResourceConceptDto {
  id: string;
  conceptId: string;
  entityType: string;
  entityId: string;
  relationship: ResourceConceptRelationship;
  confidence: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Knowledge Coverage + Gaps
// ---------------------------------------------------------------------------

export interface CoverageDetails {
  uncoveredStandardIds: string[];
  weakAreas: Array<{ strand: string; pct: number }>;
  duplicateResources: Array<{ id: string; count: number }>;
}

export interface KnowledgeCoverageDto {
  id: string;
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
  frameworkId: string;
  totalStandards: number;
  coveredStandards: number;
  uncoveredStandards: number;
  coveragePct: number;
  details: CoverageDetails;
  computedAt: string;
}

export type KnowledgeGapType =
  | "uncovered_standard"
  | "missing_prerequisite"
  | "weak_concept_coverage"
  | "no_assessment"
  | "duplicate_lesson";

export interface KnowledgeGapDto {
  id: string;
  scopeType: "classroom" | "organization" | "student" | "framework";
  scopeId: string;
  standardId: string | null;
  conceptId: string | null;
  type: KnowledgeGapType;
  description: string;
  suggestedAction: string | null;
  metadata: {
    affectedResources?: string[];
    suggestedResources?: string[];
    [k: string]: unknown;
  };
  status: "open" | "resolved" | "ignored";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Resource Quality
// ---------------------------------------------------------------------------

export interface ResourceQualityAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface ResourceQualityDto {
  id: string;
  entityType: string;
  entityId: string;
  overall: number;
  clarity: number;
  depth: number;
  accuracy: number;
  difficulty: number;
  engagement: number;
  curriculumAlignment: number;
  assessmentQuality: number;
  accessibility: number;
  aiConfidence: number;
  analysis: ResourceQualityAnalysis;
  model: string;
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// Similarity Clusters
// ---------------------------------------------------------------------------

export type SimilarityClusterType =
  | "duplicate"
  | "similar"
  | "translated_copy"
  | "ai_variant";

export interface SimilarityClusterMember {
  entityType: string;
  entityId: string;
  similarity: number;
}

export interface SimilarityClusterDto {
  id: string;
  name: string;
  entityType: string;
  members: SimilarityClusterMember[];
  centroidHash: string | null;
  threshold: number;
  clusterType: SimilarityClusterType;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Learning Prediction
// ---------------------------------------------------------------------------

export interface PredictionSignals {
  accuracy?: number;
  streak?: number;
  mastery?: number;
  velocity?: number;
  engagement?: number;
  modelVersion?: string;
}

export interface LearningPredictionDto {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  predictedScore: number | null;
  predictedCompletion: number | null;
  predictedDropout: number | null;
  predictedMastery: number | null;
  predictedStudyMinutes: number | null;
  interventionNeeded: boolean;
  interventionReason: string | null;
  metadata: PredictionSignals;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Knowledge Health
// ---------------------------------------------------------------------------

export interface MasteryDistribution {
  mastered: number;
  learning: number;
  weak: number;
  never: number;
}

export interface TeacherContribution {
  teacherId: string;
  resourceCount: number;
  avgQuality: number;
}

export interface KnowledgeHealthDto {
  organizationId: string;
  day: string;
  coverageScore: number;
  qualityScore: number;
  curriculumCompleteness: number;
  graphDensity: number;
  resourceFreshness: number;
  aiReadiness: number;
  masteryDistribution: MasteryDistribution;
  teacherContributions: TeacherContribution[];
}

// ---------------------------------------------------------------------------
// AI Curriculum Assistant
// ---------------------------------------------------------------------------

export interface CurriculumAnswerDto {
  question: string;
  answer: string;
  // Structured data backing the answer (for rich UI rendering)
  evidence: Array<{
    type: "standard" | "resource" | "concept" | "gap";
    id: string;
    title: string;
    relevance: number;
  }>;
  // AI-generated follow-up suggestions
  followUps: string[];
  confidence: number;
  answerKey: string;
  locale: string;
}

// ---------------------------------------------------------------------------
// Concept Extraction result
// ---------------------------------------------------------------------------

export interface ConceptExtractionResult {
  concepts: Array<{
    name: string;
    slug: string;
    confidence: number;
    weight: number; // primary concept vs minor reference
    relationship: ResourceConceptRelationship;
  }>;
  bloomLevel: BloomLevel | null;
  difficulty: number; // 0-1
  estimatedMinutes: number;
  attributes: ConceptAttributes;
  // AI confidence in the extraction as a whole
  aiConfidence: number;
  model: string;
}

// ---------------------------------------------------------------------------
// Prerequisite Discovery result
// ---------------------------------------------------------------------------

export interface DiscoveredPrerequisite {
  fromConceptId: string;
  toConceptId: string;
  type: ConceptRelationshipType;
  confidence: number;
  rationale: string;
}
