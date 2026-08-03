/** Systems 19, 20 — Developer Integration + Documentation Generator. */
import type {
  IdentityDeveloperIntegration, IdentityDocumentation, IdentityEventType,
} from "./types";

// ===== System 19 — Developer Integration =====

export function getDeveloperIntegration(): IdentityDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/identity/accounts", method: "GET", description: "List identities", authRequired: true, scope: "admin" },
      { path: "/api/identity/accounts", method: "POST", description: "Create identity", authRequired: true, scope: "admin" },
      { path: "/api/identity/accounts", method: "PUT", description: "Update identity lifecycle", authRequired: true, scope: "admin" },
      { path: "/api/identity/permissions", method: "GET", description: "List permissions", authRequired: true, scope: "admin" },
      { path: "/api/identity/permissions", method: "POST", description: "Register permission", authRequired: true, scope: "admin" },
      { path: "/api/identity/roles", method: "GET", description: "List role templates", authRequired: true, scope: "admin" },
      { path: "/api/identity/roles", method: "POST", description: "Create role template", authRequired: true, scope: "admin" },
      { path: "/api/identity/rbac", method: "GET", description: "List role assignments", authRequired: true, scope: "admin" },
      { path: "/api/identity/rbac", method: "POST", description: "Assign role", authRequired: true, scope: "admin" },
      { path: "/api/identity/rbac", method: "PUT", description: "Revoke role assignment", authRequired: true, scope: "admin" },
      { path: "/api/identity/sessions", method: "GET", description: "List sessions", authRequired: true, scope: "admin" },
      { path: "/api/identity/sessions", method: "POST", description: "Create session", authRequired: true, scope: "system" },
      { path: "/api/identity/sessions", method: "PUT", description: "Revoke session", authRequired: true, scope: "admin" },
      { path: "/api/identity/devices", method: "GET", description: "List devices", authRequired: true, scope: "admin" },
      { path: "/api/identity/devices", method: "POST", description: "Register device", authRequired: true, scope: "system" },
      { path: "/api/identity/federation", method: "GET", description: "List federation links", authRequired: true, scope: "admin" },
      { path: "/api/identity/federation", method: "POST", description: "Link federation", authRequired: true, scope: "admin" },
      { path: "/api/identity/providers", method: "GET", description: "List auth providers", authRequired: false, scope: "read" },
      { path: "/api/identity/providers", method: "POST", description: "Register auth provider", authRequired: true, scope: "admin" },
      { path: "/api/identity/organizations", method: "GET", description: "List organizations", authRequired: false, scope: "read" },
      { path: "/api/identity/organizations", method: "POST", description: "Create organization", authRequired: true, scope: "admin" },
      { path: "/api/identity/service-accounts", method: "GET", description: "List service accounts", authRequired: true, scope: "admin" },
      { path: "/api/identity/service-accounts", method: "POST", description: "Create service account", authRequired: true, scope: "admin" },
      { path: "/api/identity/api-keys", method: "GET", description: "List API credentials", authRequired: true, scope: "admin" },
      { path: "/api/identity/api-keys", method: "POST", description: "Issue API credential", authRequired: true, scope: "admin" },
      { path: "/api/identity/privacy", method: "GET", description: "Get privacy settings", authRequired: true, scope: "user" },
      { path: "/api/identity/privacy", method: "POST", description: "Create privacy settings", authRequired: true, scope: "user" },
      { path: "/api/identity/privacy", method: "PUT", description: "Update privacy settings", authRequired: true, scope: "user" },
      { path: "/api/identity/security", method: "GET", description: "List security policies", authRequired: true, scope: "admin" },
      { path: "/api/identity/security", method: "POST", description: "Create security policy", authRequired: true, scope: "admin" },
      { path: "/api/identity/analytics", method: "GET", description: "Identity analytics", authRequired: true, scope: "admin" },
      { path: "/api/identity/dashboard", method: "GET", description: "Identity dashboard", authRequired: true, scope: "admin" },
      { path: "/api/identity/audit", method: "GET", description: "Audit entries", authRequired: true, scope: "admin" },
      { path: "/api/identity/developer", method: "GET", description: "Developer integration metadata", authRequired: false, scope: "read" },
      { path: "/api/identity/status", method: "GET", description: "Platform status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_identity_created", name: "On Identity Created", triggerEvent: "IdentityCreated", description: "Triggered when a new identity is registered" },
      { id: "hook_identity_verified", name: "On Identity Verified", triggerEvent: "IdentityVerified", description: "Triggered when an identity is verified" },
      { id: "hook_identity_suspended", name: "On Identity Suspended", triggerEvent: "IdentitySuspended", description: "Triggered when an identity is suspended" },
      { id: "hook_session_created", name: "On Session Created", triggerEvent: "SessionCreated", description: "Triggered when a session is created" },
      { id: "hook_session_revoked", name: "On Session Revoked", triggerEvent: "SessionRevoked", description: "Triggered when a session is revoked" },
      { id: "hook_device_registered", name: "On Device Registered", triggerEvent: "DeviceRegistered", description: "Triggered when a device is registered" },
      { id: "hook_mfa_enrolled", name: "On MFA Enrolled", triggerEvent: "MfaEnrolled", description: "Triggered when MFA factor is enrolled" },
      { id: "hook_mfa_verified", name: "On MFA Verified", triggerEvent: "MfaVerified", description: "Triggered when MFA challenge is verified" },
      { id: "hook_role_assigned", name: "On Role Assigned", triggerEvent: "RoleAssigned", description: "Triggered when a role is assigned" },
      { id: "hook_role_revoked", name: "On Role Revoked", triggerEvent: "RoleRevoked", description: "Triggered when a role is revoked" },
      { id: "hook_consent_granted", name: "On Consent Granted", triggerEvent: "ConsentGranted", description: "Triggered when consent is granted" },
      { id: "hook_consent_revoked", name: "On Consent Revoked", triggerEvent: "ConsentRevoked", description: "Triggered when consent is revoked" },
      { id: "hook_org_verified", name: "On Organization Verified", triggerEvent: "OrganizationVerified", description: "Triggered when an organization is verified" },
      { id: "hook_federation_linked", name: "On Federation Linked", triggerEvent: "FederationLinked", description: "Triggered when federation link is established" },
      { id: "hook_api_credential_issued", name: "On API Credential Issued", triggerEvent: "ApiCredentialIssued", description: "Triggered when an API credential is issued" },
      { id: "hook_audit_entry_created", name: "On Audit Entry Created", triggerEvent: "AuditEntryCreated", description: "Triggered when an audit entry is created" },
    ],
    sdkMetadata: {
      version: "1.0.0", language: "typescript",
      docsUrl: "/docs/identity-platform",
      capabilities: ["registry", "lifecycle", "auth", "federation", "sessions", "devices", "mfa", "permissions", "rbac", "organizations", "delegation", "api-credentials", "service-accounts", "consent", "privacy", "security-policies", "audit", "analytics"],
    },
    webhooks: [
      { id: "wh_identity_created", event: "IdentityCreated", description: "Fired when a new identity is created" },
      { id: "wh_identity_verified", event: "IdentityVerified", description: "Fired when an identity is verified" },
      { id: "wh_identity_suspended", event: "IdentitySuspended", description: "Fired when an identity is suspended" },
      { id: "wh_session_created", event: "SessionCreated", description: "Fired when a session is created" },
      { id: "wh_session_revoked", event: "SessionRevoked", description: "Fired when a session is revoked" },
      { id: "wh_role_assigned", event: "RoleAssigned", description: "Fired when a role is assigned" },
      { id: "wh_role_revoked", event: "RoleRevoked", description: "Fired when a role is revoked" },
      { id: "wh_consent_granted", event: "ConsentGranted", description: "Fired when consent is granted" },
      { id: "wh_consent_revoked", event: "ConsentRevoked", description: "Fired when consent is revoked" },
      { id: "wh_organization_verified", event: "OrganizationVerified", description: "Fired when an organization is verified" },
      { id: "wh_federation_linked", event: "FederationLinked", description: "Fired when a federation link is established" },
      { id: "wh_audit_entry_created", event: "AuditEntryCreated", description: "Fired when an audit entry is created" },
    ],
    identitySchemas: [
      { name: "Identity", fields: ["id", "type", "status", "username", "email", "emailVerified", "phone", "phoneVerified", "displayName", "organizationId", "version"] },
      { name: "Permission", fields: ["id", "key", "namespace", "parentKey", "implies", "active"] },
      { name: "RoleTemplate", fields: ["id", "key", "name", "scope", "permissions", "parentRoleKey", "delegatable", "temporary"] },
      { name: "RoleAssignment", fields: ["id", "identityId", "roleKey", "scope", "scopeId", "assignedBy", "expiresAt", "inherited", "delegated"] },
      { name: "Session", fields: ["id", "identityId", "deviceId", "status", "issuedAt", "expiresAt", "lastActiveAt", "ipAddress"] },
      { name: "Device", fields: ["id", "identityId", "fingerprint", "trust", "status", "riskFlags", "firstSeenAt"] },
      { name: "OrganizationIdentity", fields: ["id", "name", "type", "verificationStatus", "parentOrganizationId", "domain", "country"] },
      { name: "ApiCredential", fields: ["id", "identityId", "type", "name", "keyPrefix", "scopes", "status", "expiresAt"] },
    ],
  };
}

