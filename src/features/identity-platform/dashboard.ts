/** Identity Dashboard — operational dashboard. */
import {
  getAllIdentities, getAllSessions, getAllDevices, getAllMfaFactors,
  getAllPermissions, getAllRoleTemplates, getAllRoleAssignments,
  getAllOrganizations, getAllApiCredentials, getAllServiceAccounts,
  getAllAuditEntries, getAllAuthProviders,
} from "./repository";
import type { IdentityType, IdentityStatus, RoleScope } from "./types";
import { isIdentitySubscribed, getBridgeProcessedCount } from "./event-bus-bridge";

export interface IdentityDashboard {
  identities: { total: number; active: number; pending: number; verified: number; suspended: number; new24h: number };
  sessions: { active: number; revoked24h: number; expired24h: number };
  devices: { total: number; trusted: number; revoked24h: number };
  mfa: { enabledIdentities: number; factors: number };
  permissions: { total: number; active: number };
  rbac: { templates: number; assignments: number; delegations: number };
  organizations: { total: number; verified: number; pending: number };
  apiCredentials: { total: number; active: number };
  serviceAccounts: { total: number; active: number };
  audit: { total: number; last24h: number };
  health: {
    bridge: { subscribed: boolean; processedCount: number };
    providers: { total: number; active: number };
  };
  byType: Record<IdentityType, number>;
  byStatus: Record<IdentityStatus, number>;
  byScope: Record<RoleScope, number>;
  updatedAt: string;
}

export function generateIdentityDashboard(): IdentityDashboard {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
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
  const audit = getAllAuditEntries();
  const providers = getAllAuthProviders();
  const byType: Record<IdentityType, number> = {
    user: 0, teacher: 0, parent: 0, organization_admin: 0,
    platform_admin: 0, service_account: 0, extension_identity: 0, anonymous_guest: 0,
  };
  const byStatus: Record<IdentityStatus, number> = {
    pending: 0, active: 0, verified: 0, suspended: 0,
    deactivated: 0, soft_deleted: 0, merged: 0, migrated: 0,
  };
  for (const i of identities) { byType[i.type] += 1; byStatus[i.status] += 1; }
  const byScope: Record<RoleScope, number> = {
    global: 0, organization: 0, school: 0, classroom: 0, tournament: 0, extension: 0,
  };
  for (const a of roleAssignments) byScope[a.scope] += 1;
  return {
    identities: {
      total: identities.length,
      active: byStatus.active,
      pending: byStatus.pending,
      verified: byStatus.verified,
      suspended: byStatus.suspended,
      new24h: identities.filter(i => now - new Date(i.createdAt).getTime() < day).length,
    },
    sessions: {
      active: sessions.filter(s => s.status === "active").length,
      revoked24h: sessions.filter(s => s.revokedAt && now - new Date(s.revokedAt).getTime() < day).length,
      expired24h: sessions.filter(s => s.status === "expired" && s.expiresAt && now - new Date(s.expiresAt).getTime() < day).length,
    },
    devices: {
      total: devices.length,
      trusted: devices.filter(d => d.trust === "trusted").length,
      revoked24h: devices.filter(d => d.revokedAt && now - new Date(d.revokedAt).getTime() < day).length,
    },
    mfa: {
      enabledIdentities: new Set(mfaFactors.filter(f => f.status === "active").map(f => f.identityId)).size,
      factors: mfaFactors.length,
    },
    permissions: { total: permissions.length, active: permissions.filter(p => p.active).length },
    rbac: {
      templates: roleTemplates.length,
      assignments: roleAssignments.length,
      delegations: roleAssignments.filter(a => a.delegated).length,
    },
    organizations: {
      total: organizations.length,
      verified: organizations.filter(o => o.verificationStatus === "verified").length,
      pending: organizations.filter(o => o.verificationStatus === "pending").length,
    },
    apiCredentials: { total: apiCreds.length, active: apiCreds.filter(c => c.status === "active").length },
    serviceAccounts: { total: serviceAccounts.length, active: serviceAccounts.filter(s => s.active).length },
    audit: {
      total: audit.length,
      last24h: audit.filter(a => now - new Date(a.occurredAt).getTime() < day).length,
    },
    health: {
      bridge: { subscribed: isIdentitySubscribed(), processedCount: getBridgeProcessedCount() },
      providers: { total: providers.length, active: providers.filter(p => p.status === "active").length },
    },
    byType, byStatus, byScope,
    updatedAt: new Date().toISOString(),
  };
}

export function getIdentityStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } {
  return {
    operational: true, systems: 20,
    bridgeSubscribed: isIdentitySubscribed(),
    updatedAt: new Date().toISOString(),
  };
}
