/**
 * In-memory repository for Identity Platform. Phase 6G.18.
 * Stateless, Redis-compatible storage abstraction.
 */
import type {
  Identity, LifecycleEvent,
  AuthProviderConfig, AuthSession,
  FederationLink,
  Session, Device,
  MfaFactor, MfaChallenge,
  Permission, RoleTemplate, RoleAssignment,
  OrganizationIdentity,
  Delegation,
  ApiCredential, ServiceAccount,
  ConsentRecord, PrivacySettings,
  SecurityPolicy,
  IdentityAuditEntry,
} from "./types";

const identities = new Map<string, Identity>();
const lifecycleEvents = new Map<string, LifecycleEvent[]>(); // by identityId
const authProviders = new Map<string, AuthProviderConfig>();
const authSessions = new Map<string, AuthSession>();
const federationLinks = new Map<string, FederationLink>();
const sessions = new Map<string, Session>();
const devices = new Map<string, Device>();
const mfaFactors = new Map<string, MfaFactor>();
const mfaChallenges = new Map<string, MfaChallenge>();
const permissions = new Map<string, Permission>();
const roleTemplates = new Map<string, RoleTemplate>();
const roleAssignments = new Map<string, RoleAssignment>();
const organizations = new Map<string, OrganizationIdentity>();
const delegations = new Map<string, Delegation>();
const apiCredentials = new Map<string, ApiCredential>();
const serviceAccounts = new Map<string, ServiceAccount>();
const consentRecords = new Map<string, ConsentRecord[]>(); // by identityId
const privacySettings = new Map<string, PrivacySettings>();
const securityPolicies = new Map<string, SecurityPolicy>();
const audit: IdentityAuditEntry[] = [];

// === Identities ===
export const storeIdentity = (i: Identity) => identities.set(i.id, i);
export const getIdentity = (id: string) => identities.get(id) ?? null;
export const getIdentityByEmail = (email: string) => Array.from(identities.values()).find(i => i.email === email) ?? null;
export const getIdentityByUsername = (username: string) => Array.from(identities.values()).find(i => i.username === username) ?? null;
export const getAllIdentities = () => Array.from(identities.values());

// === Lifecycle events ===
export const storeLifecycleEvent = (e: LifecycleEvent) => {
  const list = lifecycleEvents.get(e.identityId) ?? [];
  list.push(e);
  lifecycleEvents.set(e.identityId, list);
};
export const getLifecycleEvents = (identityId: string) => lifecycleEvents.get(identityId) ?? [];

// === Auth providers ===
export const storeAuthProvider = (p: AuthProviderConfig) => authProviders.set(p.id, p);
export const getAuthProvider = (id: string) => authProviders.get(id) ?? null;
export const getAllAuthProviders = () => Array.from(authProviders.values());

// === Auth sessions ===
export const storeAuthSession = (s: AuthSession) => authSessions.set(s.id, s);
export const getAuthSession = (id: string) => authSessions.get(id) ?? null;
export const getAllAuthSessions = () => Array.from(authSessions.values());

// === Federation links ===
export const storeFederationLink = (l: FederationLink) => federationLinks.set(l.id, l);
export const getFederationLink = (id: string) => federationLinks.get(id) ?? null;
export const getAllFederationLinks = () => Array.from(federationLinks.values());

// === Sessions ===
export const storeSession = (s: Session) => sessions.set(s.id, s);
export const getSession = (id: string) => sessions.get(id) ?? null;
export const getAllSessions = () => Array.from(sessions.values());

// === Devices ===
export const storeDevice = (d: Device) => devices.set(d.id, d);
export const getDevice = (id: string) => devices.get(id) ?? null;
export const getAllDevices = () => Array.from(devices.values());

// === MFA ===
export const storeMfaFactor = (f: MfaFactor) => mfaFactors.set(f.id, f);
export const getMfaFactor = (id: string) => mfaFactors.get(id) ?? null;
export const getAllMfaFactors = () => Array.from(mfaFactors.values());
export const storeMfaChallenge = (c: MfaChallenge) => mfaChallenges.set(c.id, c);
export const getMfaChallenge = (id: string) => mfaChallenges.get(id) ?? null;
export const getAllMfaChallenges = () => Array.from(mfaChallenges.values());