// ===== System 20 — Documentation Generator =====

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  {
    id: 1, name: "Identity Registry",
    description: "Single registry for every identity: User, Teacher, Parent, Organization Admin, Platform Admin, Service Account, Extension Identity, Anonymous Guest. Versioned. Lifecycle managed.",
    endpoints: ["/api/identity/accounts"],
    events: ["IdentityCreated", "IdentityDeleted"],
  },
  {
    id: 2, name: "Identity Lifecycle",
    description: "Registration, Activation, Verification, Suspension, Soft Delete, Recovery, Merge, Migration, Deactivation.",
    endpoints: ["/api/identity/accounts"],
    events: ["IdentityActivated", "IdentityVerified", "IdentitySuspended", "IdentityDeactivated", "IdentityRecovered", "IdentityMerged", "IdentityMigrated"],
  },
  {
    id: 3, name: "Authentication Abstraction",
    description: "Authentication interfaces only. NO provider SDKs. Supports Password, Passkey, OAuth, OIDC, SAML, Magic Link, API Token, Service Token. Reference only.",
    endpoints: ["/api/identity/providers"],
    events: [],
  },
  {
    id: 4, name: "Identity Federation",
    description: "Supports Google, Microsoft, Apple, GitHub, School SSO, Enterprise Identity, Government Identity, Custom Identity Providers. Federation metadata only.",
    endpoints: ["/api/identity/federation"],
    events: ["FederationLinked", "FederationUnlinked"],
  },
  {
    id: 5, name: "Session Platform",
    description: "Session lifecycle. Device binding. Expiration. Refresh. Revocation. Concurrent sessions. Session history.",
    endpoints: ["/api/identity/sessions"],
    events: ["SessionCreated", "SessionRevoked", "SessionExpired"],
  },
  {
    id: 6, name: "Device Registry",
    description: "Known devices, trusted devices, temporary devices. Device verification. Risk flags. Device revocation.",
    endpoints: ["/api/identity/devices"],
    events: ["DeviceRegistered", "DeviceRevoked", "DeviceVerified"],
  },
  {
    id: 7, name: "Multi-Factor Authentication",
    description: "Authenticator Apps, Security Keys, Backup Codes, SMS Reference, Email Reference. Recovery workflow.",
    endpoints: ["/api/identity/accounts"],
    events: ["MfaEnrolled", "MfaVerified", "MfaDisabled"],
  },
  {
    id: 8, name: "Permission Registry",
    description: "Central permission catalog. Hierarchical permissions. Namespaces. Inheritance. Validation.",
    endpoints: ["/api/identity/permissions"],
    events: ["PermissionGranted", "PermissionRevoked"],
  },
  {
    id: 9, name: "RBAC Platform",
    description: "Role templates. Permission assignments. Organization roles. Delegated roles. Temporary roles. Inherited roles.",
    endpoints: ["/api/identity/rbac", "/api/identity/roles"],
    events: ["RoleAssigned", "RoleRevoked"],
  },
  {
    id: 10, name: "Organization Identity",
    description: "Schools, Universities, Districts, Government, Enterprise, Partner. Organization verification. Brand identity metadata only.",
    endpoints: ["/api/identity/organizations"],
    events: ["OrganizationVerified", "OrganizationRejected"],
  },
  {
    id: 11, name: "Delegation Platform",
    description: "Temporary delegation. Teacher substitutes. Organization delegation. Approval tracking. Expiration. Audit.",
    endpoints: ["/api/identity/rbac"],
    events: ["DelegationCreated", "DelegationRevoked"],
  },
  {
    id: 12, name: "API Credentials",
    description: "API Keys, Client Credentials, Extension Credentials, Webhook Secrets. Rotation, Expiration, Revocation, Scopes.",
    endpoints: ["/api/identity/api-keys"],
    events: ["ApiCredentialIssued", "ApiCredentialRevoked", "ApiCredentialRotated"],
  },
  {
    id: 13, name: "Service Accounts",
    description: "Internal services. Automation. Scheduled jobs. Extension execution. Permission scopes.",
    endpoints: ["/api/identity/service-accounts"],
    events: [],
  },
  {
    id: 14, name: "Consent & Privacy",
    description: "Privacy settings. Minor protection. Parent consent. Teacher visibility. Organization overrides. Data sharing preferences.",
    endpoints: ["/api/identity/privacy"],
    events: ["ConsentGranted", "ConsentRevoked"],
  },
  {
    id: 15, name: "Security Policies",
    description: "Password policy. Session policy. MFA policy. Risk policy. Organization security policy. Never authenticates users directly. Policy only.",
    endpoints: ["/api/identity/security"],
    events: [],
  },
  {
    id: 16, name: "Identity Audit",
    description: "Every identity action. Before/after state. Correlation IDs. Actor. Reason. Approval reference. Never mutable.",
    endpoints: ["/api/identity/audit"],
    events: ["AuditEntryCreated"],
  },
  {
    id: 17, name: "Identity Analytics",
    description: "Identity growth. Verification rates. Device statistics. Session statistics. Permission usage. Role distribution. No gameplay analytics.",
    endpoints: ["/api/identity/analytics"],
    events: [],
  },
  {
    id: 18, name: "Event Bus Bridge",
    description: "Passive consumer. Passive producer. Consumes platform events. Publishes ONLY identity-owned events. No direct imports. Idempotent.",
    endpoints: [],
    events: [
      "IdentityCreated", "IdentityActivated", "IdentityVerified", "IdentitySuspended", "IdentityDeactivated",
      "IdentityRecovered", "IdentityMerged", "IdentityMigrated", "IdentityDeleted",
      "SessionCreated", "SessionRevoked", "SessionExpired",
      "DeviceRegistered", "DeviceRevoked", "DeviceVerified",
      "MfaEnrolled", "MfaVerified", "MfaDisabled",
      "RoleAssigned", "RoleRevoked",
      "PermissionGranted", "PermissionRevoked",
      "OrganizationVerified", "OrganizationRejected",
      "DelegationCreated", "DelegationRevoked",
      "ApiCredentialIssued", "ApiCredentialRevoked", "ApiCredentialRotated",
      "ConsentGranted", "ConsentRevoked",
      "FederationLinked", "FederationUnlinked",
      "AuditEntryCreated",
    ],
  },
  {
    id: 19, name: "Developer Integration",
    description: "Public APIs. SDK metadata. Extension hooks. Webhook metadata. Identity schemas.",
    endpoints: ["/api/identity/developer"],
    events: [],
  },
  {
    id: 20, name: "Documentation Generator",
    description: "Deterministic Markdown + JSON documentation generated directly from registry. No LLM.",
    endpoints: [],
    events: [],
  },
];

