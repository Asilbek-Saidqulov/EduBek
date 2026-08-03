/** Systems 9, 10 — RBAC Platform + Organization Identity. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeRoleTemplate, getRoleTemplate, getAllRoleTemplates, getRoleTemplateByKey,
  storeRoleAssignment, getRoleAssignment, getAllRoleAssignments,
  storeOrganization, getOrganization, getAllOrganizations,
  appendAudit,
} from "./repository";
import type {
  RoleTemplate, RoleAssignment, RoleScope,
  OrganizationIdentity, OrganizationType, OrganizationVerificationStatus,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.rbac");

// ===== System 9 — RBAC Platform =====

export function createRoleTemplate(input: {
  key: string; name: string; description?: string;
  scope: RoleScope;
  permissions?: string[];
  parentRoleKey?: string | null;
  delegatable?: boolean;
  temporary?: boolean;
  metadata?: Record<string, unknown>;
}): RoleTemplate {
  if (getRoleTemplateByKey(input.key)) throw new Error(`Role template already exists: ${input.key}`);
  const now = new Date().toISOString();
  const template: RoleTemplate = {
    id: randomUUID(), key: input.key,
    name: input.name, description: input.description ?? "",
    scope: input.scope,
    permissions: input.permissions ?? [],
    parentRoleKey: input.parentRoleKey ?? null,
    delegatable: input.delegatable ?? false,
    temporary: input.temporary ?? false,
    version: 1, active: true,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeRoleTemplate(template);
  log.info("role_template.created", { id: template.id, key: template.key });
  return template;
}

export function getRoleTemplateById(id: string): RoleTemplate | null { return getRoleTemplate(id); }
export function getRoleTemplateByReference(key: string): RoleTemplate | null { return getRoleTemplateByKey(key); }
export function listRoleTemplates(scope?: RoleScope, active?: boolean): RoleTemplate[] {
  let all = getAllRoleTemplates();
  if (scope) all = all.filter(r => r.scope === scope);
  if (active !== undefined) all = all.filter(r => r.active === active);
  return all;
}

export function deactivateRoleTemplate(id: string): RoleTemplate | null {
  const r = getRoleTemplate(id);
  if (!r) return null;
  r.active = false;
  r.updatedAt = new Date().toISOString();
  r.version += 1;
  storeRoleTemplate(r);
  return r;
}

export function addRolePermission(id: string, permissionKey: string): RoleTemplate | null {
  const r = getRoleTemplate(id);
  if (!r) return null;
  if (r.permissions.includes(permissionKey)) return r;
  r.permissions.push(permissionKey);
  r.updatedAt = new Date().toISOString();
  r.version += 1;
  storeRoleTemplate(r);
  return r;
}

/**
 * Resolves all permissions for a role template, including parent role inheritance.
 */
export function resolveRolePermissions(roleKey: string): string[] {
  const visited = new Set<string>();
  const permissions = new Set<string>();
  const queue = [roleKey];
  while (queue.length > 0) {
    const k = queue.shift()!;
    if (visited.has(k)) continue;
    visited.add(k);
    const t = getRoleTemplateByKey(k);
    if (!t) continue;
    for (const p of t.permissions) permissions.add(p);
    if (t.parentRoleKey) queue.push(t.parentRoleKey);
  }
  return Array.from(permissions);
}

