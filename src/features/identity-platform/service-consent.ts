/** Systems 13, 14 — Service Accounts + Consent & Privacy. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeServiceAccount, getServiceAccount, getAllServiceAccounts,
  storeConsentRecord, getConsentRecords, getAllConsentRecords,
  storePrivacySettings, getPrivacySettings, getAllPrivacySettings,
  appendAudit,
} from "./repository";
import type {
  ServiceAccount, ConsentRecord, PrivacySettings,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.service");

// ===== System 13 — Service Accounts =====

export function createServiceAccount(input: {
  identityId: string; name: string; description?: string;
  scopes?: string[];
  ownerIdentityId: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}): ServiceAccount {
  const now = new Date().toISOString();
  const account: ServiceAccount = {
    id: randomUUID(), identityId: input.identityId,
    name: input.name, description: input.description ?? "",
    scopes: input.scopes ?? [],
    ownerIdentityId: input.ownerIdentityId,
    active: true,
    issuedAt: now, expiresAt: input.expiresAt ?? null,
    lastUsedAt: null,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeServiceAccount(account);
  log.info("service_account.created", { id: account.id, identityId: input.identityId });
  return account;
}

export function getServiceAccountById(id: string): ServiceAccount | null { return getServiceAccount(id); }
export function listServiceAccounts(identityId?: string, active?: boolean): ServiceAccount[] {
  let all = getAllServiceAccounts();
  if (identityId) all = all.filter(s => s.identityId === identityId);
  if (active !== undefined) all = all.filter(s => s.active === active);
  return all;
}

export function recordServiceAccountUsage(id: string): ServiceAccount | null {
  const s = getServiceAccount(id);
  if (!s) return null;
  if (!s.active) return null;
  s.lastUsedAt = new Date().toISOString();
  storeServiceAccount(s);
  return s;
}

export function deactivateServiceAccount(id: string): ServiceAccount | null {
  const s = getServiceAccount(id);
  if (!s) return null;
  if (!s.active) return null;
  s.active = false;
  storeServiceAccount(s);
  return s;
}

export function addServiceAccountScope(id: string, scope: string): ServiceAccount | null {
  const s = getServiceAccount(id);
  if (!s) return null;
  if (s.scopes.includes(scope)) return s;
  s.scopes.push(scope);
  storeServiceAccount(s);
  return s;
}

// ===== System 14 — Consent & Privacy =====

export function recordConsent(input: {
  identityId: string; purpose: string;
  granted: boolean; version?: string;
  metadata?: Record<string, unknown>;
}): ConsentRecord {
  const now = new Date().toISOString();
  const consent: ConsentRecord = {
    id: randomUUID(), identityId: input.identityId,
    purpose: input.purpose,
    granted: input.granted,
    grantedAt: input.granted ? now : null,
    revokedAt: input.granted ? null : now,
    version: input.version ?? "1.0.0",
    metadata: input.metadata ?? {},
  };
  storeConsentRecord(consent);
  if (input.granted) publishIdentityEvent("ConsentGranted", input.identityId, { purpose: input.purpose });
  else publishIdentityEvent("ConsentRevoked", input.identityId, { purpose: input.purpose });
  return consent;
}

export function revokeConsent(identityId: string, purpose: string): ConsentRecord | null {
  const records = getConsentRecords(identityId);
  const existing = records.find(r => r.purpose === purpose && r.granted);
  if (!existing) return null;
  existing.granted = false;
  existing.grantedAt = null;
  existing.revokedAt = new Date().toISOString();
  storeConsentRecord(existing);
  publishIdentityEvent("ConsentRevoked", identityId, { purpose });
  return existing;
}

export function listConsentRecords(identityId?: string): ConsentRecord[] {
  return identityId ? getConsentRecords(identityId) : getAllConsentRecords();
}

export function hasConsent(identityId: string, purpose: string): boolean {
  return getConsentRecords(identityId).some(r => r.purpose === purpose && r.granted);
}

export function createPrivacySettings(input: {
  identityId: string;
  profileVisibility?: "public" | "organization" | "private";
  contactVisibility?: "public" | "organization" | "private";
  activitySharing?: boolean;
  dataSharing?: boolean;
  analyticsOptOut?: boolean;
  marketingOptOut?: boolean;
  minorProtection?: boolean;
  parentConsentRequired?: boolean;
  parentIdentityId?: string | null;
  teacherVisibility?: "full" | "limited" | "none";
  organizationOverrides?: Record<string, boolean>;
}): PrivacySettings {
  if (getPrivacySettings(input.identityId)) throw new Error(`Privacy settings already exist for identity: ${input.identityId}`);
  const settings: PrivacySettings = {
    identityId: input.identityId,
    profileVisibility: input.profileVisibility ?? "organization",
    contactVisibility: input.contactVisibility ?? "private",
    activitySharing: input.activitySharing ?? false,
    dataSharing: input.dataSharing ?? false,
    analyticsOptOut: input.analyticsOptOut ?? false,
    marketingOptOut: input.marketingOptOut ?? true,
    minorProtection: input.minorProtection ?? false,
    parentConsentRequired: input.parentConsentRequired ?? false,
    parentIdentityId: input.parentIdentityId ?? null,
    teacherVisibility: input.teacherVisibility ?? "limited",
    organizationOverrides: input.organizationOverrides ?? {},
    updatedAt: new Date().toISOString(),
  };
  storePrivacySettings(settings);
  log.info("privacy_settings.created", { identityId: input.identityId });
  return settings;
}

export function getPrivacySettingsForIdentity(identityId: string): PrivacySettings | null {
  return getPrivacySettings(identityId);
}

export function listAllPrivacySettings(): PrivacySettings[] { return getAllPrivacySettings(); }

export function updatePrivacySettings(identityId: string, updates: Partial<PrivacySettings>): PrivacySettings | null {
  const s = getPrivacySettings(identityId);
  if (!s) return null;
  const { identityId: _ignored, updatedAt: _ignored2, ...safe } = updates as PrivacySettings;
  Object.assign(s, safe);
  s.updatedAt = new Date().toISOString();
  storePrivacySettings(s);
  return s;
}

export function setOrganizationOverride(identityId: string, organizationId: string, enabled: boolean): PrivacySettings | null {
  const s = getPrivacySettings(identityId);
  if (!s) return null;
  s.organizationOverrides[organizationId] = enabled;
  s.updatedAt = new Date().toISOString();
  storePrivacySettings(s);
  return s;
}

export function setParentalConsent(identityId: string, parentIdentityId: string): PrivacySettings | null {
  const s = getPrivacySettings(identityId);
  if (!s) return null;
  s.parentConsentRequired = true;
  s.parentIdentityId = parentIdentityId;
  s.minorProtection = true;
  s.updatedAt = new Date().toISOString();
  storePrivacySettings(s);
  return s;
}

export function canShareData(identityId: string, organizationId?: string | null): { canShare: boolean; reasons: string[] } {
  const s = getPrivacySettings(identityId);
  if (!s) return { canShare: false, reasons: ["no_privacy_settings"] };
  const reasons: string[] = [];
  if (!s.dataSharing) reasons.push("data_sharing_disabled");
  if (s.minorProtection && !s.parentIdentityId) reasons.push("minor_protection_no_parent");
  if (s.analyticsOptOut) reasons.push("analytics_opt_out");
  if (organizationId && s.organizationOverrides[organizationId] === false) reasons.push("org_override_disabled");
  return { canShare: reasons.length === 0, reasons };
}
