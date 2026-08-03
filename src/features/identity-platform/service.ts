/** Identity Platform service — composes all 20 systems. Phase 6G.18. */
// Systems 1, 2
export {
  createIdentity, getIdentityById, listIdentities,
  supportsAllIdentityTypes, supportsAllIdentityStatuses,
  canTransitionIdentity, transitionIdentity,
  activateIdentity, verifyIdentity, suspendIdentity, deactivateIdentity,
  softDeleteIdentity, recoverIdentity, migrateIdentity, mergeIdentities,
  getIdentityLifecycleHistory, supportsAllLifecycleActions,
} from "./registry-lifecycle";

// Systems 3, 4
export {
  registerAuthProvider, getAuthProviderById, listAuthProviders,
  setAuthProviderStatus, isAuthProviderAvailable,
  createAuthSession, getAuthSessionById, listAuthSessions,
  refreshAuthSession, revokeAuthSession,
  supportsAllAuthMethods, supportsAllAuthProviderStatuses,
  linkFederation, getFederationLinkById, listFederationLinks,
  syncFederationLink, revokeFederationLink,
  supportsAllFederationProviders, supportsAllFederationLinkStatuses,
} from "./auth-federation";

// Systems 5, 6
export {
  createSession, getSessionById, listSessions,
  touchSession, refreshSession, revokeSession, expireSession,
  revokeAllSessions, countActiveSessions, expireStaleSessions,
  supportsAllSessionStatuses,
  registerDevice, getDeviceById, listDevices,
  touchDevice, verifyDevice, promoteDeviceTrust, addDeviceRiskFlag, revokeDevice,
  supportsAllDeviceTrusts, supportsAllDeviceStatuses,
} from "./sessions-devices";

// Systems 7, 8
export {
  enrollMfaFactor, getMfaFactorById, listMfaFactors,
  disableMfaFactor, createMfaChallenge, verifyMfaChallenge, listMfaChallenges,
  supportsAllMfaFactorTypes, supportsAllMfaFactorStatuses,
  registerPermission, getPermissionById, getPermissionByReference, listPermissions,
  deactivatePermission, resolveImpliedPermissions, hasPermissionKey,
} from "./mfa-permissions";

// Systems 9, 10
export {
  createRoleTemplate, getRoleTemplateById, getRoleTemplateByReference, listRoleTemplates,
  deactivateRoleTemplate, addRolePermission, resolveRolePermissions,
  assignRole, getRoleAssignmentById, listRoleAssignments, listActiveRoleAssignments,
  revokeRoleAssignment, getIdentityPermissions, identityHasPermission, identityHasRole,
  supportsAllRoleScopes,
  createOrganization, getOrganizationById, listOrganizations,
  canTransitionOrganization, transitionOrganizationStatus,
  submitOrganizationForVerification, verifyOrganization, rejectOrganization, revokeOrganization,
  supportsAllOrganizationTypes, supportsAllOrganizationVerificationStatuses,
} from "./rbac-organizations";

// Systems 11, 12
export {
  createDelegation, getDelegationById, listDelegations,
  canTransitionDelegation, approveDelegation, completeDelegation,
  expireDelegation, revokeDelegation, listActiveDelegations,
  supportsAllDelegationStatuses,
  issueApiCredential, getApiCredentialById, listApiCredentials,
  recordApiCredentialUsage, rotateApiCredential, revokeApiCredential,
  supportsAllApiCredentialTypes, supportsAllApiCredentialStatuses,
} from "./delegation-credentials";

// Systems 13, 14
export {
  createServiceAccount, getServiceAccountById, listServiceAccounts,
  recordServiceAccountUsage, deactivateServiceAccount, addServiceAccountScope,
  recordConsent, revokeConsent, listConsentRecords, hasConsent,
  createPrivacySettings, getPrivacySettingsForIdentity, listAllPrivacySettings,
  updatePrivacySettings, setOrganizationOverride, setParentalConsent, canShareData,
} from "./service-consent";

// Systems 15, 16, 17
export {
  createSecurityPolicy, getSecurityPolicyById, listSecurityPolicies,
  getActivePolicyForOrganization, deactivateSecurityPolicy, updateSecurityPolicy,
  validatePasswordAgainstPolicy, supportsAllRiskPolicies,
  recordAuditEntry, listAuditEntries, listAuditEntriesForIdentity,
  getAuditEntryCount, verifyAuditIntegrity,
  generateIdentityAnalytics,
} from "./security-audit-analytics";

// Dashboard
export { generateIdentityDashboard, getIdentityStatus } from "./dashboard";

// System 18
export {
  subscribeIdentity, unsubscribeIdentity, isIdentitySubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishIdentityEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// Systems 19, 20
export {
  getDeveloperIntegration,
  generateIdentityDocumentation, generateMarkdownDocumentation, getIdentityVersion,
} from "./developer-documentation";

// Repository reset
export { _resetRepositoryForTesting } from "./repository";

// Type re-exports
export type {
  IdentityType, IdentityStatus, Identity, LifecycleEvent, LifecycleAction,
  AuthMethod, AuthProviderConfig, AuthProviderStatus, AuthSession,
  FederationProvider, FederationLink, FederationLinkStatus,
  Session, SessionStatus, Device, DeviceTrust, DeviceStatus,
  MfaFactorType, MfaFactorStatus, MfaFactor, MfaChallenge,
  Permission, RoleTemplate, RoleAssignment, RoleScope,
  OrganizationIdentity, OrganizationType, OrganizationVerificationStatus,
  Delegation, DelegationStatus,
  ApiCredential, ApiCredentialType, ApiCredentialStatus,
  ServiceAccount, ConsentRecord, PrivacySettings,
  SecurityPolicy, IdentityAuditEntry,
  IdentityAnalytics, IdentityEventType,
  IdentityDeveloperIntegration, IdentityDocumentation,
} from "./types";
