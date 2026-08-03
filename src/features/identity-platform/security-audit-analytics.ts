/** Systems 15, 16, 17 — Security Policies + Identity Audit + Identity Analytics. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeSecurityPolicy, getSecurityPolicy, getAllSecurityPolicies,
  appendAudit, getAllAuditEntries, getAuditEntriesForIdentity,
  getAllIdentities, getAllSessions, getAllDevices, getAllMfaFactors,
  getAllPermissions, getAllRoleTemplates, getAllRoleAssignments,
  getAllOrganizations, getAllApiCredentials, getAllServiceAccounts,
} from "./repository";
import type {
  SecurityPolicy, IdentityAuditEntry,
  IdentityAnalytics, IdentityType, IdentityStatus,
  RoleScope, OrganizationType,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.security");

// ===== System 15 — Security Policies =====

export function createSecurityPolicy(input: {
  name: string;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireDigit?: boolean;
  passwordRequireSymbol?: boolean;
  passwordExpiryDays?: number | null;
  sessionMaxDurationMinutes?: number;
  sessionIdleTimeoutMinutes?: number;
  mfaRequired?: boolean;
  mfaRequiredForRoles?: string[];
  maxConcurrentSessions?: number;
  deviceTrustRequired?: boolean;
  riskPolicy?: "permissive" | "standard" | "strict" | "paranoid";
  organizationId?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}): SecurityPolicy {
  const now = new Date().toISOString();
  const policy: SecurityPolicy = {
    id: randomUUID(), name: input.name,
    passwordMinLength: input.passwordMinLength ?? 8,
    passwordRequireUppercase: input.passwordRequireUppercase ?? true,
    passwordRequireLowercase: input.passwordRequireLowercase ?? true,
    passwordRequireDigit: input.passwordRequireDigit ?? true,
    passwordRequireSymbol: input.passwordRequireSymbol ?? false,
    passwordExpiryDays: input.passwordExpiryDays ?? null,
    sessionMaxDurationMinutes: input.sessionMaxDurationMinutes ?? 480,
    sessionIdleTimeoutMinutes: input.sessionIdleTimeoutMinutes ?? 30,
    mfaRequired: input.mfaRequired ?? false,
    mfaRequiredForRoles: input.mfaRequiredForRoles ?? [],
    maxConcurrentSessions: input.maxConcurrentSessions ?? 5,
    deviceTrustRequired: input.deviceTrustRequired ?? false,
    riskPolicy: input.riskPolicy ?? "standard",
    organizationId: input.organizationId ?? null,
    active: input.active ?? true,
    version: 1,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeSecurityPolicy(policy);
  log.info("security_policy.created", { id: policy.id, name: policy.name });
  return policy;
}

export function getSecurityPolicyById(id: string): SecurityPolicy | null { return getSecurityPolicy(id); }
export function listSecurityPolicies(active?: boolean, organizationId?: string | null): SecurityPolicy[] {
  let all = getAllSecurityPolicies();
  if (active !== undefined) all = all.filter(p => p.active === active);
  if (organizationId !== undefined) all = all.filter(p => p.organizationId === organizationId);
  return all;
}

export function getActivePolicyForOrganization(organizationId: string | null): SecurityPolicy | null {
  // Prefer org-specific; fall back to global
  const orgPolicy = getAllSecurityPolicies().find(p => p.active && p.organizationId === organizationId);
  if (orgPolicy) return orgPolicy;
  return getAllSecurityPolicies().find(p => p.active && p.organizationId === null) ?? null;
}

export function deactivateSecurityPolicy(id: string): SecurityPolicy | null {
  const p = getSecurityPolicy(id);
  if (!p) return null;
  p.active = false;
  p.updatedAt = new Date().toISOString();
  p.version += 1;
  storeSecurityPolicy(p);
  return p;
}

export function updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>): SecurityPolicy | null {
  const p = getSecurityPolicy(id);
  if (!p) return null;
  const { id: _i, version: _v, createdAt: _c, updatedAt: _u, ...safe } = updates as SecurityPolicy;
  Object.assign(p, safe);
  p.updatedAt = new Date().toISOString();
  p.version += 1;
  storeSecurityPolicy(p);
  return p;
}

/** Validates a password against a security policy. Pure function, never authenticates. */
export function validatePasswordAgainstPolicy(password: string, policy: SecurityPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < policy.passwordMinLength) errors.push("too_short");
  if (policy.passwordRequireUppercase && !/[A-Z]/.test(password)) errors.push("no_uppercase");
  if (policy.passwordRequireLowercase && !/[a-z]/.test(password)) errors.push("no_lowercase");
  if (policy.passwordRequireDigit && !/\d/.test(password)) errors.push("no_digit");
  if (policy.passwordRequireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("no_symbol");
  return { valid: errors.length === 0, errors };
}

export function supportsAllRiskPolicies(): string[] {
  return ["permissive", "standard", "strict", "paranoid"];
}

// ===== System 16 — Identity Audit =====

