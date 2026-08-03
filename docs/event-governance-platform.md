# EduBek Enterprise Event Governance Platform

## Overview

The Enterprise Event Governance Platform is the governance, delivery, routing, documentation, and observability layer sitting alongside the existing Universal Game Engine Event Bus. It is NOT a replacement for the Event Bus — it defines HOW events are delivered, validated, classified, documented, monitored, and observed.

Every existing module continues communicating ONLY through the Event Bus. This module only observes, validates, documents, and governs.

## Architecture

```
Game Engine
    │
    ▼
Event Bus
    │
Enterprise Event Governance
├── Event Registry (existing, reused)
├── Event Policy Engine
├── Event Delivery Rules
├── Event Catalog
├── Event Classification
├── Correlation Graph
├── Consumer Monitoring
├── Producer Monitoring
├── Event Metrics
├── Event Lifecycle Dashboard
    │
    ▼
Consumers
```

Nothing changes for producers or consumers. This module only observes, validates, documents, and governs.

## Core Principles

1. **Never owns gameplay**: The platform governs event lifecycle, delivery, quality, documentation, and observability — never game mechanics.
2. **Never owns business logic**: No scoring, no match execution, no rating calculations.
3. **Never owns engine state**: The Universal Game Engine remains the single source of truth.
4. **Never mutates event payloads**: All validation and monitoring is read-only.
5. **Reuses existing Event Registry**: All contracts, validation, and versioning come from the existing registry — no duplication.
6. **Deterministic**: Same inputs always produce the same outputs. No LLM.

## 12 Systems

### System 1 — Event Policy Engine
**File**: `event-policy-engine.ts`

Owns delivery policy only. Supports: sync, async, ordered, unordered, priority, retry, backoff, dead-letter, batching, persistent, ephemeral, replay eligible, audit required, timeout, max retries, consumer isolation.

Policies are configurable. No hardcoded behavior.

### System 2 — Event Delivery Rules
**File**: `delivery-engine.ts`

Determines: delivery guarantees (at-most-once, at-least-once, exactly-once), ordering requirements, consumer concurrency, queue strategy (FIFO, LIFO, priority, round-robin), buffer strategy, QoS, retry strategy, deduplication strategy, delivery timeout.

Never mutates event payloads.

### System 3 — Event Classification
**File**: `classification-catalog.ts`

Every event belongs to one class: mission_critical, business_critical, operational, analytics, informational. Supports severity, priority, retention, monitoring profile, alert profile, SLA profile.

### System 4 — Event Catalog
**File**: `classification-catalog.ts`

Human-readable registry derived entirely from the Event Registry. Contains purpose, producer, consumers, payload, schema, examples, version history, deprecation, replacement, latency, throughput, documentation. Never duplicates contracts.

### System 5 — Correlation Graph
**File**: `correlation-graph.ts`

Visual relationship graph tracking traceId, correlationId, causationId, parent, children, event chain. Supports root event, dependency graph, timeline, fan-out, fan-in. OpenTelemetry compatible. Never changes events — visualization only.

### System 6 — Producer Health
**File**: `producer-consumer-monitor.ts`

Per producer: throughput, errors, latency, ownership, contract violations, version usage, deprecated usage, health score.

### System 7 — Consumer Health
**File**: `producer-consumer-monitor.ts`

Per consumer: processing latency, queue lag, retry count, dead letters, success rate, average processing, last processing, health score.

### System 8 — Event Metrics
**File**: `metrics-dashboard.ts`

Per event: publish count, consume count, latency, processing time, queue depth, retry rate, failure rate, consumer count, version adoption, classification.

### System 9 — Event Lifecycle Dashboard
**File**: `metrics-dashboard.ts`

Current versions, deprecated events, experimental events, removed events, migration paths, version adoption, compatibility, ownership validation.

### System 10 — Observability Dashboard
**File**: `metrics-dashboard.ts`

Real-time overview: top producers, top consumers, slow consumers, slow events, queue health, retry trends, dead letters, throughput, errors, processing latency, SLA compliance.

### System 11 — Governance Dashboard
**File**: `metrics-dashboard.ts`

Ownership, validation, policy violations, schema violations, producer violations, unauthorized publishers, deprecated contracts, unused contracts, unused consumers, duplicate definitions.

### System 12 — Documentation Generator
**File**: `documentation-generator.ts`

Automatically generates Markdown, JSON, developer portal metadata, architecture diagrams, ownership tables, version tables, classification tables, policy tables. Derived entirely from the Registry. No LLM.

## File Structure

```
src/features/event-governance-platform/
├── types.ts                        # All 12 systems' TypeScript types
├── repository.ts                   # In-memory state repository
├── event-policy-engine.ts          # System 1 — Policy Engine
├── delivery-engine.ts              # System 2 — Delivery Rules
├── classification-catalog.ts       # Systems 3 + 4 — Classification + Catalog
├── correlation-graph.ts            # System 5 — Correlation Graph
├── producer-consumer-monitor.ts    # Systems 6 + 7 — Producer + Consumer Health
├── metrics-dashboard.ts            # Systems 8-11 — Metrics + Dashboards
├── documentation-generator.ts      # System 12 — Documentation Generator
├── service.ts                      # Barrel re-export
└── index.ts                        # Full barrel with type exports
```

## API Routes

12 read-only endpoints under `/api/event-governance/`:

