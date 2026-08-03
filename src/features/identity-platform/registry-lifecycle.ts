/** Systems 1, 2 — Identity Registry + Lifecycle. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeIdentity, getIdentity, getAllIdentities,
  storeLifecycleEvent, getLifecycleEvents,
  appendAudit,
} from "./repository";
import type {
  Identity, IdentityType, IdentityStatus, LifecycleEvent, LifecycleAction,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.registry");

// ===== System 1 — Identity Registry =====

export function createIdentity(input: {
  type: IdentityType;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  locale?: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}): Identity {
  const now = new Date().toISOString();
  const identity: Identity = {
    id: randomUUID(), type: input.type, status: "pending",
    username: input.username ?? null,
    email: input.email ?? null,
    emailVerified: false,
    phone: input.phone ?? null,
    phoneVerified: false,
    displayName: input.displayName ?? null,
    avatarUrl: input.avatarUrl ?? null,
    locale: input.locale ?? "en",
    organizationId: input.organizationId ?? null,
    primaryIdentityId: null,
    version: 1,
    createdAt: now, updatedAt: now,
    activatedAt: null, verifiedAt: null, suspendedAt: null,
    deactivatedAt: null, deletedAt: null, mergedAt: null, migratedAt: null,
    metadata: input.metadata ?? {},
  };
  storeIdentity(identity);
  recordLifecycle(identity.id, "register", null, "Identity registered", "pending", "pending");
  publishIdentityEvent("IdentityCreated", null, { identityId: identity.id, type: identity.type });
  log.info("identity.created", { id: identity.id, type: identity.type });
  return identity;
}

export function getIdentityById(id: string): Identity | null { return getIdentity(id); }
export function listIdentities(type?: IdentityType, status?: IdentityStatus): Identity[] {
  let all = getAllIdentities();
  if (type) all = all.filter(i => i.type === type);
  if (status) all = all.filter(i => i.status === status);
  return all;
}

export function supportsAllIdentityTypes(): IdentityType[] {
  return ["user", "teacher", "parent", "organization_admin", "platform_admin", "service_account", "extension_identity", "anonymous_guest"];
}
export function supportsAllIdentityStatuses(): IdentityStatus[] {
  return ["pending", "active", "verified", "suspended", "deactivated", "soft_deleted", "merged", "migrated"];
}

// ===== System 2 — Identity Lifecycle =====

const VALID_LIFECYCLE_TRANSITIONS: Record<IdentityStatus, IdentityStatus[]> = {
  pending: ["active", "verified", "soft_deleted"],
  active: ["verified", "suspended", "deactivated", "soft_deleted", "migrated"],
  verified: ["suspended", "deactivated", "soft_deleted", "migrated"],
  suspended: ["active", "verified", "deactivated", "soft_deleted"],
  deactivated: ["active", "soft_deleted"],
  soft_deleted: ["active", "deactivated"], // recoverable
  merged: [],
  migrated: [],
};

export function canTransitionIdentity(from: IdentityStatus, to: IdentityStatus): boolean {
  return VALID_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

function recordLifecycle(identityId: string, action: LifecycleAction, actorId: string | null, reason: string, before: IdentityStatus, after: IdentityStatus, approvalRef?: string | null): LifecycleEvent {
  const evt: LifecycleEvent = {
    id: randomUUID(), identityId, action, actorId, reason,
    beforeStatus: before, afterStatus: after,
    correlationId: randomUUID(),
    approvalReference: approvalRef ?? null,
    occurredAt: new Date().toISOString(),
    metadata: {},
  };
  storeLifecycleEvent(evt);
  appendAudit({
    id: randomUUID(), identityId, actorId,
    action: `lifecycle:${action}`,
    scope: "identity", targetId: identityId,
    before: { status: before }, after: { status: after },
    reason, correlationId: evt.correlationId,
    approvalReference: approvalRef ?? null,
    occurredAt: evt.occurredAt, immutable: true,
  });
  return evt;
}

export function transitionIdentity(identityId: string, to: IdentityStatus, actorId: string | null, reason: string, approvalRef?: string | null): Identity | null {
  const identity = getIdentity(identityId);
  if (!identity) return null;
  if (!canTransitionIdentity(identity.status, to)) return null;
  const before = identity.status;
  const now = new Date().toISOString();
  identity.status = to;
  identity.updatedAt = now;
  identity.version += 1;
  if (to === "active" && !identity.activatedAt) identity.activatedAt = now;
  if (to === "verified" && !identity.verifiedAt) {
    identity.verifiedAt = now;
    identity.emailVerified = identity.email !== null;
    identity.phoneVerified = identity.phone !== null;
  }
  if (to === "suspended") identity.suspendedAt = now;
  if (to === "deactivated") identity.deactivatedAt = now;
  if (to === "soft_deleted") identity.deletedAt = now;
  if (to === "merged") identity.mergedAt = now;
  if (to === "migrated") identity.migratedAt = now;
  storeIdentity(identity);
  const action: LifecycleAction =
    to === "active" ? "activate" :
    to === "verified" ? "verify" :
    to === "suspended" ? "suspend" :
    to === "deactivated" ? "deactivate" :
    to === "soft_deleted" ? "soft_delete" :
    to === "merged" ? "merge" :
    to === "migrated" ? "migrate" : "register";
  recordLifecycle(identityId, action, actorId, reason, before, to, approvalRef);
  // Publish events
  if (to === "active") publishIdentityEvent("IdentityActivated", actorId, { identityId, correlationId: randomUUID() });
  if (to === "verified") publishIdentityEvent("IdentityVerified", actorId, { identityId });
  if (to === "suspended") publishIdentityEvent("IdentitySuspended", actorId, { identityId, reason });
  if (to === "deactivated") publishIdentityEvent("IdentityDeactivated", actorId, { identityId });
  if (to === "soft_deleted") publishIdentityEvent("IdentityDeleted", actorId, { identityId });
  if (to === "merged") publishIdentityEvent("IdentityMerged", actorId, { identityId });
  if (to === "migrated") publishIdentityEvent("IdentityMigrated", actorId, { identityId });
  return identity;
}

export function activateIdentity(identityId: string, actorId: string | null): Identity | null {
  return transitionIdentity(identityId, "active", actorId, "Manual activation");
}
export function verifyIdentity(identityId: string, actorId: string | null): Identity | null {
  return transitionIdentity(identityId, "verified", actorId, "Verification completed");
}
export function suspendIdentity(identityId: string, actorId: string, reason: string): Identity | null {
  return transitionIdentity(identityId, "suspended", actorId, reason);
}
export function deactivateIdentity(identityId: string, actorId: string, reason: string): Identity | null {
  return transitionIdentity(identityId, "deactivated", actorId, reason);
}
export function softDeleteIdentity(identityId: string, actorId: string, reason: string): Identity | null {
  return transitionIdentity(identityId, "soft_deleted", actorId, reason);
}
export function recoverIdentity(identityId: string, actorId: string): Identity | null {
  return transitionIdentity(identityId, "active", actorId, "Recovery from soft delete");
}
export function migrateIdentity(identityId: string, actorId: string, reason: string): Identity | null {
  return transitionIdentity(identityId, "migrated", actorId, reason);
}

export function mergeIdentities(sourceId: string, targetId: string, actorId: string, reason: string): { source: Identity | null; target: Identity | null } {
  const source = getIdentity(sourceId);
  const target = getIdentity(targetId);
  if (!source || !target) return { source: null, target: null };
  if (source.id === target.id) return { source: null, target: null };
  // Mark source as merged into target
  const before = source.status;
  const now = new Date().toISOString();
  source.status = "merged";
  source.mergedAt = now;
  source.primaryIdentityId = target.id;
  source.updatedAt = now;
  source.version += 1;
  storeIdentity(source);
  target.updatedAt = now;
  target.version += 1;
  storeIdentity(target);
  recordLifecycle(sourceId, "merge", actorId, `Merged into ${targetId}`, before, "merged");
  publishIdentityEvent("IdentityMerged", actorId, { identityId: sourceId, targetIdentityId: targetId });
  return { source, target };
}

export function getIdentityLifecycleHistory(identityId: string): LifecycleEvent[] {
  return getLifecycleEvents(identityId);
}

export function supportsAllLifecycleActions(): LifecycleAction[] {
  return ["register", "activate", "verify", "suspend", "resume", "soft_delete", "recover", "merge", "migrate", "deactivate"];
}
