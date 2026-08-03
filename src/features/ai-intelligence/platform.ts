/** Systems 13-24: Policy, Guardrails, Human Review, Feedback, Analytics, Cost, Governance, Dashboard, Developer, Admin, Docs. */
import { randomUUID } from "node:crypto";
import type {
  AIPolicy, PolicyEnforcement,
  GuardrailRule, GuardrailSeverity, GuardrailAction, GuardrailTrigger,
  ReviewItem, ReviewStatus,
  AIFeedback, FeedbackType,
  AIAnalytics, CostRecord, CostSummary,
  AIGovernanceRecord, GovernanceStatus,
  AIDashboard, AIIntelligenceEventType,
  AIDeveloperIntegration, AIAdminStatus, AIDocumentation,
} from "./types";
import {
  storePolicy, getPolicy, getAllPolicies,
  storeGuardrailRule, getGuardrailRule, getAllGuardrailRules, appendGuardrailTrigger, getAllGuardrailTriggers,
  storeReviewItem, getReviewItem, getAllReviewItems,
  appendFeedback, getAllFeedback,
  appendCostRecord, getAllCostRecords,
  storeGovernance, getGovernance, getAllGovernance,
  getAllModels, getAllInferences, getAllRecommendations, getAllExperiments,
} from "./repository";
import { publishAIEvent } from "./event-bus-bridge";

// System 13 — AI Policy Engine
export function createPolicy(input: { key: string; name: string; enforcement: PolicyEnforcement; conditions?: Record<string, unknown>; active?: boolean }): AIPolicy {
  const now = new Date().toISOString();
  const p: AIPolicy = { id: randomUUID(), key: input.key, name: input.name, enforcement: input.enforcement, conditions: input.conditions ?? {}, active: input.active ?? true, createdAt: now, updatedAt: now };
  storePolicy(p);
  return p;
}
export function getPolicyById(id: string) { return getPolicy(id); }
export function listPolicies(active?: boolean) { const all = getAllPolicies(); return active === undefined ? all : all.filter(p => p.active === active); }
export function supportsAllPolicyEnforcements(): PolicyEnforcement[] { return ["allow", "deny", "review", "log"]; }

// System 14 — Safety Guardrails
export function createGuardrailRule(input: { key: string; name: string; severity: GuardrailSeverity; action: GuardrailAction; pattern: string; active?: boolean }): GuardrailRule {
  const now = new Date().toISOString();
  const r: GuardrailRule = { id: randomUUID(), key: input.key, name: input.name, severity: input.severity, action: input.action, pattern: input.pattern, active: input.active ?? true, createdAt: now, updatedAt: now };
  storeGuardrailRule(r);
  return r;
}
export function getGuardrailRuleById(id: string) { return getGuardrailRule(id); }
export function listGuardrailRules(active?: boolean) { const all = getAllGuardrailRules(); return active === undefined ? all : all.filter(r => r.active === active); }
export function triggerGuardrail(input: { ruleId: string; inferenceId?: string | null; content: string; matchedPattern: string }): GuardrailTrigger {
  const rule = getGuardrailRule(input.ruleId); if (!rule) throw new Error(`Guardrail rule not found: ${input.ruleId}`);
  const t: GuardrailTrigger = { id: randomUUID(), ruleId: input.ruleId, inferenceId: input.inferenceId ?? null, content: input.content, matchedPattern: input.matchedPattern, action: rule.action, triggeredAt: new Date().toISOString(), correlationId: randomUUID() };
  appendGuardrailTrigger(t);
  publishAIEvent("GuardrailTriggered", null, { triggerId: t.id, ruleId: input.ruleId, action: t.action, correlationId: t.correlationId });
  return t;
}
export function listGuardrailTriggers() { return getAllGuardrailTriggers(); }
export function supportsAllGuardrailSeverities(): GuardrailSeverity[] { return ["low", "medium", "high", "critical"]; }
export function supportsAllGuardrailActions(): GuardrailAction[] { return ["warn", "block", "flag", "log"]; }

