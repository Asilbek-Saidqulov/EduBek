/**
 * EduBek — Event Validator.
 *
 * Provides deterministic validation for events against their registered
 * contracts. The validator NEVER mutates payloads — it only reports
 * findings.
 *
 * Validation rules:
 *   - Payload shape (fields, types, required, nullable)
 *   - Required fields present
 *   - Event version is known
 *   - Producer matches the contract
 *   - Event ID is registered
 *   - Metadata fields (correlationId, causationId, etc.)
 *   - Idempotency key present (if required by contract)
 *   - Duplicate event ID detection (caller must track)
 *
 * The validator is pure — same inputs always produce the same output.
 */

import type {
  EventContract,
  EventSchema,
  EventSchemaField,
  EventMetadata,
  ValidationFinding,
  ValidationResult,
  ValidationSeverity,
  EventProducer,
} from "./event-types";

// ===========================================================================
// Event input shape (what the validator receives)
// ===========================================================================

export interface EventInput {
  /** Event ID (e.g., "MatchFinished"). */
  eventId: string;
  /** Event version (e.g., "1.0.0"). */
  version?: string;
  /** The module claiming to produce this event. */
  producer?: EventProducer;
  /** The event payload. */
  payload: Record<string, unknown>;
  /** The event metadata. */
  metadata?: EventMetadata;
}

// ===========================================================================
// Validator core
// ===========================================================================

/**
 * Validate an event against its registered contract.
 * Returns a ValidationResult with all findings (errors, warnings, info).
 * NEVER mutates the input payload or metadata.
 */
export function validateEvent(
  input: EventInput,
  contract: EventContract | null,
): ValidationResult {
  const findings: ValidationFinding[] = [];
  const now = new Date().toISOString();

  // 1. Event ID must be registered
  if (!contract) {
    findings.push({
      path: "eventId",
      rule: "registered",
      message: `Event "${input.eventId}" is not registered in the Event Registry`,
      severity: "error",
      actualValue: input.eventId,
      expected: "A registered event ID",
    });
    return { valid: false, findings, eventId: input.eventId, validatedAt: now };
  }

  // 2. Version validation
  if (input.version) {
    if (input.version !== contract.version) {
      // Check if the version is at least compatible (same major)
      const inputMajor = input.version.split(".")[0];
      const contractMajor = contract.version.split(".")[0];
      if (inputMajor !== contractMajor) {
        findings.push({
          path: "version",
          rule: "version_compatible",
          message: `Event version ${input.version} is incompatible with contract version ${contract.version}`,
          severity: "error",
          actualValue: input.version,
          expected: contract.version,
        });
      } else {
        findings.push({
          path: "version",
          rule: "version_mismatch",
          message: `Event version ${input.version} differs from contract version ${contract.version} (compatible)`,
          severity: "info",
          actualValue: input.version,
          expected: contract.version,
        });
      }
    }
  }

  // 3. Producer validation — must match the contract's producer
  if (input.producer && input.producer !== contract.producer) {
    findings.push({
      path: "producer",
      rule: "producer_ownership",
      message: `Producer "${input.producer}" is not the owner of event "${input.eventId}". Owner is "${contract.producer}".`,
      severity: "error",
      actualValue: input.producer,
      expected: contract.producer,
    });
  }

  // 4. Deprecated event check (warning, not error)
  if (contract.deprecated) {
    findings.push({
      path: "eventId",
      rule: "deprecated",
      message: `Event "${input.eventId}" is deprecated. ${contract.deprecationMessage ?? ""}`,
      severity: "warning",
      actualValue: input.eventId,
      expected: contract.replacementEventId ?? "No replacement specified",
    });
  }

  // 5. Removed event check (error — producers must not emit removed events)
  if (contract.status === "removed") {
    findings.push({
      path: "status",
      rule: "removed",
      message: `Event "${input.eventId}" has been removed and must not be emitted`,
      severity: "error",
      actualValue: contract.status,
      expected: "stable or deprecated",
    });
  }

  // 6. Payload schema validation
  const payloadFindings = validatePayload(input.payload, contract.schema, "payload");
  findings.push(...payloadFindings);

  // 7. Metadata validation
  if (input.metadata) {
    const metadataFindings = validateMetadata(input.metadata, contract, "metadata");
    findings.push(...metadataFindings);
  }

  // 8. Idempotency key check (if required by contract)
  if (contract.idempotencyStrategy === "idempotency_key") {
    if (!input.metadata?.idempotencyKey) {
      findings.push({
        path: "metadata.idempotencyKey",
        rule: "idempotency_key_required",
        message: `Event "${input.eventId}" requires an idempotencyKey (strategy: idempotency_key)`,
        severity: "error",
        actualValue: input.metadata?.idempotencyKey,
        expected: "A unique idempotency key string",
      });
    }
  }

  const valid = !findings.some(f => f.severity === "error");
  return { valid, findings, eventId: input.eventId, validatedAt: now };
}

// ===========================================================================
// Payload validation
// ===========================================================================

