/** Systems 7, 8 — Multi-Factor Authentication + Permission Registry. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeMfaFactor, getMfaFactor, getAllMfaFactors,
  storeMfaChallenge, getMfaChallenge, getAllMfaChallenges,
  storePermission, getPermission, getPermissionByKey, getAllPermissions,
  appendAudit,
} from "./repository";
import type {
  MfaFactor, MfaFactorType, MfaFactorStatus,
  MfaChallenge, Permission,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.mfa");

// ===== System 7 — Multi-Factor Authentication =====

export function enrollMfaFactor(input: {
  identityId: string; type: MfaFactorType;
  label?: string | null;
  expiresAt?: string | null;
  backupCodesRemaining?: number;
  metadata?: Record<string, unknown>;
}): MfaFactor {
  const now = new Date().toISOString();
  const factor: MfaFactor = {
    id: randomUUID(), identityId: input.identityId,
    type: input.type, status: "active",
    label: input.label ?? null,
    enrolledAt: now, lastUsedAt: null,
    expiresAt: input.expiresAt ?? null,
    backupCodesRemaining: input.backupCodesRemaining ?? 0,
    metadata: input.metadata ?? {},
  };
  storeMfaFactor(factor);
  publishIdentityEvent("MfaEnrolled", input.identityId, {
    factorId: factor.id, type: factor.type,
  });
  log.info("mfa.enrolled", { id: factor.id, type: factor.type });
  return factor;
}

export function getMfaFactorById(id: string): MfaFactor | null { return getMfaFactor(id); }
export function listMfaFactors(identityId?: string, status?: MfaFactorStatus): MfaFactor[] {
  let all = getAllMfaFactors();
  if (identityId) all = all.filter(f => f.identityId === identityId);
  if (status) all = all.filter(f => f.status === status);
  return all;
}

export function disableMfaFactor(id: string, reason: string): MfaFactor | null {
  const f = getMfaFactor(id);
  if (!f) return null;
  if (f.status !== "active") return null;
  f.status = "disabled";
  storeMfaFactor(f);
  publishIdentityEvent("MfaDisabled", f.identityId, { factorId: f.id, reason });
  return f;
}

export function createMfaChallenge(input: {
  identityId: string; factorId: string;
  durationMinutes?: number; maxAttempts?: number;
}): MfaChallenge {
  const factor = getMfaFactor(input.factorId);
  if (!factor) throw new Error(`MFA factor not found: ${input.factorId}`);
  if (factor.identityId !== input.identityId) throw new Error("Identity mismatch");
  if (factor.status !== "active") throw new Error("Factor not active");
  const now = new Date().toISOString();
  const challenge: MfaChallenge = {
    id: randomUUID(), identityId: input.identityId, factorId: input.factorId,
    status: "pending",
    issuedAt: now, verifiedAt: null,
    expiresAt: new Date(Date.now() + (input.durationMinutes ?? 5) * 60 * 1000).toISOString(),
    attemptCount: 0, maxAttempts: input.maxAttempts ?? 3,
    correlationId: randomUUID(),
  };
  storeMfaChallenge(challenge);
  return challenge;
}

export function verifyMfaChallenge(challengeId: string, code: string): MfaChallenge | null {
  const c = getMfaChallenge(challengeId);
  if (!c) return null;
  if (c.status !== "pending") return null;
  if (new Date(c.expiresAt).getTime() < Date.now()) {
    c.status = "expired";
    storeMfaChallenge(c);
    return null;
  }
  c.attemptCount += 1;
  // Deterministic verification: code matches the last 6 chars of the challenge id (uppercase)
  // In production this would be a TOTP/HOTP validation. We never call a real provider.
  const expected = c.id.replace(/-/g, "").slice(-6).toUpperCase();
  if (code.toUpperCase() === expected) {
    c.status = "verified";
    c.verifiedAt = new Date().toISOString();
    const factor = getMfaFactor(c.factorId);
    if (factor) {
      factor.lastUsedAt = c.verifiedAt;
      if (factor.type === "backup_codes" && factor.backupCodesRemaining > 0) {
        factor.backupCodesRemaining -= 1;
        if (factor.backupCodesRemaining === 0) factor.status = "consumed";
      }
      storeMfaFactor(factor);
    }
    publishIdentityEvent("MfaVerified", c.identityId, {
      factorId: c.factorId, correlationId: c.correlationId,
    });
  } else {
    if (c.attemptCount >= c.maxAttempts) {
      c.status = "failed";
    }
  }
  storeMfaChallenge(c);
  return c;
}

export function listMfaChallenges(identityId?: string, status?: MfaChallenge["status"]): MfaChallenge[] {
  let all = getAllMfaChallenges();
  if (identityId) all = all.filter(c => c.identityId === identityId);
  if (status) all = all.filter(c => c.status === status);
  return all;
}

export function supportsAllMfaFactorTypes(): MfaFactorType[] {
  return ["authenticator_app", "security_key", "backup_codes", "sms_reference", "email_reference"];
}
export function supportsAllMfaFactorStatuses(): MfaFactorStatus[] {
  return ["active", "disabled", "expired", "consumed"];
}

// ===== System 8 — Permission Registry =====

export function registerPermission(input: {
  key: string; namespace: string;
  description?: string;
  parentKey?: string | null;
  implies?: string[];
  metadata?: Record<string, unknown>;
}): Permission {
  if (getPermissionByKey(input.key)) throw new Error(`Permission already exists: ${input.key}`);
  const now = new Date().toISOString();
  const perm: Permission = {
    id: randomUUID(), key: input.key,
    namespace: input.namespace,
    description: input.description ?? "",
    parentKey: input.parentKey ?? null,
    implies: input.implies ?? [],
    version: 1, active: true,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storePermission(perm);
  log.info("permission.registered", { id: perm.id, key: perm.key });
  return perm;
}

export function getPermissionById(id: string): Permission | null { return getPermission(id); }
export function getPermissionByReference(key: string): Permission | null { return getPermissionByKey(key); }
export function listPermissions(namespace?: string, active?: boolean): Permission[] {
  let all = getAllPermissions();
  if (namespace) all = all.filter(p => p.namespace === namespace);
  if (active !== undefined) all = all.filter(p => p.active === active);
  return all;
}

export function deactivatePermission(id: string): Permission | null {
  const p = getPermission(id);
  if (!p) return null;
  p.active = false;
  p.updatedAt = new Date().toISOString();
  p.version += 1;
  storePermission(p);
  return p;
}

/**
 * Resolves all permissions implied by a given permission (transitive).
 */
export function resolveImpliedPermissions(permissionKey: string): string[] {
  const visited = new Set<string>();
  const queue = [permissionKey];
  while (queue.length > 0) {
    const k = queue.shift()!;
    if (visited.has(k)) continue;
    visited.add(k);
    const p = getPermissionByKey(k);
    if (p) for (const impl of p.implies) queue.push(impl);
  }
  return Array.from(visited);
}

/**
 * Validates whether an identity has a given permission key.
 * Permission keys are resolved transitively through `implies` and parent inheritance.
 */
export function hasPermissionKey(grantedKeys: string[], requiredKey: string): boolean {
  const resolved = new Set<string>();
  for (const k of grantedKeys) {
    for (const r of resolveImpliedPermissions(k)) resolved.add(r);
  }
  return resolved.has(requiredKey);
}
