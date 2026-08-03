/** Systems 11, 12 — Delegation Platform + API Credentials. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeDelegation, getDelegation, getAllDelegations,
  storeApiCredential, getApiCredential, getAllApiCredentials,
  appendAudit,
} from "./repository";
import type {
  Delegation, DelegationStatus, RoleScope,
  ApiCredential, ApiCredentialType, ApiCredentialStatus,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.delegation");

// ===== System 11 — Delegation Platform =====

export function createDelegation(input: {
  fromIdentityId: string; toIdentityId: string;
  roleKey: string; scope: RoleScope;
  scopeId?: string | null;
  reason: string;
  startsAt?: string; endsAt: string;
  approvalReference?: string | null;
  metadata?: Record<string, unknown>;
}): Delegation {
  if (input.fromIdentityId === input.toIdentityId) throw new Error("Cannot delegate to self");
  if (new Date(input.endsAt).getTime() <= new Date(input.startsAt ?? new Date().toISOString()).getTime()) {
    throw new Error("Ends must be after starts");
  }
  const now = new Date().toISOString();
  const delegation: Delegation = {
    id: randomUUID(),
    fromIdentityId: input.fromIdentityId, toIdentityId: input.toIdentityId,
    roleKey: input.roleKey, scope: input.scope,
    scopeId: input.scopeId ?? null,
    reason: input.reason,
    status: "pending",
    approvedBy: null, approvedAt: null,
    startsAt: input.startsAt ?? now,
    endsAt: input.endsAt,
    revokedAt: null, revocationReason: null,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeDelegation(delegation);
  publishIdentityEvent("DelegationCreated", input.fromIdentityId, {
    delegationId: delegation.id, toIdentityId: input.toIdentityId,
    correlationId: delegation.correlationId,
  });
  log.info("delegation.created", { id: delegation.id });
  return delegation;
}

export function getDelegationById(id: string): Delegation | null { return getDelegation(id); }
export function listDelegations(status?: DelegationStatus, identityId?: string): Delegation[] {
  let all = getAllDelegations();
  if (status) all = all.filter(d => d.status === status);
  if (identityId) all = all.filter(d => d.fromIdentityId === identityId || d.toIdentityId === identityId);
  return all;
}

const VALID_DELEGATION_TRANSITIONS: Record<DelegationStatus, DelegationStatus[]> = {
  pending: ["active", "revoked", "expired"],
  active: ["revoked", "expired", "completed"],
  expired: [],
  revoked: [],
  completed: [],
};

export function canTransitionDelegation(from: DelegationStatus, to: DelegationStatus): boolean {
  return VALID_DELEGATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function approveDelegation(id: string, approverId: string): Delegation | null {
  const d = getDelegation(id);
  if (!d) return null;
  if (d.status !== "pending") return null;
  d.status = "active";
  d.approvedBy = approverId;
  d.approvedAt = new Date().toISOString();
  storeDelegation(d);
  return d;
}

export function completeDelegation(id: string): Delegation | null {
  const d = getDelegation(id);
  if (!d) return null;
  if (!canTransitionDelegation(d.status, "completed")) return null;
  d.status = "completed";
  storeDelegation(d);
  return d;
}

export function expireDelegation(id: string): Delegation | null {
  const d = getDelegation(id);
  if (!d) return null;
  if (!canTransitionDelegation(d.status, "expired")) return null;
  d.status = "expired";
  storeDelegation(d);
  return d;
}

export function revokeDelegation(id: string, reason: string): Delegation | null {
  const d = getDelegation(id);
  if (!d) return null;
  if (!canTransitionDelegation(d.status, "revoked")) return null;
  d.status = "revoked";
  d.revokedAt = new Date().toISOString();
  d.revocationReason = reason;
  storeDelegation(d);
  publishIdentityEvent("DelegationRevoked", d.fromIdentityId, {
    delegationId: d.id, reason, correlationId: d.correlationId,
  });
  return d;
}

export function listActiveDelegations(identityId: string, now: number = Date.now()): Delegation[] {
  return getAllDelegations().filter(d =>
    d.status === "active" &&
    d.toIdentityId === identityId &&
    new Date(d.endsAt).getTime() > now
  );
}

export function supportsAllDelegationStatuses(): DelegationStatus[] {
  return ["pending", "active", "expired", "revoked", "completed"];
}

// ===== System 12 — API Credentials =====

export function issueApiCredential(input: {
  identityId: string; type: ApiCredentialType;
  name: string;
  scopes?: string[];
  expiresAt?: string | null;
  rotationDueAt?: string | null;
  metadata?: Record<string, unknown>;
}): ApiCredential & { plainSecret: string } {
  const now = new Date().toISOString();
  // Generate deterministic-looking prefix and a secret. The secret is returned once.
  // Hashing is a simple deterministic hash (NOT for production). Reference-only.
  const prefix = `ek_${input.type.slice(0, 3)}_${randomUUID().slice(0, 8)}`;
  const secret = randomUUID() + randomUUID();
  const hashedSecret = hashSecret(secret);
  const credential: ApiCredential = {
    id: randomUUID(), identityId: input.identityId,
    type: input.type, name: input.name,
    keyPrefix: prefix, hashedSecret,
    scopes: input.scopes ?? [],
    status: "active",
    issuedAt: now,
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    rotationDueAt: input.rotationDueAt ?? null,
    lastUsedAt: null, lastUsedIp: null,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeApiCredential(credential);
  publishIdentityEvent("ApiCredentialIssued", input.identityId, {
    credentialId: credential.id, type: credential.type,
    correlationId: credential.correlationId,
  });
  log.info("api_credential.issued", { id: credential.id, type: credential.type });
  return { ...credential, plainSecret: secret };
}

function hashSecret(secret: string): string {
  // Deterministic, NOT cryptographically secure. Reference-only.
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (h * 31 + secret.charCodeAt(i)) | 0;
  }
  return `h_${(h >>> 0).toString(16)}`;
}

export function getApiCredentialById(id: string): ApiCredential | null { return getApiCredential(id); }
export function listApiCredentials(identityId?: string, status?: ApiCredentialStatus): ApiCredential[] {
  let all = getAllApiCredentials();
  if (identityId) all = all.filter(c => c.identityId === identityId);
  if (status) all = all.filter(c => c.status === status);
  return all;
}

export function recordApiCredentialUsage(id: string, ipAddress: string | null): ApiCredential | null {
  const c = getApiCredential(id);
  if (!c) return null;
  if (c.status !== "active") return null;
  c.lastUsedAt = new Date().toISOString();
  c.lastUsedIp = ipAddress;
  storeApiCredential(c);
  return c;
}

export function rotateApiCredential(id: string): (ApiCredential & { plainSecret: string }) | null {
  const c = getApiCredential(id);
  if (!c) return null;
  if (c.status !== "active") return null;
  // Mark as rotating then issue new secret
  const newSecret = randomUUID() + randomUUID();
  c.hashedSecret = hashSecret(newSecret);
  c.keyPrefix = `ek_${c.type.slice(0, 3)}_${randomUUID().slice(0, 8)}`;
  c.rotationDueAt = null;
  c.version = (c.metadata.version as number | undefined ?? 0) + 1;
  c.metadata.version = c.version;
  storeApiCredential(c);
  publishIdentityEvent("ApiCredentialRotated", c.identityId, {
    credentialId: c.id, correlationId: c.correlationId,
  });
  return { ...c, plainSecret: newSecret };
}

export function revokeApiCredential(id: string, reason: string): ApiCredential | null {
  const c = getApiCredential(id);
  if (!c) return null;
  if (c.status === "revoked") return null;
  c.status = "revoked";
  c.revokedAt = new Date().toISOString();
  c.metadata.revocationReason = reason;
  storeApiCredential(c);
  publishIdentityEvent("ApiCredentialRevoked", c.identityId, {
    credentialId: c.id, reason, correlationId: c.correlationId,
  });
  return c;
}

export function supportsAllApiCredentialTypes(): ApiCredentialType[] {
  return ["api_key", "client_credentials", "extension_credentials", "webhook_secret"];
}
export function supportsAllApiCredentialStatuses(): ApiCredentialStatus[] {
  return ["active", "revoked", "expired", "rotating"];
}
