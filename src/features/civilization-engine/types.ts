/**
 * EduBek — Civilization Engine types.
 * Phase 5D.3: Autonomous Educational Civilization, Persistent AI
 * Institutions & Long-Term Educational Memory.
 */

export interface InstitutionalMemoryDto {
  id: string; organizationId: string; type: string; title: string;
  description: string; period: string | null; payload: Record<string, unknown>;
  linkedEntities: Array<{ entityType: string; entityId: string }>;
  evidence: Array<{ source: string; date: string; data: Record<string, unknown> }>;
  importance: number; searchText: string;
  createdAt: string; updatedAt: string;
}

export interface DecisionAnalysisDto {
  id: string; organizationId: string; title: string; description: string | null;
  type: string; parameters: Record<string, unknown>;
  impactEstimates: {
    learningImpact: number; teacherWorkload: number; dropout: number;
    resourceDemand: number; budget: number; aiCost: number;
    curriculumCompletion: number;
  };
  confidence: number; reasoning: string | null;
  evidence: Array<{ source: string; description: string; relevance: number }>;
  status: "pending" | "approved" | "rejected" | "implemented" | "archived";
  actualOutcome: string | null;
  createdAt: string; updatedAt: string;
}

export interface StrategicPlanDto {
  id: string; organizationId: string; title: string; description: string | null;
  horizon: "1_year" | "3_year" | "5_year" | "10_year";
  goals: Array<{ id: string; title: string; description: string; targetDate: string; status: string }>;
  milestones: Array<{ id: string; title: string; date: string; status: string; dependencies: string[] }>;
  kpis: Array<{ name: string; baseline: number; target: number; current: number; unit: string }>;
  resources: Array<{ type: string; amount: number; unit: string; notes?: string }>;
  risks: Array<{ risk: string; probability: number; impact: number; mitigation: string }>;
  expectedOutcomes: Array<{ outcome: string; metric: string; expectedValue: number }>;
  confidence: number; narrative: string | null;
  status: "draft" | "active" | "completed" | "archived";
  createdBy: string; createdAt: string; updatedAt: string;
}

export interface AdvisorRecommendationDto {
  id: string; organizationId: string; priority: number; category: string;
  title: string; description: string; reasoning: string | null;
  expectedImpact: Record<string, unknown>;
  costEstimate: Record<string, unknown>;
  confidence: number;
  requiredActions: Array<{ action: string; description: string; priority: number }>;
  evidence: Array<{ type: string; source: string; data: Record<string, unknown> }>;
  status: "pending" | "acknowledged" | "accepted" | "dismissed" | "implemented";
  acknowledgedAt: string | null; implementedAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface EducationalPolicyDto {
  id: string; organizationId: string; type: string; name: string;
  description: string | null;
  rules: Array<{ id: string; condition: string; action: string; parameters: Record<string, unknown> }>;
  ownerId: string; version: number;
  approvals: Array<{ approverId: string; approvedAt: string; comment?: string }>;
  aiAnalysis: { predictedImpact?: Record<string, number>; complianceScore?: number; riskAssessment?: Record<string, unknown> };
  status: "draft" | "pending_approval" | "active" | "superseded" | "archived";
  effectiveFrom: string | null; effectiveTo: string | null;
  compliance: Array<{ requirement: string; status: string; lastChecked?: string }>;
  createdAt: string; updatedAt: string;
}

export interface InstitutionalGoalDto {
  id: string; organizationId: string; title: string; description: string | null;
  type: string;
  target: { metric: string; baseline: number; target: number; current: number; unit: string; deadline?: string };
  kpis: Array<{ name: string; value: number; target: number; trend: string }>;
  initiatives: Array<{ id: string; title: string; status: string; progress: number }>;
  progress: number;
  status: "active" | "achieved" | "missed" | "paused" | "archived";
  deadline: string | null; achievedAt: string | null;
  aiAssessment: string | null;
  createdAt: string; updatedAt: string;
}

export interface TimelineEventDto {
  id: string; organizationId: string | null; type: string; title: string;
  description: string | null; occurredAt: string;
  linkedEntities: Array<{ entityType: string; entityId: string }>;
  metadata: Record<string, unknown>;
  severity: "info" | "notice" | "important" | "critical";
  createdAt: string;
}

export interface KnowledgeBaseEntryDto {
  id: string; organizationId: string | null; type: string; title: string;
  description: string; content: string; tags: string[]; subject: string | null;
  graphLinks: Array<{ nodeId: string; relationship: string }>;
  evidence: Array<{ source: string; data: Record<string, unknown>; confidence: number }>;
  effectiveness: number; searchText: string;
  status: "draft" | "published" | "archived";
  authorId: string | null; authorName: string | null;
  createdAt: string; updatedAt: string;
}

export interface InstitutionSimulationDto {
  id: string; organizationId: string; type: string; title: string;
  description: string | null;
  parameters: Record<string, unknown>;
  predictions: Array<{ metric: string; currentValue: number; predictedValue: number; confidence: number; trajectory: string }>;
  scenarios: Array<{ name: string; probability: number; impact: number; description: string }>;
  resourceProjections: Array<{ resource: string; current: number; projected: number; unit: string }>;
  summary: string | null; confidence: number;
  createdBy: string; createdAt: string; updatedAt: string;
}

export interface WisdomInsightDto {
  id: string; organizationId: string | null; type: string; title: string;
  description: string; narrative: string;
  historicalEvidence: Array<{ source: string; description: string; date: string; data: Record<string, unknown> }>;
  benchmarkEvidence: Array<{ metric: string; comparison: string; percentile: number }>;
  globalEvidence: Array<{ source: string; scope: string; finding: string }>;
  institutionEvidence: Array<{ source: string; data: Record<string, unknown>; relevance: number }>;
  confidence: number;
  recommendations: Array<{ action: string; priority: number; expectedImpact: string }>;
  subject: string | null;
  status: "active" | "archived" | "challenged";
  createdAt: string; updatedAt: string;
}

export interface CivilizationDashboardDto {
  organizationId: string;
  totalMemories: number;
  activeGoals: number;
  achievedGoals: number;
  pendingDecisions: number;
  activePolicies: number;
  pendingRecommendations: number;
  timelineEvents: number;
  knowledgeEntries: number;
  activeSimulations: number;
  wisdomInsights: number;
  strategicPlans: number;
  goalProgressAvg: number;
  advisorRecommendationCount: number;
  generatedAt: string;
}
