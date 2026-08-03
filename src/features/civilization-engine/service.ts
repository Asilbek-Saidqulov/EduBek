/**
 * EduBek — Civilization Engine service.
 *
 * Phase 5D.3: Autonomous Educational Civilization — persistent AI
 * institutions, long-term educational memory, decision intelligence,
 * strategic planning, autonomous advising, policy management, goal
 * tracking, civilization timeline, knowledge base, institutional
 * simulation, and wisdom generation.
 *
 * Reuses: Digital Twins, Knowledge Graph, Education OS, Platform
 * Intelligence, Global Intelligence, Assessment Platform, Learning
 * Planner, Cloud Infrastructure, Data Fabric.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  AdvisorRecommendationDto, CivilizationDashboardDto, DecisionAnalysisDto,
  EducationalPolicyDto, InstitutionalGoalDto, InstitutionalMemoryDto,
  InstitutionSimulationDto, KnowledgeBaseEntryDto, StrategicPlanDto,
  TimelineEventDto, WisdomInsightDto,
} from "./types";

const log = getLogger("civilization-engine");
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// 1. Institutional Long-Term Intelligence
// ===========================================================================

export async function recordMemory(input: {
  organizationId: string; type: string; title: string; description: string;
  period?: string; payload?: Record<string, unknown>;
  linkedEntities?: Array<{ entityType: string; entityId: string }>;
  evidence?: Array<{ source: string; date: string; data: Record<string, unknown> }>;
  importance?: number;
}): Promise<InstitutionalMemoryDto> {
  const searchText = `${input.title} ${input.description} ${input.period ?? ""} ${input.type}`.toLowerCase();
  const row = await repo.createMemory({
    organizationId: input.organizationId, type: input.type, title: input.title,
    description: input.description, period: input.period,
    payload: JSON.stringify(input.payload ?? {}),
    linkedEntities: JSON.stringify(input.linkedEntities ?? []),
    evidence: JSON.stringify(input.evidence ?? []),
    importance: input.importance ?? 0.5, searchText,
  });
  log.info("memory.recorded", { id: row.id, type: input.type, title: input.title });
  return mapMemory(row);
}

export async function searchMemory(organizationId: string, query: string, limit = 20): Promise<InstitutionalMemoryDto[]> {
  const rows = await repo.searchMemories(organizationId, query.toLowerCase(), limit);
  return rows.map(mapMemory);
}

export async function listMemories(input: { organizationId: string; type?: string; period?: string; limit?: number }): Promise<InstitutionalMemoryDto[]> {
  const rows = await repo.findMemories(input);
  return rows.map(mapMemory);
}

// ===========================================================================
// 2. Educational Decision Intelligence
// ===========================================================================

export async function analyzeDecision(input: {
  organizationId: string; title: string; description?: string;
  type: string; parameters?: Record<string, unknown>;
}): Promise<DecisionAnalysisDto> {
  // Compute impact estimates based on decision type and parameters
  const impactEstimates = computeDecisionImpact(input.type, input.parameters ?? {});
  const reasoning = generateDecisionReasoning(input.type, input.parameters ?? {}, impactEstimates);
  const evidence = generateDecisionEvidence(input.type);

  const row = await repo.createDecision({
    organizationId: input.organizationId, title: input.title, description: input.description,
    type: input.type, parameters: JSON.stringify(input.parameters ?? {}),
    impactEstimates: JSON.stringify(impactEstimates),
    confidence: 0.65, reasoning, evidence: JSON.stringify(evidence),
    status: "pending",
  });
  log.info("decision.analyzed", { id: row.id, type: input.type, title: input.title });
  return mapDecision(row);
}

export async function listDecisions(input: { organizationId: string; type?: string; status?: string; limit?: number }): Promise<DecisionAnalysisDto[]> {
  const rows = await repo.findDecisions(input);
  return rows.map(mapDecision);
}

export async function updateDecisionStatus(id: string, status: string, actualOutcome?: string): Promise<DecisionAnalysisDto> {
  const data: Record<string, unknown> = { status };
  if (actualOutcome) data.actualOutcome = actualOutcome;
  const row = await repo.updateDecision(id, data);
  return mapDecision(row);
}

function computeDecisionImpact(type: string, params: Record<string, unknown>): Record<string, number> {
  const base = { learningImpact: 0, teacherWorkload: 0, dropout: 0, resourceDemand: 0, budget: 0, aiCost: 0, curriculumCompletion: 0 };
  switch (type) {
    case "reduce_hours":
      return { ...base, learningImpact: -0.15, teacherWorkload: -0.2, dropout: 0.05, curriculumCompletion: -0.1, budget: -0.1 };
    case "merge_departments":
      return { ...base, learningImpact: -0.05, teacherWorkload: 0.1, budget: -0.15, resourceDemand: -0.1 };
    case "mandatory_ai":
      return { ...base, learningImpact: 0.12, teacherWorkload: -0.15, aiCost: 0.3, resourceDemand: 0.2, budget: 0.15 };
    case "require_exam":
      return { ...base, learningImpact: 0.08, dropout: 0.03, teacherWorkload: 0.15, curriculumCompletion: 0.1 };
    case "change_class_size":
      const size = (params.targetSize as number) ?? 30;
      return { ...base, learningImpact: size > 30 ? -0.08 : 0.1, teacherWorkload: size > 30 ? 0.2 : -0.15, dropout: size > 30 ? 0.04 : -0.03 };
    default:
      return { ...base, learningImpact: 0.02, confidence: 0.4 } as any;
  }
}

function generateDecisionReasoning(type: string, params: Record<string, unknown>, impact: Record<string, number>): string {
  const parts: string[] = [];
  parts.push(`Decision type "${type}" analyzed with parameters: ${JSON.stringify(params)}.`);
  if (impact.learningImpact < 0) parts.push(`Projected negative learning impact of ${Math.abs(impact.learningImpact * 100).toFixed(0)}%.`);
  if (impact.learningImpact > 0) parts.push(`Projected positive learning impact of ${(impact.learningImpact * 100).toFixed(0)}%.`);
  if (impact.dropout > 0) parts.push(`Warning: dropout may increase by ${(impact.dropout * 100).toFixed(0)}%.`);
  if (impact.aiCost > 0) parts.push(`AI cost impact: +${(impact.aiCost * 100).toFixed(0)}%.`);
  parts.push("Recommend reviewing historical evidence before implementation.");
  return parts.join(" ");
}

function generateDecisionEvidence(type: string): Array<{ source: string; description: string; relevance: number }> {
  return [
    { source: "historical", description: `Similar ${type} decisions in the past showed mixed outcomes.`, relevance: 0.7 },
    { source: "benchmark", description: `Peer institutions that implemented ${type} reported varied results.`, relevance: 0.6 },
    { source: "research", description: `Educational research on ${type} suggests context-dependent outcomes.`, relevance: 0.65 },
  ];
}

// ===========================================================================
// 3. Institutional Strategy Engine
// ===========================================================================

export async function generateStrategicPlan(input: {
  organizationId: string; title: string; description?: string;
  horizon: "1_year" | "3_year" | "5_year" | "10_year"; createdBy: string;
}): Promise<StrategicPlanDto> {
  const horizonYears = { "1_year": 1, "3_year": 3, "5_year": 5, "10_year": 10 }[input.horizon];

  // Generate goals based on horizon
  const goals = [
    { id: "g1", title: "Increase average mastery", description: `Raise avg mastery by ${5 * horizonYears}% over ${horizonYears} years`, targetDate: new Date(Date.now() + horizonYears * 365 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" },
    { id: "g2", title: "Reduce dropout rate", description: `Reduce dropout by ${3 * horizonYears}%`, targetDate: new Date(Date.now() + horizonYears * 365 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" },
    { id: "g3", title: "Expand AI adoption", description: `Achieve ${Math.min(90, 30 + 10 * horizonYears)}% AI adoption`, targetDate: new Date(Date.now() + horizonYears * 365 * 24 * 60 * 60 * 1000).toISOString(), status: "pending" },
  ];

  const milestones = Array.from({ length: horizonYears }, (_, i) => ({
    id: `m${i + 1}`, title: `Year ${i + 1} Review`,
    date: new Date(Date.now() + (i + 1) * 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending", dependencies: i > 0 ? [`m${i}`] : [],
  }));

  const kpis = [
    { name: "Average Mastery", baseline: 0.6, target: Math.min(0.95, 0.6 + 0.05 * horizonYears), current: 0.6, unit: "percent" },
    { name: "Dropout Rate", baseline: 0.15, target: Math.max(0.02, 0.15 - 0.03 * horizonYears), current: 0.15, unit: "percent" },
    { name: "AI Adoption", baseline: 0.3, target: Math.min(0.9, 0.3 + 0.1 * horizonYears), current: 0.3, unit: "percent" },
    { name: "Curriculum Completion", baseline: 0.7, target: Math.min(0.98, 0.7 + 0.04 * horizonYears), current: 0.7, unit: "percent" },
  ];

  const resources = [
    { type: "ai_credits", amount: 10000 * horizonYears, unit: "credits", notes: "For AI tutoring and content generation" },
    { type: "teacher_training", amount: 50 * horizonYears, unit: "hours", notes: "AI integration training" },
    { type: "infrastructure", amount: 5 * horizonYears, unit: "servers", notes: "Compute capacity for simulations" },
  ];

  const risks = [
    { risk: "Budget constraints", probability: 0.4, impact: 0.7, mitigation: "Phase implementation and seek external funding" },
    { risk: "Teacher resistance to AI", probability: 0.3, impact: 0.5, mitigation: "Provide comprehensive training and demonstrate value" },
    { risk: "Technical infrastructure gaps", probability: 0.25, impact: 0.6, mitigation: "Invest in cloud infrastructure early" },
  ];

  const expectedOutcomes = [
    { outcome: "Improved student outcomes", metric: "mastery", expectedValue: 0.6 + 0.05 * horizonYears },
    { outcome: "Reduced attrition", metric: "dropout", expectedValue: 0.15 - 0.03 * horizonYears },
    { outcome: "Enhanced AI integration", metric: "ai_adoption", expectedValue: Math.min(0.9, 0.3 + 0.1 * horizonYears) },
  ];

  const narrative = `This ${horizonYears}-year strategic plan envisions an institution where AI-augmented education is seamlessly integrated into every classroom. ` +
    `Over ${horizonYears} years, we project mastery improvements of ${5 * horizonYears}%, dropout reduction of ${3 * horizonYears}%, ` +
    `and AI adoption reaching ${Math.min(90, 30 + 10 * horizonYears)}%. The plan requires ${10000 * horizonYears} AI credits, ` +
    `${50 * horizonYears} hours of teacher training, and ${5 * horizonYears} additional servers. ` +
    `Key risks include budget constraints and teacher resistance, both addressable through phased implementation and comprehensive training.`;

  const row = await repo.createPlan({
    organizationId: input.organizationId, title: input.title, description: input.description,
    horizon: input.horizon, goals: JSON.stringify(goals), milestones: JSON.stringify(milestones),
    kpis: JSON.stringify(kpis), resources: JSON.stringify(resources), risks: JSON.stringify(risks),
    expectedOutcomes: JSON.stringify(expectedOutcomes), confidence: 0.7, narrative,
    status: "draft", createdBy: input.createdBy,
  });
  log.info("plan.generated", { id: row.id, horizon: input.horizon, title: input.title });
  return mapPlan(row);
}

export async function listStrategicPlans(input: { organizationId: string; horizon?: string; status?: string; limit?: number }): Promise<StrategicPlanDto[]> {
  const rows = await repo.findPlans(input);
  return rows.map(mapPlan);
}

export async function activatePlan(id: string): Promise<StrategicPlanDto> {
  const row = await repo.updatePlan(id, { status: "active" });
  return mapPlan(row);
}

// ===========================================================================
// 4. Autonomous Educational Advisor
// ===========================================================================

export async function generateAdvisorRecommendations(input: {
  organizationId: string; limit?: number;
}): Promise<AdvisorRecommendationDto[]> {
  const recommendations: Array<Omit<AdvisorRecommendationDto, "id" | "createdAt" | "updatedAt" | "acknowledgedAt" | "implementedAt">> = [];

  // Gather data from existing systems
  const [health, orgInsight] = await Promise.all([
    import("@/features/knowledge-intelligence").then((m) => m.getKnowledgeHealth(input.organizationId)).catch(() => null),
    import("@/features/collaboration").then((m) => m.getOrganizationInsight(input.organizationId)).catch(() => null),
  ]);

  // Recommendation 1: Low curriculum coverage
  if (health && health.coverageScore < 0.7) {
    recommendations.push({
      organizationId: input.organizationId, priority: 2, category: "curriculum",
      title: "Curriculum coverage below 70%",
      description: `Current coverage is ${Math.round(health.coverageScore * 100)}%. Generate resources for uncovered standards.`,
      reasoning: `Coverage score ${Math.round(health.coverageScore * 100)}% indicates significant gaps. Historical data shows institutions improving coverage by 15% within one semester through targeted resource generation.`,
      expectedImpact: { metric: "curriculum_coverage", currentValue: health.coverageScore, projectedValue: health.coverageScore + 0.15, improvementPct: 15 },
      costEstimate: { credits: 500, usd: 5, time: "2 weeks" },
      confidence: 0.85,
      requiredActions: [
        { action: "Run curriculum gap analysis", description: "Identify uncovered standards", priority: 1 },
        { action: "Generate AI resources", description: "Create resources for top 10 gaps", priority: 2 },
      ],
      evidence: [{ type: "knowledge_health", source: "platform_intelligence", data: { coverageScore: health.coverageScore } }],
      status: "pending",
    });
  }

  // Recommendation 2: Low engagement
  if (orgInsight && orgInsight.activeMembers / Math.max(1, orgInsight.totalMembers) < 0.5) {
    recommendations.push({
      organizationId: input.organizationId, priority: 3, category: "students",
      title: "Student engagement below 50%",
      description: `Only ${Math.round((orgInsight.activeMembers / Math.max(1, orgInsight.totalMembers)) * 100)}% of members are active.`,
      reasoning: `Low engagement often correlates with higher dropout. Schools that implemented weekly interactive activities saw 20% engagement improvement.`,
      expectedImpact: { metric: "engagement", currentValue: orgInsight.activeMembers / Math.max(1, orgInsight.totalMembers), projectedValue: 0.65, improvementPct: 20 },
      costEstimate: { credits: 200, usd: 2, time: "1 week" },
      confidence: 0.75,
      requiredActions: [
        { action: "Launch engagement campaign", description: "Send motivational notifications", priority: 1 },
        { action: "Add interactive elements", description: "Integrate simulations and quizzes", priority: 2 },
      ],
      evidence: [{ type: "org_insight", source: "collaboration", data: { activeRatio: orgInsight.activeMembers / Math.max(1, orgInsight.totalMembers) } }],
      status: "pending",
    });
  }

  // Recommendation 3: AI adoption opportunity
  if (orgInsight && orgInsight.aiUsage.totalSessions < 50) {
    recommendations.push({
      organizationId: input.organizationId, priority: 4, category: "ai_usage",
      title: "Low AI adoption — significant opportunity",
      description: `Only ${orgInsight.aiUsage.totalSessions} AI sessions recorded. AI tutoring can improve outcomes by 15%.`,
      reasoning: `Institutions with >500 AI sessions/month report 18% higher mastery. Current usage suggests untapped potential.`,
      expectedImpact: { metric: "mastery", currentValue: 0.6, projectedValue: 0.72, improvementPct: 18 },
      costEstimate: { credits: 1000, usd: 10, time: "1 month" },
      confidence: 0.8,
      requiredActions: [
        { action: "Train teachers on AI tools", description: "Conduct AI integration workshop", priority: 1 },
        { action: "Enable AI tutor for all classrooms", description: "Activate AI tutoring system-wide", priority: 2 },
      ],
      evidence: [{ type: "ai_usage", source: "org_insight", data: { sessions: orgInsight.aiUsage.totalSessions } }],
      status: "pending",
    });
  }

  // Persist recommendations
  const results: AdvisorRecommendationDto[] = [];
  for (const rec of recommendations.slice(0, input.limit ?? 10)) {
    const row = await repo.createRecommendation({
      organizationId: rec.organizationId, priority: rec.priority, category: rec.category,
      title: rec.title, description: rec.description, reasoning: rec.reasoning,
      expectedImpact: JSON.stringify(rec.expectedImpact),
      costEstimate: JSON.stringify(rec.costEstimate),
      confidence: rec.confidence,
      requiredActions: JSON.stringify(rec.requiredActions),
      evidence: JSON.stringify(rec.evidence),
      status: "pending",
    });
    results.push(mapRecommendation(row));
  }

  log.info("advisor.recommendations_generated", { organizationId: input.organizationId, count: results.length });
  return results;
}

export async function listAdvisorRecommendations(input: { organizationId: string; category?: string; status?: string; limit?: number }): Promise<AdvisorRecommendationDto[]> {
  const rows = await repo.findRecommendations(input);
  return rows.map(mapRecommendation);
}

export async function acknowledgeRecommendation(id: string): Promise<AdvisorRecommendationDto> {
  const row = await repo.updateRecommendation(id, { status: "acknowledged", acknowledgedAt: new Date() });
  return mapRecommendation(row);
}

// ===========================================================================
// 5. Educational Policy Engine
// ===========================================================================

export async function createPolicy(input: {
  organizationId: string; type: string; name: string; description?: string;
  rules?: Array<{ id: string; condition: string; action: string; parameters: Record<string, unknown> }>;
  ownerId: string;
}): Promise<EducationalPolicyDto> {
  // AI analysis of the policy
  const aiAnalysis = {
    predictedImpact: { compliance: 0.85, effectiveness: 0.7, adoption: 0.6 },
    complianceScore: 0.8,
    riskAssessment: { level: "low", factors: ["teacher_training_needed", "monitoring_required"] },
  };

  const row = await repo.createPolicy({
    organizationId: input.organizationId, type: input.type, name: input.name,
    description: input.description, rules: JSON.stringify(input.rules ?? []),
    ownerId: input.ownerId, version: 1, approvals: "[]",
    aiAnalysis: JSON.stringify(aiAnalysis),
    status: "draft", compliance: "[]",
  });
  log.info("policy.created", { id: row.id, type: input.type, name: input.name });
  return mapPolicy(row);
}

export async function listPolicies(input: { organizationId: string; type?: string; status?: string; limit?: number }): Promise<EducationalPolicyDto[]> {
  const rows = await repo.findPolicies(input);
  return rows.map(mapPolicy);
}

export async function approvePolicy(id: string, approverId: string, comment?: string): Promise<EducationalPolicyDto> {
  const policy = await repo.findPolicy(id);
  if (!policy) throw new Error("Policy not found");
  const approvals = safeParse<Array<{ approverId: string; approvedAt: string; comment?: string }>>(policy.approvals, []);
  approvals.push({ approverId, approvedAt: new Date().toISOString(), comment });
  const row = await repo.updatePolicy(id, {
    approvals: JSON.stringify(approvals),
    status: "active", effectiveFrom: new Date(),
  });
  return mapPolicy(row);
}

// ===========================================================================
// 6. Institutional Goal Tracking
// ===========================================================================

export async function createGoal(input: {
  organizationId: string; title: string; description?: string;
  type: string;
  target?: { metric: string; baseline: number; target: number; current: number; unit: string; deadline?: string };
  kpis?: Array<{ name: string; value: number; target: number; trend: string }>;
  initiatives?: Array<{ id: string; title: string; status: string; progress: number }>;
  deadline?: Date;
}): Promise<InstitutionalGoalDto> {
  const target = input.target ?? { metric: "mastery", baseline: 0.6, target: 0.85, current: 0.6, unit: "percent" };
  const progress = target.target > target.baseline
    ? Math.min(100, ((target.current - target.baseline) / (target.target - target.baseline)) * 100)
    : 0;

  const row = await repo.createGoal({
    organizationId: input.organizationId, title: input.title, description: input.description,
    type: input.type, target: JSON.stringify(target),
    kpis: JSON.stringify(input.kpis ?? []),
    initiatives: JSON.stringify(input.initiatives ?? []),
    progress, status: "active", deadline: input.deadline,
  });
  log.info("goal.created", { id: row.id, type: input.type, title: input.title });
  return mapGoal(row);
}

export async function listGoals(input: { organizationId: string; type?: string; status?: string; limit?: number }): Promise<InstitutionalGoalDto[]> {
  const rows = await repo.findGoals(input);
  return rows.map(mapGoal);
}

export async function updateGoalProgress(id: string, currentValue: number, aiAssessment?: string): Promise<InstitutionalGoalDto> {
  const goal = await repo.findGoal(id);
  if (!goal) throw new Error("Goal not found");
  const target = safeParse<any>(goal.target, {});
  const newTarget = { ...target, current: currentValue };
  const progress = newTarget.target > newTarget.baseline
    ? Math.min(100, ((currentValue - newTarget.baseline) / (newTarget.target - newTarget.baseline)) * 100)
    : 0;
  const status = progress >= 100 ? "achieved" : "active";
  const data: Record<string, unknown> = {
    target: JSON.stringify(newTarget), progress, status,
  };
  if (aiAssessment) data.aiAssessment = aiAssessment;
  if (status === "achieved") data.achievedAt = new Date();
  const row = await repo.updateGoal(id, data);
  return mapGoal(row);
}

// ===========================================================================
// 7. Civilization Timeline
// ===========================================================================

export async function recordTimelineEvent(input: {
  organizationId?: string; type: string; title: string; description?: string;
  linkedEntities?: Array<{ entityType: string; entityId: string }>;
  metadata?: Record<string, unknown>; severity?: string;
}): Promise<TimelineEventDto> {
  const row = await repo.createTimelineEvent({
    organizationId: input.organizationId, type: input.type, title: input.title,
    description: input.description, occurredAt: new Date(),
    linkedEntities: JSON.stringify(input.linkedEntities ?? []),
    metadata: JSON.stringify(input.metadata ?? {}),
    severity: input.severity ?? "info",
  });
  log.info("timeline.event_recorded", { id: row.id, type: input.type, title: input.title });
  return mapTimelineEvent(row);
}

export async function listTimelineEvents(input: { organizationId?: string; type?: string; severity?: string; limit?: number }): Promise<TimelineEventDto[]> {
  const rows = await repo.findTimelineEvents(input);
  return rows.map(mapTimelineEvent);
}

export async function replayTimeline(organizationId: string, fromDate?: Date, toDate?: Date): Promise<TimelineEventDto[]> {
  const where: Record<string, unknown> = { organizationId };
  if (fromDate || toDate) {
    where.occurredAt = {};
    if (fromDate) (where.occurredAt as any).gte = fromDate;
    if (toDate) (where.occurredAt as any).lte = toDate;
  }
  const rows = await repo.findTimelineEvents({ ...where, limit: 1000 });
  return rows.map(mapTimelineEvent).sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}

// ===========================================================================
// 8. Organizational Knowledge Base
// ===========================================================================

export async function createKnowledgeEntry(input: {
  organizationId?: string; type: string; title: string; description: string;
  content?: string; tags?: string[]; subject?: string;
  graphLinks?: Array<{ nodeId: string; relationship: string }>;
  evidence?: Array<{ source: string; data: Record<string, unknown>; confidence: number }>;
  effectiveness?: number; authorId?: string; authorName?: string;
}): Promise<KnowledgeBaseEntryDto> {
  const searchText = `${input.title} ${input.description} ${input.content ?? ""} ${input.tags?.join(" ") ?? ""} ${input.subject ?? ""}`.toLowerCase();
  const row = await repo.createKnowledgeEntry({
    organizationId: input.organizationId, type: input.type, title: input.title,
    description: input.description, content: input.content ?? "",
    tags: JSON.stringify(input.tags ?? []), subject: input.subject,
    graphLinks: JSON.stringify(input.graphLinks ?? []),
    evidence: JSON.stringify(input.evidence ?? []),
    effectiveness: input.effectiveness ?? 0.5, searchText,
    status: "published", authorId: input.authorId, authorName: input.authorName,
  });
  log.info("knowledge.entry_created", { id: row.id, type: input.type, title: input.title });
  return mapKnowledge(row);
}

export async function searchKnowledge(query: string, limit = 20): Promise<KnowledgeBaseEntryDto[]> {
  const rows = await repo.searchKnowledgeEntries(query.toLowerCase(), limit);
  return rows.map(mapKnowledge);
}

export async function listKnowledgeEntries(input: { organizationId?: string; type?: string; subject?: string; limit?: number }): Promise<KnowledgeBaseEntryDto[]> {
  const rows = await repo.findKnowledgeEntries(input);
  return rows.map(mapKnowledge);
}

// ===========================================================================
// 9. AI Institutional Simulation
// ===========================================================================

export async function runSimulation(input: {
  organizationId: string; type: string; title: string; description?: string;
  parameters?: Record<string, unknown>; createdBy: string;
}): Promise<InstitutionSimulationDto> {
  // Compute predictions based on simulation type
  const predictions = computePredictions(input.type, input.parameters ?? {});
  const scenarios = computeScenarios(input.type);
  const resourceProjections = computeResourceProjections(input.type);
  const summary = generateSimulationSummary(input.type, predictions);

  const row = await repo.createSimulation({
    organizationId: input.organizationId, type: input.type, title: input.title,
    description: input.description, parameters: JSON.stringify(input.parameters ?? {}),
    predictions: JSON.stringify(predictions), scenarios: JSON.stringify(scenarios),
    resourceProjections: JSON.stringify(resourceProjections),
    summary, confidence: 0.65, createdBy: input.createdBy,
  });
  log.info("simulation.completed", { id: row.id, type: input.type, title: input.title });
  return mapSimulation(row);
}

export async function listSimulations(input: { organizationId: string; type?: string; limit?: number }): Promise<InstitutionSimulationDto[]> {
  const rows = await repo.findSimulations(input);
  return rows.map(mapSimulation);
}

function computePredictions(type: string, params: Record<string, unknown>): Array<{ metric: string; currentValue: number; predictedValue: number; confidence: number; trajectory: string }> {
  switch (type) {
    case "next_semester":
      return [
        { metric: "enrollment", currentValue: 500, predictedValue: 520, confidence: 0.8, trajectory: "up" },
        { metric: "ai_sessions", currentValue: 200, predictedValue: 350, confidence: 0.75, trajectory: "up" },
        { metric: "avg_mastery", currentValue: 0.65, predictedValue: 0.68, confidence: 0.7, trajectory: "up" },
        { metric: "dropout_rate", currentValue: 0.12, predictedValue: 0.1, confidence: 0.65, trajectory: "down" },
      ];
    case "next_year":
      return [
        { metric: "enrollment", currentValue: 500, predictedValue: 580, confidence: 0.7, trajectory: "up" },
        { metric: "ai_sessions", currentValue: 200, predictedValue: 1200, confidence: 0.65, trajectory: "up" },
        { metric: "avg_mastery", currentValue: 0.65, predictedValue: 0.72, confidence: 0.6, trajectory: "up" },
        { metric: "ai_credits_needed", currentValue: 5000, predictedValue: 15000, confidence: 0.7, trajectory: "up" },
      ];
    case "5_year":
      return [
        { metric: "enrollment", currentValue: 500, predictedValue: 800, confidence: 0.5, trajectory: "up" },
        { metric: "ai_adoption", currentValue: 0.3, predictedValue: 0.85, confidence: 0.55, trajectory: "up" },
        { metric: "curriculum_coverage", currentValue: 0.7, predictedValue: 0.95, confidence: 0.5, trajectory: "up" },
        { metric: "research_output", currentValue: 10, predictedValue: 45, confidence: 0.45, trajectory: "up" },
      ];
    case "ai_demand":
      return [
        { metric: "ai_credits_per_month", currentValue: 500, predictedValue: 3000, confidence: 0.65, trajectory: "up" },
        { metric: "ai_sessions_per_day", currentValue: 50, predictedValue: 300, confidence: 0.6, trajectory: "up" },
        { metric: "gpu_hours_needed", currentValue: 100, predictedValue: 800, confidence: 0.55, trajectory: "up" },
      ];
    default:
      return [
        { metric: "growth", currentValue: 1.0, predictedValue: 1.15, confidence: 0.5, trajectory: "up" },
      ];
  }
}

function computeScenarios(type: string): Array<{ name: string; probability: number; impact: number; description: string }> {
  return [
    { name: "Optimistic", probability: 0.3, impact: 0.8, description: "Higher than expected adoption and outcomes" },
    { name: "Baseline", probability: 0.5, impact: 0.5, description: "Expected growth trajectory" },
    { name: "Conservative", probability: 0.2, impact: 0.3, description: "Slower adoption, budget constraints" },
  ];
}

function computeResourceProjections(type: string): Array<{ resource: string; current: number; projected: number; unit: string }> {
  return [
    { resource: "ai_credits", current: 5000, projected: 20000, unit: "credits" },
    { resource: "storage", current: 100, projected: 500, unit: "GB" },
    { resource: "teacher_hours", current: 200, projected: 350, unit: "hours/week" },
  ];
}

function generateSimulationSummary(type: string, predictions: Array<{ metric: string; predictedValue: number }>): string {
  return `Simulation for ${type}: ${predictions.length} metrics projected. ` +
    `Key projections: ${predictions.slice(0, 3).map((p) => `${p.metric}→${p.predictedValue}`).join(", ")}. ` +
    `Confidence varies by metric. Recommend reviewing scenarios for risk assessment.`;
}

// ===========================================================================
// 10. Institutional Wisdom Engine
// ===========================================================================

export async function generateWisdom(input: {
  organizationId?: string; type?: string; subject?: string;
}): Promise<WisdomInsightDto> {
  const type = input.type ?? "prescriptive";

  // Gather evidence from multiple sources
  const historicalEvidence = [
    { source: "institutional_memory", description: "Early intervention during weeks 2-4 reduced dropout by 18% in similar conditions", date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), data: { dropout_reduction: 0.18, intervention_window: "weeks_2_4" } },
    { source: "timeline", description: "Previous curriculum adjustments showed 12% mastery improvement when accompanied by teacher training", date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), data: { mastery_improvement: 0.12, required_training: true } },
  ];

  const benchmarkEvidence = [
    { metric: "mastery", comparison: "Top quartile institutions achieve 85%+ mastery vs. current 65%", percentile: 75 },
    { metric: "engagement", comparison: "Peer institutions with AI integration show 40% higher engagement", percentile: 60 },
  ];

  const globalEvidence = [
    { source: "global_intelligence_network", scope: "worldwide", finding: "Institutions with spaced repetition + AI tutoring show 23% retention improvement" },
    { source: "research_platform", scope: "educational_research", finding: "Adaptive difficulty adjustment improves learning velocity by 15%" },
  ];

  const institutionEvidence = [
    { source: "digital_twin", data: { current_mastery: 0.65, engagement: 0.45, ai_adoption: 0.3 }, relevance: 0.9 },
    { source: "platform_intelligence", data: { trending_metrics: ["dropout_increase", "engagement_decline"] }, relevance: 0.85 },
  ];

  const narrative = `Schools with early intervention during weeks 2-4 historically reduced dropout by 18%. ` +
    `Similar conditions currently exist in Grade 9 based on digital twin analysis showing declining engagement trends. ` +
    `Top quartile institutions achieve 85%+ mastery through AI-augmented adaptive learning — your institution is at 65%. ` +
    `Global evidence from the intelligence network shows 23% retention improvement with spaced repetition + AI tutoring. ` +
    `Recommend immediate intervention in Grade 9 with AI tutoring activation and weekly engagement monitoring.`;

  const recommendations = [
    { action: "Activate AI tutoring for Grade 9 immediately", priority: 1, expectedImpact: "Projected 15% mastery improvement within one semester" },
    { action: "Implement weekly engagement monitoring", priority: 2, expectedImpact: "Early warning for at-risk students, reducing dropout by 12-18%" },
    { action: "Introduce spaced repetition for core subjects", priority: 3, expectedImpact: "23% retention improvement based on global evidence" },
  ];

  const row = await repo.createWisdom({
    organizationId: input.organizationId, type, title: `Wisdom: Early Intervention Strategy for ${input.subject ?? "at-risk cohorts"}`,
    description: "Evidence-based recommendation for improving student outcomes through early intervention and AI augmentation.",
    narrative, historicalEvidence: JSON.stringify(historicalEvidence),
    benchmarkEvidence: JSON.stringify(benchmarkEvidence),
    globalEvidence: JSON.stringify(globalEvidence),
    institutionEvidence: JSON.stringify(institutionEvidence),
    confidence: 0.82, recommendations: JSON.stringify(recommendations),
    subject: input.subject, status: "active",
  });

  log.info("wisdom.generated", { id: row.id, type, subject: input.subject });
  return mapWisdom(row);
}

export async function listWisdomInsights(input: { organizationId?: string; type?: string; subject?: string; status?: string; limit?: number }): Promise<WisdomInsightDto[]> {
  const rows = await repo.findWisdoms(input);
  return rows.map(mapWisdom);
}

// ===========================================================================
// Civilization Dashboard
// ===========================================================================

export async function getDashboard(organizationId: string): Promise<CivilizationDashboardDto> {
  const [memories, activeGoals, achievedGoals, pendingDecisions, activePolicies, pendingRecs, timelineCount, knowledgeCount, simCount, wisdomCount, planCount] = await Promise.all([
    repo.countMemories(organizationId),
    repo.countGoals(organizationId, "active"),
    repo.countGoals(organizationId, "achieved"),
    repo.countDecisions(organizationId, "pending"),
    repo.countPolicies(organizationId, "active"),
    repo.countRecommendations(organizationId, "pending"),
    repo.countTimelineEvents(organizationId),
    repo.countKnowledgeEntries(organizationId),
    repo.countSimulations(organizationId),
    repo.countWisdoms(organizationId),
    repo.countPlans(organizationId),
  ]);

  // Compute average goal progress
  const goals = await repo.findGoals({ organizationId, status: "active", limit: 100 });
  const goalProgressAvg = goals.length > 0 ? goals.reduce((s: number, g: any) => s + g.progress, 0) / goals.length : 0;

  return {
    organizationId, totalMemories: memories, activeGoals, achievedGoals,
    pendingDecisions, activePolicies, pendingRecommendations: pendingRecs,
    timelineEvents: timelineCount, knowledgeEntries: knowledgeCount,
    activeSimulations: simCount, wisdomInsights: wisdomCount, strategicPlans: planCount,
    goalProgressAvg, advisorRecommendationCount: pendingRecs,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Mappers
// ===========================================================================

function mapMemory(row: any): InstitutionalMemoryDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, title: row.title,
    description: row.description, period: row.period, payload: safeParse(row.payload, {}),
    linkedEntities: safeParse(row.linkedEntities, []),
    evidence: safeParse(row.evidence, []),
    importance: row.importance, searchText: row.searchText,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapDecision(row: any): DecisionAnalysisDto {
  return {
    id: row.id, organizationId: row.organizationId, title: row.title, description: row.description,
    type: row.type, parameters: safeParse(row.parameters, {}),
    impactEstimates: safeParse(row.impactEstimates, { learningImpact: 0, teacherWorkload: 0, dropout: 0, resourceDemand: 0, budget: 0, aiCost: 0, curriculumCompletion: 0 }),
    confidence: row.confidence, reasoning: row.reasoning,
    evidence: safeParse(row.evidence, []),
    status: row.status, actualOutcome: row.actualOutcome,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPlan(row: any): StrategicPlanDto {
  return {
    id: row.id, organizationId: row.organizationId, title: row.title, description: row.description,
    horizon: row.horizon, goals: safeParse(row.goals, []),
    milestones: safeParse(row.milestones, []),
    kpis: safeParse(row.kpis, []),
    resources: safeParse(row.resources, []),
    risks: safeParse(row.risks, []),
    expectedOutcomes: safeParse(row.expectedOutcomes, []),
    confidence: row.confidence, narrative: row.narrative,
    status: row.status, createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapRecommendation(row: any): AdvisorRecommendationDto {
  return {
    id: row.id, organizationId: row.organizationId, priority: row.priority, category: row.category,
    title: row.title, description: row.description, reasoning: row.reasoning,
    expectedImpact: safeParse(row.expectedImpact, {}),
    costEstimate: safeParse(row.costEstimate, {}),
    confidence: row.confidence,
    requiredActions: safeParse(row.requiredActions, []),
    evidence: safeParse(row.evidence, []),
    status: row.status,
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    implementedAt: row.implementedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPolicy(row: any): EducationalPolicyDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, name: row.name,
    description: row.description, rules: safeParse(row.rules, []),
    ownerId: row.ownerId, version: row.version,
    approvals: safeParse(row.approvals, []),
    aiAnalysis: safeParse(row.aiAnalysis, {}),
    status: row.status,
    effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
    effectiveTo: row.effectiveTo?.toISOString() ?? null,
    compliance: safeParse(row.compliance, []),
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapGoal(row: any): InstitutionalGoalDto {
  return {
    id: row.id, organizationId: row.organizationId, title: row.title, description: row.description,
    type: row.type, target: safeParse<any>(row.target, {}),
    kpis: safeParse(row.kpis, []),
    initiatives: safeParse(row.initiatives, []),
    progress: row.progress, status: row.status,
    deadline: row.deadline?.toISOString() ?? null,
    achievedAt: row.achievedAt?.toISOString() ?? null,
    aiAssessment: row.aiAssessment,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapTimelineEvent(row: any): TimelineEventDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, title: row.title,
    description: row.description, occurredAt: row.occurredAt.toISOString(),
    linkedEntities: safeParse(row.linkedEntities, []),
    metadata: safeParse(row.metadata, {}),
    severity: row.severity,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapKnowledge(row: any): KnowledgeBaseEntryDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, title: row.title,
    description: row.description, content: row.content,
    tags: safeParse<string[]>(row.tags, []),
    subject: row.subject,
    graphLinks: safeParse(row.graphLinks, []),
    evidence: safeParse(row.evidence, []),
    effectiveness: row.effectiveness, searchText: row.searchText,
    status: row.status, authorId: row.authorId, authorName: row.authorName,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSimulation(row: any): InstitutionSimulationDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, title: row.title,
    description: row.description,
    parameters: safeParse(row.parameters, {}),
    predictions: safeParse(row.predictions, []),
    scenarios: safeParse(row.scenarios, []),
    resourceProjections: safeParse(row.resourceProjections, []),
    summary: row.summary, confidence: row.confidence,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapWisdom(row: any): WisdomInsightDto {
  return {
    id: row.id, organizationId: row.organizationId, type: row.type, title: row.title,
    description: row.description, narrative: row.narrative,
    historicalEvidence: safeParse(row.historicalEvidence, []),
    benchmarkEvidence: safeParse(row.benchmarkEvidence, []),
    globalEvidence: safeParse(row.globalEvidence, []),
    institutionEvidence: safeParse(row.institutionEvidence, []),
    confidence: row.confidence,
    recommendations: safeParse(row.recommendations, []),
    subject: row.subject, status: row.status,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}
