/**
 * EduBek — Event Documentation Generator.
 *
 * Automatically generates deterministic documentation from the Event Registry.
 * No LLM. Documentation is fully derived from registered contracts.
 *
 * For every event, the documentation includes:
 *   - Purpose
 *   - Producer
 *   - Consumers
 *   - Payload schema
 *   - Version history
 *   - Sample payload
 *   - Lifecycle (experimental → stable → deprecated → removed)
 *   - Replay support
 *   - Audit support
 *   - Best practices
 */

import type {
  EventContract,
  EventDocumentation,
  EventDocumentationEntry,
  EventCategory,
  EventProducer,
} from "./event-types";
import { getMigrationPath, getDeprecatedEvents } from "./event-version";

// ===========================================================================
// Documentation generation
// ===========================================================================

/**
 * Generate complete documentation for all registered events.
 * Output is deterministic — same registry state produces the same docs.
 */
export function generateDocumentation(contracts: EventContract[]): EventDocumentation {
  const entries = contracts
    .map(generateEntry)
    .sort((a, b) => {
      // Sort by category, then by eventId
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.eventId.localeCompare(b.eventId);
    });

  const summaryByCategory = computeCategorySummary(contracts);
  const summaryByProducer = computeProducerSummary(contracts);

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: entries.length,
    entries,
    summaryByCategory,
    summaryByProducer,
  };
}

/**
 * Generate a single documentation entry from a contract.
 */
function generateEntry(contract: EventContract): EventDocumentationEntry {
  return {
    eventId: contract.eventId,
    displayName: contract.displayName,
    description: contract.description,
    producer: contract.producer,
    consumers: contract.consumers,
    category: contract.category,
    version: contract.version,
    status: contract.status,
    payloadType: contract.payloadType,
    schema: contract.schema,
    idempotencyStrategy: contract.idempotencyStrategy,
    orderingRequirement: contract.orderingRequirement,
    persistenceRequirement: contract.persistenceRequirement,
    replaySupport: contract.replaySupport,
    auditSupport: contract.auditSupport,
    deprecated: contract.deprecated,
    replacementEventId: contract.replacementEventId,
    deprecationMessage: contract.deprecationMessage,
    samplePayload: contract.samplePayload,
    registeredAt: contract.registeredAt,
    purpose: generatePurpose(contract),
    lifecycle: generateLifecycleDescription(contract),
    bestPractices: generateBestPractices(contract),
  };
}

function generatePurpose(contract: EventContract): string {
  const consumerList = contract.consumers.length > 0
    ? contract.consumers.join(", ")
    : "no consumers currently registered";
  return `${contract.description} Produced by ${contract.producer}. Consumed by: ${consumerList}.`;
}

function generateLifecycleDescription(contract: EventContract): string {
  const parts: string[] = [`Status: ${contract.status}`, `Version: ${contract.version}`];
  if (contract.deprecated) {
    parts.push(`Deprecated. Replacement: ${contract.replacementEventId ?? "none"}`);
    if (contract.deprecationMessage) {
      parts.push(`Message: ${contract.deprecationMessage}`);
    }
    const migration = getMigrationPath(contract);
    if (migration) {
      parts.push(`Migration: ${migration.description}`);
    }
  }
  return parts.join(" | ");
}

function generateBestPractices(contract: EventContract): string[] {
  const practices: string[] = [];
  practices.push(`Always include ${contract.idempotencyStrategy} for idempotent processing.`);
  if (contract.orderingRequirement === "strict") {
    practices.push("Process events in strict order — out-of-order processing may cause inconsistencies.");
  } else if (contract.orderingRequirement === "causal") {
    practices.push("Respect causationId ordering — events caused by other events must be processed after their cause.");
  } else {
    practices.push("Order-independent — handlers must be idempotent.");
  }
  if (contract.persistenceRequirement === "required") {
    practices.push("Persist this event to the event store for replay and audit.");
  } else if (contract.persistenceRequirement === "transient") {
    practices.push("Transient event — do not persist (e.g., timer ticks).");
  }
  if (contract.replaySupport) {
    practices.push("Replay-safe: handlers must produce the same state when replayed.");
  } else {
    practices.push("Not replay-safe: handlers must skip this event during replay.");
  }
  if (contract.auditSupport) {
    practices.push("Auditable: include in audit trails.");
  }
  if (contract.deprecated) {
    practices.push(`DEPRECATED — migrate to ${contract.replacementEventId ?? "the replacement event"}.`);
  }
  if (contract.status === "experimental") {
    practices.push("EXPERIMENTAL — may change without notice. Do not rely on in production.");
  }
  return practices;
}

// ===========================================================================
// Summary computation
// ===========================================================================