function validatePayload(
  payload: Record<string, unknown>,
  schema: EventSchema,
  basePath: string,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  // Check required fields
  for (const fieldName of schema.required) {
    if (!(fieldName in payload)) {
      findings.push({
        path: `${basePath}.${fieldName}`,
        rule: "required_field",
        message: `Required field "${fieldName}" is missing`,
        severity: "error",
        expected: "Present",
      });
    }
  }

  // Validate each declared field
  for (const field of schema.fields) {
    const value = payload[field.name];
    const fieldPath = `${basePath}.${field.name}`;

    // Skip if not present and not required
    if (!(field.name in payload)) {
      if (field.required && field.default === undefined) {
        // Already reported in required check
      }
      continue;
    }

    // Null check
    if (value === null) {
      if (!field.nullable) {
        findings.push({
          path: fieldPath,
          rule: "not_nullable",
          message: `Field "${field.name}" cannot be null`,
          severity: "error",
          actualValue: null,
          expected: field.type,
        });
      }
      continue;
    }

    // Type check
    const typeFinding = checkType(value, field, fieldPath);
    if (typeFinding) findings.push(typeFinding);

    // Enum check
    if (field.enum && typeof value === "string" && !field.enum.includes(value)) {
      findings.push({
        path: fieldPath,
        rule: "enum_value",
        message: `Field "${field.name}" value "${value}" is not in allowed enum: ${field.enum.join(", ")}`,
        severity: "error",
        actualValue: value,
        expected: field.enum.join(" | "),
      });
    }
  }

  // Check for additional properties (if disallowed)
  if (!schema.additionalProperties) {
    const declaredFields = new Set(schema.fields.map(f => f.name));
    for (const key of Object.keys(payload)) {
      if (!declaredFields.has(key)) {
        findings.push({
          path: `${basePath}.${key}`,
          rule: "additional_property",
          message: `Additional property "${key}" is not allowed`,
          severity: "error",
          actualValue: key,
          expected: "One of: " + Array.from(declaredFields).join(", "),
        });
      }
    }
  }

  return findings;
}

function checkType(value: unknown, field: EventSchemaField, path: string): ValidationFinding | null {
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (actualType !== field.type) {
    return {
      path,
      rule: "type_mismatch",
      message: `Field "${field.name}" has type "${actualType}" but expected "${field.type}"`,
      severity: "error",
      actualValue: actualType,
      expected: field.type,
    };
  }

  // Array element type check
  if (field.type === "array" && field.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const elem = value[i];
      const elemType = typeof elem;
      if (elemType !== field.items) {
        return {
          path: `${path}[${i}]`,
          rule: "array_item_type",
          message: `Array element at index ${i} has type "${elemType}" but expected "${field.items}"`,
          severity: "error",
          actualValue: elemType,
          expected: field.items,
        };
      }
    }
  }

  return null;
}

// ===========================================================================
// Metadata validation
// ===========================================================================

function validateMetadata(
  metadata: EventMetadata,
  contract: EventContract,
  basePath: string,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  // occurredAt should be a valid ISO timestamp if present
  if (metadata.occurredAt) {
    const date = new Date(metadata.occurredAt);
    if (Number.isNaN(date.getTime())) {
      findings.push({
        path: `${basePath}.occurredAt`,
        rule: "invalid_timestamp",
        message: "occurredAt is not a valid ISO-8601 timestamp",
        severity: "error",
        actualValue: metadata.occurredAt,
        expected: "ISO-8601 timestamp",
      });
    }
  }

  // sequenceNumber should be a non-negative integer if present
  if (metadata.sequenceNumber !== undefined) {
    if (!Number.isInteger(metadata.sequenceNumber) || metadata.sequenceNumber < 0) {
      findings.push({
        path: `${basePath}.sequenceNumber`,
        rule: "invalid_sequence",
        message: "sequenceNumber must be a non-negative integer",
        severity: "error",
        actualValue: metadata.sequenceNumber,
        expected: "non-negative integer",
      });
    }
  }

  // If replay support is false but metadata.replayable is true, warn
  if (!contract.replaySupport && metadata.replayable === true) {
    findings.push({
      path: `${basePath}.replayable`,
      rule: "replay_not_supported",
      message: `Event "${contract.eventId}" does not support replay but metadata.replayable is true`,
      severity: "warning",
      actualValue: metadata.replayable,
      expected: "false",
    });
  }

  // If audit support is false but metadata.auditable is true, warn
  if (!contract.auditSupport && metadata.auditable === true) {
    findings.push({
      path: `${basePath}.auditable`,
      rule: "audit_not_supported",
      message: `Event "${contract.eventId}" does not support audit but metadata.auditable is true`,
      severity: "warning",
      actualValue: metadata.auditable,
      expected: "false",
    });
  }

  return findings;
}

// ===========================================================================
// Duplicate event ID detection (utility — caller tracks state)
// ===========================================================================

/**
 * Check if an event ID has already been seen.
 * Returns true if the event is a duplicate.
 * The caller is responsible for maintaining the seen-set.
 */
export function isDuplicateEvent(
  eventId: string,
  seenEventIds: Set<string>,
): boolean {
  return seenEventIds.has(eventId);
}

/**
 * Mark an event ID as seen.
 * The caller is responsible for maintaining the seen-set.
 */
export function markEventSeen(
  eventId: string,
  seenEventIds: Set<string>,
): void {
  seenEventIds.add(eventId);
}

// ===========================================================================
// Severity helpers
// ===========================================================================

export function hasErrors(result: ValidationResult): boolean {
  return result.findings.some(f => f.severity === "error");
}

export function hasWarnings(result: ValidationResult): boolean {
  return result.findings.some(f => f.severity === "warning");
}

export function getFindingsBySeverity(result: ValidationResult, severity: ValidationSeverity): ValidationFinding[] {
  return result.findings.filter(f => f.severity === severity);
}
