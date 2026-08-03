/** In-memory repository for AI Intelligence Platform. Phase 6G.26. */
import type {
  AIModel, PromptTemplate, EmbeddingModelMeta,
  FeatureDefinition, FeatureVector,
  Recommendation, PersonalizationProfile,
  RankingProfile, AIContext,
  Experiment, EvaluationResult, PromptVersion,
  InferenceRequest, AIPolicy,
  GuardrailRule, GuardrailTrigger,
  ReviewItem, AIFeedback,
  CostRecord, AIGovernanceRecord,
} from "./types";

const models = new Map<string, AIModel>();
const prompts = new Map<string, PromptTemplate>();
const embeddings = new Map<string, EmbeddingModelMeta>();
const featureDefs = new Map<string, FeatureDefinition>();
const featureVectors = new Map<string, FeatureVector[]>();
const recommendations = new Map<string, Recommendation>();
const personalization = new Map<string, PersonalizationProfile>();
const rankingProfiles = new Map<string, RankingProfile>();
const contexts = new Map<string, AIContext>();
const experiments = new Map<string, Experiment>();
const evaluations = new Map<string, EvaluationResult>();
const promptVersions = new Map<string, PromptVersion[]>();
const inferences = new Map<string, InferenceRequest>();
const policies = new Map<string, AIPolicy>();
const guardrailRules = new Map<string, GuardrailRule>();
const guardrailTriggers: GuardrailTrigger[] = [];
const reviewItems = new Map<string, ReviewItem>();
const feedback: AIFeedback[] = [];
const costRecords: CostRecord[] = [];
const governanceRecords = new Map<string, AIGovernanceRecord>();

export const storeModel = (m: AIModel) => models.set(m.id, m);
export const getModel = (id: string) => models.get(id) ?? null;
export const getModelByKey = (k: string) => Array.from(models.values()).find(m => m.key === k) ?? null;
export const getAllModels = () => Array.from(models.values());
export const storePrompt = (p: PromptTemplate) => prompts.set(p.id, p);
export const getPrompt = (id: string) => prompts.get(id) ?? null;
export const getPromptByKey = (k: string) => Array.from(prompts.values()).find(p => p.key === k) ?? null;
export const getAllPrompts = () => Array.from(prompts.values());
export const storeEmbedding = (e: EmbeddingModelMeta) => embeddings.set(e.id, e);
export const getEmbedding = (id: string) => embeddings.get(id) ?? null;
export const getAllEmbeddings = () => Array.from(embeddings.values());
export const storeFeatureDef = (f: FeatureDefinition) => featureDefs.set(f.id, f);
export const getFeatureDef = (id: string) => featureDefs.get(id) ?? null;
export const getAllFeatureDefs = () => Array.from(featureDefs.values());
export const storeFeatureVector = (v: FeatureVector) => { const a = featureVectors.get(v.entityId) ?? []; a.push(v); featureVectors.set(v.entityId, a); };
export const getFeatureVectors = (entityId: string) => featureVectors.get(entityId) ?? [];
export const storeRecommendation = (r: Recommendation) => recommendations.set(r.id, r);
export const getRecommendation = (id: string) => recommendations.get(id) ?? null;
export const getAllRecommendations = () => Array.from(recommendations.values());
export const storePersonalization = (p: PersonalizationProfile) => personalization.set(p.userId, p);
export const getPersonalization = (userId: string) => personalization.get(userId) ?? null;
export const getAllPersonalizations = () => Array.from(personalization.values());
export const storeRankingProfile = (r: RankingProfile) => rankingProfiles.set(r.id, r);
export const getRankingProfile = (id: string) => rankingProfiles.get(id) ?? null;
export const getAllRankingProfiles = () => Array.from(rankingProfiles.values());
export const storeContext = (c: AIContext) => contexts.set(c.id, c);
export const getContext = (id: string) => contexts.get(id) ?? null;
export const getAllContexts = () => Array.from(contexts.values());
export const storeExperiment = (e: Experiment) => experiments.set(e.id, e);
export const getExperiment = (id: string) => experiments.get(id) ?? null;
export const getAllExperiments = () => Array.from(experiments.values());
export const storeEvaluation = (e: EvaluationResult) => evaluations.set(e.id, e);
export const getEvaluation = (id: string) => evaluations.get(id) ?? null;
export const getAllEvaluations = () => Array.from(evaluations.values());
export const storePromptVersion = (v: PromptVersion) => { const a = promptVersions.get(v.promptId) ?? []; a.push(v); promptVersions.set(v.promptId, a); };
export const getPromptVersions = (promptId: string) => promptVersions.get(promptId) ?? [];
export const storeInference = (i: InferenceRequest) => inferences.set(i.id, i);
export const getInference = (id: string) => inferences.get(id) ?? null;
export const getAllInferences = () => Array.from(inferences.values());
export const storePolicy = (p: AIPolicy) => policies.set(p.id, p);
export const getPolicy = (id: string) => policies.get(id) ?? null;
export const getAllPolicies = () => Array.from(policies.values());
export const storeGuardrailRule = (r: GuardrailRule) => guardrailRules.set(r.id, r);
export const getGuardrailRule = (id: string) => guardrailRules.get(id) ?? null;
export const getAllGuardrailRules = () => Array.from(guardrailRules.values());
export const appendGuardrailTrigger = (t: GuardrailTrigger) => guardrailTriggers.push(t);
export const getAllGuardrailTriggers = () => guardrailTriggers.slice();
export const storeReviewItem = (r: ReviewItem) => reviewItems.set(r.id, r);
export const getReviewItem = (id: string) => reviewItems.get(id) ?? null;
export const getAllReviewItems = () => Array.from(reviewItems.values());
export const appendFeedback = (f: AIFeedback) => feedback.push(f);
export const getAllFeedback = () => feedback.slice();
export const appendCostRecord = (c: CostRecord) => costRecords.push(c);
export const getAllCostRecords = () => costRecords.slice();
export const storeGovernance = (g: AIGovernanceRecord) => governanceRecords.set(g.id, g);
export const getGovernance = (id: string) => governanceRecords.get(id) ?? null;
export const getAllGovernance = () => Array.from(governanceRecords.values());

export function _resetRepositoryForTesting() {
  models.clear(); prompts.clear(); embeddings.clear();
  featureDefs.clear(); featureVectors.clear();
  recommendations.clear(); personalization.clear();
  rankingProfiles.clear(); contexts.clear();
  experiments.clear(); evaluations.clear(); promptVersions.clear();
  inferences.clear(); policies.clear();
  guardrailRules.clear(); guardrailTriggers.length = 0;
  reviewItems.clear(); feedback.length = 0;
  costRecords.length = 0; governanceRecords.clear();
}