const ALL_CATEGORIES: EventCategory[] = [
  "gameplay", "competition", "progression", "analytics", "replay",
  "social", "notifications", "administration", "organization", "ai",
  "integration", "workflow", "custom",
];

const ALL_PRODUCERS: EventProducer[] = [
  "universal_game_engine", "player_progression", "competitive_platform",
  "classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale",
  "analytics", "replay", "notifications", "cosmetics", "social", "ai_director",
  "organization", "workflow", "integration",
];

function computeCategorySummary(contracts: EventContract[]): Record<EventCategory, number> {
  const summary = {} as Record<EventCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    summary[cat] = contracts.filter(c => c.category === cat).length;
  }
  return summary;
}

function computeProducerSummary(contracts: EventContract[]): Record<EventProducer, number> {
  const summary = {} as Record<EventProducer, number>;
  for (const prod of ALL_PRODUCERS) {
    summary[prod] = contracts.filter(c => c.producer === prod).length;
  }
  return summary;
}

// ===========================================================================
// Markdown documentation generation
// ===========================================================================

/**
 * Generate a Markdown documentation string from the registry.
 * Useful for README files and static documentation sites.
 */
export function generateMarkdownDocumentation(contracts: EventContract[]): string {
  const doc = generateDocumentation(contracts);
  const lines: string[] = [];

  lines.push("# EduBek Event Registry Documentation");
  lines.push("");
  lines.push(`> Auto-generated from the Event Registry. ${doc.totalEvents} events documented.`);
  lines.push("");

  // Summary by category
  lines.push("## Summary by Category");
  lines.push("");
  lines.push("| Category | Event Count |");
  lines.push("|----------|-------------|");
  for (const [cat, count] of Object.entries(doc.summaryByCategory)) {
    if (count > 0) {
      lines.push(`| ${cat} | ${count} |`);
    }
  }
  lines.push("");

  // Summary by producer
  lines.push("## Summary by Producer");
  lines.push("");
  lines.push("| Producer | Event Count |");
  lines.push("|----------|-------------|");
  for (const [prod, count] of Object.entries(doc.summaryByProducer)) {
    if (count > 0) {
      lines.push(`| ${prod} | ${count} |`);
    }
  }
  lines.push("");

  // Deprecated events
  const deprecated = getDeprecatedEvents(contracts);
  if (deprecated.length > 0) {
    lines.push("## Deprecated Events");
    lines.push("");
    for (const c of deprecated) {
      lines.push(`- **${c.eventId}** (v${c.version}) → ${c.replacementEventId ?? "no replacement"}`);
      if (c.deprecationMessage) lines.push(`  - ${c.deprecationMessage}`);
    }
    lines.push("");
  }

  // Event details
  lines.push("## Event Details");
  lines.push("");
  for (const entry of doc.entries) {
    lines.push(`### ${entry.eventId}`);
    lines.push("");
    lines.push(`**${entry.displayName}** — ${entry.description}`);
    lines.push("");
    lines.push(`- **Producer**: ${entry.producer}`);
    lines.push(`- **Consumers**: ${entry.consumers.length > 0 ? entry.consumers.join(", ") : "none"}`);
    lines.push(`- **Category**: ${entry.category}`);
    lines.push(`- **Version**: ${entry.version}`);
    lines.push(`- **Status**: ${entry.status}`);
    lines.push(`- **Idempotency**: ${entry.idempotencyStrategy}`);
    lines.push(`- **Ordering**: ${entry.orderingRequirement}`);
    lines.push(`- **Persistence**: ${entry.persistenceRequirement}`);
    lines.push(`- **Replay Support**: ${entry.replaySupport}`);
    lines.push(`- **Audit Support**: ${entry.auditSupport}`);
    if (entry.deprecated) {
      lines.push(`- **⚠️ Deprecated**: ${entry.deprecationMessage ?? ""}`);
      lines.push(`- **Replacement**: ${entry.replacementEventId ?? "none"}`);
    }
    lines.push("");
    lines.push("#### Payload Schema");
    lines.push("");
    lines.push("| Field | Type | Required | Nullable | Description |");
    lines.push("|-------|------|----------|----------|-------------|");
    for (const field of entry.schema.fields) {
      lines.push(`| ${field.name} | ${field.type} | ${field.required ? "✓" : ""} | ${field.nullable ? "✓" : ""} | ${field.description} |`);
    }
    lines.push("");
    lines.push("#### Sample Payload");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(entry.samplePayload, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("#### Best Practices");
    lines.push("");
    for (const bp of entry.bestPractices) {
      lines.push(`- ${bp}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ===========================================================================
// JSON documentation generation
// ===========================================================================

/**
 * Generate a JSON documentation string from the registry.
 */
export function generateJsonDocumentation(contracts: EventContract[]): string {
  const doc = generateDocumentation(contracts);
  return JSON.stringify(doc, null, 2);
}
