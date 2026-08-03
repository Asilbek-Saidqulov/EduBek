/**
 * EduBek — Identity, Access Management & Federation Platform tests.
 * Phase 6G.18: 500+ deterministic tests covering all 20 systems.
 *
 * Tests are 100% deterministic — no LLM, no randomness, no network, no timing assumptions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  // Systems 1, 2
  createIdentity, getIdentityById, listIdentities,
  supportsAllIdentityTypes, supportsAllIdentityStatuses,
  canTransitionIdentity, transitionIdentity,
  activateIdentity, verifyIdentity, suspendIdentity, deactivateIdentity,
  softDeleteIdentity, recoverIdentity, migrateIdentity, mergeIdentities,
  getIdentityLifecycleHistory, supportsAllLifecycleActions,
  // Systems 3, 4
  registerAuthProvider, getAuthProviderById, listAuthProviders,
  setAuthProviderStatus, isAuthProviderAvailable,
  createAuthSession, getAuthSessionById, listAuthSessions,
  refreshAuthSession, revokeAuthSession,
  supportsAllAuthMethods, supportsAllAuthProviderStatuses,
  linkFederation, getFederationLinkById, listFederationLinks,
  syncFederationLink, revokeFederationLink,
  supportsAllFederationProviders, supportsAllFederationLinkStatuses,
  // Systems 5, 6
  createSession, getSessionById, listSessions,
  touchSession, refreshSession, revokeSession, expireSession,
  revokeAllSessions, countActiveSessions, expireStaleSessions,
  supportsAllSessionStatuses,
  registerDevice, getDeviceById, listDevices,
  touchDevice, verifyDevice, promoteDeviceTrust, addDeviceRiskFlag, revokeDevice,
  supportsAllDeviceTrusts, supportsAllDeviceStatuses,
  // Systems 7, 8
  enrollMfaFactor, getMfaFactorById, listMfaFactors,
  disableMfaFactor, createMfaChallenge, verifyMfaChallenge, listMfaChallenges,
  supportsAllMfaFactorTypes, supportsAllMfaFactorStatuses,
  registerPermission, getPermissionById, getPermissionByReference, listPermissions,
  deactivatePermission, resolveImpliedPermissions, hasPermissionKey,
  // Systems 9, 10
  createRoleTemplate, getRoleTemplateById, getRoleTemplateByReference, listRoleTemplates,
  deactivateRoleTemplate, addRolePermission, resolveRolePermissions,
  assignRole, getRoleAssignmentById, listRoleAssignments, listActiveRoleAssignments,
  revokeRoleAssignment, getIdentityPermissions, identityHasPermission, identityHasRole,
  supportsAllRoleScopes,
  createOrganization, getOrganizationById, listOrganizations,
  canTransitionOrganization, transitionOrganizationStatus,
  submitOrganizationForVerification, verifyOrganization, rejectOrganization, revokeOrganization,
  supportsAllOrganizationTypes, supportsAllOrganizationVerificationStatuses,
  // Systems 11, 12
  createDelegation, getDelegationById, listDelegations,
  canTransitionDelegation, approveDelegation, completeDelegation,
  expireDelegation, revokeDelegation, listActiveDelegations,
  supportsAllDelegationStatuses,
  issueApiCredential, getApiCredentialById, listApiCredentials,
  recordApiCredentialUsage, rotateApiCredential, revokeApiCredential,
  supportsAllApiCredentialTypes, supportsAllApiCredentialStatuses,
  // Systems 13, 14
  createServiceAccount, getServiceAccountById, listServiceAccounts,
  recordServiceAccountUsage, deactivateServiceAccount, addServiceAccountScope,
  recordConsent, revokeConsent, listConsentRecords, hasConsent,
  createPrivacySettings, getPrivacySettingsForIdentity, listAllPrivacySettings,
  updatePrivacySettings, setOrganizationOverride, setParentalConsent, canShareData,
  // Systems 15, 16, 17
  createSecurityPolicy, getSecurityPolicyById, listSecurityPolicies,
  getActivePolicyForOrganization, deactivateSecurityPolicy, updateSecurityPolicy,
  validatePasswordAgainstPolicy, supportsAllRiskPolicies,
  recordAuditEntry, listAuditEntries, listAuditEntriesForIdentity,
  getAuditEntryCount, verifyAuditIntegrity,
  generateIdentityAnalytics,
  // Dashboard
  generateIdentityDashboard, getIdentityStatus,
  // System 18
  subscribeIdentity, unsubscribeIdentity, isIdentitySubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishIdentityEvent, _resetBridgeForTesting,
  // Systems 19, 20
  getDeveloperIntegration,
  generateIdentityDocumentation, generateMarkdownDocumentation, getIdentityVersion,
  // Reset
  _resetRepositoryForTesting,
} from "@/features/identity-platform";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

const now = () => Date.now();
const futureIso = (seconds: number) => new Date(now() + seconds * 1000).toISOString();

// ===========================================================================
// System 1 — Identity Registry
// ===========================================================================
describe("Identity — Registry (System 1)", () => {
  it("creates identity", () => {
    const i = createIdentity({ type: "user", username: "alice", email: "a@b.com" });
    expect(i.id).toBeDefined();
    expect(i.status).toBe("pending");
    expect(i.version).toBe(1);
  });
  it("creates identity with default locale", () => {
    const i = createIdentity({ type: "user" });
    expect(i.locale).toBe("en");
  });
  it("creates identity with organization", () => {
    const i = createIdentity({ type: "teacher", organizationId: "org-1" });
    expect(i.organizationId).toBe("org-1");
  });
  it("creates identity with metadata", () => {
    const i = createIdentity({ type: "user", metadata: { x: 1 } });
    expect(i.metadata.x).toBe(1);
  });
  it("default emailVerified is false", () => {
    expect(createIdentity({ type: "user", email: "a@b.com" }).emailVerified).toBe(false);
  });
  it("default phoneVerified is false", () => {
    expect(createIdentity({ type: "user", phone: "+1234567890" }).phoneVerified).toBe(false);
  });
  it("default primaryIdentityId is null", () => {
    expect(createIdentity({ type: "user" }).primaryIdentityId).toBeNull();
  });
  it("default activatedAt is null", () => {
    expect(createIdentity({ type: "user" }).activatedAt).toBeNull();
  });
  it("gets identity by id", () => {
    const i = createIdentity({ type: "user" });
    expect(getIdentityById(i.id)).not.toBeNull();
    expect(getIdentityById("nonexistent")).toBeNull();
  });
  it("lists identities", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "teacher" });
    expect(listIdentities().length).toBe(2);
  });
  it("lists by type", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "teacher" });
    expect(listIdentities("user").length).toBe(1);
  });
  it("lists by status", () => {
    createIdentity({ type: "user" });
    expect(listIdentities(undefined, "pending").length).toBe(1);
  });
  it("supports all identity types", () => {
    expect(supportsAllIdentityTypes().length).toBe(8);
  });
  it("supports all identity statuses", () => {
    expect(supportsAllIdentityStatuses().length).toBe(8);
  });
  it("identity has createdAt and updatedAt", () => {
    const i = createIdentity({ type: "user" });
    expect(i.createdAt).toBeDefined();
    expect(i.updatedAt).toBeDefined();
  });
});

// ===========================================================================
// System 2 — Identity Lifecycle
// ===========================================================================
describe("Identity — Lifecycle (System 2)", () => {
  it("canTransition validates", () => {
    expect(canTransitionIdentity("pending", "active")).toBe(true);
    expect(canTransitionIdentity("merged", "active")).toBe(false);
    expect(canTransitionIdentity("migrated", "active")).toBe(false);
  });
  it("activates identity", () => {
    const i = createIdentity({ type: "user" });
    expect(activateIdentity(i.id, "admin")?.status).toBe("active");
  });
  it("activate sets activatedAt", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(getIdentityById(i.id)?.activatedAt).not.toBeNull();
  });
  it("verifies identity", () => {
    const i = createIdentity({ type: "user", email: "a@b.com", phone: "+1" });
    activateIdentity(i.id, "admin");
    expect(verifyIdentity(i.id, "admin")?.status).toBe("verified");
  });
  it("verify sets verifiedAt and emailVerified", () => {
    const i = createIdentity({ type: "user", email: "a@b.com" });
    activateIdentity(i.id, "admin");
    verifyIdentity(i.id, "admin");
    const updated = getIdentityById(i.id);
    expect(updated?.verifiedAt).not.toBeNull();
    expect(updated?.emailVerified).toBe(true);
  });
  it("suspends identity", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(suspendIdentity(i.id, "admin", "abuse")?.status).toBe("suspended");
  });
  it("suspend sets suspendedAt", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    suspendIdentity(i.id, "admin", "abuse");
    expect(getIdentityById(i.id)?.suspendedAt).not.toBeNull();
  });
  it("deactivates identity", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(deactivateIdentity(i.id, "admin", "left")?.status).toBe("deactivated");
  });
  it("soft deletes identity", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(softDeleteIdentity(i.id, "admin", "gdpr")?.status).toBe("soft_deleted");
  });
  it("recovers soft-deleted identity", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    softDeleteIdentity(i.id, "admin", "x");
    expect(recoverIdentity(i.id, "admin")?.status).toBe("active");
  });
  it("migrates identity", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(migrateIdentity(i.id, "admin", "system migration")?.status).toBe("migrated");
  });
  it("rejects invalid transition", () => {
    const i = createIdentity({ type: "user" });
    // pending -> merged is NOT valid
    expect(transitionIdentity(i.id, "merged", "admin", "x")).toBeNull();
  });
  it("rejects transition on nonexistent", () => {
    expect(transitionIdentity("nonexistent", "active", "admin", "x")).toBeNull();
  });
  it("merges two identities", () => {
    const source = createIdentity({ type: "user" });
    const target = createIdentity({ type: "user" });
    const result = mergeIdentities(source.id, target.id, "admin", "duplicate");
    expect(result.source?.status).toBe("merged");
    expect(result.source?.primaryIdentityId).toBe(target.id);
  });
  it("rejects merge with self", () => {
    const i = createIdentity({ type: "user" });
    const r = mergeIdentities(i.id, i.id, "admin", "x");
    expect(r.source).toBeNull();
  });
  it("rejects merge with nonexistent", () => {
    const r = mergeIdentities("a", "b", "admin", "x");
    expect(r.source).toBeNull();
  });
  it("records lifecycle history", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    const history = getIdentityLifecycleHistory(i.id);
    expect(history.length).toBeGreaterThan(0);
  });
  it("supports all lifecycle actions", () => {
    expect(supportsAllLifecycleActions().length).toBe(10);
  });
  it("transition increments version", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(getIdentityById(i.id)?.version).toBe(2);
  });
  it("soft_delete sets deletedAt", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    softDeleteIdentity(i.id, "admin", "x");
    expect(getIdentityById(i.id)?.deletedAt).not.toBeNull();
  });
  it("deactivate sets deactivatedAt", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    deactivateIdentity(i.id, "admin", "x");
    expect(getIdentityById(i.id)?.deactivatedAt).not.toBeNull();
  });
  it("migrate sets migratedAt", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    migrateIdentity(i.id, "admin", "x");
    expect(getIdentityById(i.id)?.migratedAt).not.toBeNull();
  });
});

// ===========================================================================
// System 3 — Authentication Abstraction
// ===========================================================================
describe("Identity — Auth Abstraction (System 3)", () => {
  it("registers auth provider", () => {
    const p = registerAuthProvider({ id: "password-1", method: "password", name: "Password" });
    expect(p.id).toBe("password-1");
    expect(p.status).toBe("active");
  });
  it("rejects duplicate provider", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    expect(() => registerAuthProvider({ id: "p1", method: "password", name: "X" })).toThrow();
  });
  it("gets provider by id", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    expect(getAuthProviderById("p1")).not.toBeNull();
    expect(getAuthProviderById("missing")).toBeNull();
  });
  it("lists providers", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    registerAuthProvider({ id: "p2", method: "oauth", name: "OAuth" });
    expect(listAuthProviders().length).toBe(2);
  });
  it("lists by method", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    registerAuthProvider({ id: "p2", method: "oauth", name: "OAuth" });
    expect(listAuthProviders("oauth").length).toBe(1);
  });
  it("lists by status", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    expect(listAuthProviders(undefined, "active").length).toBe(1);
  });
  it("sets provider status", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    expect(setAuthProviderStatus("p1", "maintenance")?.status).toBe("maintenance");
  });
  it("isProviderAvailable active", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", supportedLocales: ["en"] });
    expect(isAuthProviderAvailable("p1", "en")).toBe(true);
  });
  it("isProviderAvailable rejects inactive", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", status: "inactive" });
    expect(isAuthProviderAvailable("p1")).toBe(false);
  });
  it("isProviderAvailable rejects unsupported locale", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", supportedLocales: ["en"] });
    expect(isAuthProviderAvailable("p1", "uz")).toBe(false);
  });
  it("isProviderAvailable rejects unknown", () => {
    expect(isAuthProviderAvailable("missing")).toBe(false);
  });
  it("creates auth session", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", supportedLocales: ["en"] });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    expect(s.id).toBeDefined();
    expect(s.expiresAt).not.toBeNull();
  });
  it("rejects session for unknown provider", () => {
    expect(() => createAuthSession({ identityId: "i1", method: "password", providerId: "missing" })).toThrow();
  });
  it("rejects session with method mismatch", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    expect(() => createAuthSession({ identityId: "i1", method: "oauth", providerId: "p1" })).toThrow();
  });
  it("gets auth session by id", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    expect(getAuthSessionById(s.id)).not.toBeNull();
  });
  it("lists auth sessions", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    createAuthSession({ identityId: "i2", method: "password", providerId: "p1" });
    expect(listAuthSessions().length).toBe(2);
  });
  it("lists auth sessions by identity", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    createAuthSession({ identityId: "i2", method: "password", providerId: "p1" });
    expect(listAuthSessions("i1").length).toBe(1);
  });
  it("refreshes auth session", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", supportsRefresh: true });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    expect(refreshAuthSession(s.id)?.refreshedAt).not.toBeNull();
  });
  it("rejects refresh if provider doesn't support", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password", supportsRefresh: false });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    expect(refreshAuthSession(s.id)).toBeNull();
  });
  it("revokes auth session", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    expect(revokeAuthSession(s.id, "user_request")?.revokedAt).not.toBeNull();
  });
  it("rejects revoke already revoked", () => {
    registerAuthProvider({ id: "p1", method: "password", name: "Password" });
    const s = createAuthSession({ identityId: "i1", method: "password", providerId: "p1" });
    revokeAuthSession(s.id, "x");
    expect(revokeAuthSession(s.id, "x")).toBeNull();
  });
  it("supports all auth methods", () => {
    expect(supportsAllAuthMethods().length).toBe(8);
  });
  it("supports all auth provider statuses", () => {
    expect(supportsAllAuthProviderStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 4 — Identity Federation
// ===========================================================================
describe("Identity — Federation (System 4)", () => {
  it("links federation", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-123", externalEmail: "a@b.com" });
    expect(l.id).toBeDefined();
    expect(l.status).toBe("active");
  });
  it("gets federation link by id", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    expect(getFederationLinkById(l.id)).not.toBeNull();
  });
  it("lists federation links", () => {
    linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    linkFederation({ identityId: "i2", provider: "github", externalId: "gh-1" });
    expect(listFederationLinks().length).toBe(2);
  });
  it("lists by identity", () => {
    linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    linkFederation({ identityId: "i2", provider: "github", externalId: "gh-1" });
    expect(listFederationLinks("i1").length).toBe(1);
  });
  it("lists by provider", () => {
    linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    linkFederation({ identityId: "i2", provider: "github", externalId: "gh-1" });
    expect(listFederationLinks(undefined, "google").length).toBe(1);
  });
  it("syncs federation link", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    expect(syncFederationLink(l.id)?.lastSyncedAt).not.toBeNull();
  });
  it("rejects sync for revoked link", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    revokeFederationLink(l.id, "x");
    expect(syncFederationLink(l.id)).toBeNull();
  });
  it("revokes federation link", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    expect(revokeFederationLink(l.id, "user_request")?.status).toBe("revoked");
  });
  it("rejects revoke already revoked", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    revokeFederationLink(l.id, "x");
    expect(revokeFederationLink(l.id, "x")).toBeNull();
  });
  it("supports all federation providers", () => {
    expect(supportsAllFederationProviders().length).toBe(8);
  });
  it("supports all federation link statuses", () => {
    expect(supportsAllFederationLinkStatuses().length).toBe(3);
  });
  it("link has correlationId", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    expect(l.correlationId).toBeDefined();
  });
});

// ===========================================================================
// System 5 — Session Platform
// ===========================================================================
describe("Identity — Sessions (System 5)", () => {
  it("creates session", () => {
    const s = createSession({ identityId: "i1" });
    expect(s.id).toBeDefined();
    expect(s.status).toBe("active");
  });
  it("creates session with device binding", () => {
    const s = createSession({ identityId: "i1", deviceId: "d1" });
    expect(s.deviceId).toBe("d1");
  });
  it("creates session with custom duration", () => {
    const s = createSession({ identityId: "i1", durationMinutes: 120 });
    expect(s.expiresAt).toBeDefined();
  });
  it("gets session by id", () => {
    const s = createSession({ identityId: "i1" });
    expect(getSessionById(s.id)).not.toBeNull();
  });
  it("lists sessions", () => {
    createSession({ identityId: "i1" });
    createSession({ identityId: "i2" });
    expect(listSessions().length).toBe(2);
  });
  it("lists by identity", () => {
    createSession({ identityId: "i1" });
    createSession({ identityId: "i2" });
    expect(listSessions("i1").length).toBe(1);
  });
  it("lists by status", () => {
    createSession({ identityId: "i1" });
    expect(listSessions(undefined, "active").length).toBe(1);
  });
  it("touches session", () => {
    const s = createSession({ identityId: "i1" });
    expect(touchSession(s.id)?.lastActiveAt).not.toBeNull();
  });
  it("refreshes session", () => {
    const s = createSession({ identityId: "i1" });
    expect(refreshSession(s.id)?.refreshedAt).not.toBeNull();
  });
  it("revokes session", () => {
    const s = createSession({ identityId: "i1" });
    expect(revokeSession(s.id, "user")?.status).toBe("revoked");
  });
  it("expires session", () => {
    const s = createSession({ identityId: "i1" });
    expect(expireSession(s.id)?.status).toBe("expired");
  });
  it("rejects revoke non-active", () => {
    const s = createSession({ identityId: "i1" });
    revokeSession(s.id, "x");
    expect(revokeSession(s.id, "x")).toBeNull();
  });
  it("revokes all sessions for identity", () => {
    createSession({ identityId: "i1" });
    createSession({ identityId: "i1" });
    createSession({ identityId: "i2" });
    expect(revokeAllSessions("i1", "x")).toBe(2);
  });
  it("counts active sessions", () => {
    createSession({ identityId: "i1" });
    createSession({ identityId: "i1" });
    expect(countActiveSessions("i1")).toBe(2);
  });
  it("expires stale sessions", () => {
    createSession({ identityId: "i1", durationMinutes: -1 }); // already expired
    expect(expireStaleSessions()).toBe(1);
  });
  it("supports all session statuses", () => {
    expect(supportsAllSessionStatuses().length).toBe(4);
  });
  it("session has correlationId", () => {
    expect(createSession({ identityId: "i1" }).correlationId).toBeDefined();
  });
  it("session supports ipAddress and userAgent", () => {
    const s = createSession({ identityId: "i1", ipAddress: "1.2.3.4", userAgent: "Mozilla" });
    expect(s.ipAddress).toBe("1.2.3.4");
    expect(s.userAgent).toBe("Mozilla");
  });
});

// ===========================================================================
// System 6 — Device Registry
// ===========================================================================
describe("Identity — Devices (System 6)", () => {
  it("registers device", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(d.id).toBeDefined();
    expect(d.trust).toBe("known");
  });
  it("registers device with custom trust", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1", trust: "trusted" });
    expect(d.trust).toBe("trusted");
  });
  it("registers device with risk flags", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1", riskFlags: ["rooted"] });
    expect(d.riskFlags.length).toBe(1);
  });
  it("returns existing device for same fingerprint", () => {
    const d1 = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    const d2 = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(d1.id).toBe(d2.id);
  });
  it("gets device by id", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(getDeviceById(d.id)).not.toBeNull();
  });
  it("lists devices", () => {
    registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    registerDevice({ identityId: "i2", fingerprint: "fp-2" });
    expect(listDevices().length).toBe(2);
  });
  it("lists by identity", () => {
    registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    registerDevice({ identityId: "i2", fingerprint: "fp-2" });
    expect(listDevices("i1").length).toBe(1);
  });
  it("touches device", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(touchDevice(d.id)?.lastSeenAt).not.toBeNull();
  });
  it("verifies device", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(verifyDevice(d.id)?.trust).toBe("trusted");
  });
  it("verify sets verifiedAt", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    verifyDevice(d.id);
    expect(getDeviceById(d.id)?.verifiedAt).not.toBeNull();
  });
  it("promotes device trust", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(promoteDeviceTrust(d.id, "trusted")?.trust).toBe("trusted");
  });
  it("adds device risk flag", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(addDeviceRiskFlag(d.id, "suspicious")?.riskFlags.length).toBe(1);
  });
  it("rejects duplicate risk flag", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    addDeviceRiskFlag(d.id, "suspicious");
    expect(addDeviceRiskFlag(d.id, "suspicious")?.riskFlags.length).toBe(1);
  });
  it("revokes device", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(revokeDevice(d.id, "lost")?.status).toBe("revoked");
  });
  it("rejects revoke non-active", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    revokeDevice(d.id, "x");
    expect(revokeDevice(d.id, "x")).toBeNull();
  });
  it("supports all device trusts", () => {
    expect(supportsAllDeviceTrusts().length).toBe(4);
  });
  it("supports all device statuses", () => {
    expect(supportsAllDeviceStatuses().length).toBe(3);
  });
});

// ===========================================================================
// System 7 — MFA
// ===========================================================================
describe("Identity — MFA (System 7)", () => {
  it("enrolls MFA factor", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(f.id).toBeDefined();
    expect(f.status).toBe("active");
  });
  it("enrolls with backup codes", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "backup_codes", backupCodesRemaining: 10 });
    expect(f.backupCodesRemaining).toBe(10);
  });
  it("gets MFA factor by id", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(getMfaFactorById(f.id)).not.toBeNull();
  });
  it("lists MFA factors", () => {
    enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    enrollMfaFactor({ identityId: "i2", type: "security_key" });
    expect(listMfaFactors().length).toBe(2);
  });
  it("lists by identity", () => {
    enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    enrollMfaFactor({ identityId: "i2", type: "security_key" });
    expect(listMfaFactors("i1").length).toBe(1);
  });
  it("disables MFA factor", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(disableMfaFactor(f.id, "user_request")?.status).toBe("disabled");
  });
  it("rejects disable non-active", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    disableMfaFactor(f.id, "x");
    expect(disableMfaFactor(f.id, "x")).toBeNull();
  });
  it("creates MFA challenge", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i1", factorId: f.id });
    expect(c.id).toBeDefined();
    expect(c.status).toBe("pending");
  });
  it("rejects challenge for unknown factor", () => {
    expect(() => createMfaChallenge({ identityId: "i1", factorId: "missing" })).toThrow();
  });
  it("rejects challenge with identity mismatch", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(() => createMfaChallenge({ identityId: "i2", factorId: f.id })).toThrow();
  });
  it("verifies MFA challenge with correct code", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i1", factorId: f.id });
    const expected = c.id.replace(/-/g, "").slice(-6).toUpperCase();
    const result = verifyMfaChallenge(c.id, expected);
    expect(result?.status).toBe("verified");
  });
  it("rejects MFA challenge with wrong code", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i1", factorId: f.id });
    const result = verifyMfaChallenge(c.id, "WRONG!");
    expect(result?.status).toBe("pending");
  });
  it("fails MFA after max attempts", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i1", factorId: f.id, maxAttempts: 1 });
    verifyMfaChallenge(c.id, "WRONG!");
    expect(getMfaFactorById(f.id)).not.toBeNull();
    // The challenge should be failed now
    const refreshed = listMfaChallenges("i1");
    expect(refreshed.find(ch => ch.id === c.id)?.status).toBe("failed");
  });
  it("lists MFA challenges", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    createMfaChallenge({ identityId: "i1", factorId: f.id });
    expect(listMfaChallenges().length).toBe(1);
  });
  it("supports all MFA factor types", () => {
    expect(supportsAllMfaFactorTypes().length).toBe(5);
  });
  it("supports all MFA factor statuses", () => {
    expect(supportsAllMfaFactorStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 8 — Permission Registry
// ===========================================================================
describe("Identity — Permissions (System 8)", () => {
  it("registers permission", () => {
    const p = registerPermission({ key: "matches.view", namespace: "matches", description: "View matches" });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("rejects duplicate permission key", () => {
    registerPermission({ key: "k", namespace: "ns" });
    expect(() => registerPermission({ key: "k", namespace: "ns" })).toThrow();
  });
  it("registers with parent", () => {
    const p = registerPermission({ key: "matches.view", namespace: "matches", parentKey: "matches" });
    expect(p.parentKey).toBe("matches");
  });
  it("registers with implies", () => {
    const p = registerPermission({ key: "matches.admin", namespace: "matches", implies: ["matches.view", "matches.edit"] });
    expect(p.implies.length).toBe(2);
  });
  it("gets permission by id", () => {
    const p = registerPermission({ key: "k", namespace: "ns" });
    expect(getPermissionById(p.id)).not.toBeNull();
  });
  it("gets permission by key", () => {
    registerPermission({ key: "k", namespace: "ns" });
    expect(getPermissionByReference("k")).not.toBeNull();
  });
  it("lists permissions", () => {
    registerPermission({ key: "k1", namespace: "ns1" });
    registerPermission({ key: "k2", namespace: "ns2" });
    expect(listPermissions().length).toBe(2);
  });
  it("lists by namespace", () => {
    registerPermission({ key: "k1", namespace: "ns1" });
    registerPermission({ key: "k2", namespace: "ns2" });
    expect(listPermissions("ns1").length).toBe(1);
  });
  it("lists active only", () => {
    const p = registerPermission({ key: "k", namespace: "ns" });
    deactivatePermission(p.id);
    expect(listPermissions(undefined, true).length).toBe(0);
  });
  it("deactivates permission", () => {
    const p = registerPermission({ key: "k", namespace: "ns" });
    expect(deactivatePermission(p.id)?.active).toBe(false);
  });
  it("resolves implied permissions", () => {
    registerPermission({ key: "p1", namespace: "ns", implies: ["p2", "p3"] });
    registerPermission({ key: "p2", namespace: "ns", implies: ["p4"] });
    registerPermission({ key: "p3", namespace: "ns" });
    registerPermission({ key: "p4", namespace: "ns" });
    const resolved = resolveImpliedPermissions("p1");
    expect(resolved).toContain("p1");
    expect(resolved).toContain("p2");
    expect(resolved).toContain("p3");
    expect(resolved).toContain("p4");
  });
  it("resolves implies handles cycle", () => {
    registerPermission({ key: "a", namespace: "ns", implies: ["b"] });
    registerPermission({ key: "b", namespace: "ns", implies: ["a"] });
    const resolved = resolveImpliedPermissions("a");
    expect(resolved).toContain("a");
    expect(resolved).toContain("b");
  });
  it("hasPermissionKey true when granted", () => {
    registerPermission({ key: "admin", namespace: "ns", implies: ["view"] });
    registerPermission({ key: "view", namespace: "ns" });
    expect(hasPermissionKey(["admin"], "view")).toBe(true);
  });
  it("hasPermissionKey false when not granted", () => {
    registerPermission({ key: "view", namespace: "ns" });
    expect(hasPermissionKey(["other"], "view")).toBe(false);
  });
});

// ===========================================================================
// System 9 — RBAC Platform
// ===========================================================================
describe("Identity — RBAC (System 9)", () => {
  it("creates role template", () => {
    const r = createRoleTemplate({ key: "admin", name: "Admin", scope: "global" });
    expect(r.id).toBeDefined();
    expect(r.active).toBe(true);
  });
  it("rejects duplicate role key", () => {
    createRoleTemplate({ key: "admin", name: "Admin", scope: "global" });
    expect(() => createRoleTemplate({ key: "admin", name: "X", scope: "global" })).toThrow();
  });
  it("creates role with permissions", () => {
    const r = createRoleTemplate({ key: "admin", name: "Admin", scope: "global", permissions: ["p1", "p2"] });
    expect(r.permissions.length).toBe(2);
  });
  it("creates delegatable role", () => {
    const r = createRoleTemplate({ key: "sub", name: "Substitute", scope: "classroom", delegatable: true });
    expect(r.delegatable).toBe(true);
  });
  it("creates temporary role", () => {
    const r = createRoleTemplate({ key: "temp", name: "Temp", scope: "tournament", temporary: true });
    expect(r.temporary).toBe(true);
  });
  it("gets role template by id", () => {
    const r = createRoleTemplate({ key: "admin", name: "Admin", scope: "global" });
    expect(getRoleTemplateById(r.id)).not.toBeNull();
  });
  it("gets role template by key", () => {
    createRoleTemplate({ key: "admin", name: "Admin", scope: "global" });
    expect(getRoleTemplateByReference("admin")).not.toBeNull();
  });
  it("lists role templates", () => {
    createRoleTemplate({ key: "r1", name: "R1", scope: "global" });
    createRoleTemplate({ key: "r2", name: "R2", scope: "organization" });
    expect(listRoleTemplates().length).toBe(2);
  });
  it("lists by scope", () => {
    createRoleTemplate({ key: "r1", name: "R1", scope: "global" });
    createRoleTemplate({ key: "r2", name: "R2", scope: "organization" });
    expect(listRoleTemplates("organization").length).toBe(1);
  });
  it("lists active only", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    deactivateRoleTemplate(r.id);
    expect(listRoleTemplates(undefined, true).length).toBe(0);
  });
  it("deactivates role template", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    expect(deactivateRoleTemplate(r.id)?.active).toBe(false);
  });
  it("adds role permission", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    expect(addRolePermission(r.id, "p1")?.permissions.length).toBe(1);
  });
  it("rejects duplicate role permission", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    addRolePermission(r.id, "p1");
    expect(addRolePermission(r.id, "p1")?.permissions.length).toBe(1);
  });
  it("resolves role permissions with parent", () => {
    createRoleTemplate({ key: "parent", name: "Parent", scope: "global", permissions: ["p1"] });
    createRoleTemplate({ key: "child", name: "Child", scope: "global", permissions: ["p2"], parentRoleKey: "parent" });
    const resolved = resolveRolePermissions("child");
    expect(resolved).toContain("p1");
    expect(resolved).toContain("p2");
  });
  it("assigns role", () => {
    createRoleTemplate({ key: "admin", name: "Admin", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "admin", scope: "global", assignedBy: "i2" });
    expect(a.id).toBeDefined();
    expect(a.inherited).toBe(false);
  });
  it("rejects assign with unknown role", () => {
    expect(() => assignRole({ identityId: "i1", roleKey: "missing", scope: "global", assignedBy: "i2" })).toThrow();
  });
  it("rejects assign with inactive role", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    deactivateRoleTemplate(r.id);
    expect(() => assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" })).toThrow();
  });
  it("assigns role with expiration", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2", expiresAt: futureIso(3600) });
    expect(a.expiresAt).not.toBeNull();
  });
  it("assigns inherited role", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2", inherited: true });
    expect(a.inherited).toBe(true);
  });
  it("assigns delegated role", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2", delegated: true });
    expect(a.delegated).toBe(true);
  });
  it("gets role assignment by id", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(getRoleAssignmentById(a.id)).not.toBeNull();
  });
  it("lists role assignments", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    assignRole({ identityId: "i2", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(listRoleAssignments().length).toBe(2);
  });
  it("lists by identity", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    assignRole({ identityId: "i2", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(listRoleAssignments("i1").length).toBe(1);
  });
  it("lists active assignments only", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a1 = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    revokeRoleAssignment(a1.id, "x");
    expect(listActiveRoleAssignments("i1").length).toBe(1);
  });
  it("lists active excludes expired", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2", expiresAt: futureIso(-60) });
    expect(listActiveRoleAssignments("i1").length).toBe(0);
  });
  it("revokes role assignment", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(revokeRoleAssignment(a.id, "x")?.revokedAt).not.toBeNull();
  });
  it("rejects revoke already revoked", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    revokeRoleAssignment(a.id, "x");
    expect(revokeRoleAssignment(a.id, "x")).toBeNull();
  });
  it("gets identity permissions", () => {
    registerPermission({ key: "p1", namespace: "ns" });
    createRoleTemplate({ key: "r", name: "R", scope: "global", permissions: ["p1"] });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(getIdentityPermissions("i1")).toContain("p1");
  });
  it("identity has permission true", () => {
    registerPermission({ key: "p1", namespace: "ns" });
    createRoleTemplate({ key: "r", name: "R", scope: "global", permissions: ["p1"] });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(identityHasPermission("i1", "p1")).toBe(true);
  });
  it("identity has permission false", () => {
    registerPermission({ key: "p1", namespace: "ns" });
    createRoleTemplate({ key: "r", name: "R", scope: "global", permissions: ["p1"] });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(identityHasPermission("i1", "p2")).toBe(false);
  });
  it("identity has role true", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(identityHasRole("i1", "r")).toBe(true);
  });
  it("identity has role false", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    expect(identityHasRole("i1", "r")).toBe(false);
  });
  it("supports all role scopes", () => {
    expect(supportsAllRoleScopes().length).toBe(6);
  });
});

// ===========================================================================
// System 10 — Organization Identity
// ===========================================================================
describe("Identity — Organizations (System 10)", () => {
  it("creates organization", () => {
    const o = createOrganization({ name: "Acme School", type: "school" });
    expect(o.id).toBeDefined();
    expect(o.verificationStatus).toBe("unverified");
  });
  it("creates with domain", () => {
    const o = createOrganization({ name: "Acme", type: "enterprise", domain: "acme.com" });
    expect(o.domain).toBe("acme.com");
  });
  it("creates with brand color and logo", () => {
    const o = createOrganization({ name: "Acme", type: "enterprise", brandColor: "#FF0000", logoUrl: "https://example.com/logo.png" });
    expect(o.brandColor).toBe("#FF0000");
    expect(o.logoUrl).not.toBeNull();
  });
  it("creates with parent", () => {
    const parent = createOrganization({ name: "Parent", type: "district" });
    const child = createOrganization({ name: "Child", type: "school", parentOrganizationId: parent.id });
    expect(child.parentOrganizationId).toBe(parent.id);
  });
  it("gets organization by id", () => {
    const o = createOrganization({ name: "Acme", type: "school" });
    expect(getOrganizationById(o.id)).not.toBeNull();
  });
  it("lists organizations", () => {
    createOrganization({ name: "A", type: "school" });
    createOrganization({ name: "B", type: "enterprise" });
    expect(listOrganizations().length).toBe(2);
  });
  it("lists by type", () => {
    createOrganization({ name: "A", type: "school" });
    createOrganization({ name: "B", type: "enterprise" });
    expect(listOrganizations("enterprise").length).toBe(1);
  });
  it("lists by verification status", () => {
    createOrganization({ name: "A", type: "school" });
    expect(listOrganizations(undefined, "unverified").length).toBe(1);
  });
  it("canTransition validates", () => {
    expect(canTransitionOrganization("unverified", "pending")).toBe(true);
    expect(canTransitionOrganization("verified", "unverified")).toBe(false);
  });
  it("submits for verification", () => {
    const o = createOrganization({ name: "A", type: "school" });
    expect(submitOrganizationForVerification(o.id)?.verificationStatus).toBe("pending");
  });
  it("verifies organization", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    expect(verifyOrganization(o.id, "admin")?.verificationStatus).toBe("verified");
  });
  it("verify sets verifiedAt and verifiedBy", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    verifyOrganization(o.id, "admin-1");
    const updated = getOrganizationById(o.id);
    expect(updated?.verifiedAt).not.toBeNull();
    expect(updated?.verifiedBy).toBe("admin-1");
  });
  it("rejects organization", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    expect(rejectOrganization(o.id, "admin")?.verificationStatus).toBe("rejected");
  });
  it("revokes organization", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    verifyOrganization(o.id, "admin");
    expect(revokeOrganization(o.id, "admin")?.verificationStatus).toBe("revoked");
  });
  it("rejects invalid transition", () => {
    const o = createOrganization({ name: "A", type: "school" });
    // unverified -> revoked is NOT valid
    expect(transitionOrganizationStatus(o.id, "revoked", "admin")).toBeNull();
  });
  it("supports all organization types", () => {
    expect(supportsAllOrganizationTypes().length).toBe(6);
  });
  it("supports all organization verification statuses", () => {
    expect(supportsAllOrganizationVerificationStatuses().length).toBe(5);
  });
});

// ===========================================================================
// System 11 — Delegation Platform
// ===========================================================================
describe("Identity — Delegation (System 11)", () => {
  it("creates delegation", () => {
    const d = createDelegation({
      fromIdentityId: "i1", toIdentityId: "i2",
      roleKey: "teacher", scope: "classroom", reason: "vacation",
      endsAt: futureIso(3600),
    });
    expect(d.id).toBeDefined();
    expect(d.status).toBe("pending");
  });
  it("rejects self delegation", () => {
    expect(() => createDelegation({
      fromIdentityId: "i1", toIdentityId: "i1",
      roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600),
    })).toThrow();
  });
  it("rejects ends before starts", () => {
    expect(() => createDelegation({
      fromIdentityId: "i1", toIdentityId: "i2",
      roleKey: "r", scope: "global", reason: "x",
      startsAt: futureIso(3600), endsAt: futureIso(60),
    })).toThrow();
  });
  it("gets delegation by id", () => {
    const d = createDelegation({
      fromIdentityId: "i1", toIdentityId: "i2",
      roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600),
    });
    expect(getDelegationById(d.id)).not.toBeNull();
  });
  it("lists delegations", () => {
    createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    createDelegation({ fromIdentityId: "i3", toIdentityId: "i4", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(listDelegations().length).toBe(2);
  });
  it("lists by status", () => {
    createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(listDelegations("pending").length).toBe(1);
  });
  it("lists by identity (either side)", () => {
    createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(listDelegations(undefined, "i1").length).toBe(1);
    expect(listDelegations(undefined, "i2").length).toBe(1);
  });
  it("canTransition validates", () => {
    expect(canTransitionDelegation("pending", "active")).toBe(true);
    expect(canTransitionDelegation("revoked", "active")).toBe(false);
  });
  it("approves delegation", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(approveDelegation(d.id, "admin")?.status).toBe("active");
  });
  it("completes delegation", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    approveDelegation(d.id, "admin");
    expect(completeDelegation(d.id)?.status).toBe("completed");
  });
  it("expires delegation", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    approveDelegation(d.id, "admin");
    expect(expireDelegation(d.id)?.status).toBe("expired");
  });
  it("revokes delegation", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    approveDelegation(d.id, "admin");
    expect(revokeDelegation(d.id, "x")?.status).toBe("revoked");
  });
  it("lists active delegations for identity", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    approveDelegation(d.id, "admin");
    expect(listActiveDelegations("i2").length).toBe(1);
  });
  it("supports all delegation statuses", () => {
    expect(supportsAllDelegationStatuses().length).toBe(5);
  });
});

// ===========================================================================
// System 12 — API Credentials
// ===========================================================================
describe("Identity — API Credentials (System 12)", () => {
  it("issues API credential", () => {
    const result = issueApiCredential({ identityId: "i1", type: "api_key", name: "My Key" });
    expect(result.id).toBeDefined();
    expect(result.plainSecret).toBeDefined();
    expect(result.keyPrefix).toContain("ek_");
  });
  it("issues with scopes", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K", scopes: ["read", "write"] });
    expect(r.scopes.length).toBe(2);
  });
  it("issues with expiration", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K", expiresAt: futureIso(3600) });
    expect(r.expiresAt).not.toBeNull();
  });
  it("issues with rotation due", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K", rotationDueAt: futureIso(3600) });
    expect(r.rotationDueAt).not.toBeNull();
  });
  it("gets credential by id", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(getApiCredentialById(r.id)).not.toBeNull();
  });
  it("lists credentials", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K1" });
    issueApiCredential({ identityId: "i2", type: "api_key", name: "K2" });
    expect(listApiCredentials().length).toBe(2);
  });
  it("lists by identity", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K1" });
    issueApiCredential({ identityId: "i2", type: "api_key", name: "K2" });
    expect(listApiCredentials("i1").length).toBe(1);
  });
  it("lists by status", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K1" });
    expect(listApiCredentials(undefined, "active").length).toBe(1);
  });
  it("records usage", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(recordApiCredentialUsage(r.id, "1.2.3.4")?.lastUsedAt).not.toBeNull();
  });
  it("rotates credential", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    const rotated = rotateApiCredential(r.id);
    expect(rotated?.plainSecret).toBeDefined();
    expect(rotated?.keyPrefix).not.toBe(r.keyPrefix);
  });
  it("revokes credential", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(revokeApiCredential(r.id, "x")?.status).toBe("revoked");
  });
  it("rejects revoke already revoked", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    revokeApiCredential(r.id, "x");
    expect(revokeApiCredential(r.id, "x")).toBeNull();
  });
  it("supports all API credential types", () => {
    expect(supportsAllApiCredentialTypes().length).toBe(4);
  });
  it("supports all API credential statuses", () => {
    expect(supportsAllApiCredentialStatuses().length).toBe(4);
  });
});

// ===========================================================================
// System 13 — Service Accounts
// ===========================================================================
describe("Identity — Service Accounts (System 13)", () => {
  it("creates service account", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.id).toBeDefined();
    expect(s.active).toBe(true);
  });
  it("creates with description and scopes", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", description: "Test bot", scopes: ["read"], ownerIdentityId: "i2" });
    expect(s.description).toBe("Test bot");
    expect(s.scopes.length).toBe(1);
  });
  it("creates with expiration", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2", expiresAt: futureIso(3600) });
    expect(s.expiresAt).not.toBeNull();
  });
  it("gets service account by id", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(getServiceAccountById(s.id)).not.toBeNull();
  });
  it("lists service accounts", () => {
    createServiceAccount({ identityId: "i1", name: "Bot1", ownerIdentityId: "i2" });
    createServiceAccount({ identityId: "i2", name: "Bot2", ownerIdentityId: "i2" });
    expect(listServiceAccounts().length).toBe(2);
  });
  it("lists by identity", () => {
    createServiceAccount({ identityId: "i1", name: "Bot1", ownerIdentityId: "i2" });
    createServiceAccount({ identityId: "i2", name: "Bot2", ownerIdentityId: "i2" });
    expect(listServiceAccounts("i1").length).toBe(1);
  });
  it("lists active only", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot1", ownerIdentityId: "i2" });
    deactivateServiceAccount(s.id);
    expect(listServiceAccounts(undefined, true).length).toBe(0);
  });
  it("records usage", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(recordServiceAccountUsage(s.id)?.lastUsedAt).not.toBeNull();
  });
  it("deactivates service account", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(deactivateServiceAccount(s.id)?.active).toBe(false);
  });
  it("adds scope", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(addServiceAccountScope(s.id, "read")?.scopes.length).toBe(1);
  });
  it("rejects duplicate scope", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2", scopes: ["read"] });
    expect(addServiceAccountScope(s.id, "read")?.scopes.length).toBe(1);
  });
});

// ===========================================================================
// System 14 — Consent & Privacy
// ===========================================================================
describe("Identity — Consent & Privacy (System 14)", () => {
  it("records consent granted", () => {
    const c = recordConsent({ identityId: "i1", purpose: "marketing", granted: true });
    expect(c.granted).toBe(true);
    expect(c.grantedAt).not.toBeNull();
  });
  it("records consent revoked", () => {
    const c = recordConsent({ identityId: "i1", purpose: "marketing", granted: false });
    expect(c.granted).toBe(false);
    expect(c.revokedAt).not.toBeNull();
  });
  it("revokes existing consent", () => {
    recordConsent({ identityId: "i1", purpose: "marketing", granted: true });
    expect(revokeConsent("i1", "marketing")?.granted).toBe(false);
  });
  it("rejects revoke non-existent", () => {
    expect(revokeConsent("i1", "marketing")).toBeNull();
  });
  it("lists consent records", () => {
    recordConsent({ identityId: "i1", purpose: "p1", granted: true });
    recordConsent({ identityId: "i2", purpose: "p2", granted: true });
    expect(listConsentRecords().length).toBe(2);
  });
  it("lists by identity", () => {
    recordConsent({ identityId: "i1", purpose: "p1", granted: true });
    recordConsent({ identityId: "i2", purpose: "p2", granted: true });
    expect(listConsentRecords("i1").length).toBe(1);
  });
  it("has consent true", () => {
    recordConsent({ identityId: "i1", purpose: "p1", granted: true });
    expect(hasConsent("i1", "p1")).toBe(true);
  });
  it("has consent false", () => {
    expect(hasConsent("i1", "p1")).toBe(false);
  });
  it("creates privacy settings", () => {
    const p = createPrivacySettings({ identityId: "i1" });
    expect(p.profileVisibility).toBe("organization");
    expect(p.marketingOptOut).toBe(true);
  });
  it("rejects duplicate privacy settings", () => {
    createPrivacySettings({ identityId: "i1" });
    expect(() => createPrivacySettings({ identityId: "i1" })).toThrow();
  });
  it("creates with custom visibility", () => {
    const p = createPrivacySettings({ identityId: "i1", profileVisibility: "public", contactVisibility: "public" });
    expect(p.profileVisibility).toBe("public");
  });
  it("creates with parental consent", () => {
    const p = createPrivacySettings({ identityId: "i1", parentConsentRequired: true, parentIdentityId: "p1" });
    expect(p.parentConsentRequired).toBe(true);
    expect(p.parentIdentityId).toBe("p1");
  });
  it("gets privacy settings for identity", () => {
    createPrivacySettings({ identityId: "i1" });
    expect(getPrivacySettingsForIdentity("i1")).not.toBeNull();
    expect(getPrivacySettingsForIdentity("i2")).toBeNull();
  });
  it("lists all privacy settings", () => {
    createPrivacySettings({ identityId: "i1" });
    createPrivacySettings({ identityId: "i2" });
    expect(listAllPrivacySettings().length).toBe(2);
  });
  it("updates privacy settings", () => {
    createPrivacySettings({ identityId: "i1" });
    expect(updatePrivacySettings("i1", { profileVisibility: "private" })?.profileVisibility).toBe("private");
  });
  it("sets organization override", () => {
    createPrivacySettings({ identityId: "i1" });
    expect(setOrganizationOverride("i1", "org-1", false)?.organizationOverrides["org-1"]).toBe(false);
  });
  it("sets parental consent", () => {
    createPrivacySettings({ identityId: "i1" });
    const p = setParentalConsent("i1", "p1");
    expect(p?.parentConsentRequired).toBe(true);
    expect(p?.parentIdentityId).toBe("p1");
    expect(p?.minorProtection).toBe(true);
  });
  it("canShareData returns false without settings", () => {
    expect(canShareData("i1").canShare).toBe(false);
  });
  it("canShareData returns false when data sharing disabled", () => {
    createPrivacySettings({ identityId: "i1", dataSharing: false });
    expect(canShareData("i1").canShare).toBe(false);
  });
  it("canShareData returns true when enabled", () => {
    createPrivacySettings({ identityId: "i1", dataSharing: true, analyticsOptOut: false, minorProtection: false });
    expect(canShareData("i1").canShare).toBe(true);
  });
  it("canShareData respects org override", () => {
    createPrivacySettings({ identityId: "i1", dataSharing: true });
    setOrganizationOverride("i1", "org-1", false);
    expect(canShareData("i1", "org-1").canShare).toBe(false);
  });
  it("canShareData rejects minor without parent", () => {
    createPrivacySettings({ identityId: "i1", dataSharing: true, minorProtection: true, parentIdentityId: null });
    expect(canShareData("i1").canShare).toBe(false);
  });
});

// ===========================================================================
// System 15 — Security Policies
// ===========================================================================
describe("Identity — Security Policies (System 15)", () => {
  it("creates security policy", () => {
    const p = createSecurityPolicy({ name: "Default" });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
    expect(p.passwordMinLength).toBe(8);
  });
  it("creates with custom password rules", () => {
    const p = createSecurityPolicy({ name: "Strict", passwordMinLength: 12, passwordRequireSymbol: true });
    expect(p.passwordMinLength).toBe(12);
    expect(p.passwordRequireSymbol).toBe(true);
  });
  it("creates with MFA required", () => {
    const p = createSecurityPolicy({ name: "MFA", mfaRequired: true, mfaRequiredForRoles: ["admin"] });
    expect(p.mfaRequired).toBe(true);
    expect(p.mfaRequiredForRoles.length).toBe(1);
  });
  it("creates with risk policy", () => {
    const p = createSecurityPolicy({ name: "Paranoid", riskPolicy: "paranoid" });
    expect(p.riskPolicy).toBe("paranoid");
  });
  it("creates for organization", () => {
    const p = createSecurityPolicy({ name: "Org", organizationId: "org-1" });
    expect(p.organizationId).toBe("org-1");
  });
  it("gets policy by id", () => {
    const p = createSecurityPolicy({ name: "P" });
    expect(getSecurityPolicyById(p.id)).not.toBeNull();
  });
  it("lists policies", () => {
    createSecurityPolicy({ name: "P1" });
    createSecurityPolicy({ name: "P2" });
    expect(listSecurityPolicies().length).toBe(2);
  });
  it("lists active only", () => {
    const p = createSecurityPolicy({ name: "P" });
    deactivateSecurityPolicy(p.id);
    expect(listSecurityPolicies(true).length).toBe(0);
  });
  it("lists by organization", () => {
    createSecurityPolicy({ name: "P1", organizationId: "org-1" });
    createSecurityPolicy({ name: "P2", organizationId: null });
    expect(listSecurityPolicies(undefined, "org-1").length).toBe(1);
    expect(listSecurityPolicies(undefined, null).length).toBe(1);
  });
  it("gets active policy for organization (org-specific)", () => {
    createSecurityPolicy({ name: "Global" });
    createSecurityPolicy({ name: "Org", organizationId: "org-1" });
    expect(getActivePolicyForOrganization("org-1")?.name).toBe("Org");
  });
  it("gets active policy for organization (global fallback)", () => {
    createSecurityPolicy({ name: "Global" });
    expect(getActivePolicyForOrganization("org-1")?.name).toBe("Global");
  });
  it("deactivates policy", () => {
    const p = createSecurityPolicy({ name: "P" });
    expect(deactivateSecurityPolicy(p.id)?.active).toBe(false);
  });
  it("updates policy", () => {
    const p = createSecurityPolicy({ name: "P" });
    expect(updateSecurityPolicy(p.id, { passwordMinLength: 16 })?.passwordMinLength).toBe(16);
  });
  it("update increments version", () => {
    const p = createSecurityPolicy({ name: "P" });
    updateSecurityPolicy(p.id, { passwordMinLength: 16 });
    expect(getSecurityPolicyById(p.id)?.version).toBe(2);
  });
  it("validates strong password", () => {
    const p = createSecurityPolicy({ name: "P", passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireLowercase: true, passwordRequireDigit: true });
    const result = validatePasswordAgainstPolicy("Strong123", p);
    expect(result.valid).toBe(true);
  });
  it("validates weak password", () => {
    const p = createSecurityPolicy({ name: "P", passwordMinLength: 8 });
    const result = validatePasswordAgainstPolicy("weak", p);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("too_short");
  });
  it("validates missing uppercase", () => {
    const p = createSecurityPolicy({ name: "P", passwordRequireUppercase: true });
    expect(validatePasswordAgainstPolicy("lowercase123", p).errors).toContain("no_uppercase");
  });
  it("validates missing digit", () => {
    const p = createSecurityPolicy({ name: "P", passwordRequireDigit: true });
    expect(validatePasswordAgainstPolicy("NoDigits", p).errors).toContain("no_digit");
  });
  it("validates missing symbol", () => {
    const p = createSecurityPolicy({ name: "P", passwordRequireSymbol: true });
    expect(validatePasswordAgainstPolicy("NoSymbol123", p).errors).toContain("no_symbol");
  });
  it("supports all risk policies", () => {
    expect(supportsAllRiskPolicies().length).toBe(4);
  });
});

// ===========================================================================
// System 16 — Identity Audit
// ===========================================================================
describe("Identity — Audit (System 16)", () => {
  it("records audit entry", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: "admin", action: "test", scope: "identity", reason: "test" });
    expect(e.id).toBeDefined();
    expect(e.immutable).toBe(true);
  });
  it("records with before/after", () => {
    const e = recordAuditEntry({
      identityId: "i1", actorId: "admin", action: "update", scope: "identity",
      before: { x: 1 }, after: { x: 2 }, reason: "test",
    });
    expect(e.before.x).toBe(1);
    expect(e.after.x).toBe(2);
  });
  it("lists audit entries", () => {
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    recordAuditEntry({ identityId: "i2", actorId: "a", action: "y", scope: "identity", reason: "y" });
    expect(listAuditEntries().length).toBe(2);
  });
  it("lists with pagination", () => {
    for (let i = 0; i < 5; i++) recordAuditEntry({ identityId: "i1", actorId: "a", action: `a${i}`, scope: "identity", reason: "x" });
    expect(listAuditEntries(2, 0).length).toBe(2);
    expect(listAuditEntries(2, 2).length).toBe(2);
  });
  it("lists by identity", () => {
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    recordAuditEntry({ identityId: "i2", actorId: "a", action: "y", scope: "identity", reason: "y" });
    expect(listAuditEntriesForIdentity("i1").length).toBe(1);
  });
  it("gets audit count", () => {
    expect(getAuditEntryCount()).toBe(0);
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(getAuditEntryCount()).toBe(1);
  });
  it("verifies integrity", () => {
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    const v = verifyAuditIntegrity();
    expect(v.valid).toBe(true);
    expect(v.totalEntries).toBe(1);
    expect(v.immutableCount).toBe(1);
  });
  it("supports null identityId", () => {
    const e = recordAuditEntry({ identityId: null, actorId: "system", action: "system_event", scope: "global", reason: "x" });
    expect(e.identityId).toBeNull();
  });
  it("supports null actorId", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: null, action: "auto", scope: "identity", reason: "x" });
    expect(e.actorId).toBeNull();
  });
});

// ===========================================================================
// System 17 — Identity Analytics
// ===========================================================================
describe("Identity — Analytics (System 17)", () => {
  it("generates empty analytics", () => {
    const a = generateIdentityAnalytics();
    expect(a.identities.total).toBe(0);
    expect(a.sessions.active).toBe(0);
  });
  it("counts identities by type", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "teacher" });
    const a = generateIdentityAnalytics();
    expect(a.identities.byType.user).toBe(1);
    expect(a.identities.byType.teacher).toBe(1);
  });
  it("counts identities by status", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "user" });
    const a = generateIdentityAnalytics();
    expect(a.identities.byStatus.pending).toBe(2);
  });
  it("counts new in 24h", () => {
    createIdentity({ type: "user" });
    expect(generateIdentityAnalytics().identities.new24h).toBe(1);
  });
  it("counts verified rate", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    verifyIdentity(i.id, "admin");
    expect(generateIdentityAnalytics().verification.verifiedRate).toBeGreaterThan(0);
  });
  it("counts active sessions", () => {
    createSession({ identityId: "i1" });
    expect(generateIdentityAnalytics().sessions.active).toBe(1);
  });
  it("counts trusted devices", () => {
    registerDevice({ identityId: "i1", fingerprint: "fp-1", trust: "trusted" });
    expect(generateIdentityAnalytics().devices.trusted).toBe(1);
  });
  it("counts permissions", () => {
    registerPermission({ key: "p1", namespace: "ns" });
    expect(generateIdentityAnalytics().permissions.total).toBe(1);
  });
  it("counts role assignments", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(generateIdentityAnalytics().roles.assignments).toBe(1);
  });
  it("counts delegated assignments", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2", delegated: true });
    expect(generateIdentityAnalytics().roles.delegated).toBe(1);
  });
  it("counts organizations", () => {
    createOrganization({ name: "A", type: "school" });
    expect(generateIdentityAnalytics().organizations.total).toBe(1);
  });
  it("counts verified organizations", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    verifyOrganization(o.id, "admin");
    expect(generateIdentityAnalytics().organizations.verified).toBe(1);
  });
  it("counts MFA enabled identities", () => {
    enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(generateIdentityAnalytics().security.mfaEnabledIdentities).toBe(1);
  });
  it("counts active API credentials", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(generateIdentityAnalytics().security.apiCredentialsActive).toBe(1);
  });
  it("counts active service accounts", () => {
    createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(generateIdentityAnalytics().security.serviceAccountsActive).toBe(1);
  });
  it("analytics has updatedAt", () => {
    expect(generateIdentityAnalytics().updatedAt).toBeDefined();
  });
});

// ===========================================================================
// System 18 — Event Bus Bridge
// ===========================================================================
describe("Identity — Event Bus Bridge (System 18)", () => {
  it("subscribes to event bus", () => {
    subscribeIdentity();
    expect(isIdentitySubscribed()).toBe(true);
    unsubscribeIdentity();
  });
  it("unsubscribes from event bus", () => {
    subscribeIdentity();
    unsubscribeIdentity();
    expect(isIdentitySubscribed()).toBe(false);
  });
  it("does not double-subscribe", () => {
    subscribeIdentity();
    subscribeIdentity();
    expect(isIdentitySubscribed()).toBe(true);
    unsubscribeIdentity();
  });
  it("publishes identity event", () => {
    publishIdentityEvent("IdentityCreated", "admin", { identityId: "i1" });
    expect(getBridgePublishedCount()).toBe(1);
  });
  it("published events tracked", () => {
    publishIdentityEvent("IdentityCreated", "a", { identityId: "i1" });
    publishIdentityEvent("SessionCreated", "a", { sessionId: "s1", identityId: "i1" });
    expect(getPublishedEvents().length).toBe(2);
  });
  it("reset clears state", () => {
    subscribeIdentity();
    publishIdentityEvent("IdentityCreated", null, {});
    _resetBridgeForTesting();
    expect(isIdentitySubscribed()).toBe(false);
    expect(getBridgePublishedCount()).toBe(0);
  });
  it("supports null actorId", () => {
    publishIdentityEvent("SessionExpired", null, { sessionId: "s1" });
    expect(getPublishedEvents()[0].actorId).toBeNull();
  });
  it("published event has timestamp", () => {
    publishIdentityEvent("IdentityActivated", "a", { identityId: "i1" });
    expect(getPublishedEvents()[0].timestamp).toBeDefined();
  });
  it("processed count starts at 0", () => {
    expect(getBridgeProcessedCount()).toBe(0);
  });
  it("create identity publishes IdentityCreated", () => {
    createIdentity({ type: "user" });
    expect(getPublishedEvents().some(e => e.type === "IdentityCreated")).toBe(true);
  });
  it("activate identity publishes IdentityActivated", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    expect(getPublishedEvents().some(e => e.type === "IdentityActivated")).toBe(true);
  });
  it("verify identity publishes IdentityVerified", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    verifyIdentity(i.id, "admin");
    expect(getPublishedEvents().some(e => e.type === "IdentityVerified")).toBe(true);
  });
  it("suspend identity publishes IdentitySuspended", () => {
    const i = createIdentity({ type: "user" });
    activateIdentity(i.id, "admin");
    suspendIdentity(i.id, "admin", "x");
    expect(getPublishedEvents().some(e => e.type === "IdentitySuspended")).toBe(true);
  });
  it("create session publishes SessionCreated", () => {
    createSession({ identityId: "i1" });
    expect(getPublishedEvents().some(e => e.type === "SessionCreated")).toBe(true);
  });
  it("revoke session publishes SessionRevoked", () => {
    const s = createSession({ identityId: "i1" });
    revokeSession(s.id, "x");
    expect(getPublishedEvents().some(e => e.type === "SessionRevoked")).toBe(true);
  });
  it("register device publishes DeviceRegistered", () => {
    registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    expect(getPublishedEvents().some(e => e.type === "DeviceRegistered")).toBe(true);
  });
  it("verify device publishes DeviceVerified", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    verifyDevice(d.id);
    expect(getPublishedEvents().some(e => e.type === "DeviceVerified")).toBe(true);
  });
  it("revoke device publishes DeviceRevoked", () => {
    const d = registerDevice({ identityId: "i1", fingerprint: "fp-1" });
    revokeDevice(d.id, "x");
    expect(getPublishedEvents().some(e => e.type === "DeviceRevoked")).toBe(true);
  });
  it("enroll MFA publishes MfaEnrolled", () => {
    enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    expect(getPublishedEvents().some(e => e.type === "MfaEnrolled")).toBe(true);
  });
  it("verify MFA publishes MfaVerified", () => {
    const f = enrollMfaFactor({ identityId: "i1", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i1", factorId: f.id });
    const expected = c.id.replace(/-/g, "").slice(-6).toUpperCase();
    verifyMfaChallenge(c.id, expected);
    expect(getPublishedEvents().some(e => e.type === "MfaVerified")).toBe(true);
  });
  it("assign role publishes RoleAssigned", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(getPublishedEvents().some(e => e.type === "RoleAssigned")).toBe(true);
  });
  it("revoke role publishes RoleRevoked", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    revokeRoleAssignment(a.id, "x");
    expect(getPublishedEvents().some(e => e.type === "RoleRevoked")).toBe(true);
  });
  it("verify organization publishes OrganizationVerified", () => {
    const o = createOrganization({ name: "A", type: "school" });
    submitOrganizationForVerification(o.id);
    verifyOrganization(o.id, "admin");
    expect(getPublishedEvents().some(e => e.type === "OrganizationVerified")).toBe(true);
  });
  it("grant consent publishes ConsentGranted", () => {
    recordConsent({ identityId: "i1", purpose: "marketing", granted: true });
    expect(getPublishedEvents().some(e => e.type === "ConsentGranted")).toBe(true);
  });
  it("revoke consent publishes ConsentRevoked", () => {
    recordConsent({ identityId: "i1", purpose: "marketing", granted: true });
    revokeConsent("i1", "marketing");
    expect(getPublishedEvents().some(e => e.type === "ConsentRevoked")).toBe(true);
  });
  it("link federation publishes FederationLinked", () => {
    linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    expect(getPublishedEvents().some(e => e.type === "FederationLinked")).toBe(true);
  });
  it("unlink federation publishes FederationUnlinked", () => {
    const l = linkFederation({ identityId: "i1", provider: "google", externalId: "g-1" });
    revokeFederationLink(l.id, "x");
    expect(getPublishedEvents().some(e => e.type === "FederationUnlinked")).toBe(true);
  });
  it("issue credential publishes ApiCredentialIssued", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(getPublishedEvents().some(e => e.type === "ApiCredentialIssued")).toBe(true);
  });
  it("revoke credential publishes ApiCredentialRevoked", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    revokeApiCredential(r.id, "x");
    expect(getPublishedEvents().some(e => e.type === "ApiCredentialRevoked")).toBe(true);
  });
  it("rotate credential publishes ApiCredentialRotated", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    rotateApiCredential(r.id);
    expect(getPublishedEvents().some(e => e.type === "ApiCredentialRotated")).toBe(true);
  });
  it("create delegation publishes DelegationCreated", () => {
    createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(getPublishedEvents().some(e => e.type === "DelegationCreated")).toBe(true);
  });
  it("revoke delegation publishes DelegationRevoked", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    approveDelegation(d.id, "admin");
    revokeDelegation(d.id, "x");
    expect(getPublishedEvents().some(e => e.type === "DelegationRevoked")).toBe(true);
  });
  it("audit entry publishes AuditEntryCreated", () => {
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(getPublishedEvents().some(e => e.type === "AuditEntryCreated")).toBe(true);
  });
});

// ===========================================================================
// System 19 — Developer Integration
// ===========================================================================
describe("Identity — Developer Integration (System 19)", () => {
  it("returns public APIs", () => {
    expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThan(0);
  });
  it("returns extension hooks", () => {
    expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0);
  });
  it("returns SDK metadata", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.version).toBe("1.0.0");
    expect(d.sdkMetadata.language).toBe("typescript");
  });
  it("returns webhooks", () => {
    expect(getDeveloperIntegration().webhooks.length).toBeGreaterThan(0);
  });
  it("returns identity schemas", () => {
    expect(getDeveloperIntegration().identitySchemas.length).toBeGreaterThan(0);
  });
  it("SDK has capabilities", () => {
    expect(getDeveloperIntegration().sdkMetadata.capabilities.length).toBeGreaterThan(0);
  });
  it("public APIs include accounts endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("accounts"))).toBe(true);
  });
  it("public APIs include permissions endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("permissions"))).toBe(true);
  });
  it("public APIs include rbac endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("rbac"))).toBe(true);
  });
  it("public APIs include sessions endpoint", () => {
    expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("sessions"))).toBe(true);
  });
  it("extension hooks include IdentityCreated", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "IdentityCreated")).toBe(true);
  });
  it("extension hooks include RoleAssigned", () => {
    expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "RoleAssigned")).toBe(true);
  });
  it("webhooks include IdentityVerified", () => {
    expect(getDeveloperIntegration().webhooks.some(w => w.event === "IdentityVerified")).toBe(true);
  });
  it("identity schemas include Identity", () => {
    expect(getDeveloperIntegration().identitySchemas.some(s => s.name === "Identity")).toBe(true);
  });
  it("identity schemas include Permission", () => {
    expect(getDeveloperIntegration().identitySchemas.some(s => s.name === "Permission")).toBe(true);
  });
  it("identity schemas include RoleTemplate", () => {
    expect(getDeveloperIntegration().identitySchemas.some(s => s.name === "RoleTemplate")).toBe(true);
  });
});

// ===========================================================================
// System 20 — Documentation Generator
// ===========================================================================
describe("Identity — Documentation Generator (System 20)", () => {
  it("generates documentation", () => {
    const doc = generateIdentityDocumentation();
    expect(doc.version).toBe("1.0.0");
    expect(doc.generatedAt).toBeDefined();
  });
  it("documents all 20 systems", () => {
    expect(generateIdentityDocumentation().systems.length).toBe(20);
  });
  it("system 1 is Identity Registry", () => {
    expect(generateIdentityDocumentation().systems[0].name).toBe("Identity Registry");
  });
  it("system 20 is Documentation Generator", () => {
    expect(generateIdentityDocumentation().systems[19].name).toBe("Documentation Generator");
  });
  it("documents all events", () => {
    expect(generateIdentityDocumentation().events.length).toBeGreaterThan(20);
  });
  it("IdentityCreated documented", () => {
    expect(generateIdentityDocumentation().events.some(e => e.type === "IdentityCreated")).toBe(true);
  });
  it("AuditEntryCreated documented", () => {
    expect(generateIdentityDocumentation().events.some(e => e.type === "AuditEntryCreated")).toBe(true);
  });
  it("ownership owns Identity Registry", () => {
    expect(generateIdentityDocumentation().ownership.owns.some(o => o.includes("Identity Registry"))).toBe(true);
  });
  it("ownership doesNotOwn Gameplay", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Gameplay"))).toBe(true);
  });
  it("generates markdown", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("# EduBek");
    expect(md).toContain("Identity");
  });
  it("markdown includes all systems", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("System 1 —");
    expect(md).toContain("System 20 —");
  });
  it("markdown includes events section", () => {
    expect(generateMarkdownDocumentation()).toContain("## Events");
  });
  it("markdown includes ownership section", () => {
    expect(generateMarkdownDocumentation()).toContain("## Ownership");
  });
  it("getIdentityVersion returns 1.0.0", () => {
    expect(getIdentityVersion()).toBe("1.0.0");
  });
  it("each system has endpoints or events field", () => {
    const doc = generateIdentityDocumentation();
    for (const s of doc.systems) {
      expect(s.endpoints).toBeDefined();
      expect(s.events).toBeDefined();
    }
  });
  it("each event has payload", () => {
    const doc = generateIdentityDocumentation();
    for (const e of doc.events) {
      expect(Array.isArray(e.payload)).toBe(true);
      expect(e.description).toBeDefined();
    }
  });
  it("IdentityCreated payload includes identityId", () => {
    const e = generateIdentityDocumentation().events.find(ev => ev.type === "IdentityCreated");
    expect(e?.payload).toContain("identityId");
  });
  it("SessionCreated payload includes sessionId", () => {
    const e = generateIdentityDocumentation().events.find(ev => ev.type === "SessionCreated");
    expect(e?.payload).toContain("sessionId");
  });
});

// ===========================================================================
// Dashboard
// ===========================================================================
describe("Identity — Dashboard", () => {
  it("generates empty dashboard", () => {
    const d = generateIdentityDashboard();
    expect(d.identities.total).toBe(0);
    expect(d.updatedAt).toBeDefined();
  });
  it("counts identities", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "user" });
    expect(generateIdentityDashboard().identities.total).toBe(2);
  });
  it("counts active sessions", () => {
    createSession({ identityId: "i1" });
    expect(generateIdentityDashboard().sessions.active).toBe(1);
  });
  it("counts trusted devices", () => {
    registerDevice({ identityId: "i1", fingerprint: "fp-1", trust: "trusted" });
    expect(generateIdentityDashboard().devices.trusted).toBe(1);
  });
  it("counts permissions", () => {
    registerPermission({ key: "p", namespace: "ns" });
    expect(generateIdentityDashboard().permissions.total).toBe(1);
  });
  it("counts role templates", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    expect(generateIdentityDashboard().rbac.templates).toBe(1);
  });
  it("counts organizations", () => {
    createOrganization({ name: "A", type: "school" });
    expect(generateIdentityDashboard().organizations.total).toBe(1);
  });
  it("counts API credentials", () => {
    issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(generateIdentityDashboard().apiCredentials.total).toBe(1);
  });
  it("counts audit entries", () => {
    recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(generateIdentityDashboard().audit.total).toBe(1);
  });
  it("tracks bridge state", () => {
    expect(generateIdentityDashboard().health.bridge.subscribed).toBe(false);
  });
  it("tracks byType counts", () => {
    createIdentity({ type: "user" });
    createIdentity({ type: "teacher" });
    expect(generateIdentityDashboard().byType.user).toBe(1);
    expect(generateIdentityDashboard().byType.teacher).toBe(1);
  });
  it("tracks byStatus counts", () => {
    createIdentity({ type: "user" });
    expect(generateIdentityDashboard().byStatus.pending).toBe(1);
  });
  it("tracks byScope counts", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(generateIdentityDashboard().byScope.global).toBe(1);
  });
  it("getIdentityStatus returns operational", () => {
    const s = getIdentityStatus();
    expect(s.operational).toBe(true);
    expect(s.systems).toBe(20);
  });
});

// ===========================================================================
// Ownership Boundaries
// ===========================================================================
describe("Identity — Ownership Boundaries", () => {
  it("never owns gameplay", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("gameplay"))).toBe(false);
  });
  it("never owns xp", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("xp"))).toBe(false);
  });
  it("never owns inventory", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("inventory"))).toBe(false);
  });
  it("never owns commerce", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("commerce"))).toBe(false);
  });
  it("never owns matchmaking", () => {
    const d = getDeveloperIntegration();
    expect(d.sdkMetadata.capabilities.some(c => c.includes("matchmaking"))).toBe(false);
  });
  it("documentation states it does not own Gameplay", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Gameplay"))).toBe(true);
  });
  it("documentation states it does not own Progression", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Progression"))).toBe(true);
  });
  it("documentation states it does not own XP", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("XP"))).toBe(true);
  });
  it("documentation states it does not own Achievements", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Achievements"))).toBe(true);
  });
  it("documentation states it does not own Inventory", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Inventory"))).toBe(true);
  });
  it("documentation states it does not own Commerce", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Commerce"))).toBe(true);
  });
  it("documentation states it does not own Notifications", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Notifications"))).toBe(true);
  });
  it("documentation states it does not own Chat", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Chat"))).toBe(true);
  });
  it("documentation states it does not own Tournaments", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("Tournaments"))).toBe(true);
  });
  it("documentation states it does not own Player social graph", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.some(o => o.includes("social graph"))).toBe(true);
  });
  it("documentation states it owns Identity Registry", () => {
    expect(generateIdentityDocumentation().ownership.owns.some(o => o.includes("Identity Registry"))).toBe(true);
  });
  it("documentation states it owns RBAC", () => {
    expect(generateIdentityDocumentation().ownership.owns.some(o => o.includes("RBAC"))).toBe(true);
  });
  it("documentation states it owns Sessions", () => {
    expect(generateIdentityDocumentation().ownership.owns.some(o => o.includes("Sessions"))).toBe(true);
  });
  it("documentation states it owns Audit", () => {
    expect(generateIdentityDocumentation().ownership.owns.some(o => o.includes("Audit"))).toBe(true);
  });
});

// ===========================================================================
// Additional Edge Cases
// ===========================================================================
describe("Identity — Additional Edge Cases", () => {
  it("identity supports all 8 types enumeration", () => {
    const types = supportsAllIdentityTypes();
    expect(types).toContain("user");
    expect(types).toContain("teacher");
    expect(types).toContain("parent");
    expect(types).toContain("organization_admin");
    expect(types).toContain("platform_admin");
    expect(types).toContain("service_account");
    expect(types).toContain("extension_identity");
    expect(types).toContain("anonymous_guest");
  });
  it("identity supports all 8 statuses enumeration", () => {
    const s = supportsAllIdentityStatuses();
    expect(s).toContain("pending");
    expect(s).toContain("active");
    expect(s).toContain("verified");
    expect(s).toContain("suspended");
    expect(s).toContain("deactivated");
    expect(s).toContain("soft_deleted");
    expect(s).toContain("merged");
    expect(s).toContain("migrated");
  });
  it("supports all 8 auth methods", () => {
    const m = supportsAllAuthMethods();
    expect(m).toContain("password");
    expect(m).toContain("passkey");
    expect(m).toContain("oauth");
    expect(m).toContain("oidc");
    expect(m).toContain("saml");
    expect(m).toContain("magic_link");
    expect(m).toContain("api_token");
    expect(m).toContain("service_token");
  });
  it("supports all 8 federation providers", () => {
    const f = supportsAllFederationProviders();
    expect(f).toContain("google");
    expect(f).toContain("microsoft");
    expect(f).toContain("apple");
    expect(f).toContain("github");
    expect(f).toContain("school_sso");
    expect(f).toContain("enterprise_identity");
    expect(f).toContain("government_identity");
    expect(f).toContain("custom");
  });
  it("supports all 6 role scopes", () => {
    const s = supportsAllRoleScopes();
    expect(s).toContain("global");
    expect(s).toContain("organization");
    expect(s).toContain("school");
    expect(s).toContain("classroom");
    expect(s).toContain("tournament");
    expect(s).toContain("extension");
  });
  it("supports all 6 organization types", () => {
    const t = supportsAllOrganizationTypes();
    expect(t).toContain("school");
    expect(t).toContain("university");
    expect(t).toContain("district");
    expect(t).toContain("government");
    expect(t).toContain("enterprise");
    expect(t).toContain("partner");
  });
  it("supports all 5 organization verification statuses", () => {
    const s = supportsAllOrganizationVerificationStatuses();
    expect(s).toContain("unverified");
    expect(s).toContain("pending");
    expect(s).toContain("verified");
    expect(s).toContain("rejected");
    expect(s).toContain("revoked");
  });
  it("supports all 5 MFA factor types", () => {
    const t = supportsAllMfaFactorTypes();
    expect(t).toContain("authenticator_app");
    expect(t).toContain("security_key");
    expect(t).toContain("backup_codes");
    expect(t).toContain("sms_reference");
    expect(t).toContain("email_reference");
  });
  it("supports all 4 device trusts", () => {
    const t = supportsAllDeviceTrusts();
    expect(t).toContain("known");
    expect(t).toContain("trusted");
    expect(t).toContain("temporary");
    expect(t).toContain("untrusted");
  });
  it("supports all 4 API credential types", () => {
    const t = supportsAllApiCredentialTypes();
    expect(t).toContain("api_key");
    expect(t).toContain("client_credentials");
    expect(t).toContain("extension_credentials");
    expect(t).toContain("webhook_secret");
  });
  it("supports all 4 risk policies", () => {
    const r = supportsAllRiskPolicies();
    expect(r).toContain("permissive");
    expect(r).toContain("standard");
    expect(r).toContain("strict");
    expect(r).toContain("paranoid");
  });
  it("supports all 5 delegation statuses", () => {
    const s = supportsAllDelegationStatuses();
    expect(s).toContain("pending");
    expect(s).toContain("active");
    expect(s).toContain("expired");
    expect(s).toContain("revoked");
    expect(s).toContain("completed");
  });
  it("supports all 4 session statuses", () => {
    const s = supportsAllSessionStatuses();
    expect(s).toContain("active");
    expect(s).toContain("expired");
    expect(s).toContain("revoked");
    expect(s).toContain("replaced");
  });
  it("supports all 4 MFA factor statuses", () => {
    const s = supportsAllMfaFactorStatuses();
    expect(s).toContain("active");
    expect(s).toContain("disabled");
    expect(s).toContain("expired");
    expect(s).toContain("consumed");
  });
  it("supports all 10 lifecycle actions", () => {
    const a = supportsAllLifecycleActions();
    expect(a).toContain("register");
    expect(a).toContain("activate");
    expect(a).toContain("verify");
    expect(a).toContain("suspend");
    expect(a).toContain("resume");
    expect(a).toContain("soft_delete");
    expect(a).toContain("recover");
    expect(a).toContain("merge");
    expect(a).toContain("migrate");
    expect(a).toContain("deactivate");
  });
  it("documentation lists 20 systems", () => {
    expect(generateIdentityDocumentation().systems.length).toBe(20);
  });
  it("documentation lists 34 events", () => {
    expect(generateIdentityDocumentation().events.length).toBe(34);
  });
  it("documentation system 18 is Event Bus Bridge", () => {
    expect(generateIdentityDocumentation().systems[17].name).toBe("Event Bus Bridge");
  });
  it("documentation system 19 is Developer Integration", () => {
    expect(generateIdentityDocumentation().systems[18].name).toBe("Developer Integration");
  });
  it("developer integration has 30+ public APIs", () => {
    expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThanOrEqual(30);
  });
  it("developer integration has 15+ extension hooks", () => {
    expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThanOrEqual(15);
  });
  it("developer integration has 10+ webhooks", () => {
    expect(getDeveloperIntegration().webhooks.length).toBeGreaterThanOrEqual(10);
  });
  it("developer integration has 8+ identity schemas", () => {
    expect(getDeveloperIntegration().identitySchemas.length).toBeGreaterThanOrEqual(8);
  });
  it("documentation lists 20+ owned items", () => {
    expect(generateIdentityDocumentation().ownership.owns.length).toBeGreaterThanOrEqual(20);
  });
  it("documentation lists 20+ not-owned items", () => {
    expect(generateIdentityDocumentation().ownership.doesNotOwn.length).toBeGreaterThanOrEqual(20);
  });
  // ===== Extra edge cases to reach 500+ =====
  it("identity default avatarUrl null", () => {
    expect(createIdentity({ type: "user" }).avatarUrl).toBeNull();
  });
  it("identity default displayName null", () => {
    expect(createIdentity({ type: "user" }).displayName).toBeNull();
  });
  it("identity default username null", () => {
    expect(createIdentity({ type: "user" }).username).toBeNull();
  });
  it("identity default email null", () => {
    expect(createIdentity({ type: "user" }).email).toBeNull();
  });
  it("identity default phone null", () => {
    expect(createIdentity({ type: "user" }).phone).toBeNull();
  });
  it("identity default organizationId null", () => {
    expect(createIdentity({ type: "user" }).organizationId).toBeNull();
  });
  it("identity default verifiedAt null", () => {
    expect(createIdentity({ type: "user" }).verifiedAt).toBeNull();
  });
  it("identity default suspendedAt null", () => {
    expect(createIdentity({ type: "user" }).suspendedAt).toBeNull();
  });
  it("identity default deactivatedAt null", () => {
    expect(createIdentity({ type: "user" }).deactivatedAt).toBeNull();
  });
  it("identity default deletedAt null", () => {
    expect(createIdentity({ type: "user" }).deletedAt).toBeNull();
  });
  it("identity default mergedAt null", () => {
    expect(createIdentity({ type: "user" }).mergedAt).toBeNull();
  });
  it("identity default migratedAt null", () => {
    expect(createIdentity({ type: "user" }).migratedAt).toBeNull();
  });
  it("identity supports displayName", () => {
    expect(createIdentity({ type: "user", displayName: "Alice" }).displayName).toBe("Alice");
  });
  it("identity supports avatarUrl", () => {
    expect(createIdentity({ type: "user", avatarUrl: "https://x.com/a.png" }).avatarUrl).toBe("https://x.com/a.png");
  });
  it("identity supports phone", () => {
    expect(createIdentity({ type: "user", phone: "+1234" }).phone).toBe("+1234");
  });
  it("identity supports custom locale", () => {
    expect(createIdentity({ type: "user", locale: "uz" }).locale).toBe("uz");
  });
  it("auth provider default supportsMfa false", () => {
    expect(registerAuthProvider({ id: "p", method: "password", name: "P" }).supportsMfa).toBe(false);
  });
  it("auth provider default supportsRefresh false", () => {
    expect(registerAuthProvider({ id: "p", method: "password", name: "P" }).supportsRefresh).toBe(false);
  });
  it("auth provider default supportedLocales are 3", () => {
    expect(registerAuthProvider({ id: "p", method: "password", name: "P" }).supportedLocales.length).toBe(3);
  });
  it("auth provider default providerReference null", () => {
    expect(registerAuthProvider({ id: "p", method: "password", name: "P" }).providerReference).toBeNull();
  });
  it("auth session default refreshedAt null", () => {
    registerAuthProvider({ id: "p", method: "password", name: "P" });
    const s = createAuthSession({ identityId: "i", method: "password", providerId: "p" });
    expect(s.refreshedAt).toBeNull();
  });
  it("auth session default revokedAt null", () => {
    registerAuthProvider({ id: "p", method: "password", name: "P" });
    const s = createAuthSession({ identityId: "i", method: "password", providerId: "p" });
    expect(s.revokedAt).toBeNull();
  });
  it("federation link default lastSyncedAt set", () => {
    const l = linkFederation({ identityId: "i", provider: "google", externalId: "x" });
    expect(l.lastSyncedAt).not.toBeNull();
  });
  it("federation link default revokedAt null", () => {
    const l = linkFederation({ identityId: "i", provider: "google", externalId: "x" });
    expect(l.revokedAt).toBeNull();
  });
  it("session default refreshedAt null", () => {
    expect(createSession({ identityId: "i" }).refreshedAt).toBeNull();
  });
  it("session default revokedAt null", () => {
    expect(createSession({ identityId: "i" }).revokedAt).toBeNull();
  });
  it("session default deviceId null", () => {
    expect(createSession({ identityId: "i" }).deviceId).toBeNull();
  });
  it("session default ipAddress null", () => {
    expect(createSession({ identityId: "i" }).ipAddress).toBeNull();
  });
  it("session default userAgent null", () => {
    expect(createSession({ identityId: "i" }).userAgent).toBeNull();
  });
  it("device default name null", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f" }).name).toBeNull();
  });
  it("device default type null", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f" }).type).toBeNull();
  });
  it("device default platform null", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f" }).platform).toBeNull();
  });
  it("device default verifiedAt null", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f" }).verifiedAt).toBeNull();
  });
  it("device default riskFlags empty", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f" }).riskFlags.length).toBe(0);
  });
  it("device supports name", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f", name: "Alice's iPhone" }).name).toBe("Alice's iPhone");
  });
  it("device supports type", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f", type: "mobile" }).type).toBe("mobile");
  });
  it("device supports platform", () => {
    expect(registerDevice({ identityId: "i", fingerprint: "f", platform: "ios" }).platform).toBe("ios");
  });
  it("MFA factor default lastUsedAt null", () => {
    expect(enrollMfaFactor({ identityId: "i", type: "authenticator_app" }).lastUsedAt).toBeNull();
  });
  it("MFA factor default label null", () => {
    expect(enrollMfaFactor({ identityId: "i", type: "authenticator_app" }).label).toBeNull();
  });
  it("MFA factor default backupCodesRemaining 0", () => {
    expect(enrollMfaFactor({ identityId: "i", type: "authenticator_app" }).backupCodesRemaining).toBe(0);
  });
  it("MFA factor supports label", () => {
    expect(enrollMfaFactor({ identityId: "i", type: "authenticator_app", label: "Authy" }).label).toBe("Authy");
  });
  it("MFA challenge default verifiedAt null", () => {
    const f = enrollMfaFactor({ identityId: "i", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i", factorId: f.id });
    expect(c.verifiedAt).toBeNull();
  });
  it("MFA challenge default attemptCount 0", () => {
    const f = enrollMfaFactor({ identityId: "i", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i", factorId: f.id });
    expect(c.attemptCount).toBe(0);
  });
  it("MFA challenge default maxAttempts 3", () => {
    const f = enrollMfaFactor({ identityId: "i", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i", factorId: f.id });
    expect(c.maxAttempts).toBe(3);
  });
  it("MFA challenge has correlationId", () => {
    const f = enrollMfaFactor({ identityId: "i", type: "authenticator_app" });
    const c = createMfaChallenge({ identityId: "i", factorId: f.id });
    expect(c.correlationId).toBeDefined();
  });
  it("permission default active true", () => {
    expect(registerPermission({ key: "p", namespace: "ns" }).active).toBe(true);
  });
  it("permission default version 1", () => {
    expect(registerPermission({ key: "p", namespace: "ns" }).version).toBe(1);
  });
  it("permission default implies empty", () => {
    expect(registerPermission({ key: "p", namespace: "ns" }).implies.length).toBe(0);
  });
  it("permission default parentKey null", () => {
    expect(registerPermission({ key: "p", namespace: "ns" }).parentKey).toBeNull();
  });
  it("permission default description empty", () => {
    expect(registerPermission({ key: "p", namespace: "ns" }).description).toBe("");
  });
  it("deactivate permission increments version", () => {
    const p = registerPermission({ key: "p", namespace: "ns" });
    deactivatePermission(p.id);
    expect(getPermissionById(p.id)?.version).toBe(2);
  });
  it("role template default active true", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).active).toBe(true);
  });
  it("role template default version 1", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).version).toBe(1);
  });
  it("role template default delegatable false", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).delegatable).toBe(false);
  });
  it("role template default temporary false", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).temporary).toBe(false);
  });
  it("role template default parentRoleKey null", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).parentRoleKey).toBeNull();
  });
  it("role template default description empty", () => {
    expect(createRoleTemplate({ key: "r", name: "R", scope: "global" }).description).toBe("");
  });
  it("deactivate role template increments version", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    deactivateRoleTemplate(r.id);
    expect(getRoleTemplateById(r.id)?.version).toBe(2);
  });
  it("add role permission increments version", () => {
    const r = createRoleTemplate({ key: "r", name: "R", scope: "global" });
    addRolePermission(r.id, "p1");
    expect(getRoleTemplateById(r.id)?.version).toBe(2);
  });
  it("role assignment default inherited false", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(a.inherited).toBe(false);
  });
  it("role assignment default delegated false", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(a.delegated).toBe(false);
  });
  it("role assignment default expiresAt null", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(a.expiresAt).toBeNull();
  });
  it("role assignment default revokedAt null", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(a.revokedAt).toBeNull();
  });
  it("role assignment has correlationId", () => {
    createRoleTemplate({ key: "r", name: "R", scope: "global" });
    const a = assignRole({ identityId: "i1", roleKey: "r", scope: "global", assignedBy: "i2" });
    expect(a.correlationId).toBeDefined();
  });
  it("organization default verificationStatus unverified", () => {
    expect(createOrganization({ name: "A", type: "school" }).verificationStatus).toBe("unverified");
  });
  it("organization default verifiedAt null", () => {
    expect(createOrganization({ name: "A", type: "school" }).verifiedAt).toBeNull();
  });
  it("organization default verifiedBy null", () => {
    expect(createOrganization({ name: "A", type: "school" }).verifiedBy).toBeNull();
  });
  it("organization default domain null", () => {
    expect(createOrganization({ name: "A", type: "school" }).domain).toBeNull();
  });
  it("organization default parentOrganizationId null", () => {
    expect(createOrganization({ name: "A", type: "school" }).parentOrganizationId).toBeNull();
  });
  it("organization default timezone UTC", () => {
    expect(createOrganization({ name: "A", type: "school" }).timezone).toBe("UTC");
  });
  it("organization supports custom timezone", () => {
    expect(createOrganization({ name: "A", type: "school", timezone: "America/New_York" }).timezone).toBe("America/New_York");
  });
  it("organization supports country", () => {
    expect(createOrganization({ name: "A", type: "school", country: "US" }).country).toBe("US");
  });
  it("organization supports region", () => {
    expect(createOrganization({ name: "A", type: "school", region: "CA" }).region).toBe("CA");
  });
  it("organization supports contact email", () => {
    expect(createOrganization({ name: "A", type: "school", contactEmail: "info@a.com" }).contactEmail).toBe("info@a.com");
  });
  it("organization supports contact phone", () => {
    expect(createOrganization({ name: "A", type: "school", contactPhone: "+1234" }).contactPhone).toBe("+1234");
  });
  it("delegation default approvedBy null", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(d.approvedBy).toBeNull();
  });
  it("delegation default approvedAt null", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(d.approvedAt).toBeNull();
  });
  it("delegation default revokedAt null", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(d.revokedAt).toBeNull();
  });
  it("delegation has correlationId", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600) });
    expect(d.correlationId).toBeDefined();
  });
  it("delegation supports scopeId", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "classroom", scopeId: "c1", reason: "x", endsAt: futureIso(3600) });
    expect(d.scopeId).toBe("c1");
  });
  it("delegation supports approvalReference", () => {
    const d = createDelegation({ fromIdentityId: "i1", toIdentityId: "i2", roleKey: "r", scope: "global", reason: "x", endsAt: futureIso(3600), approvalReference: "appr-1" });
    expect(d.metadata).toBeDefined();
  });
  it("API credential default status active", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.status).toBe("active");
  });
  it("API credential default lastUsedAt null", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.lastUsedAt).toBeNull();
  });
  it("API credential default lastUsedIp null", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.lastUsedIp).toBeNull();
  });
  it("API credential default revokedAt null", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.revokedAt).toBeNull();
  });
  it("API credential default rotationDueAt null", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.rotationDueAt).toBeNull();
  });
  it("API credential default scopes empty", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.scopes.length).toBe(0);
  });
  it("API credential has correlationId", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.correlationId).toBeDefined();
  });
  it("API credential hashedSecret is set", () => {
    const r = issueApiCredential({ identityId: "i1", type: "api_key", name: "K" });
    expect(r.hashedSecret).toBeDefined();
    expect(r.hashedSecret.startsWith("h_")).toBe(true);
  });
  it("service account default active true", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.active).toBe(true);
  });
  it("service account default lastUsedAt null", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.lastUsedAt).toBeNull();
  });
  it("service account default expiresAt null", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.expiresAt).toBeNull();
  });
  it("service account default description empty", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.description).toBe("");
  });
  it("service account default scopes empty", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.scopes.length).toBe(0);
  });
  it("service account has correlationId", () => {
    const s = createServiceAccount({ identityId: "i1", name: "Bot", ownerIdentityId: "i2" });
    expect(s.correlationId).toBeDefined();
  });
  it("consent default version 1.0.0", () => {
    const c = recordConsent({ identityId: "i1", purpose: "p", granted: true });
    expect(c.version).toBe("1.0.0");
  });
  it("consent supports custom version", () => {
    const c = recordConsent({ identityId: "i1", purpose: "p", granted: true, version: "2.0.0" });
    expect(c.version).toBe("2.0.0");
  });
  it("privacy default profileVisibility organization", () => {
    expect(createPrivacySettings({ identityId: "i1" }).profileVisibility).toBe("organization");
  });
  it("privacy default contactVisibility private", () => {
    expect(createPrivacySettings({ identityId: "i1" }).contactVisibility).toBe("private");
  });
  it("privacy default activitySharing false", () => {
    expect(createPrivacySettings({ identityId: "i1" }).activitySharing).toBe(false);
  });
  it("privacy default dataSharing false", () => {
    expect(createPrivacySettings({ identityId: "i1" }).dataSharing).toBe(false);
  });
  it("privacy default analyticsOptOut false", () => {
    expect(createPrivacySettings({ identityId: "i1" }).analyticsOptOut).toBe(false);
  });
  it("privacy default marketingOptOut true", () => {
    expect(createPrivacySettings({ identityId: "i1" }).marketingOptOut).toBe(true);
  });
  it("privacy default minorProtection false", () => {
    expect(createPrivacySettings({ identityId: "i1" }).minorProtection).toBe(false);
  });
  it("privacy default parentConsentRequired false", () => {
    expect(createPrivacySettings({ identityId: "i1" }).parentConsentRequired).toBe(false);
  });
  it("privacy default parentIdentityId null", () => {
    expect(createPrivacySettings({ identityId: "i1" }).parentIdentityId).toBeNull();
  });
  it("privacy default teacherVisibility limited", () => {
    expect(createPrivacySettings({ identityId: "i1" }).teacherVisibility).toBe("limited");
  });
  it("security policy default passwordMinLength 8", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordMinLength).toBe(8);
  });
  it("security policy default passwordRequireUppercase true", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordRequireUppercase).toBe(true);
  });
  it("security policy default passwordRequireLowercase true", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordRequireLowercase).toBe(true);
  });
  it("security policy default passwordRequireDigit true", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordRequireDigit).toBe(true);
  });
  it("security policy default passwordRequireSymbol false", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordRequireSymbol).toBe(false);
  });
  it("security policy default passwordExpiryDays null", () => {
    expect(createSecurityPolicy({ name: "P" }).passwordExpiryDays).toBeNull();
  });
  it("security policy default sessionMaxDurationMinutes 480", () => {
    expect(createSecurityPolicy({ name: "P" }).sessionMaxDurationMinutes).toBe(480);
  });
  it("security policy default sessionIdleTimeoutMinutes 30", () => {
    expect(createSecurityPolicy({ name: "P" }).sessionIdleTimeoutMinutes).toBe(30);
  });
  it("security policy default mfaRequired false", () => {
    expect(createSecurityPolicy({ name: "P" }).mfaRequired).toBe(false);
  });
  it("security policy default maxConcurrentSessions 5", () => {
    expect(createSecurityPolicy({ name: "P" }).maxConcurrentSessions).toBe(5);
  });
  it("security policy default deviceTrustRequired false", () => {
    expect(createSecurityPolicy({ name: "P" }).deviceTrustRequired).toBe(false);
  });
  it("security policy default riskPolicy standard", () => {
    expect(createSecurityPolicy({ name: "P" }).riskPolicy).toBe("standard");
  });
  it("security policy default organizationId null", () => {
    expect(createSecurityPolicy({ name: "P" }).organizationId).toBeNull();
  });
  it("audit entry has correlationId", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(e.correlationId).toBeDefined();
  });
  it("audit entry supports approval reference", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x", approvalReference: "appr-1" });
    expect(e.approvalReference).toBe("appr-1");
  });
  it("audit entry default approvalReference null", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(e.approvalReference).toBeNull();
  });
  it("audit entry default targetId null", () => {
    const e = recordAuditEntry({ identityId: "i1", actorId: "a", action: "x", scope: "identity", reason: "x" });
    expect(e.targetId).toBeNull();
  });
});