const EVENT_PAYLOADS: Record<IdentityEventType, string[]> = {
  IdentityCreated: ["identityId", "type"],
  IdentityActivated: ["identityId", "actorId"],
  IdentityVerified: ["identityId", "actorId"],
  IdentitySuspended: ["identityId", "reason"],
  IdentityDeactivated: ["identityId"],
  IdentityRecovered: ["identityId"],
  IdentityMerged: ["identityId", "targetIdentityId"],
  IdentityMigrated: ["identityId"],
  IdentityDeleted: ["identityId"],
  SessionCreated: ["sessionId", "identityId", "correlationId"],
  SessionRevoked: ["sessionId", "identityId", "reason", "correlationId"],
  SessionExpired: ["sessionId", "identityId"],
  DeviceRegistered: ["deviceId", "identityId", "trust"],
  DeviceRevoked: ["deviceId", "identityId", "reason"],
  DeviceVerified: ["deviceId", "identityId"],
  MfaEnrolled: ["factorId", "identityId", "type"],
  MfaVerified: ["factorId", "identityId", "correlationId"],
  MfaDisabled: ["factorId", "identityId", "reason"],
  RoleAssigned: ["identityId", "roleKey", "scope", "correlationId"],
  RoleRevoked: ["identityId", "roleKey", "reason", "correlationId"],
  PermissionGranted: ["identityId", "permissionKey"],
  PermissionRevoked: ["identityId", "permissionKey"],
  OrganizationVerified: ["organizationId"],
  OrganizationRejected: ["organizationId"],
  DelegationCreated: ["delegationId", "fromIdentityId", "toIdentityId", "correlationId"],
  DelegationRevoked: ["delegationId", "reason", "correlationId"],
  ApiCredentialIssued: ["credentialId", "identityId", "type", "correlationId"],
  ApiCredentialRevoked: ["credentialId", "reason", "correlationId"],
  ApiCredentialRotated: ["credentialId", "correlationId"],
  ConsentGranted: ["identityId", "purpose"],
  ConsentRevoked: ["identityId", "purpose"],
  FederationLinked: ["linkId", "identityId", "provider", "correlationId"],
  FederationUnlinked: ["linkId", "identityId", "reason", "correlationId"],
  AuditEntryCreated: ["auditId", "action", "scope", "correlationId"],
};

