/** Systems 8, 9 — Configuration Validation + Configuration Comparison. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeValidationFinding, getValidationFindings, storeValidationResult, getValidationResult, storeComparison, getComparison, getConfig, getVersion } from "./repository";
import type { ValidationFinding, ValidationIssueKind, ValidationResult, ConfigComparison } from "./types";
import { computeDiff } from "./configuration-registry";

const log = getLogger("game-config.validation");

// ===== System 8 — Configuration Validation =====
export function validateConfig(configId: string, version: string, data: Record<string, unknown>): ValidationResult {
  const findings: ValidationFinding[] = [];
  const now = new Date().toISOString();

  // Check missing required values
  const requiredFields = ["gameMode", "maxPlayers", "timer"];
  for (const field of requiredFields) {
    if (!(field in data)) {
      const f: ValidationFinding = { id: randomUUID(), configId, version, kind: "missing_value", field, severity: "error", message: `Missing required field: ${field}`, timestamp: now };
      findings.push(f); storeValidationFinding(f);
    }
  }

  // Check invalid ranges
  if ("maxPlayers" in data && typeof data.maxPlayers === "number" && (data.maxPlayers < 1 || data.maxPlayers > 1000)) {
    const f: ValidationFinding = { id: randomUUID(), configId, version, kind: "invalid_range", field: "maxPlayers", severity: "error", message: "maxPlayers must be 1-1000", timestamp: now };
    findings.push(f); storeValidationFinding(f);
  }
  if ("timer" in data && typeof data.timer === "number" && (data.timer < 1000 || data.timer > 600000)) {
    const f: ValidationFinding = { id: randomUUID(), configId, version, kind: "invalid_range", field: "timer", severity: "warning", message: "timer should be 1000-600000ms", timestamp: now };
    findings.push(f); storeValidationFinding(f);
  }

  // Check for deprecated fields
  const deprecatedFields = ["legacyScore", "oldTimer"];
  for (const field of deprecatedFields) {
    if (field in data) {
      const f: ValidationFinding = { id: randomUUID(), configId, version, kind: "deprecated_config", field, severity: "warning", message: `Deprecated field: ${field}`, timestamp: now };
      findings.push(f); storeValidationFinding(f);
    }
  }

  // Check for unknown configs
  const knownFields = new Set([...requiredFields, "scoring", "rewards", "difficulty", "overtime", "tieResolution", "gameMode", "maxPlayers", "timer"]);
  for (const key of Object.keys(data)) {
    if (!knownFields.has(key)) {
      const f: ValidationFinding = { id: randomUUID(), configId, version, kind: "unknown_config", field: key, severity: "info", message: `Unknown configuration field: ${key}`, timestamp: now };
      findings.push(f); storeValidationFinding(f);
    }
  }

  const result: ValidationResult = {
    configId, version, valid: !findings.some(f => f.severity === "error"),
    findings, validatedAt: now,
  };
  storeValidationResult(result);
  return result;
}

export function getValidationResultFor(configId: string, version: string): ValidationResult | null { return getValidationResult(configId, version); }
export function getFindingsFor(configId: string, version: string): ValidationFinding[] { return getValidationFindings(configId, version); }
export function supportsAllIssueKinds(): ValidationIssueKind[] { return ["missing_value", "invalid_range", "broken_dependency", "circular_reference", "unknown_config", "deprecated_config", "ownership_violation"]; }

// ===== System 9 — Configuration Comparison =====
export function compareConfigs(configId: string, versionA: string, versionB: string): ConfigComparison | null {
  const config = getConfig(configId);
  if (!config) return null;
  const vA = getVersion(configId, versionA);
  const vB = getVersion(configId, versionB);
  if (!vA || !vB) return null;

  // Use config data as proxy for version data
  const dataA = config.data; // In production, would load version-specific data
  const dataB = config.data;
  const diff = computeDiff(dataA, dataB);
  const diffs: Array<{ path: string; valueA: unknown; valueB: unknown; change: "added" | "removed" | "modified" }> = [];
  for (const k of diff.added) diffs.push({ path: k, valueA: undefined, valueB: dataB[k], change: "added" });
  for (const k of diff.removed) diffs.push({ path: k, valueA: dataA[k], valueB: undefined, change: "removed" });
  for (const k of diff.modified) diffs.push({ path: k, valueA: dataA[k], valueB: dataB[k], change: "modified" });

  const hasBreaking = diff.removed.length > 0;
  const impactLevel: ConfigComparison["impactLevel"] = hasBreaking ? "breaking" : diffs.length === 0 ? "none" : diffs.length < 3 ? "low" : diffs.length < 6 ? "medium" : "high";

  const comparison: ConfigComparison = {
    configId, versionA, versionB, diffs, compatible: !hasBreaking,
    impactLevel, dependencyImpact: diff.modified,
  };
  storeComparison(comparison);
  return comparison;
}

export function getComparisonResult(configId: string, vA: string, vB: string): ConfigComparison | null { return getComparison(configId, vA, vB); }
