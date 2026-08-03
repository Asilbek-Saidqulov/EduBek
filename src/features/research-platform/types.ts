/**
 * EduBek — Research Platform types.
 * Phase 5D.1: AI-Native Knowledge Creation, Autonomous Research &
 * Scientific Education Platform.
 */

export interface ResearchProjectDto {
  id: string; title: string; description: string | null;
  status: "proposal" | "active" | "analysis" | "peer_review" | "published" | "archived";
  researchType: string; field: string | null;
  objectives: Array<{ id: string; objective: string; status: string }>;
  milestones: Array<{ id: string; name: string; dueDate: string; status: string; completedAt?: string }>;
  principalInvestigator: string; teamMembers: string[];
  organizationId: string | null;
  experimentIds: string[]; datasetIds: string[]; publicationIds: string[];
  assistantState: Record<string, unknown>;
  funding: Record<string, unknown>;
  ethicsApproved: boolean; ethicsNotes: string | null;
  createdAt: string; updatedAt: string;
}

export interface LiteratureEntryDto {
  id: string; type: string; title: string;
  authors: Array<{ name: string; affiliation?: string; orcid?: string }>;
  abstract: string | null; year: number | null; venue: string | null;
  doi: string | null; url: string | null;
  keywords: string[]; concepts: string[]; methodologies: string[];
  citationCount: number; influenceScore: number; evidenceStrength: number;
  contradictions: Array<{ entryId: string; description: string }>;
  fullTextUrl: string | null; organizationId: string | null;
}

export interface ExperimentDesignDto {
  id: string; projectId: string | null; title: string; description: string | null;
  experimentType: string; hypothesis: string | null;
  variables: { independent: Array<{ name: string; type: string; levels: string[] }>; dependent: Array<{ name: string; type: string; measurement: string }>; control: Array<{ name: string; value: string }> };
  sampleSize: number | null; sampleSizeJustification: string | null;
  measurements: Array<{ name: string; instrument: string; frequency: string; unit: string }>;
  analysisPlan: Record<string, unknown>;
  risks: Array<{ risk: string; severity: string; mitigation: string }>;
  reproducibility: Array<{ item: string; status: string; notes?: string }>;
  aiGenerated: boolean; status: string;
}

export interface ResearchDatasetDto {
  id: string; projectId: string | null; name: string; description: string | null;
  schema: Array<{ name: string; type: string; unit?: string; required: boolean; description?: string }>;
  data: Record<string, unknown>[]; fileUrl: string | null; format: string;
  version: number; provenance: Array<{ source: string; timestamp: string; operation: string; actor: string }>;
  qualityScore: number; fairCompliance: Record<string, unknown>;
  anonymized: boolean; anonymizationMethod: string | null;
  rowCount: number; sizeBytes: number; organizationId: string | null;
}

export interface CitationRecordDto {
  id: string; sourceType: string; sourceId: string;
  literatureId: string | null; rawCitation: string | null;
  citationType: string; context: string | null;
  validationStatus: "verified" | "unverified" | "mismatch" | "broken";
  validationNotes: string | null;
  formattedCitation: string | null; citationStyle: string;
}

export interface PeerReviewDto {
  id: string; entityType: string; entityId: string;
  reviewerId: string; reviewerName: string; reviewType: string;
  status: "assigned" | "in_progress" | "submitted" | "revision_requested" | "accepted" | "rejected";
  rubricEvaluation: Array<{ criterion: string; score: number; feedback: string }>;
  overallScore: number | null; recommendation: string | null;
  reviewText: string | null; confidentialComments: string | null;
  revisionRound: number; readinessScore: number | null;
  assignedAt: string; submittedAt: string | null;
}

export interface PatentWorkspaceDto {
  id: string; title: string; description: string | null;
  disclosure: string | null;
  noveltyAnalysis: Array<{ feature: string; isNovel: boolean; priorArt: string; notes?: string }>;
  priorArt: Array<{ reference: string; relevance: string; url?: string }>;
  draftSections: Array<{ section: string; content: string; status: string }>;
  commercialization: Record<string, unknown>;
  inventors: string[]; organizationId: string | null;
  status: "disclosure" | "searching" | "drafting" | "filed" | "granted" | "rejected";
  patentNumber: string | null; filedAt: string | null; grantedAt: string | null;
}

export interface PublicationDraftDto {
  id: string; projectId: string | null; title: string; abstract: string | null;
  sections: Array<{ id: string; name: string; content: string; wordCount: number; status: string }>;
  authors: Array<{ name: string; affiliation?: string; orcid?: string; corresponding: boolean }>;
  keywords: string[]; targetVenue: string | null;
  publicationType: string; citationStyle: string;
  bibliography: Array<{ entry: string; formattedCitation: string }>;
  aiGenerated: boolean; status: string; wordCount: number;
  reviewIds: string[]; doi: string | null; publishedUrl: string | null;
  organizationId: string | null;
}

export interface ResearchAnalyticsDto {
  id: string; organizationId: string; day: string;
  publicationMetrics: Record<string, unknown>;
  collaborationNetwork: Record<string, unknown>;
  funding: Record<string, unknown>;
  trends: Array<{ field: string; direction: string; growthRate: number }>;
  interdisciplinary: Array<{ fieldA: string; fieldB: string; strength: number }>;
  innovationMetrics: Record<string, unknown>;
  aiSummary: string | null;
}

// AI Research Assistant
export interface ResearchAssistantResult {
  query: string;
  response: string;
  citations: Array<{ literatureId?: string; reference: string; relevance: number }>;
  suggestions: string[];
  confidence: number;
}
