# EduBek Game Configuration, Feature Flags & Live Balancing Platform

## Overview

The single source of truth for all game configurations. Safely distributes approved configurations to existing game systems. Never owns gameplay, scoring, matchmaking, progression, or economy.

## 18 Systems

1. **Configuration Registry** — 6 game mode configs (Classic Quiz, Treasure Heist, Empire Builder, Quiz Royale, Battle Royale, Cross-Platform)
2. **Configuration Versioning** — 6 version statuses (draft→testing→approved→live→deprecated→archived), rollback targets, diffs
3. **Live Configuration Loader** — Hot reload, cache, fallback, snapshot loading
4. **Feature Flag Platform** — 10 rollout types (boolean, percentage, organization, school, teacher, player, tournament, region, environment, emergency disable), prerequisites, dependencies
5. **Balancing Profiles** — 7 profile types (casual, classroom, tournament, olympiad, practice, demo, custom)
6. **Environment Configuration** — 7 environments (development, testing, qa, staging, production, sandbox, local)
7. **Rollout Engine** — 8 strategies (canary, percentage, organization, country, region, gradual, instant, scheduled)
8. **Configuration Validation** — 7 issue kinds (missing value, invalid range, broken dependency, circular reference, unknown config, deprecated config, ownership violation)
9. **Configuration Comparison** — Version diffs, compatibility, impact levels (none→breaking)
10. **Experiment Platform** — 5 types (A/B, multivariate, shadow, simulation, dry run), never affects production automatically
11. **Recommendation Integration** — Consumes Game Intelligence recommendations, never applies them
12. **Approval Workflow** — 7 statuses (draft→review→testing→approval→deployment→rollback→archive), RBAC, audit
13. **Deployment History** — Who, when, why, version, approval, rollback, impact
14. **Rollback Platform** — Manual only, automatic recovery disabled, immediate and scheduled rollback
15. **Configuration Dashboard** — Current versions, flags, rollouts, experiments, validation, recommendations, health
16. **Event Bus Bridge** — Passive consumer, publishes config events
17. **Developer Integration** — 10 API endpoints, 3 extension hooks, SDK metadata
18. **Administration API** — Read-only status, configs, versions, flags, profiles, rollouts, validation, experiments, history, dashboard

## Architecture

Passive Event Bus consumer. Configuration ownership only. 100% deterministic. No LLM. No automatic balancing. No automatic deployments. All changes require approval.

## Testing

363 tests. 446 i18n keys × 3 locales. 0 TypeScript errors, 0 ESLint errors.
