/**
 * EduBek — Identity, Access Management & Federation Platform types.
 * Phase 6G.18: Single source of truth for identity, auth, RBAC, sessions,
 * devices, federation, permissions, privacy, and identity audit.
 *
 * Owns ONLY identity. Never owns gameplay, progression, XP, achievements,
 * inventory, commerce, notifications, analytics (outside identity),
 * matchmaking, tournaments, leaderboards, broadcasts, configuration,
 * social relationships, or player profiles beyond identity metadata.
 *
 * All cross-module communication happens exclusively through the Event Bus.
 */

// ===========================================================================
// System 1 — Identity Registry
// ===========================================================================
export type IdentityType =
  | "user" | "teacher" | "parent" | "organization_admin"
  | "platform_admin" | "service_account" | "extension_identity" | "anonymous_guest";

export type IdentityStatus =
  | "pending" | "active" | "verified" | "suspended"
  | "deactivated" | "soft_deleted" | "merged" | "migrated";

export interface Identity {
  id: string; type: IdentityType;
  status: IdentityStatus;
  username: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  organizationId: string | null;
  primaryIdentityId: string | null; // for merged identities
  version: number;
  createdAt: string; updatedAt: string;
  activatedAt: string | null;
  verifiedAt: string | null;
  suspendedAt: string | null;
  deactivatedAt: string | null;
  deletedAt: string | null;
  mergedAt: string | null;
  migratedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Identity Lifecycle
// ===========================================================================
export type LifecycleAction =
  | "register" | "activate" | "verify" | "suspend" | "resume"
  | "soft_delete" | "recover" | "merge" | "migrate" | "deactivate";

export interface LifecycleEvent {
  id: string; identityId: string;
  action: LifecycleAction;
  actorId: string | null;
  reason: string;
  beforeStatus: IdentityStatus;
  afterStatus: IdentityStatus;
  correlationId: string;
  approvalReference: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 3 — Authentication Abstraction
// ===========================================================================
export type AuthMethod =
  | "password" | "passkey" | "oauth" | "oidc" | "saml"
  | "magic_link" | "api_token" | "service_token";

export type AuthProviderStatus = "active" | "inactive" | "maintenance" | "deprecated";

export interface AuthProviderConfig {
  id: string; method: AuthMethod;
  name: string; status: AuthProviderStatus;
  supportsMfa: boolean;
  supportsRefresh: boolean;
  supportedLocales: string[];
  providerReference: string | null;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  id: string; identityId: string;
  method: AuthMethod; providerId: string;
  issuedAt: string; expiresAt: string | null;
  refreshedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 4 — Identity Federation
// ===========================================================================
export type FederationProvider =
  | "google" | "microsoft" | "apple" | "github"
  | "school_sso" | "enterprise_identity" | "government_identity" | "custom";

export type FederationLinkStatus = "active" | "revoked" | "expired";

export interface FederationLink {
  id: string; identityId: string;
  provider: FederationProvider;
  externalId: string;
  externalEmail: string | null;
  externalMetadata: Record<string, unknown>;
  status: FederationLinkStatus;
  linkedAt: string; revokedAt: string | null;
  lastSyncedAt: string | null;
  correlationId: string;
}

// ===========================================================================
// System 5 — Session Platform
// ===========================================================================
export type SessionStatus = "active" | "expired" | "revoked" | "replaced";

export interface Session {
  id: string; identityId: string;
  deviceId: string | null;
  status: SessionStatus;
  issuedAt: string; expiresAt: string;
  lastActiveAt: string;
  refreshedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Device Registry
// ===========================================================================
export type DeviceTrust = "known" | "trusted" | "temporary" | "untrusted";
export type DeviceStatus = "active" | "revoked" | "expired";

export interface Device {
  id: string; identityId: string;
  fingerprint: string;
  name: string | null;
  type: string | null;
  platform: string | null;
  trust: DeviceTrust;
  status: DeviceStatus;
  riskFlags: string[];
  firstSeenAt: string; lastSeenAt: string;
  verifiedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Multi-Factor Authentication
// ===========================================================================
export type MfaFactorType =
  | "authenticator_app" | "security_key" | "backup_codes"
  | "sms_reference" | "email_reference";

export type MfaFactorStatus = "active" | "disabled" | "expired" | "consumed";

export interface MfaFactor {
  id: string; identityId: string;
  type: MfaFactorType;
  status: MfaFactorStatus;
  label: string | null;
  enrolledAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  backupCodesRemaining: number;
  metadata: Record<string, unknown>;
}

export interface MfaChallenge {
  id: string; identityId: string;
  factorId: string;
  status: "pending" | "verified" | "failed" | "expired";
  issuedAt: string; verifiedAt: string | null;
  expiresAt: string;
  attemptCount: number;
  maxAttempts: number;
  correlationId: string;
}

// ===========================================================================
// System 8 — Permission Registry
// ===========================================================================
export interface Permission {
  id: string; key: string;
  namespace: string;
  description: string;
  parentKey: string | null;
  implies: string[];
  version: number;
  active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 9 — RBAC Platform
// ===========================================================================
export type RoleScope = "global" | "organization" | "school" | "classroom" | "tournament" | "extension";

export interface RoleTemplate {
  id: string; key: string;
  name: string; description: string;
  scope: RoleScope;
  permissions: string[];
  parentRoleKey: string | null;
  delegatable: boolean;
  temporary: boolean;
  version: number;
  active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface RoleAssignment {
  id: string; identityId: string;
  roleKey: string;
  scope: RoleScope;
  scopeId: string | null;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  inherited: boolean;
  delegated: boolean;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Organization Identity
// ===========================================================================
export type OrganizationType =
  | "school" | "university" | "district" | "government"
  | "enterprise" | "partner";

export type OrganizationVerificationStatus =
  | "unverified" | "pending" | "verified" | "rejected" | "revoked";

export interface OrganizationIdentity {
  id: string; name: string;
  type: OrganizationType;
  verificationStatus: OrganizationVerificationStatus;
  parentOrganizationId: string | null;
  domain: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string | null;
  region: string | null;
  timezone: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Delegation Platform
// ===========================================================================
export type DelegationStatus = "pending" | "active" | "expired" | "revoked" | "completed";

export interface Delegation {
  id: string;
  fromIdentityId: string;
  toIdentityId: string;
  roleKey: string;
  scope: RoleScope;
  scopeId: string | null;
  reason: string;
  status: DelegationStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  startsAt: string;
  endsAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 12 — API Credentials
// ===========================================================================
export type ApiCredentialType =
  | "api_key" | "client_credentials" | "extension_credentials" | "webhook_secret";

export type ApiCredentialStatus = "active" | "revoked" | "expired" | "rotating";

export interface ApiCredential {
  id: string; identityId: string;
  type: ApiCredentialType;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  scopes: string[];
  status: ApiCredentialStatus;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  rotationDueAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 13 — Service Accounts
// ===========================================================================
export interface ServiceAccount {
  id: string; identityId: string;
  name: string;
  description: string;
  scopes: string[];
  ownerIdentityId: string;
  active: boolean;
  issuedAt: string; expiresAt: string | null;
  lastUsedAt: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 14 — Consent & Privacy
// ===========================================================================
export interface ConsentRecord {
  id: string; identityId: string;
  purpose: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  version: string;
  metadata: Record<string, unknown>;
}

export interface PrivacySettings {
  identityId: string;
  profileVisibility: "public" | "organization" | "private";
  contactVisibility: "public" | "organization" | "private";
  activitySharing: boolean;
  dataSharing: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
  minorProtection: boolean;
  parentConsentRequired: boolean;
  parentIdentityId: string | null;
  teacherVisibility: "full" | "limited" | "none";
  organizationOverrides: Record<string, boolean>;
  updatedAt: string;
}

// ===========================================================================
// System 15 — Security Policies
// ===========================================================================
export interface SecurityPolicy {
  id: string; name: string;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireDigit: boolean;
  passwordRequireSymbol: boolean;
  passwordExpiryDays: number | null;
  sessionMaxDurationMinutes: number;
  sessionIdleTimeoutMinutes: number;
  mfaRequired: boolean;
  mfaRequiredForRoles: string[];
  maxConcurrentSessions: number;
  deviceTrustRequired: boolean;
  riskPolicy: "permissive" | "standard" | "strict" | "paranoid";
  organizationId: string | null;
  active: boolean;
  version: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 16 — Identity Audit
// ===========================================================================
export interface IdentityAuditEntry {
  id: string; identityId: string | null;
  actorId: string | null;
  action: string;
  scope: string;
  targetId: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  correlationId: string;
  approvalReference: string | null;
  occurredAt: string;
  immutable: true;
}

// ===========================================================================
// System 17 — Identity Analytics
// ===========================================================================
export interface IdentityAnalytics {
  identities: {
    total: number;
    byType: Record<IdentityType, number>;
    byStatus: Record<IdentityStatus, number>;
    new24h: number; new7d: number; new30d: number;
  };
  verification: {
    verifiedRate: number;
    pendingCount: number;
    rejectedCount: number;
  };
  sessions: {
    active: number;
    avgDurationMinutes: number;
    revoked24h: number;
  };
  devices: {
    total: number;
    trusted: number;
    revoked24h: number;
  };
  permissions: {
    total: number;
    assignments: number;
    byScope: Record<RoleScope, number>;
  };
  roles: {
    templates: number;
    assignments: number;
    delegated: number;
    temporary: number;
  };
  organizations: {
    total: number;
    verified: number;
    byType: Record<OrganizationType, number>;
  };
  security: {
    mfaEnabledIdentities: number;
    apiCredentialsActive: number;
    serviceAccountsActive: number;
  };
  updatedAt: string;
}

// ===========================================================================
// System 18 — Event Bus Bridge
// ===========================================================================
export type IdentityEventType =
  | "IdentityCreated" | "IdentityActivated" | "IdentityVerified"
  | "IdentitySuspended" | "IdentityDeactivated" | "IdentityRecovered"
  | "IdentityMerged" | "IdentityMigrated" | "IdentityDeleted"
  | "SessionCreated" | "SessionRevoked" | "SessionExpired"
  | "DeviceRegistered" | "DeviceRevoked" | "DeviceVerified"
  | "MfaEnrolled" | "MfaVerified" | "MfaDisabled"
  | "RoleAssigned" | "RoleRevoked"
  | "PermissionGranted" | "PermissionRevoked"
  | "OrganizationVerified" | "OrganizationRejected"
  | "DelegationCreated" | "DelegationRevoked"
  | "ApiCredentialIssued" | "ApiCredentialRevoked" | "ApiCredentialRotated"
  | "ConsentGranted" | "ConsentRevoked"
  | "FederationLinked" | "FederationUnlinked"
  | "AuditEntryCreated";

// ===========================================================================
// System 19 — Developer Integration
// ===========================================================================
export interface IdentityDeveloperIntegration {
  publicAPIs: Array<{
    path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description: string; authRequired: boolean; scope: string;
  }>;
  extensionHooks: Array<{
    id: string; name: string; triggerEvent: IdentityEventType;
    description: string;
  }>;
  sdkMetadata: {
    version: string; language: string; docsUrl: string;
    capabilities: string[];
  };
  webhooks: Array<{
    id: string; event: IdentityEventType; description: string;
  }>;
  identitySchemas: Array<{
    name: string; fields: string[];
  }>;
}

// ===========================================================================
// System 20 — Documentation Generator
// ===========================================================================
export interface IdentityDocumentation {
  version: string; generatedAt: string;
  systems: Array<{
    id: number; name: string; description: string;
    endpoints: string[]; events: string[];
  }>;
  events: Array<{
    type: IdentityEventType; payload: string[]; description: string;
  }>;
  ownership: {
    owns: string[]; doesNotOwn: string[];
  };
}
