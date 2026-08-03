/** Developer Platform service — composes all 22 systems. Phase 6G.21. */
// Systems 1-8
export {
  registerExtension, getExtensionById, getExtensionByKeyStr, listExtensions,
  suspendExtension, deprecateExtension, removeExtension,
  supportsAllExtensionTypes, supportsAllExtensionStatuses,
  createManifest, getManifestById, getManifestForExtension, listManifests,
  registerSdk, getSdkById, listSdks, deprecateSdk, supportsAllSdkLanguages,
  registerCapability, getCapabilityById, listCapabilities,
  createSandboxPolicy, getSandboxById, getSandboxForExtension, listSandboxes,
  requestPermission, getPermissionById, listPermissions, listPermissionsForExtension,
  approvePermission, rejectPermission, revokePermission, supportsAllPermissionStatuses,
  installExtension, canTransitionLifecycle, transitionLifecycle,
  getLifecycleStateForExtension, getLifecycleHistory, listLifecycleStates,
  supportsAllLifecycleStates, supportsAllLifecycleActions,
  checkDependencies,
} from "./core";

// Systems 9-16
export {
  createSubscription, getSubscriptionById, listSubscriptions,
  deactivateSubscription, getAllowedEvents,
  createConfig, getConfigById, getConfigForExtension, listConfigs, updateConfig,
  registerWebhook, getWebhookById, listWebhooks,
  pauseWebhook, revokeWebhook, recordWebhookDelivery, triggerWebhook,
  supportsAllWebhookStatuses,
  issueApiKey, getApiKeyById, listApiKeys, recordApiKeyUsage, rotateApiKey, revokeApiKey,
  supportsAllApiKeyStatuses,
  createOrganization, getOrganizationById, listOrganizations,
  addMember, removeMember, addProject, addApplication,
  createMarketplaceReference, getMarketplaceReference, listMarketplaceReferences,
  markMarketplacePublished,
  generateDeveloperAnalytics,
  recordHealth, getHealthById, getHealthForExtension, listHealth,
  recordFailure, recordCrash, supportsAllHealthStates,
} from "./platform";

// Systems 17-22
export {
  submitForCertification, reviewCertification, listCertifications,
  supportsAllCertificationLevels, supportsAllCertificationStatuses,
  generateDeveloperDashboard,
  getPublicApiEndpoints,
  generateDeveloperDocumentation, generateMarkdownDocumentation, getDeveloperVersion,
  getCliMetadata, getDeveloperIntegration, getDeveloperStatus,
} from "./certification-docs-cli";

// System 19
export {
  subscribeDeveloper, unsubscribeDeveloper, isDeveloperSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishDeveloperEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

export { _resetRepositoryForTesting } from "./repository";
export { describeRuntime, generateCapabilityReport, generatePermissionReport, generateMarketplaceReport } from "./core-systems";
export { generateDeveloperAccountReport, generateSDKReport, generateAPIExplorerReport, generateWebhookCatalogReport, validateInSandbox } from "./developer-tools";
export { validateExtension, analyzeCompatibility, generateAnalyticsReport, generatePublishingReport, generateDocumentation } from "./management-systems";

export type {
  ExtensionType, ExtensionStatus, ExtensionRegistryEntry,
  PluginManifest, SdkEntry, SdkLanguage,
  ApiCapability, SandboxPolicy,
  ExtensionPermission, PermissionStatus,
  LifecycleEvent, LifecycleAction, LifecycleState,
  DependencyCheckResult, DependencyNode,
  EventSubscription, ExtensionConfig, WebhookDefinition, WebhookStatus,
  DeveloperApiKey, ApiKeyStatus,
  DeveloperOrganization, MarketplaceReference,
  DeveloperAnalytics, ExtensionHealth, HealthState,
  CertificationRecord, CertificationLevel, CertificationStatus,
  DeveloperDashboard, DeveloperEventType,
  PublicApiEndpoint, DeveloperDocumentation,
  CliMetadata, CliCommand, CliTemplate, DeveloperIntegration,
} from "./types";