const EVENT_DESCRIPTIONS: Record<IdentityEventType, string> = {
  IdentityCreated: "Emitted when a new identity is registered.",
  IdentityActivated: "Emitted when an identity is activated.",
  IdentityVerified: "Emitted when an identity is verified.",
  IdentitySuspended: "Emitted when an identity is suspended.",
  IdentityDeactivated: "Emitted when an identity is deactivated.",
  IdentityRecovered: "Emitted when a soft-deleted identity is recovered.",
  IdentityMerged: "Emitted when two identities are merged.",
  IdentityMigrated: "Emitted when an identity is migrated.",
  IdentityDeleted: "Emitted when an identity is soft-deleted.",
  SessionCreated: "Emitted when a session is created.",
  SessionRevoked: "Emitted when a session is revoked.",
  SessionExpired: "Emitted when a session expires.",
  DeviceRegistered: "Emitted when a device is registered.",
  DeviceRevoked: "Emitted when a device is revoked.",
  DeviceVerified: "Emitted when a device is verified as trusted.",
  MfaEnrolled: "Emitted when an MFA factor is enrolled.",
  MfaVerified: "Emitted when an MFA challenge is successfully verified.",
  MfaDisabled: "Emitted when an MFA factor is disabled.",
  RoleAssigned: "Emitted when a role is assigned to an identity.",
  RoleRevoked: "Emitted when a role assignment is revoked.",
  PermissionGranted: "Emitted when a permission is granted to an identity.",
  PermissionRevoked: "Emitted when a permission is revoked from an identity.",
  OrganizationVerified: "Emitted when an organization is verified.",
  OrganizationRejected: "Emitted when an organization verification is rejected.",
  DelegationCreated: "Emitted when a delegation is created.",
  DelegationRevoked: "Emitted when a delegation is revoked.",
  ApiCredentialIssued: "Emitted when an API credential is issued.",
  ApiCredentialRevoked: "Emitted when an API credential is revoked.",
  ApiCredentialRotated: "Emitted when an API credential is rotated.",
  ConsentGranted: "Emitted when consent is granted for a purpose.",
  ConsentRevoked: "Emitted when consent is revoked for a purpose.",
  FederationLinked: "Emitted when a federation link is established.",
  FederationUnlinked: "Emitted when a federation link is revoked.",
  AuditEntryCreated: "Emitted when an audit entry is recorded.",
};