// System 15 — Human Review Queue
export function createReviewItem(input: { inferenceId?: string | null; type: string; content: string; metadata?: Record<string, unknown> }): ReviewItem {
  const r: ReviewItem = { id: randomUUID(), inferenceId: input.inferenceId ?? null, type: input.type, content: input.content, status: "pending", reviewerId: null, reviewedAt: null, reason: null, createdAt: new Date().toISOString(), metadata: input.metadata ?? {} };
  storeReviewItem(r);
  return r;
}
export function getReviewItemById(id: string) { return getReviewItem(id); }
export function listReviewItems(status?: ReviewStatus) { const all = getAllReviewItems(); return status ? all.filter(r => r.status === status) : all; }
export function approveReviewItem(id: string, reviewerId: string, reason?: string) { const r = getReviewItem(id); if (!r || r.status !== "pending") return null; r.status = "approved"; r.reviewerId = reviewerId; r.reviewedAt = new Date().toISOString(); r.reason = reason ?? null; storeReviewItem(r); return r; }
export function rejectReviewItem(id: string, reviewerId: string, reason: string) { const r = getReviewItem(id); if (!r || r.status !== "pending") return null; r.status = "rejected"; r.reviewerId = reviewerId; r.reviewedAt = new Date().toISOString(); r.reason = reason; storeReviewItem(r); return r; }
export function supportsAllReviewStatuses(): ReviewStatus[] { return ["pending", "approved", "rejected", "escalated"]; }

// System 16 — Feedback Registry
export function recordFeedback(input: { userId: string; inferenceId?: string | null; recommendationId?: string | null; type: FeedbackType; value: unknown; comment?: string | null }): AIFeedback {
  const f: AIFeedback = { id: randomUUID(), userId: input.userId, inferenceId: input.inferenceId ?? null, recommendationId: input.recommendationId ?? null, type: input.type, value: input.value, comment: input.comment ?? null, createdAt: new Date().toISOString(), correlationId: randomUUID() };
  appendFeedback(f);
  publishAIEvent("FeedbackRecorded", input.userId, { feedbackId: f.id, type: f.type, correlationId: f.correlationId });
  return f;
}
export function listFeedback(userId?: string) { const all = getAllFeedback(); return userId ? all.filter(f => f.userId === userId) : all; }
export function supportsAllFeedbackTypes(): FeedbackType[] { return ["thumbs_up", "thumbs_down", "rating", "text", "correction"]; }

// System 17 — AI Analytics
export function generateAIAnalytics(): AIAnalytics {
  const inferences = getAllInferences();
  const completedInf = inferences.filter(i => i.status === "completed");
  const recs = getAllRecommendations();
  const experiments = getAllExperiments();
  const triggers = getAllGuardrailTriggers();
  const models = getAllModels();
  return {
    inferences: { total: inferences.length, completed: completedInf.length, failed: inferences.filter(i => i.status === "failed").length, avgLatencyMs: completedInf.length > 0 ? completedInf.reduce((s, i) => s + (i.latencyMs ?? 0), 0) / completedInf.length : 0 },
    recommendations: { total: recs.length, served: recs.filter(r => r.status === "served" || r.status === "clicked").length, clicked: recs.filter(r => r.status === "clicked").length, clickRate: recs.length > 0 ? recs.filter(r => r.status === "clicked").length / recs.length : 0 },
    experiments: { total: experiments.length, running: experiments.filter(e => e.status === "running").length, completed: experiments.filter(e => e.status === "completed").length },
    guardrails: { totalTriggers: triggers.length, blocked: triggers.filter(t => t.action === "block").length, flagged: triggers.filter(t => t.action === "flag").length },
    models: { total: models.length, active: models.filter(m => m.status === "active").length },
    updatedAt: new Date().toISOString(),
  };
}