export function assignRole(input: {
  identityId: string; roleKey: string;
  scope: RoleScope; scopeId?: string | null;
  assignedBy: string;
  expiresAt?: string | null;
  inherited?: boolean; delegated?: boolean;
  metadata?: Record<string, unknown>;
}): RoleAssignment {
  const template = getRoleTemplateByKey(input.roleKey);
  if (!template) throw new Error(`Role template not found: ${input.roleKey}`);
  if (!template.active) throw new Error(`Role template is not active: ${input.roleKey}`);
  const now = new Date().toISOString();
  const assignment: RoleAssignment = {
    id: randomUUID(), identityId: input.identityId,
    roleKey: input.roleKey,
    scope: input.scope, scopeId: input.scopeId ?? null,
    assignedBy: input.assignedBy, assignedAt: now,
    expiresAt: input.expiresAt ?? null,
    revokedAt: null, revocationReason: null,
    inherited: input.inherited ?? false,
    delegated: input.delegated ?? false,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeRoleAssignment(assignment);
  publishIdentityEvent("RoleAssigned", input.assignedBy, {
    identityId: input.identityId, roleKey: input.roleKey, scope: input.scope,
    correlationId: assignment.correlationId,
  });
  log.info("role.assigned", { id: assignment.id, roleKey: input.roleKey });
  return assignment;
}

export function getRoleAssignmentById(id: string): RoleAssignment | null { return getRoleAssignment(id); }
export function listRoleAssignments(identityId?: string, scope?: RoleScope): RoleAssignment[] {
  let all = getAllRoleAssignments();
  if (identityId) all = all.filter(a => a.identityId === identityId);
  if (scope) all = all.filter(a => a.scope === scope);
  return all;
}

export function listActiveRoleAssignments(identityId: string): RoleAssignment[] {
  const now = Date.now();
  return getAllRoleAssignments().filter(a =>
    a.identityId === identityId &&
    !a.revokedAt &&
    (!a.expiresAt || new Date(a.expiresAt).getTime() > now)
  );
}

export function revokeRoleAssignment(id: string, reason: string): RoleAssignment | null {
  const a = getRoleAssignment(id);
  if (!a) return null;
  if (a.revokedAt) return null;
  a.revokedAt = new Date().toISOString();
  a.revocationReason = reason;
  storeRoleAssignment(a);
  publishIdentityEvent("RoleRevoked", a.assignedBy, {
    identityId: a.identityId, roleKey: a.roleKey, reason,
    correlationId: a.correlationId,
  });
  return a;
}

/**
 * Returns all permission keys an identity has via active role assignments.
 */
export function getIdentityPermissions(identityId: string): string[] {
  const assignments = listActiveRoleAssignments(identityId);
  const perms = new Set<string>();
  for (const a of assignments) {
    for (const p of resolveRolePermissions(a.roleKey)) perms.add(p);
  }
  return Array.from(perms);
}

export function identityHasPermission(identityId: string, permissionKey: string): boolean {
  return getIdentityPermissions(identityId).includes(permissionKey);
}

export function identityHasRole(identityId: string, roleKey: string): boolean {
  return listActiveRoleAssignments(identityId).some(a => a.roleKey === roleKey);
}

export function supportsAllRoleScopes(): RoleScope[] {
  return ["global", "organization", "school", "classroom", "tournament", "extension"];
}

// ===== System 10 — Organization Identity =====

export function createOrganization(input: {
  name: string; type: OrganizationType;
  parentOrganizationId?: string | null;
  domain?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  region?: string | null;
  timezone?: string;
  metadata?: Record<string, unknown>;
}): OrganizationIdentity {
  const now = new Date().toISOString();
  const org: OrganizationIdentity = {
    id: randomUUID(), name: input.name, type: input.type,
    verificationStatus: "unverified",
    parentOrganizationId: input.parentOrganizationId ?? null,
    domain: input.domain ?? null,
    brandColor: input.brandColor ?? null,
    logoUrl: input.logoUrl ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    timezone: input.timezone ?? "UTC",
    verifiedAt: null, verifiedBy: null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeOrganization(org);
  log.info("organization.created", { id: org.id, type: org.type });
  return org;
}

export function getOrganizationById(id: string): OrganizationIdentity | null { return getOrganization(id); }
export function listOrganizations(type?: OrganizationType, verificationStatus?: OrganizationVerificationStatus): OrganizationIdentity[] {
  let all = getAllOrganizations();
  if (type) all = all.filter(o => o.type === type);
  if (verificationStatus) all = all.filter(o => o.verificationStatus === verificationStatus);
  return all;
}

const VALID_ORG_TRANSITIONS: Record<OrganizationVerificationStatus, OrganizationVerificationStatus[]> = {
  unverified: ["pending", "verified", "rejected"],
  pending: ["verified", "rejected"],
  verified: ["revoked"],
  rejected: ["pending", "unverified"],
  revoked: ["pending", "unverified"],
};

export function canTransitionOrganization(from: OrganizationVerificationStatus, to: OrganizationVerificationStatus): boolean {
  return VALID_ORG_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionOrganizationStatus(id: string, to: OrganizationVerificationStatus, verifiedBy?: string | null): OrganizationIdentity | null {
  const o = getOrganization(id);
  if (!o) return null;
  if (!canTransitionOrganization(o.verificationStatus, to)) return null;
  const now = new Date().toISOString();
  o.verificationStatus = to;
  o.updatedAt = now;
  if (to === "verified") {
    o.verifiedAt = now;
    o.verifiedBy = verifiedBy ?? null;
    publishIdentityEvent("OrganizationVerified", verifiedBy ?? null, { organizationId: o.id });
  }
  if (to === "rejected") publishIdentityEvent("OrganizationRejected", verifiedBy ?? null, { organizationId: o.id });
  storeOrganization(o);
  return o;
}

export function submitOrganizationForVerification(id: string): OrganizationIdentity | null {
  return transitionOrganizationStatus(id, "pending");
}
export function verifyOrganization(id: string, verifiedBy: string): OrganizationIdentity | null {
  return transitionOrganizationStatus(id, "verified", verifiedBy);
}
export function rejectOrganization(id: string, verifiedBy: string): OrganizationIdentity | null {
  return transitionOrganizationStatus(id, "rejected", verifiedBy);
}
export function revokeOrganization(id: string, verifiedBy: string): OrganizationIdentity | null {
  return transitionOrganizationStatus(id, "revoked", verifiedBy);
}

export function supportsAllOrganizationTypes(): OrganizationType[] {
  return ["school", "university", "district", "government", "enterprise", "partner"];
}
export function supportsAllOrganizationVerificationStatuses(): OrganizationVerificationStatus[] {
  return ["unverified", "pending", "verified", "rejected", "revoked"];
}