export function generateIdentityDocumentation(): IdentityDocumentation {
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({
      type: type as IdentityEventType,
      payload: EVENT_PAYLOADS[type as IdentityEventType],
      description: EVENT_DESCRIPTIONS[type as IdentityEventType],
    })),
    ownership: {
      owns: [
        "Identity Registry",
        "Identity Lifecycle",
        "Authentication abstraction",
        "Authorization metadata",
        "Permission Registry",
        "RBAC (Role Templates, Role Assignments)",
        "Organization Identity",
        "Identity Federation",
        "Sessions",
        "Devices",
        "API Credentials",
        "Service Accounts",
        "Consent",
        "Privacy",
        "Security Policies",
        "Identity Audit",
        "Identity Analytics",
        "Identity Events",
        "Developer Metadata",
        "Documentation",
      ],
      doesNotOwn: [
        "Gameplay",
        "Scoring",
        "Progression",
        "XP",
        "Achievements",
        "Inventory",
        "Commerce",
        "Marketplace",
        "Notifications",
        "Chat",
        "Messaging",
        "Broadcast",
        "Configuration",
        "Competitive Rankings",
        "Tournaments",
        "Player Statistics",
        "Replay",
        "Analytics outside Identity",
        "Organization business logic",
        "Player social graph",
      ],
    },
  };
}

