/** Systems 1-12: Model Registry, Prompts, Embeddings, Features, Recommendations, Personalization, Ranking, Context, Experiments, Evaluation, Versioning, Inference. */
import { randomUUID } from "node:crypto";
import {
  storeModel, getModel, getModelByKey, getAllModels,
  storePrompt, getPrompt, getPromptByKey, getAllPrompts,
  storeEmbedding, getEmbedding, getAllEmbeddings,
  storeFeatureDef, getFeatureDef, getAllFeatureDefs, storeFeatureVector, getFeatureVectors,
  storeRecommendation, getRecommendation, getAllRecommendations,
  storePersonalization, getPersonalization, getAllPersonalizations,
  storeRankingProfile, getRankingProfile, getAllRankingProfiles,
  storeContext, getContext, getAllContexts,
  storeExperiment, getExperiment, getAllExperiments,
  storeEvaluation, getEvaluation, getAllEvaluations,
  storePromptVersion, getPromptVersions,
  storeInference, getInference, getAllInferences,
} from "./repository";
import type {
  AIModel, ModelType, ModelStatus,
  PromptTemplate, PromptStatus,
  EmbeddingModelMeta,
  FeatureDefinition, FeatureDataType, FeatureVector,
  Recommendation, RecommendationStatus,
  PersonalizationProfile, PersonalizationStatus,
  RankingProfile, RankingStrategy,
  AIContext,
  Experiment, ExperimentStatus,
  EvaluationResult, EvalStatus,
  PromptVersion,
  InferenceRequest, InferenceStatus,
} from "./types";
import { publishAIEvent } from "./event-bus-bridge";

