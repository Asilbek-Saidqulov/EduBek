/**
 * Systems 3 + 4 — Event Classification + Event Catalog.
 *
 * System 3 (Classification): Every event belongs to one class
 *   (mission_critical, business_critical, operational, analytics,
 *   informational). Supports severity, priority, retention, monitoring
 *   profile, alert profile, SLA profile.
 *
 * System 4 (Catalog): Human-readable registry derived entirely from the
 *   Event Registry. Contains purpose, producer, consumers, payload, schema,
 *   examples, version history, deprecation, replacement, latency, throughput,
 *   documentation. NEVER duplicates contracts.
 */
import { getLogger } from "@/lib/logger";
import {
  listEvents, getContract,
} from "@/features/game-engine/events";
import {
  storeClassification, getClassification, getAllClassifications,
} from "./repository";
import type {
  EventClassification,
  EventClass,
  Severity,
  Priority,
  RetentionPolicy,
  MonitoringProfile,
  AlertProfile,
  SLAProfile,
  ClassificationProfile,
  CatalogEntry,
  EventCatalog,
  VersionHistoryEntry,
  LatencyProfile,
  ThroughputProfile,
} from "./types";
import type { EventContract, EventProducer, EventCategory } from "@/features/game-engine/events";

const log = getLogger("event-governance.catalog");

// ===========================================================================
// System 3 — Event Classification
// ===========================================================================

/**
 * Default classification profiles by event category.
 * These are configurable defaults — not hardcoded behavior.
 */
export const DEFAULT_CLASSIFICATION_BY_CATEGORY: Record<EventCategory, ClassificationProfile> = {
  gameplay: {
    eventClass: "mission_critical",
    severity: "high",
    priority: "high",
    retention: "days_30",
    monitoringProfile: "full",
    alertProfile: "immediate",
    slaProfile: "realtime",
  },
  competition: {
    eventClass: "business_critical",
    severity: "high",
    priority: "high",
    retention: "days_90",
    monitoringProfile: "full",
    alertProfile: "immediate",
    slaProfile: "interactive",
  },
  progression: {
    eventClass: "business_critical",
    severity: "medium",
    priority: "normal",
    retention: "days_90",
    monitoringProfile: "standard",
    alertProfile: "threshold",
    slaProfile: "near_realtime",
  },
  analytics: {
    eventClass: "analytics",
    severity: "low",
    priority: "low",
    retention: "days_30",
    monitoringProfile: "standard",
    alertProfile: "aggregated",
    slaProfile: "batch",
  },
  replay: {
    eventClass: "operational",
    severity: "medium",
    priority: "normal",
    retention: "days_90",
    monitoringProfile: "standard",
    alertProfile: "threshold",
    slaProfile: "near_realtime",
  },
  social: {
    eventClass: "operational",
    severity: "low",
    priority: "normal",
    retention: "days_30",
    monitoringProfile: "standard",
    alertProfile: "aggregated",
    slaProfile: "near_realtime",
  },
  notifications: {
    eventClass: "operational",
    severity: "low",
    priority: "normal",
    retention: "days_7",
    monitoringProfile: "minimal",
    alertProfile: "aggregated",
    slaProfile: "near_realtime",
  },
  administration: {
    eventClass: "business_critical",
    severity: "high",
    priority: "high",
    retention: "days_365",
    monitoringProfile: "full",
    alertProfile: "immediate",
    slaProfile: "interactive",
  },
  organization: {
    eventClass: "operational",
    severity: "medium",
    priority: "normal",
    retention: "days_90",
    monitoringProfile: "standard",
    alertProfile: "threshold",
    slaProfile: "near_realtime",
  },
  ai: {
    eventClass: "analytics",
    severity: "low",
    priority: "low",
    retention: "days_30",
    monitoringProfile: "standard",
    alertProfile: "aggregated",
    slaProfile: "batch",
  },
  integration: {
    eventClass: "operational",
    severity: "medium",
    priority: "normal",
    retention: "days_30",
    monitoringProfile: "standard",
    alertProfile: "threshold",
    slaProfile: "near_realtime",
  },
  workflow: {
    eventClass: "operational",
    severity: "low",
    priority: "normal",
    retention: "days_30",
    monitoringProfile: "standard",
    alertProfile: "aggregated",
    slaProfile: "near_realtime",
  },
  custom: {
    eventClass: "informational",
    severity: "info",
    priority: "low",
    retention: "days_7",
    monitoringProfile: "minimal",
    alertProfile: "silent",
    slaProfile: "best_effort",
  },
};

export function classifyEvent(input: {
  eventId: string;
  eventClass?: EventClass;
  severity?: Severity;
  priority?: Priority;
  retention?: RetentionPolicy;
  monitoringProfile?: MonitoringProfile;
  alertProfile?: AlertProfile;
  slaProfile?: SLAProfile;
  classifiedBy?: string;
}): EventClassification {
  const contract = getContract(input.eventId);
  const defaultProfile = contract
    ? DEFAULT_CLASSIFICATION_BY_CATEGORY[contract.category]
    : DEFAULT_CLASSIFICATION_BY_CATEGORY.custom;
  const classification: EventClassification = {
    eventId: input.eventId,
    classification: {
      eventClass: input.eventClass ?? defaultProfile.eventClass,
      severity: input.severity ?? defaultProfile.severity,
      priority: input.priority ?? defaultProfile.priority,
      retention: input.retention ?? defaultProfile.retention,
      monitoringProfile: input.monitoringProfile ?? defaultProfile.monitoringProfile,
      alertProfile: input.alertProfile ?? defaultProfile.alertProfile,
      slaProfile: input.slaProfile ?? defaultProfile.slaProfile,
    },
    classifiedAt: new Date().toISOString(),
    classifiedBy: input.classifiedBy ?? "system",
  };
  storeClassification(classification);
  log.info("classification.set", { eventId: input.eventId, eventClass: classification.classification.eventClass });
  return classification;
}

