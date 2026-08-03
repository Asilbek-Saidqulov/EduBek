/** Systems 3, 4 — Authentication Abstraction + Identity Federation. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeAuthProvider, getAuthProvider, getAllAuthProviders,
  storeAuthSession, getAuthSession, getAllAuthSessions,
  storeFederationLink, getFederationLink, getAllFederationLinks,
  appendAudit,
} from "./repository";
import type {
  AuthMethod, AuthProviderConfig, AuthProviderStatus, AuthSession,
  FederationLink, FederationProvider, FederationLinkStatus,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.auth");

// ===== System 3 — Authentication Abstraction =====

export function registerAuthProvider(input: {
  id: string; method: AuthMethod;
  name: string; status?: AuthProviderStatus;
  supportsMfa?: boolean; supportsRefresh?: boolean;
  supportedLocales?: string[];
  providerReference?: string | null;
  metadata?: Record<string, unknown>;
}): AuthProviderConfig {
  if (getAuthProvider(input.id)) throw new Error(`Auth provider already registered: ${input.id}`);
  const provider: AuthProviderConfig = {
    id: input.id, method: input.method,
    name: input.name, status: input.status ?? "active",
    supportsMfa: input.supportsMfa ?? false,
    supportsRefresh: input.supportsRefresh ?? false,
    supportedLocales: input.supportedLocales ?? ["en", "uz", "ru"],
    providerReference: input.providerReference ?? null,
    metadata: input.metadata ?? {},
  };
  storeAuthProvider(provider);
  log.info("auth_provider.registered", { id: provider.id, method: provider.method });
  return provider;
}

export function getAuthProviderById(id: string): AuthProviderConfig | null { return getAuthProvider(id); }
export function listAuthProviders(method?: AuthMethod, status?: AuthProviderStatus): AuthProviderConfig[] {
  let all = getAllAuthProviders();
  if (method) all = all.filter(p => p.method === method);
  if (status) all = all.filter(p => p.status === status);
  return all;
}

export function setAuthProviderStatus(id: string, status: AuthProviderStatus): AuthProviderConfig | null {
  const p = getAuthProvider(id);
  if (!p) return null;
  p.status = status;
  storeAuthProvider(p);
  return p;
}

export function isAuthProviderAvailable(id: string, locale?: string): boolean {
  const p = getAuthProvider(id);
  if (!p) return false;
  if (p.status !== "active") return false;
  if (locale && p.supportedLocales.length > 0 && !p.supportedLocales.includes(locale)) return false;
  return true;
}

/**
 * Creates an auth session reference. NOTE: This is the ONLY auth primitive.
 * The platform NEVER authenticates users directly — it just records auth events
 * and produces events that other modules can react to.
 */
export function createAuthSession(input: {
  identityId: string; method: AuthMethod; providerId: string;
  durationMinutes?: number;
  metadata?: Record<string, unknown>;
}): AuthSession {
  const provider = getAuthProvider(input.providerId);
  if (!provider) throw new Error(`Auth provider not found: ${input.providerId}`);
  if (provider.method !== input.method) throw new Error("Method/provider mismatch");
  if (!isAuthProviderAvailable(input.providerId)) throw new Error(`Provider not available: ${input.providerId}`);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (input.durationMinutes ?? 60) * 60 * 1000).toISOString();
  const session: AuthSession = {
    id: randomUUID(), identityId: input.identityId,
    method: input.method, providerId: input.providerId,
    issuedAt: now, expiresAt,
    refreshedAt: null, revokedAt: null, revocationReason: null,
    metadata: input.metadata ?? {},
  };
  storeAuthSession(session);
  appendAudit({
    id: randomUUID(), identityId: input.identityId, actorId: input.identityId,
    action: "auth_session_created", scope: "auth", targetId: session.id,
    before: {}, after: { method: input.method, providerId: input.providerId },
    reason: "Auth session created", correlationId: randomUUID(),
    approvalReference: null, occurredAt: now, immutable: true,
  });
  log.info("auth_session.created", { id: session.id, identityId: input.identityId });
  return session;
}

export function getAuthSessionById(id: string): AuthSession | null { return getAuthSession(id); }
export function listAuthSessions(identityId?: string): AuthSession[] {
  const all = getAllAuthSessions();
  return identityId ? all.filter(s => s.identityId === identityId) : all;
}

export function refreshAuthSession(id: string): AuthSession | null {
  const s = getAuthSession(id);
  if (!s) return null;
  if (s.revokedAt) return null;
  if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) return null;
  const provider = getAuthProvider(s.providerId);
  if (!provider?.supportsRefresh) return null;
  s.refreshedAt = new Date().toISOString();
  s.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  storeAuthSession(s);
  return s;
}

export function revokeAuthSession(id: string, reason: string): AuthSession | null {
  const s = getAuthSession(id);
  if (!s) return null;
  if (s.revokedAt) return null;
  s.revokedAt = new Date().toISOString();
  s.revocationReason = reason;
  storeAuthSession(s);
  return s;
}

export function supportsAllAuthMethods(): AuthMethod[] {
  return ["password", "passkey", "oauth", "oidc", "saml", "magic_link", "api_token", "service_token"];
}
export function supportsAllAuthProviderStatuses(): AuthProviderStatus[] {
  return ["active", "inactive", "maintenance", "deprecated"];
}

// ===== System 4 — Identity Federation =====

export function linkFederation(input: {
  identityId: string; provider: FederationProvider;
  externalId: string; externalEmail?: string | null;
  externalMetadata?: Record<string, unknown>;
}): FederationLink {
  const now = new Date().toISOString();
  const link: FederationLink = {
    id: randomUUID(), identityId: input.identityId,
    provider: input.provider, externalId: input.externalId,
    externalEmail: input.externalEmail ?? null,
    externalMetadata: input.externalMetadata ?? {},
    status: "active",
    linkedAt: now, revokedAt: null, lastSyncedAt: now,
    correlationId: randomUUID(),
  };
  storeFederationLink(link);
  publishIdentityEvent("FederationLinked", input.identityId, {
    linkId: link.id, provider: link.provider, correlationId: link.correlationId,
  });
  log.info("federation.linked", { id: link.id, provider: link.provider });
  return link;
}

export function getFederationLinkById(id: string): FederationLink | null { return getFederationLink(id); }
export function listFederationLinks(identityId?: string, provider?: FederationProvider): FederationLink[] {
  let all = getAllFederationLinks();
  if (identityId) all = all.filter(l => l.identityId === identityId);
  if (provider) all = all.filter(l => l.provider === provider);
  return all;
}

export function syncFederationLink(id: string): FederationLink | null {
  const l = getFederationLink(id);
  if (!l) return null;
  if (l.status !== "active") return null;
  l.lastSyncedAt = new Date().toISOString();
  storeFederationLink(l);
  return l;
}

export function revokeFederationLink(id: string, reason: string): FederationLink | null {
  const l = getFederationLink(id);
  if (!l) return null;
  if (l.status !== "active") return null;
  l.status = "revoked";
  l.revokedAt = new Date().toISOString();
  storeFederationLink(l);
  publishIdentityEvent("FederationUnlinked", l.identityId, {
    linkId: l.id, reason, correlationId: l.correlationId,
  });
  return l;
}

export function supportsAllFederationProviders(): FederationProvider[] {
  return ["google", "microsoft", "apple", "github", "school_sso", "enterprise_identity", "government_identity", "custom"];
}
export function supportsAllFederationLinkStatuses(): FederationLinkStatus[] {
  return ["active", "revoked", "expired"];
}
