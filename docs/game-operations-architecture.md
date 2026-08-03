# EduBek Game Administration, Operations & Incident Management Platform

## Overview

The single source of truth for gaming operations. Owns operational workflows, incident management, maintenance, emergency operations, intervention workflows, operational health, operational audit, announcements, maintenance windows, operational dashboards, admin actions, and operational playbooks. Never owns gameplay, scoring, matchmaking, progression, rewards, configurations, or analytics.

## 16 Systems

1. **Operations Control Center** — Unified view of live matches, tournaments, broadcasts, services, health, alerts
2. **Incident Management** — Full lifecycle (open→investigating→identified→monitoring→resolved→closed), severity, priority, ownership, timeline, root cause, resolution, postmortem, escalation
3. **Maintenance Management** — 5 types (scheduled, emergency, partial, organization, regional), notifications, history
4. **Emergency Operations** — 6 types (pause, stop, announcement, global_maintenance, organization_isolation, service_suspension), manual only, recovery workflow
5. **Match Intervention** — 10 actions (pause, resume, terminate, cancel, restart, freeze timers, disconnect spectators, transfer ownership, recover session, force replay), RBAC protected, audited
6. **Operational Playbooks** — 8 categories, deterministic runbooks, no automation beyond documented workflow
7. **Administrative Actions** — 8 scopes (global, organization, school, tournament, match, player, club, broadcast)
8. **Service Health Platform** — 10 services tracked, health status only, never owns monitoring
9. **Operational Alerts** — 5 severities, acknowledgement, assignment, resolution, escalation, history
10. **Global Announcements** — 5 types, 6 audiences, scheduling, expiration
11. **Operational Audit** — Who/what/when/why/before/after/scope/approval/correlation ID/incident reference
12. **Administrative Dashboard** — Incidents, maintenance, alerts, health, announcements, interventions, statistics
13. **Operational Analytics** — Incident frequency, resolution time, maintenance history, workload, SLA compliance
14. **Event Bus Bridge** — Passive consumer, produces 7 operational event types
15. **Developer Integration** — 9 API endpoints, 3 extension hooks, SDK metadata
16. **Administration API** — Read-only status endpoint

## Architecture

Passive Event Bus consumer. Thin orchestration layer. Every action RBAC protected and audited. Emergency operations manual only. 100% deterministic. No LLM.

## Testing

430 tests. 526 i18n keys × 3 locales. 0 TypeScript errors, 0 ESLint errors.