// System 1 — AI Model Registry
export function registerModel(input: { key: string; name: string; type: ModelType; provider: string; version: string; capabilities?: string[]; contextWindow?: number | null; metadata?: Record<string, unknown> }): AIModel {
  if (getModelByKey(input.key)) throw new Error(`Model key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const m: AIModel = { id: randomUUID(), key: input.key, name: input.name, type: input.type, provider: input.provider, version: input.version, status: "registered", capabilities: input.capabilities ?? [], contextWindow: input.contextWindow ?? null, registeredAt: now, updatedAt: now, metadata: input.metadata ?? {} };
  storeModel(m);
  publishAIEvent("ModelRegistered", null, { modelId: m.id, key: m.key, type: m.type });
  return m;
}
export function getModelById(id: string) { return getModel(id); }
export function listModels(type?: ModelType, status?: ModelStatus) { let all = getAllModels(); if (type) all = all.filter(m => m.type === type); if (status) all = all.filter(m => m.status === status); return all; }
export function activateModel(id: string) { const m = getModel(id); if (!m) return null; m.status = "active"; m.updatedAt = new Date().toISOString(); storeModel(m); return m; }
export function deprecateModel(id: string) { const m = getModel(id); if (!m) return null; m.status = "deprecated"; m.updatedAt = new Date().toISOString(); storeModel(m); return m; }
export function supportsAllModelTypes(): ModelType[] { return ["llm", "embedding", "reranker", "classifier", "regression", "custom"]; }
export function supportsAllModelStatuses(): ModelStatus[] { return ["registered", "active", "deprecated", "retired"]; }

// System 2 — Prompt Registry
export function createPrompt(input: { key: string; name: string; template: string; variables?: string[]; modelKey?: string | null; metadata?: Record<string, unknown> }): PromptTemplate {
  if (getPromptByKey(input.key)) throw new Error(`Prompt key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const p: PromptTemplate = { id: randomUUID(), key: input.key, name: input.name, template: input.template, variables: input.variables ?? [], status: "draft", version: 1, modelKey: input.modelKey ?? null, createdAt: now, updatedAt: now, metadata: input.metadata ?? {} };
  storePrompt(p);
  return p;
}
export function getPromptById(id: string) { return getPrompt(id); }
export function listPrompts(status?: PromptStatus) { const all = getAllPrompts(); return status ? all.filter(p => p.status === status) : all; }
export function activatePrompt(id: string) { const p = getPrompt(id); if (!p) return null; p.status = "active"; p.updatedAt = new Date().toISOString(); storePrompt(p); return p; }
export function supportsAllPromptStatuses(): PromptStatus[] { return ["draft", "active", "deprecated"]; }

// System 3 — Embedding Registry
export function registerEmbedding(input: { key: string; name: string; provider: string; dimensions: number; maxTokens: number; active?: boolean }): EmbeddingModelMeta {
  const e: EmbeddingModelMeta = { id: randomUUID(), key: input.key, name: input.name, provider: input.provider, dimensions: input.dimensions, maxTokens: input.maxTokens, active: input.active ?? true, createdAt: new Date().toISOString(), metadata: {} };
  storeEmbedding(e);
  return e;
}
export function getEmbeddingById(id: string) { return getEmbedding(id); }
export function listEmbeddings(active?: boolean) { const all = getAllEmbeddings(); return active === undefined ? all : all.filter(e => e.active === active); }

// System 4 — Feature Store Metadata
export function createFeatureDef(input: { key: string; name: string; dataType: FeatureDataType; description?: string; source: string; active?: boolean }): FeatureDefinition {
  const now = new Date().toISOString();
  const f: FeatureDefinition = { id: randomUUID(), key: input.key, name: input.name, dataType: input.dataType, description: input.description ?? "", source: input.source, active: input.active ?? true, createdAt: now, updatedAt: now };
  storeFeatureDef(f);
  return f;
}
export function getFeatureDefById(id: string) { return getFeatureDef(id); }
export function listFeatureDefs(active?: boolean) { const all = getAllFeatureDefs(); return active === undefined ? all : all.filter(f => f.active === active); }
export function storeFeatureVectorForEntity(input: { entityId: string; entityType: string; features: Record<string, unknown> }): FeatureVector {
  const v: FeatureVector = { id: randomUUID(), entityId: input.entityId, entityType: input.entityType, features: input.features, version: (getFeatureVectors(input.entityId).length + 1), computedAt: new Date().toISOString() };
  storeFeatureVector(v);
  return v;
}
export function getFeatureVectorsForEntity(entityId: string) { return getFeatureVectors(entityId); }
export function supportsAllFeatureDataTypes(): FeatureDataType[] { return ["numeric", "categorical", "text", "embedding", "temporal"]; }

// System 5 — Recommendation Engine
export function generateRecommendation(input: { userId: string; entityType: string; entityId: string; score: number; reason: string; strategy: string; metadata?: Record<string, unknown> }): Recommendation {
  const r: Recommendation = { id: randomUUID(), userId: input.userId, entityType: input.entityType, entityId: input.entityId, score: input.score, reason: input.reason, strategy: input.strategy, status: "generated", generatedAt: new Date().toISOString(), servedAt: null, clickedAt: null, dismissedAt: null, correlationId: randomUUID(), metadata: input.metadata ?? {} };
  storeRecommendation(r);
  publishAIEvent("RecommendationGenerated", null, { recommendationId: r.id, userId: input.userId, entityType: input.entityType, entityId: input.entityId, score: input.score, correlationId: r.correlationId });
  return r;
}
export function getRecommendationById(id: string) { return getRecommendation(id); }
export function listRecommendations(userId?: string, status?: RecommendationStatus) { let all = getAllRecommendations(); if (userId) all = all.filter(r => r.userId === userId); if (status) all = all.filter(r => r.status === status); return all; }
export function serveRecommendation(id: string) { const r = getRecommendation(id); if (!r) return null; r.status = "served"; r.servedAt = new Date().toISOString(); storeRecommendation(r); return r; }
export function clickRecommendation(id: string) { const r = getRecommendation(id); if (!r) return null; r.status = "clicked"; r.clickedAt = new Date().toISOString(); storeRecommendation(r); return r; }
export function dismissRecommendation(id: string) { const r = getRecommendation(id); if (!r) return null; r.status = "dismissed"; r.dismissedAt = new Date().toISOString(); storeRecommendation(r); return r; }
export function supportsAllRecommendationStatuses(): RecommendationStatus[] { return ["generated", "served", "clicked", "dismissed", "expired"]; }

// System 6 — Personalization Engine
export function createPersonalization(input: { userId: string; preferences?: Record<string, unknown>; interests?: string[]; difficulty?: string | null; learningStyle?: string | null }): PersonalizationProfile {
  const now = new Date().toISOString();
  const p: PersonalizationProfile = { id: randomUUID(), userId: input.userId, status: "active", preferences: input.preferences ?? {}, interests: input.interests ?? [], difficulty: input.difficulty ?? null, learningStyle: input.learningStyle ?? null, updatedAt: now, createdAt: now };
  storePersonalization(p);
  return p;
}
export function getPersonalizationForUser(userId: string) { return getPersonalization(userId); }
export function listPersonalizations(status?: PersonalizationStatus) { const all = getAllPersonalizations(); return status ? all.filter(p => p.status === status) : all; }
export function updatePersonalization(userId: string, updates: Partial<Pick<PersonalizationProfile, "preferences" | "interests" | "difficulty" | "learningStyle">>) { const p = getPersonalization(userId); if (!p) return null; Object.assign(p, updates); p.updatedAt = new Date().toISOString(); storePersonalization(p); publishAIEvent("PersonalizationUpdated", userId, { userId }); return p; }
export function optOutPersonalization(userId: string) { const p = getPersonalization(userId); if (!p) return null; p.status = "opted_out"; p.updatedAt = new Date().toISOString(); storePersonalization(p); return p; }
export function supportsAllPersonalizationStatuses(): PersonalizationStatus[] { return ["active", "opted_out", "paused"]; }

// System 7 — Ranking Profiles
export function createRankingProfile(input: { key: string; name: string; strategy: RankingStrategy; weights?: Record<string, number> }): RankingProfile {
  const now = new Date().toISOString();
  const r: RankingProfile = { id: randomUUID(), key: input.key, name: input.name, strategy: input.strategy, weights: input.weights ?? {}, active: true, version: 1, createdAt: now, updatedAt: now };
  storeRankingProfile(r);
  return r;
}
export function getRankingProfileById(id: string) { return getRankingProfile(id); }
export function listRankingProfiles(active?: boolean) { const all = getAllRankingProfiles(); return active === undefined ? all : all.filter(r => r.active === active); }
export function supportsAllRankingStrategies(): RankingStrategy[] { return ["relevance", "popularity", "freshness", "personalized", "hybrid"]; }

// System 8 — Context Builder
export function buildContext(input: { userId: string; contextType: string; features?: Record<string, unknown>; recommendations?: string[]; promptVariables?: Record<string, unknown>; expiresAt?: string | null }): AIContext {
  const c: AIContext = { id: randomUUID(), userId: input.userId, contextType: input.contextType, features: input.features ?? {}, recommendations: input.recommendations ?? [], promptVariables: input.promptVariables ?? {}, builtAt: new Date().toISOString(), expiresAt: input.expiresAt ?? null };
  storeContext(c);
  return c;
}
export function getContextById(id: string) { return getContext(id); }
export function listContexts(userId?: string) { const all = getAllContexts(); return userId ? all.filter(c => c.userId === userId) : all; }

// System 9 — AI Experiment Platform
export function createExperiment(input: { key: string; name: string; hypothesis: string; modelKeys?: string[] }): Experiment {
  const now = new Date().toISOString();
  const e: Experiment = { id: randomUUID(), key: input.key, name: input.name, hypothesis: input.hypothesis, modelKeys: input.modelKeys ?? [], status: "draft", startedAt: null, endedAt: null, metrics: {}, correlationId: randomUUID(), createdAt: now, updatedAt: now };
  storeExperiment(e);
  return e;
}
export function getExperimentById(id: string) { return getExperiment(id); }
export function listExperiments(status?: ExperimentStatus) { const all = getAllExperiments(); return status ? all.filter(e => e.status === status) : all; }
export function startExperiment(id: string) { const e = getExperiment(id); if (!e || e.status !== "draft") return null; e.status = "running"; e.startedAt = new Date().toISOString(); e.updatedAt = e.startedAt; storeExperiment(e); return e; }
export function completeExperiment(id: string, metrics: Record<string, number>) { const e = getExperiment(id); if (!e || e.status !== "running") return null; e.status = "completed"; e.endedAt = new Date().toISOString(); e.metrics = metrics; e.updatedAt = e.endedAt; storeExperiment(e); publishAIEvent("ExperimentCompleted", null, { experimentId: e.id, correlationId: e.correlationId }); return e; }
export function supportsAllExperimentStatuses(): ExperimentStatus[] { return ["draft", "running", "completed", "cancelled", "failed"]; }

// System 10 — Model Evaluation
export function createEvaluation(input: { modelKey: string; datasetRef: string }): EvaluationResult {
  const e: EvaluationResult = { id: randomUUID(), modelKey: input.modelKey, datasetRef: input.datasetRef, status: "pending", metrics: {}, startedAt: new Date().toISOString(), completedAt: null, notes: null, correlationId: randomUUID() };
  storeEvaluation(e);
  return e;
}
export function getEvaluationById(id: string) { return getEvaluation(id); }
export function listEvaluations(status?: EvalStatus) { const all = getAllEvaluations(); return status ? all.filter(e => e.status === status) : all; }
export function completeEvaluation(id: string, metrics: Record<string, number>, notes?: string) { const e = getEvaluation(id); if (!e || e.status !== "pending") return null; e.status = "completed"; e.metrics = metrics; e.notes = notes ?? null; e.completedAt = new Date().toISOString(); storeEvaluation(e); publishAIEvent("ModelEvaluationCompleted", null, { evaluationId: e.id, modelKey: e.modelKey, correlationId: e.correlationId }); return e; }
export function supportsAllEvalStatuses(): EvalStatus[] { return ["pending", "running", "completed", "failed"]; }

// System 11 — Prompt Versioning
export function publishPromptVersion(input: { promptId: string; template: string; changeLog: string; publishedBy: string }): PromptVersion {
  const existing = getPromptVersions(input.promptId);
  const versionNum = existing.length + 1;
  for (const v of existing) v.active = false;
  const v: PromptVersion = { id: randomUUID(), promptId: input.promptId, version: versionNum, template: input.template, changeLog: input.changeLog, publishedBy: input.publishedBy, publishedAt: new Date().toISOString(), active: true };
  storePromptVersion(v);
  publishAIEvent("PromptPublished", input.publishedBy, { promptId: input.promptId, version: versionNum });
  return v;
}
export function getPromptVersionHistory(promptId: string) { return getPromptVersions(promptId); }
export function getActivePromptVersion(promptId: string) { return getPromptVersions(promptId).find(v => v.active) ?? null; }

// System 12 — Inference Routing
export function createInference(input: { modelKey: string; promptKey?: string | null; input: Record<string, unknown>; metadata?: Record<string, unknown> }): InferenceRequest {
  const r: InferenceRequest = { id: randomUUID(), modelKey: input.modelKey, promptKey: input.promptKey ?? null, input: input.input, output: null, status: "pending", latencyMs: null, costEstimate: null, requestedAt: new Date().toISOString(), completedAt: null, error: null, correlationId: randomUUID(), metadata: input.metadata ?? {} };
  storeInference(r);
  return r;
}
export function getInferenceById(id: string) { return getInference(id); }
export function listInferences(status?: InferenceStatus, modelKey?: string) { let all = getAllInferences(); if (status) all = all.filter(i => i.status === status); if (modelKey) all = all.filter(i => i.modelKey === modelKey); return all; }
export function completeInference(id: string, output: Record<string, unknown>, latencyMs: number, costEstimate?: number) { const r = getInference(id); if (!r || r.status !== "pending") return null; r.status = "completed"; r.output = output; r.latencyMs = latencyMs; r.costEstimate = costEstimate ?? null; r.completedAt = new Date().toISOString(); storeInference(r); publishAIEvent("InferenceCompleted", null, { inferenceId: r.id, modelKey: r.modelKey, correlationId: r.correlationId }); return r; }
export function failInference(id: string, error: string) { const r = getInference(id); if (!r || r.status !== "pending") return null; r.status = "failed"; r.error = error; r.completedAt = new Date().toISOString(); storeInference(r); publishAIEvent("InferenceFailed", null, { inferenceId: r.id, error, correlationId: r.correlationId }); return r; }
export function supportsAllInferenceStatuses(): InferenceStatus[] { return ["pending", "running", "completed", "failed", "timeout"]; }