export function generateMarkdownDocumentation(): string {
  const doc = generateIdentityDocumentation();
  let md = `# EduBek — Identity, Access Management & Federation Platform\n\n`;
  md += `**Version:** ${doc.version}  \n`;
  md += `**Generated:** ${doc.generatedAt}  \n`;
  md += `**Phase:** 6G.18\n\n`;
  md += `## Overview\n\n`;
  md += `This platform is the SINGLE SOURCE OF TRUTH for identity, authentication abstraction, authorization, RBAC, federation, sessions, devices, API credentials, permissions, privacy, and organizational identity across EduBek. `;
  md += `It is a passive Event Bus consumer + producer. It NEVER owns gameplay, progression, XP, achievements, inventory, commerce, notifications, analytics (outside identity), matchmaking, tournaments, leaderboards, broadcasts, configuration, social relationships, or player profiles beyond identity metadata. `;
  md += `All cross-module communication happens exclusively through the Event Bus.\n\n`;
  md += `## Systems\n\n`;
  for (const s of doc.systems) {
    md += `### System ${s.id} — ${s.name}\n\n${s.description}\n\n`;
    if (s.endpoints.length > 0) {
      md += `**Endpoints:**\n`;
      for (const e of s.endpoints) md += `- \`${e}\`\n`;
      md += `\n`;
    }
    if (s.events.length > 0) {
      md += `**Events:**\n`;
      for (const e of s.events) md += `- \`${e}\`\n`;
      md += `\n`;
    }
  }
  md += `## Events\n\n`;
  for (const e of doc.events) {
    md += `### \`${e.type}\`\n\n${e.description}\n\n`;
    md += `**Payload:**\n`;
    for (const p of e.payload) md += `- \`${p}\`\n`;
    md += `\n`;
  }
  md += `## Ownership\n\n`;
  md += `### Owns\n\n`;
  for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n\n`;
  for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  md += `\n`;
  return md;
}

export function getIdentityVersion(): string { return "1.0.0"; }
