/**
 * EduBek — Event Versioning.
 *
 * Supports event evolution without breaking consumers.
 *
 * Lifecycle:
 *   experimental → stable → deprecated → removed
 *
 * Each event contract carries a semantic version (MAJOR.MINOR.PATCH):
 *   - MAJOR: breaking payload changes
 *   - MINOR: backward-compatible field additions
 *   - PATCH: documentation / metadata fixes
 *
 * Versioning rules:
 *   - Only one version of an event is "stable" at a time.
 *   - Deprecated events remain in the registry until removed.
 *   - Removed events are kept in the registry for documentation but
 *     flagged with status "removed" — producers must not emit them.
 *   - Consumers should check deprecation status and migrate.
 *
 * This module provides:
 *   - Version comparison (greaterThan, lessThan, equals)
 *   - Compatibility checking (isCompatible)
 *   - Lifecycle validation (canTransition)
 *   - Migration path discovery (getMigrationPath)
 */

import type { EventStatus, EventContract } from "./event-types";

// ===========================================================================
// Semantic Version parsing + comparison
// ===========================================================================

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a semantic version string ("1.2.3") into its components.
 * Returns null for invalid formats.
 */
export function parseVersion(version: string): SemanticVersion | null {
  const parts = version.split(".");
  if (parts.length !== 3) return null;
  const [major, minor, patch] = parts.map(Number);
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return null;
  if (major < 0 || minor < 0 || patch < 0) return null;
  return { major, minor, patch };
}

/**
 * Format a SemanticVersion back to "MAJOR.MINOR.PATCH" string.
 */
export function formatVersion(v: SemanticVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

/**
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) return 0;
  if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
  if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
  if (va.patch !== vb.patch) return va.patch < vb.patch ? -1 : 1;
  return 0;
}

export function versionGreaterThan(a: string, b: string): boolean {
  return compareVersions(a, b) > 0;
}

export function versionLessThan(a: string, b: string): boolean {
  return compareVersions(a, b) < 0;
}

export function versionEquals(a: string, b: string): boolean {
  return compareVersions(a, b) === 0;
}

// ===========================================================================
// Compatibility checking
// ===========================================================================

/**
 * Two event versions are compatible if they share the same MAJOR version.
 * MINOR and PATCH changes are backward-compatible by convention.
 */
export function isCompatible(versionA: string, versionB: string): boolean {
  const va = parseVersion(versionA);
  const vb = parseVersion(versionB);
  if (!va || !vb) return false;
  return va.major === vb.major;
}

/**
 * Returns the maximum compatible version from a list.
 */
export function getLatestCompatibleVersion(targetVersion: string, availableVersions: string[]): string | null {
  const target = parseVersion(targetVersion);
  if (!target) return null;
  const compatible = availableVersions.filter(v => isCompatible(v, targetVersion));
  if (compatible.length === 0) return null;
  return compatible.sort(compareVersions).pop() ?? null;
}

// ===========================================================================
// Lifecycle validation
// ===========================================================================

const LIFECYCLE_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  experimental: ["stable", "deprecated", "removed"],
  stable: ["deprecated", "removed"],
  deprecated: ["removed"],
  removed: [],
};

/**
 * Returns true if an event can transition from one status to another.
 */
export function canTransition(from: EventStatus, to: EventStatus): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns true if the status is active (consumers should expect the event).
 */
export function isActiveStatus(status: EventStatus): boolean {
  return status === "stable" || status === "experimental" || status === "deprecated";
}

/**
 * Returns true if the status means producers should NOT emit the event.
 */
export function isEmissionBlocked(status: EventStatus): boolean {
  return status === "removed";
}

// ===========================================================================
// Migration path discovery
// ===========================================================================

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  fromStatus: EventStatus;
  toStatus: EventStatus;
  description: string;
}

/**
 * Returns the migration path from a deprecated event to its replacement.
 * Returns null if the event is not deprecated or has no replacement.
 */
export function getMigrationPath(contract: EventContract): MigrationStep | null {
  if (!contract.deprecated || !contract.replacementEventId) return null;
  return {
    fromVersion: contract.version,
    toVersion: contract.version, // replacement is a different event, version stays for the old one
    fromStatus: contract.status,
    toStatus: "removed",
    description: `Migrate from ${contract.eventId} v${contract.version} to ${contract.replacementEventId}. ${contract.deprecationMessage ?? ""}`,
  };
}

/**
 * Returns all deprecated events in the registry.
 */
export function getDeprecatedEvents(contracts: EventContract[]): EventContract[] {
  return contracts.filter(c => c.deprecated);
}

/**
 * Returns all events that have a replacement event registered.
 */
export function getMigratableEvents(contracts: EventContract[]): EventContract[] {
  return contracts.filter(c => c.deprecated && c.replacementEventId);
}

/**
 * Returns all events by status.
 */
export function getEventsByStatus(contracts: EventContract[], status: EventStatus): EventContract[] {
  return contracts.filter(c => c.status === status);
}