| Endpoint | Purpose |
|----------|---------|
| `GET /policies` | Event delivery policies + stats |
| `GET /delivery` | Delivery rules + delivery stats |
| `GET /classification` | Event classifications + catalog stats |
| `GET /catalog` | Full event catalog (derived from Registry) |
| `GET /correlation` | Correlation nodes, edges, and stats |
| `GET /producers` | Producer health records + overall stats |
| `GET /consumers` | Consumer health records + overall stats |
| `GET /metrics` | Per-event metrics + aggregated stats |
| `GET /versions` | Event lifecycle dashboard (versions, deprecations, migrations) |
| `GET /dashboard` | Combined observability + governance + health dashboards |
| `GET /documentation` | Auto-generated documentation (JSON, Markdown, or structured) |
| `GET /health` | Platform health status + component details |

All routes require authentication. All routes are read-only.

## Event Policy Rules

Each event policy defines:
- Delivery mode (sync, async, ordered, unordered)
- Priority (critical, high, normal, low, background)
- Retry strategy (none, fixed, exponential, linear)
- Timeout
- Dead-letter eligibility (eligible, ineligible, drop)
- Replay eligibility
- Audit requirement
- Classification
- Retention profile (permanent, 7/30/90/365 days, transient)
- SLA profile (realtime, interactive, near-realtime, batch, best-effort)

Policies never execute business logic.

## Event Classification

| Class | Description | Default SLA |
|-------|-------------|-------------|
| mission_critical | System cannot function without these | realtime (<100ms) |
| business_critical | Core business operations | interactive (<1s) |
| operational | Day-to-day operations | near_realtime (<5s) |
| analytics | Analytics and reporting | batch (<60s) |
| informational | Informational only | best_effort |

## Correlation

Supports:
- `traceId` — Cross-module request tracing
- `correlationId` — Cross-module correlation
- `causationId` — Event that caused this event (causal ordering)
- Root event identification
- Child event tracking
- Dependency tree construction
- Timeline reconstruction
- Fan-out and fan-in measurement

OpenTelemetry compatible.

## Monitoring

### Producer Metrics
- Throughput (events/sec)
- Total events
- Error count + error rate
- Average/P95/P99 latency
- Owned events
- Contract violations
- Version usage
- Deprecated usage
- Health score (0-100)

### Consumer Metrics
- Processing latency
- P95 processing time
- Queue lag
- Retry count
- Dead letter count
- Success rate
- Total processed/failed
- Last processing time
- Health score (0-100)

### Health Score Computation
Health score = (success rate × 50) + (latency compliance × 30) − (error rate × 20)

| Score | Status |
|-------|--------|
| ≥ 80 | healthy |
| ≥ 50 | degraded |
| < 50 | unhealthy |

## Documentation

Auto-generated from the Event Registry:
- **Markdown**: Full documentation with ownership, version, classification, and policy tables
- **JSON**: Machine-readable format for developer portals
- **Structured**: `GovernanceDocumentation` object with all sections

No LLM. Fully deterministic.

## Integration

Reuses existing:
- Event Registry (contracts, ownership, versioning)
- Event Validation (deterministic, never mutates payloads)
- Version Manager (semantic versioning, lifecycle transitions)
- Documentation Generator (from registry)
- Event Bus (emitEvent, subscribe, getEvents)
- Replay Engine
- Analytics Platform
- Observability
- Audit
- RBAC

Never duplicates.

## Testing

207 regression tests in `tests/unit/event-governance.test.ts` covering:
- Policy Engine (27 tests): creation, defaults, custom values, CRUD, evaluation, SLA compliance, retry delay calculation, dead-letter eligibility, violations, validation, stats
- Delivery Rules (12 tests): creation, defaults, QoS levels, queue/buffer/dedup strategies, validation, stats
- Classification (8 tests): default classification, custom override, auto-derivation, queries
- Catalog (10 tests): generation, sorting, entry lookup, version history, examples, documentation, deprecated entries
- Correlation (13 tests): node registration, parent-child, graph building, trace graph, timeline, chain, fan-out, causation edges
- Producer + Consumer Health (20 tests): metrics recording, accumulation, health score, status, owned events, version usage, dead letters, queue lag, slow consumers, overall stats
- Metrics + Dashboards (20 tests): event metrics, lifecycle dashboard, observability dashboard, governance dashboard, platform health
- Documentation (9 tests): generation, sections, tables, markdown, JSON, determinism
- Architecture Compliance (4 tests): no payload mutation, no cross-module imports
- Backward Compatibility (4 tests): existing contracts valid, existing names valid
- Determinism (4 tests): catalog, lifecycle, governance, health score
- Extended tests (76 tests): all delivery modes, priorities, retentions, SLAs, QoS levels, strategies, edge cases, stress scenarios

## Acceptance Criteria

- ✅ Universal Game Engine unchanged
- ✅ Event Bus unchanged
- ✅ Game Modes unchanged
- ✅ Replay unchanged
- ✅ Progression unchanged
- ✅ Competitive unchanged
- ✅ Existing APIs unchanged
- ✅ Existing Registry reused
- ✅ Existing Validation reused
- ✅ Existing Versioning reused
- ✅ No gameplay behavior changes
- ✅ No event payload mutation
- ✅ Event Policy configurable
- ✅ Event Catalog generated automatically
- ✅ Classification supported
- ✅ Correlation graph supported
- ✅ Producer health monitoring
- ✅ Consumer health monitoring
- ✅ Event metrics available
- ✅ Governance dashboard complete
- ✅ Documentation generated
- ✅ Horizontal scaling compatible
- ✅ Redis compatible
- ✅ Server authoritative
- ✅ Deterministic
- ✅ No LLM usage
- ✅ 207 tests passing (exceeds 180+ requirement)
- ✅ 0 ESLint errors
- ✅ 0 TypeScript errors
- ✅ Production ready
