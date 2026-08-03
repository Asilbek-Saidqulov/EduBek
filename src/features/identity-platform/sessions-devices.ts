/** Systems 5, 6 — Session Platform + Device Registry. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeSession, getSession, getAllSessions,
  storeDevice, getDevice, getAllDevices,
  appendAudit,
} from "./repository";
import type {
  Session, SessionStatus, Device, DeviceTrust, DeviceStatus,
} from "./types";
import { publishIdentityEvent } from "./event-bus-bridge";

const log = getLogger("identity.sessions");

// ===== System 5 — Session Platform =====

export function createSession(input: {
  identityId: string; deviceId?: string | null;
  durationMinutes?: number;
  ipAddress?: string | null; userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Session {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (input.durationMinutes ?? 60) * 60 * 1000).toISOString();
  const session: Session = {
    id: randomUUID(), identityId: input.identityId,
    deviceId: input.deviceId ?? null,
    status: "active",
    issuedAt: now, expiresAt,
    lastActiveAt: now, refreshedAt: null,
    revokedAt: null, revocationReason: null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeSession(session);
  publishIdentityEvent("SessionCreated", input.identityId, {
    sessionId: session.id, correlationId: session.correlationId,
  });
  log.info("session.created", { id: session.id, identityId: input.identityId });
  return session;
}

export function getSessionById(id: string): Session | null { return getSession(id); }
export function listSessions(identityId?: string, status?: SessionStatus): Session[] {
  let all = getAllSessions();
  if (identityId) all = all.filter(s => s.identityId === identityId);
  if (status) all = all.filter(s => s.status === status);
  return all;
}

export function touchSession(id: string): Session | null {
  const s = getSession(id);
  if (!s) return null;
  if (s.status !== "active") return null;
  s.lastActiveAt = new Date().toISOString();
  storeSession(s);
  return s;
}

export function refreshSession(id: string, extendMinutes?: number): Session | null {
  const s = getSession(id);
  if (!s) return null;
  if (s.status !== "active") return null;
  if (new Date(s.expiresAt).getTime() < Date.now()) {
    s.status = "expired";
    storeSession(s);
    publishIdentityEvent("SessionExpired", s.identityId, { sessionId: s.id });
    return null;
  }
  s.refreshedAt = new Date().toISOString();
  s.expiresAt = new Date(Date.now() + (extendMinutes ?? 60) * 60 * 1000).toISOString();
  storeSession(s);
  return s;
}

export function revokeSession(id: string, reason: string): Session | null {
  const s = getSession(id);
  if (!s) return null;
  if (s.status !== "active") return null;
  s.status = "revoked";
  s.revokedAt = new Date().toISOString();
  s.revocationReason = reason;
  storeSession(s);
  publishIdentityEvent("SessionRevoked", s.identityId, {
    sessionId: s.id, reason, correlationId: s.correlationId,
  });
  return s;
}

export function expireSession(id: string): Session | null {
  const s = getSession(id);
  if (!s) return null;
  if (s.status !== "active") return null;
  s.status = "expired";
  storeSession(s);
  publishIdentityEvent("SessionExpired", s.identityId, { sessionId: s.id });
  return s;
}

export function revokeAllSessions(identityId: string, reason: string): number {
  const sessions = getAllSessions().filter(s => s.identityId === identityId && s.status === "active");
  for (const s of sessions) revokeSession(s.id, reason);
  return sessions.length;
}

export function countActiveSessions(identityId: string): number {
  return getAllSessions().filter(s => s.identityId === identityId && s.status === "active").length;
}

export function expireStaleSessions(now: number = Date.now()): number {
  const expired = getAllSessions().filter(s =>
    s.status === "active" && new Date(s.expiresAt).getTime() < now
  );
  for (const s of expired) expireSession(s.id);
  return expired.length;
}

export function supportsAllSessionStatuses(): SessionStatus[] {
  return ["active", "expired", "revoked", "replaced"];
}

// ===== System 6 — Device Registry =====

export function registerDevice(input: {
  identityId: string; fingerprint: string;
  name?: string | null; type?: string | null; platform?: string | null;
  trust?: DeviceTrust;
  riskFlags?: string[];
  metadata?: Record<string, unknown>;
}): Device {
  // Check if device fingerprint already exists for this user
  const existing = getAllDevices().find(d => d.identityId === input.identityId && d.fingerprint === input.fingerprint && d.status === "active");
  if (existing) return existing;
  const now = new Date().toISOString();
  const device: Device = {
    id: randomUUID(), identityId: input.identityId,
    fingerprint: input.fingerprint,
    name: input.name ?? null,
    type: input.type ?? null,
    platform: input.platform ?? null,
    trust: input.trust ?? "known",
    status: "active",
    riskFlags: input.riskFlags ?? [],
    firstSeenAt: now, lastSeenAt: now,
    verifiedAt: null, revokedAt: null, revocationReason: null,
    metadata: input.metadata ?? {},
  };
  storeDevice(device);
  publishIdentityEvent("DeviceRegistered", input.identityId, {
    deviceId: device.id, trust: device.trust,
  });
  log.info("device.registered", { id: device.id, identityId: input.identityId });
  return device;
}

export function getDeviceById(id: string): Device | null { return getDevice(id); }
export function listDevices(identityId?: string, status?: DeviceStatus): Device[] {
  let all = getAllDevices();
  if (identityId) all = all.filter(d => d.identityId === identityId);
  if (status) all = all.filter(d => d.status === status);
  return all;
}

export function touchDevice(id: string): Device | null {
  const d = getDevice(id);
  if (!d) return null;
  if (d.status !== "active") return null;
  d.lastSeenAt = new Date().toISOString();
  storeDevice(d);
  return d;
}

export function verifyDevice(id: string): Device | null {
  const d = getDevice(id);
  if (!d) return null;
  if (d.status !== "active") return null;
  if (d.trust === "trusted") return d;
  d.trust = "trusted";
  d.verifiedAt = new Date().toISOString();
  storeDevice(d);
  publishIdentityEvent("DeviceVerified", d.identityId, { deviceId: d.id });
  return d;
}

export function promoteDeviceTrust(id: string, trust: DeviceTrust): Device | null {
  const d = getDevice(id);
  if (!d) return null;
  d.trust = trust;
  storeDevice(d);
  return d;
}

export function addDeviceRiskFlag(id: string, flag: string): Device | null {
  const d = getDevice(id);
  if (!d) return null;
  if (d.riskFlags.includes(flag)) return d;
  d.riskFlags.push(flag);
  storeDevice(d);
  return d;
}

export function revokeDevice(id: string, reason: string): Device | null {
  const d = getDevice(id);
  if (!d) return null;
  if (d.status !== "active") return null;
  d.status = "revoked";
  d.revokedAt = new Date().toISOString();
  d.revocationReason = reason;
  storeDevice(d);
  publishIdentityEvent("DeviceRevoked", d.identityId, { deviceId: d.id, reason });
  return d;
}

export function supportsAllDeviceTrusts(): DeviceTrust[] {
  return ["known", "trusted", "temporary", "untrusted"];
}
export function supportsAllDeviceStatuses(): DeviceStatus[] {
  return ["active", "revoked", "expired"];
}