// System 18 — AI Cost Tracking
export function recordCost(input: { modelKey: string; inferenceId?: string | null; inputTokens: number; outputTokens: number; costUsd: number; currency?: string }): CostRecord {
  const c: CostRecord = { id: randomUUID(), modelKey: input.modelKey, inferenceId: input.inferenceId ?? null, inputTokens: input.inputTokens, outputTokens: input.outputTokens, costUsd: input.costUsd, currency: input.currency ?? "USD", recordedAt: new Date().toISOString(), correlationId: randomUUID() };
  appendCostRecord(c);
  return c;
}
export function generateCostSummary(period: string = "all"): CostSummary {
  const records = getAllCostRecords();
  const byModel: Record<string, number> = {};
  let totalCost = 0;
  for (const r of records) { byModel[r.modelKey] = (byModel[r.modelKey] ?? 0) + r.costUsd; totalCost += r.costUsd; }
  return { totalCostUsd: totalCost, byModel, totalInferences: records.length, avgCostPerInference: records.length > 0 ? totalCost / records.length : 0, period };
}
export function listCostRecords() { return getAllCostRecords(); }

// System 19 — AI Governance
export function createGovernance(input: { modelKey: string; purpose: string; riskLevel: "low" | "medium" | "high" | "critical"; complianceTags?: string[] }): AIGovernanceRecord {
  const now = new Date().toISOString();
  const g: AIGovernanceRecord = { id: randomUUID(), modelKey: input.modelKey, purpose: input.purpose, riskLevel: input.riskLevel, status: "pending", approvedBy: null, approvedAt: null, complianceTags: input.complianceTags ?? [], createdAt: now, updatedAt: now };
  storeGovernance(g);
  return g;
}
export function getGovernanceById(id: string) { return getGovernance(id); }
export function listGovernance(status?: GovernanceStatus) { const all = getAllGovernance(); return status ? all.filter(g => g.status === status) : all; }
export function approveGovernance(id: string, approverId: string) { const g = getGovernance(id); if (!g || g.status !== "pending") return null; g.status = "approved"; g.approvedBy = approverId; g.approvedAt = new Date().toISOString(); g.updatedAt = g.approvedAt; storeGovernance(g); return g; }
export function rejectGovernance(id: string, reviewerId: string) { const g = getGovernance(id); if (!g || g.status !== "pending") return null; g.status = "rejected"; g.approvedBy = reviewerId; g.updatedAt = new Date().toISOString(); storeGovernance(g); return g; }
export function supportsAllGovernanceStatuses(): GovernanceStatus[] { return ["pending", "approved", "rejected", "review"]; }

// System 20 — AI Dashboard
export function generateAIDashboard(): AIDashboard {
  const models = getAllModels(); const inferences = getAllInferences(); const recs = getAllRecommendations();
  const experiments = getAllExperiments(); const triggers = getAllGuardrailTriggers();
  const costs = getAllCostRecords();
  const day = 24 * 3600 * 1000; const now = Date.now();
  const completedInf = inferences.filter(i => i.status === "completed");
  return {
    models: { total: models.length, active: models.filter(m => m.status === "active").length, deprecated: models.filter(m => m.status === "deprecated").length },
    inferences: { total24h: inferences.filter(i => now - new Date(i.requestedAt).getTime() < day).length, avgLatencyMs: completedInf.length > 0 ? completedInf.reduce((s, i) => s + (i.latencyMs ?? 0), 0) / completedInf.length : 0, failureRate: inferences.length > 0 ? inferences.filter(i => i.status === "failed").length / inferences.length : 0 },
    recommendations: { total24h: recs.filter(r => now - new Date(r.generatedAt).getTime() < day).length, clickRate: recs.length > 0 ? recs.filter(r => r.status === "clicked").length / recs.length : 0 },
    experiments: { running: experiments.filter(e => e.status === "running").length, completed24h: experiments.filter(e => e.status === "completed" && e.endedAt && now - new Date(e.endedAt).getTime() < day).length },
    guardrails: { triggers24h: triggers.filter(t => now - new Date(t.triggeredAt).getTime() < day).length, blocked24h: triggers.filter(t => t.action === "block" && now - new Date(t.triggeredAt).getTime() < day).length },
    cost: { total24h: costs.filter(c => now - new Date(c.recordedAt).getTime() < day).reduce((s, c) => s + c.costUsd, 0), currency: "USD" },
    governance: { pending: getAllGovernance().filter(g => g.status === "pending").length, approved: getAllGovernance().filter(g => g.status === "approved").length },
    updatedAt: new Date().toISOString(),
  };
}

