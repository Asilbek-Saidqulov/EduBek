/** Game Config Platform service — composes all 18 systems. */
export {
  createConfig, getConfigById, listConfigs, updateConfig,
  createVersion, getVersionsForConfig, getConfigVersion, transitionVersion, canTransitionVersion, computeDiff,
  loadConfig, cacheConfig,
  createApproval, transitionApproval, canTransitionApproval, getApprovalById, listApprovals,
  recordDeployment, getDeploymentHistory,
  rollbackConfig, getRollbackHistory,
} from "./configuration-registry";
export {
  createFlag, getFlagById, listFlags, enableFlag, disableFlag, emergencyDisable, setFlagPercentage, setFlagTargets, evaluateFlag,
  createProfile, getProfileById, listProfiles, activateProfile, deactivateProfile,
  createEnvironment, getEnvironmentById, listEnvironments, updateEnvironment,
  createRollout, getRolloutById, listRollouts, startRollout, completeRollout, rollbackRollout, cancelRollout,
  supportsAllRolloutStrategies, supportsAllFlagRolloutTypes, supportsAllProfileTypes, supportsAllEnvironments,
} from "./feature-flags-rollouts";
export {
  validateConfig, getValidationResultFor, getFindingsFor, supportsAllIssueKinds,
  compareConfigs, getComparisonResult,
} from "./validation-versioning";
export {
  createExperiment, getExperimentById, listExperiments, startExperiment, pauseExperiment, completeExperiment, cancelExperiment, supportsAllExperimentTypes,
  receiveRecommendation, getAllRecommendations, acknowledgeRecommendation,
  generateDashboard, getDeveloperIntegration, getStatus,
} from "./experiments-dashboard";
export {
  subscribeConfig, unsubscribeConfig, isConfigSubscribed, getBridgeProcessedCount, publishConfigEvent,
  _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
