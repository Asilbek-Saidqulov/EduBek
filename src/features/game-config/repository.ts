/** In-memory repository for Game Config Platform. */
import type {
  GameConfig, ConfigVersion, ConfigCache, FeatureFlag, BalancingProfile,
  EnvironmentConfig, Rollout, ValidationFinding, ValidationResult,
  ConfigComparison, Experiment, ConfigRecommendation, ApprovalWorkflow,
  DeploymentRecord, RollbackRecord,
} from "./types";

const configs = new Map<string, GameConfig>();
const versions = new Map<string, ConfigVersion[]>();
const caches = new Map<string, ConfigCache>();
const flags = new Map<string, FeatureFlag>();
const profiles = new Map<string, BalancingProfile>();
const environments = new Map<string, EnvironmentConfig>();
const rollouts = new Map<string, Rollout>();
const validationFindings = new Map<string, ValidationFinding[]>();
const validationResults = new Map<string, ValidationResult>();
const comparisons = new Map<string, ConfigComparison>();
const experiments = new Map<string, Experiment>();
const recommendations = new Map<string, ConfigRecommendation[]>();
const approvals = new Map<string, ApprovalWorkflow>();
const deployments = new Map<string, DeploymentRecord[]>();
const rollbacks = new Map<string, RollbackRecord[]>();

export const storeConfig = (c: GameConfig) => configs.set(c.id, c);
export const getConfig = (id: string) => configs.get(id) ?? null;
export const getAllConfigs = () => Array.from(configs.values());
export const storeVersion = (v: ConfigVersion) => { const l = versions.get(v.configId) ?? []; l.push(v); versions.set(v.configId, l); };
export const getVersions = (configId: string) => versions.get(configId) ?? [];
export const getVersion = (configId: string, version: string) => (versions.get(configId) ?? []).find(v => v.version === version) ?? null;
export const storeCache = (c: ConfigCache) => caches.set(c.configId, c);
export const getCache = (configId: string) => caches.get(configId) ?? null;
export const storeFlag = (f: FeatureFlag) => flags.set(f.id, f);
export const getFlag = (id: string) => flags.get(id) ?? null;
export const getAllFlags = () => Array.from(flags.values());
export const storeProfile = (p: BalancingProfile) => profiles.set(p.id, p);
export const getProfile = (id: string) => profiles.get(id) ?? null;
export const getAllProfiles = () => Array.from(profiles.values());
export const storeEnvironment = (e: EnvironmentConfig) => environments.set(e.id, e);
export const getEnvironment = (id: string) => environments.get(id) ?? null;
export const getAllEnvironments = () => Array.from(environments.values());
export const storeRollout = (r: Rollout) => rollouts.set(r.id, r);
export const getRollout = (id: string) => rollouts.get(id) ?? null;
export const getAllRollouts = () => Array.from(rollouts.values());
export const storeValidationFinding = (f: ValidationFinding) => { const l = validationFindings.get(`${f.configId}:${f.version}`) ?? []; l.push(f); validationFindings.set(`${f.configId}:${f.version}`, l); };
export const getValidationFindings = (configId: string, version: string) => validationFindings.get(`${configId}:${version}`) ?? [];
export const storeValidationResult = (r: ValidationResult) => validationResults.set(`${r.configId}:${r.version}`, r);
export const getValidationResult = (configId: string, version: string) => validationResults.get(`${configId}:${version}`) ?? null;
export const storeComparison = (c: ConfigComparison) => comparisons.set(`${c.configId}:${c.versionA}:${c.versionB}`, c);
export const getComparison = (configId: string, vA: string, vB: string) => comparisons.get(`${configId}:${vA}:${vB}`) ?? null;
export const storeExperiment = (e: Experiment) => experiments.set(e.id, e);
export const getExperiment = (id: string) => experiments.get(id) ?? null;
export const getAllExperiments = () => Array.from(experiments.values());
export const storeRecommendation = (r: ConfigRecommendation) => { const l = recommendations.get("all") ?? []; l.push(r); recommendations.set("all", l); };
export const getRecommendations = () => recommendations.get("all") ?? [];
export const storeApproval = (a: ApprovalWorkflow) => approvals.set(a.id, a);
export const getApproval = (id: string) => approvals.get(id) ?? null;
export const getAllApprovals = () => Array.from(approvals.values());
export const storeDeployment = (d: DeploymentRecord) => { const l = deployments.get(d.configId) ?? []; l.push(d); deployments.set(d.configId, l); };
export const getDeployments = (configId: string) => deployments.get(configId) ?? [];
export const storeRollback = (r: RollbackRecord) => { const l = rollbacks.get(r.configId) ?? []; l.push(r); rollbacks.set(r.configId, l); };
export const getRollbacks = (configId: string) => rollbacks.get(configId) ?? [];

export function _resetRepositoryForTesting() {
  configs.clear(); versions.clear(); caches.clear(); flags.clear(); profiles.clear();
  environments.clear(); rollouts.clear(); validationFindings.clear(); validationResults.clear();
  comparisons.clear(); experiments.clear(); recommendations.clear(); approvals.clear();
  deployments.clear(); rollbacks.clear();
}