export function getClassificationForEvent(eventId: string): EventClassification | null {
  // If no explicit classification, derive from the contract's category
  const existing = getClassification(eventId);
  if (existing) return existing;
  const contract = getContract(eventId);
  if (!contract) return null;
  // Auto-classify based on category defaults
  const profile = DEFAULT_CLASSIFICATION_BY_CATEGORY[contract.category];
  return {
    eventId,
    classification: profile,
    classifiedAt: new Date().toISOString(),
    classifiedBy: "auto-derived",
  };
}

export function getAllClassifiedEvents(): EventClassification[] {
  return getAllClassifications();
}

export function getEventsByClass(eventClass: EventClass): EventClassification[] {
  return getAllClassifications().filter(c => c.classification.eventClass === eventClass);
}

export function getEventsBySeverity(severity: Severity): EventClassification[] {
  return getAllClassifications().filter(c => c.classification.severity === severity);
}

export function getSLAForEvent(eventId: string): SLAProfile | null {
  const classification = getClassificationForEvent(eventId);
  return classification?.classification.slaProfile ?? null;
}

// ===========================================================================
// System 4 — Event Catalog (derived from Registry)
// ===========================================================================

/**
 * Generate the full Event Catalog from the Event Registry.
 * NEVER duplicates contracts — derives everything from registered data.
 */
export function generateCatalog(): EventCatalog {
  const contracts = listEvents();
  const entries: CatalogEntry[] = contracts.map(contract => generateCatalogEntry(contract));
  return {
    totalEvents: entries.length,
    entries: entries.sort((a, b) => a.eventId.localeCompare(b.eventId)),
    generatedAt: new Date().toISOString(),
  };
}

export function getCatalogEntry(eventId: string): CatalogEntry | null {
  const contract = getContract(eventId);
  if (!contract) return null;
  return generateCatalogEntry(contract);
}

function generateCatalogEntry(contract: EventContract): CatalogEntry {
  const classification = getClassificationForEvent(contract.eventId);
  const versionHistory: VersionHistoryEntry[] = [
    {
      version: contract.version,
      status: contract.status,
      releaseDate: contract.registeredAt,
      changes: contract.deprecated
        ? `Deprecated. ${contract.deprecationMessage ?? ""}`
        : "Initial registered version.",
    },
  ];
  const latency: LatencyProfile | null = null; // Would be derived from metrics
  const throughput: ThroughputProfile | null = null; // Would be derived from metrics
  const documentation = generateEntryDocumentation(contract, classification);

  return {
    eventId: contract.eventId,
    displayName: contract.displayName,
    description: contract.description,
    purpose: documentation,
    producer: contract.producer,
    consumers: contract.consumers,
    category: contract.category,
    classification: classification?.classification.eventClass ?? null,
    payloadType: contract.payloadType,
    schema: contract.schema,
    examples: [contract.samplePayload],
    version: contract.version,
    status: contract.status,
    versionHistory,
    deprecated: contract.deprecated,
    replacementEventId: contract.replacementEventId,
    deprecationMessage: contract.deprecationMessage,
    latency,
    throughput,
    documentation,
    policy: null, // Linked at query time from policy engine
    deliveryRule: null, // Linked at query time from delivery engine
  };
}

function generateEntryDocumentation(
  contract: EventContract,
  classification: EventClassification | null,
): string {
  const parts: string[] = [];
  parts.push(`${contract.displayName}: ${contract.description}`);
  parts.push(`Produced by ${contract.producer}.`);
  if (contract.consumers.length > 0) {
    parts.push(`Consumed by: ${contract.consumers.join(", ")}.`);
  }
  if (classification) {
    parts.push(`Classification: ${classification.classification.eventClass} (severity: ${classification.classification.severity}).`);
    parts.push(`SLA: ${classification.classification.slaProfile}.`);
  }
  if (contract.deprecated) {
    parts.push(`⚠️ DEPRECATED. Replacement: ${contract.replacementEventId ?? "none"}.`);
  }
  return parts.join(" ");
}

// ===========================================================================
// Catalog statistics
// ===========================================================================

export function getCatalogStats(): {
  totalEvents: number;
  byClass: Record<EventClass, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  deprecatedCount: number;
} {
  const catalog = generateCatalog();
  const byClass: Record<EventClass, number> = {
    mission_critical: 0,
    business_critical: 0,
    operational: 0,
    analytics: 0,
    informational: 0,
  };
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let deprecatedCount = 0;
  for (const entry of catalog.entries) {
    if (entry.classification) byClass[entry.classification] += 1;
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
    if (entry.deprecated) deprecatedCount += 1;
  }
  return {
    totalEvents: catalog.totalEvents,
    byClass,
    byCategory,
    byStatus,
    deprecatedCount,
  };
}