// System 22 — Developer Integration
export function getDeveloperIntegration(): AIDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/ai-intelligence/models", method: "GET", description: "List models", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/models", method: "POST", description: "Register model", authRequired: true, scope: "admin" },
      { path: "/api/ai-intelligence/prompts", method: "GET", description: "List prompts", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/prompts", method: "POST", description: "Create prompt", authRequired: true, scope: "admin" },
      { path: "/api/ai-intelligence/recommendations", method: "GET", description: "List recommendations", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/recommendations", method: "POST", description: "Generate recommendation", authRequired: true, scope: "system" },
      { path: "/api/ai-intelligence/personalization", method: "GET", description: "Get personalization", authRequired: true, scope: "user" },
      { path: "/api/ai-intelligence/personalization", method: "POST", description: "Create personalization", authRequired: true, scope: "user" },
      { path: "/api/ai-intelligence/experiments", method: "GET", description: "List experiments", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/experiments", method: "POST", description: "Create experiment", authRequired: true, scope: "admin" },
      { path: "/api/ai-intelligence/evaluations", method: "GET", description: "List evaluations", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/inference", method: "POST", description: "Create inference", authRequired: true, scope: "system" },
      { path: "/api/ai-intelligence/feedback", method: "POST", description: "Record feedback", authRequired: true, scope: "user" },
      { path: "/api/ai-intelligence/guardrails", method: "GET", description: "List guardrails", authRequired: true, scope: "read" },
      { path: "/api/ai-intelligence/analytics", method: "GET", description: "AI analytics", authRequired: true, scope: "admin" },
      { path: "/api/ai-intelligence/dashboard", method: "GET", description: "Dashboard", authRequired: true, scope: "admin" },
      { path: "/api/ai-intelligence/developer", method: "GET", description: "Developer integration", authRequired: false, scope: "read" },
      { path: "/api/ai-intelligence/status", method: "GET", description: "Status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_recommendation_generated", name: "On Recommendation Generated", triggerEvent: "RecommendationGenerated", description: "Triggered when a recommendation is generated" },
      { id: "hook_inference_completed", name: "On Inference Completed", triggerEvent: "InferenceCompleted", description: "Triggered when inference completes" },
      { id: "hook_inference_failed", name: "On Inference Failed", triggerEvent: "InferenceFailed", description: "Triggered when inference fails" },
      { id: "hook_model_registered", name: "On Model Registered", triggerEvent: "ModelRegistered", description: "Triggered when a model is registered" },
      { id: "hook_prompt_published", name: "On Prompt Published", triggerEvent: "PromptPublished", description: "Triggered when a prompt version is published" },
      { id: "hook_guardrail_triggered", name: "On Guardrail Triggered", triggerEvent: "GuardrailTriggered", description: "Triggered when a safety guardrail fires" },
      { id: "hook_feedback_recorded", name: "On Feedback Recorded", triggerEvent: "FeedbackRecorded", description: "Triggered when feedback is recorded" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/ai-intelligence", capabilities: ["models", "prompts", "embeddings", "features", "recommendations", "personalization", "ranking", "context", "experiments", "evaluations", "versioning", "inference", "policies", "guardrails", "review", "feedback", "analytics", "cost", "governance", "dashboard"] },
    webhooks: [
      { id: "wh_recommendation_generated", event: "RecommendationGenerated", description: "Fired when a recommendation is generated" },
      { id: "wh_inference_completed", event: "InferenceCompleted", description: "Fired when inference completes" },
      { id: "wh_inference_failed", event: "InferenceFailed", description: "Fired when inference fails" },
      { id: "wh_guardrail_triggered", event: "GuardrailTriggered", description: "Fired when a guardrail is triggered" },
    ],
  };
}

// System 23 — Administration API
export function getAIStatus(): AIAdminStatus { return { operational: true, systems: 24, bridgeSubscribed: false, updatedAt: new Date().toISOString() }; }

// System 24 — Documentation Generator
const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "AI Model Registry", description: "Register AI models with versioning and capabilities.", endpoints: ["/api/ai-intelligence/models"], events: ["ModelRegistered"] },
  { id: 2, name: "Prompt Registry", description: "Prompt templates with variables and model binding.", endpoints: ["/api/ai-intelligence/prompts"], events: [] },
  { id: 3, name: "Embedding Registry", description: "Metadata only. Dimensions, max tokens, provider.", endpoints: ["/api/ai-intelligence/embeddings"], events: [] },
  { id: 4, name: "Feature Store Metadata", description: "Feature definitions and vectors.", endpoints: ["/api/ai-intelligence/features"], events: [] },
  { id: 5, name: "Recommendation Engine", description: "Advisory recommendations with scoring and lifecycle.", endpoints: ["/api/ai-intelligence/recommendations"], events: ["RecommendationGenerated"] },
  { id: 6, name: "Personalization Engine", description: "User profiles, preferences, opt-out.", endpoints: ["/api/ai-intelligence/personalization"], events: ["PersonalizationUpdated"] },
  { id: 7, name: "Ranking Profiles", description: "Deterministic ranking strategies with weights.", endpoints: ["/api/ai-intelligence/ranking"], events: [] },
  { id: 8, name: "Context Builder", description: "Build AI context from features, recommendations, and prompts.", endpoints: ["/api/ai-intelligence/context"], events: [] },
  { id: 9, name: "AI Experiment Platform", description: "A/B testing, hypothesis tracking, metrics.", endpoints: ["/api/ai-intelligence/experiments"], events: ["ExperimentCompleted"] },
  { id: 10, name: "Model Evaluation", description: "Evaluation results, metrics, datasets.", endpoints: ["/api/ai-intelligence/evaluations"], events: ["ModelEvaluationCompleted"] },
  { id: 11, name: "Prompt Versioning", description: "Multiple versions with active flag and change log.", endpoints: ["/api/ai-intelligence/prompts/versions"], events: ["PromptPublished"] },
  { id: 12, name: "Inference Routing", description: "Inference requests with latency and cost tracking.", endpoints: ["/api/ai-intelligence/inference"], events: ["InferenceCompleted", "InferenceFailed"] },
  { id: 13, name: "AI Policy Engine", description: "Allow/deny/review/log policies.", endpoints: ["/api/ai-intelligence/policies"], events: [] },
  { id: 14, name: "Safety Guardrails", description: "Pattern-based content filtering.", endpoints: ["/api/ai-intelligence/guardrails"], events: ["GuardrailTriggered"] },
  { id: 15, name: "Human Review Queue", description: "Pending review items for flagged content.", endpoints: ["/api/ai-intelligence/review"], events: [] },
  { id: 16, name: "Feedback Registry", description: "User feedback on inferences and recommendations.", endpoints: ["/api/ai-intelligence/feedback"], events: ["FeedbackRecorded"] },
  { id: 17, name: "AI Analytics", description: "Inference, recommendation, experiment, guardrail metrics.", endpoints: ["/api/ai-intelligence/analytics"], events: [] },
  { id: 18, name: "AI Cost Tracking", description: "Token counts, cost per model, cost summaries.", endpoints: ["/api/ai-intelligence/cost"], events: [] },
  { id: 19, name: "AI Governance", description: "Model governance with risk levels and approval.", endpoints: ["/api/ai-intelligence/governance"], events: [] },
  { id: 20, name: "AI Dashboard", description: "Operational dashboard with all metrics.", endpoints: ["/api/ai-intelligence/dashboard"], events: [] },
  { id: 21, name: "Event Bus Bridge", description: "Passive consumer + producer.", endpoints: [], events: ["RecommendationGenerated", "PersonalizationUpdated", "PromptPublished", "ModelRegistered", "InferenceCompleted", "InferenceFailed", "ModelEvaluationCompleted", "ExperimentCompleted", "FeedbackRecorded", "GuardrailTriggered"] },
  { id: 22, name: "Developer Integration", description: "SDK metadata, extension hooks, webhooks.", endpoints: ["/api/ai-intelligence/developer"], events: [] },
  { id: 23, name: "Administration API", description: "Status, health, metrics.", endpoints: ["/api/ai-intelligence/status"], events: [] },
  { id: 24, name: "Documentation Generator", description: "Deterministic Markdown + JSON. No LLM.", endpoints: ["/api/ai-intelligence/documentation"], events: [] },
];
const EVENT_PAYLOADS: Record<AIIntelligenceEventType, string[]> = {
  RecommendationGenerated: ["recommendationId", "userId", "entityType", "entityId", "score", "correlationId"],
  PersonalizationUpdated: ["userId"],
  PromptPublished: ["promptId", "version"],
  ModelRegistered: ["modelId", "key", "type"],
  InferenceCompleted: ["inferenceId", "modelKey", "correlationId"],
  InferenceFailed: ["inferenceId", "error", "correlationId"],
  ModelEvaluationCompleted: ["evaluationId", "modelKey", "correlationId"],
  ExperimentCompleted: ["experimentId", "correlationId"],
  FeedbackRecorded: ["feedbackId", "type", "correlationId"],
  GuardrailTriggered: ["triggerId", "ruleId", "action", "correlationId"],
};
const EVENT_DESCRIPTIONS: Record<AIIntelligenceEventType, string> = {
  RecommendationGenerated: "Emitted when a recommendation is generated.",
  PersonalizationUpdated: "Emitted when a user's personalization profile is updated.",
  PromptPublished: "Emitted when a new prompt version is published.",
  ModelRegistered: "Emitted when an AI model is registered.",
  InferenceCompleted: "Emitted when an inference request completes successfully.",
  InferenceFailed: "Emitted when an inference request fails.",
  ModelEvaluationCompleted: "Emitted when a model evaluation completes.",
  ExperimentCompleted: "Emitted when an experiment completes.",
  FeedbackRecorded: "Emitted when user feedback is recorded.",
  GuardrailTriggered: "Emitted when a safety guardrail is triggered.",
};

export function generateDocumentation(): AIDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as AIIntelligenceEventType, payload: EVENT_PAYLOADS[type as AIIntelligenceEventType], description: EVENT_DESCRIPTIONS[type as AIIntelligenceEventType] })),
    ownership: {
      owns: ["AI Metadata", "Prompt Templates", "Model Registry", "Inference Metadata", "Recommendation Metadata", "Personalization Metadata", "Evaluation Results", "AI Governance", "Cost Analytics", "AI Experiments"],
      doesNotOwn: ["AI-Generated Quizzes", "Tutoring Sessions", "User Profiles", "Notifications", "Commerce", "Gameplay", "Search", "Analytics Datasets", "Operational Business Logic", "APIs"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateDocumentation();
  let md = `# EduBek — AI Intelligence, Recommendation & Personalization Platform\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.26\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for AI-driven personalization and recommendation orchestration. It owns ONLY recommendation metadata, personalization profiles, feature vectors, inference orchestration, prompt templates, model registry, evaluation metadata, experiment metadata, and AI policies. All recommendations are advisory. Business platforms decide whether to use them.\n\n**Boundary with 6G.18 (AI Services):** 6G.18 owns AI infrastructure, model access, prompt execution, LLM provider abstraction, embeddings, AI service lifecycle. 6G.26 uses those services to produce recommendations, personalization, ranking profiles, experiments, governance, and AI decision metadata.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getAIVersion(): string { return "1.0.0"; }