// === Permissions ===
export const storePermission = (p: Permission) => permissions.set(p.id, p);
export const getPermission = (id: string) => permissions.get(id) ?? null;
export const getPermissionByKey = (key: string) => Array.from(permissions.values()).find(p => p.key === key) ?? null;
export const getAllPermissions = () => Array.from(permissions.values());

// === Role templates ===
export const storeRoleTemplate = (r: RoleTemplate) => roleTemplates.set(r.id, r);
export const getRoleTemplate = (id: string) => roleTemplates.get(id) ?? null;
export const getRoleTemplateByKey = (key: string) => Array.from(roleTemplates.values()).find(r => r.key === key) ?? null;
export const getAllRoleTemplates = () => Array.from(roleTemplates.values());

// === Role assignments ===
export const storeRoleAssignment = (a: RoleAssignment) => roleAssignments.set(a.id, a);
export const getRoleAssignment = (id: string) => roleAssignments.get(id) ?? null;
export const getAllRoleAssignments = () => Array.from(roleAssignments.values());

// === Organizations ===
export const storeOrganization = (o: OrganizationIdentity) => organizations.set(o.id, o);
export const getOrganization = (id: string) => organizations.get(id) ?? null;
export const getAllOrganizations = () => Array.from(organizations.values());

// === Delegations ===
export const storeDelegation = (d: Delegation) => delegations.set(d.id, d);
export const getDelegation = (id: string) => delegations.get(id) ?? null;
export const getAllDelegations = () => Array.from(delegations.values());

// === API credentials ===
export const storeApiCredential = (c: ApiCredential) => apiCredentials.set(c.id, c);
export const getApiCredential = (id: string) => apiCredentials.get(id) ?? null;
export const getApiCredentialByKeyPrefix = (prefix: string) => Array.from(apiCredentials.values()).find(c => c.keyPrefix === prefix) ?? null;
export const getAllApiCredentials = () => Array.from(apiCredentials.values());

// === Service accounts ===
export const storeServiceAccount = (s: ServiceAccount) => serviceAccounts.set(s.id, s);
export const getServiceAccount = (id: string) => serviceAccounts.get(id) ?? null;
export const getAllServiceAccounts = () => Array.from(serviceAccounts.values());

// === Consent ===
export const storeConsentRecord = (c: ConsentRecord) => {
  const list = consentRecords.get(c.identityId) ?? [];
  const idx = list.findIndex(r => r.purpose === c.purpose);
  if (idx >= 0) list[idx] = c; else list.push(c);
  consentRecords.set(c.identityId, list);
};
export const getConsentRecords = (identityId: string) => consentRecords.get(identityId) ?? [];
export const getAllConsentRecords = () => {
  const all: ConsentRecord[] = [];
  for (const list of consentRecords.values()) all.push(...list);
  return all;
};

// === Privacy ===
export const storePrivacySettings = (p: PrivacySettings) => privacySettings.set(p.identityId, p);
export const getPrivacySettings = (identityId: string) => privacySettings.get(identityId) ?? null;
export const getAllPrivacySettings = () => Array.from(privacySettings.values());

// === Security policies ===
export const storeSecurityPolicy = (p: SecurityPolicy) => securityPolicies.set(p.id, p);
export const getSecurityPolicy = (id: string) => securityPolicies.get(id) ?? null;
export const getAllSecurityPolicies = () => Array.from(securityPolicies.values());

// === Audit ===
export const appendAudit = (e: IdentityAuditEntry) => audit.push(e);
export const getAllAuditEntries = () => audit.slice();
export const getAuditEntriesForIdentity = (identityId: string) => audit.filter(e => e.identityId === identityId);

// === Reset ===
export function _resetRepositoryForTesting() {
  identities.clear(); lifecycleEvents.clear();
  authProviders.clear(); authSessions.clear();
  federationLinks.clear();
  sessions.clear(); devices.clear();
  mfaFactors.clear(); mfaChallenges.clear();
  permissions.clear(); roleTemplates.clear(); roleAssignments.clear();
  organizations.clear();
  delegations.clear();
  apiCredentials.clear(); serviceAccounts.clear();
  consentRecords.clear(); privacySettings.clear();
  securityPolicies.clear();
  audit.length = 0;
}