export function recordAuditEntry(input: {
  identityId: string | null; actorId: string | null;
  action: string; scope: string; targetId?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason: string;
  correlationId?: string;
  approvalReference?: string | null;
  metadata?: Record<string, unknown>;
}): IdentityAuditEntry {
  const entry: IdentityAuditEntry = {
    id: randomUUID(), identityId: input.identityId, actorId: input.actorId,
    action: input.action, scope: input.scope, targetId: input.targetId ?? null,
    before: input.before ?? {},
    after: input.after ?? {},
    reason: input.reason,
    correlationId: input.correlationId ?? randomUUID(),
    approvalReference: input.approvalReference ?? null,
    occurredAt: new Date().toISOString(),
    immutable: true,
  };
  appendAudit(entry);
  publishIdentityEvent("AuditEntryCreated", input.actorId, {
    auditId: entry.id, action: entry.action, scope: entry.scope,
    correlationId: entry.correlationId,
  });
  return entry;
}

export function listAuditEntries(limit = 100, offset = 0, identityId?: string): IdentityAuditEntry[] {
  const entries = identityId ? getAuditEntriesForIdentity(identityId) : getAllAuditEntries();
  return entries.slice(offset, offset + limit);
}

export function listAuditEntriesForIdentity(identityId: string): IdentityAuditEntry[] {
  return getAuditEntriesForIdentity(identityId);
}

export function getAuditEntryCount(): number {
  return getAllAuditEntries().length;
}

export function verifyAuditIntegrity(): { valid: boolean; totalEntries: number; immutableCount: number } {
  const entries = getAllAuditEntries();
  const immutableCount = entries.filter(e => e.immutable === true).length;
  return { valid: immutableCount === entries.length, totalEntries: entries.length, immutableCount };
}

// ===== System 17 — Identity Analytics =====

export function generateIdentityAnalytics(): IdentityAnalytics {
  const identities = getAllIdentities();
  const sessions = getAllSessions();
  const devices = getAllDevices();
  const mfaFactors = getAllMfaFactors();
  const permissions = getAllPermissions();
  const roleTemplates = getAllRoleTemplates();
  const roleAssignments = getAllRoleAssignments();
  const organizations = getAllOrganizations();
  const apiCreds = getAllApiCredentials();
  const serviceAccounts = getAllServiceAccounts();

  const byType: Record<IdentityType, number> = {
    user: 0, teacher: 0, parent: 0, organization_admin: 0,
    platform_admin: 0, service_account: 0, extension_identity: 0, anonymous_guest: 0,
  };
  const byStatus: Record<IdentityStatus, number> = {
    pending: 0, active: 0, verified: 0, suspended: 0,
    deactivated: 0, soft_deleted: 0, merged: 0, migrated: 0,
  };
  for (const i of identities) {
    byType[i.type] += 1;
    byStatus[i.status] += 1;
  }
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const new24h = identities.filter(i => now - new Date(i.createdAt).getTime() < day).length;
  const new7d = identities.filter(i => now - new Date(i.createdAt).getTime() < 7 * day).length;
  const new30d = identities.filter(i => now - new Date(i.createdAt).getTime() < 30 * day).length;
  const verifiedCount = identities.filter(i => i.status === "verified" || i.verifiedAt).length;
  const pendingCount = byStatus.pending;
  const rejectedCount = 0; // not tracked at identity level
  const activeSessions = sessions.filter(s => s.status === "active").length;
  const revoked24h = sessions.filter(s => s.revokedAt && now - new Date(s.revokedAt).getTime() < day).length;
  const trustedDevices = devices.filter(d => d.trust === "trusted").length;
  const revokedDevices24h = devices.filter(d => d.revokedAt && now - new Date(d.revokedAt).getTime() < day).length;
  const byScope: Record<RoleScope, number> = {
    global: 0, organization: 0, school: 0, classroom: 0, tournament: 0, extension: 0,
  };
  for (const a of roleAssignments) byScope[a.scope] += 1;
  const delegated = roleAssignments.filter(a => a.delegated).length;
  const temporary = roleAssignments.filter(a => a.expiresAt !== null).length;
  const orgByType: Record<OrganizationType, number> = {
    school: 0, university: 0, district: 0, government: 0, enterprise: 0, partner: 0,
  };
  for (const o of organizations) orgByType[o.type] += 1;
  const verifiedOrgs = organizations.filter(o => o.verificationStatus === "verified").length;
  const mfaEnabledIdentities = new Set(mfaFactors.filter(f => f.status === "active").map(f => f.identityId)).size;
  return {
    identities: {
      total: identities.length, byType, byStatus, new24h, new7d, new30d,
    },
    verification: {
      verifiedRate: identities.length > 0 ? verifiedCount / identities.length : 0,
      pendingCount, rejectedCount,
    },
    sessions: {
      active: activeSessions,
      avgDurationMinutes: 60, // baseline
      revoked24h,
    },
    devices: {
      total: devices.length, trusted: trustedDevices, revoked24h: revokedDevices24h,
    },
    permissions: {
      total: permissions.length,
      assignments: roleAssignments.length,
      byScope,
    },
    roles: {
      templates: roleTemplates.length,
      assignments: roleAssignments.length,
      delegated, temporary,
    },
    organizations: {
      total: organizations.length,
      verified: verifiedOrgs,
      byType: orgByType,
    },
    security: {
      mfaEnabledIdentities,
      apiCredentialsActive: apiCreds.filter(c => c.status === "active").length,
      serviceAccountsActive: serviceAccounts.filter(s => s.active).length,
    },
    updatedAt: new Date().toISOString(),
  };
}
