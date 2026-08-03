# EduBek Live Events, Campaigns & Seasonal Operations Platform

## Overview

The Live Events Platform is the single source of truth for every temporary event, campaign, seasonal operation, academic celebration, limited-time activity, and live educational operation across the EduBek Gaming Platform.

It is a **passive Event Bus consumer + producer**. It never calls Progression, Competitive, Social, or Game Modes directly. Everything goes through the Event Bus.

## Architecture

```
Game Engine → Event Bus → Live Events Platform (this module)
                              ├── Event Registry
                              ├── Campaign Engine
                              ├── Event Scheduler
                              ├── Event Participation
                              ├── Objective Engine
                              ├── Reward Mapping
                              ├── Event Templates
                              ├── LiveOps Dashboard
                              ├── Event Analytics
                              ├── Notification Mapping
                              ├── Feature Flags
                              ├── Approval Workflow
                              ├── Organization Operations
                              └── Developer Integration
```

## 15 Systems

1. **Live Event Registry** — 12 event types (daily/weekly/monthly/seasonal/academic/national/organization/classroom/club/university/special/custom)
2. **Campaign Engine** — Stages, milestones, objectives, schedules, visibility, expiration
3. **Event Scheduler** — Start/end, recurrence, timezone, holidays, blackout periods, academic calendar
4. **Event Participation** — Enrolled/active/completed/abandoned/expired tracking
5. **Objective Engine** — 10 objective types (play_matches, win_matches, reach_level, etc.)
6. **Reward Mapping** — 9 reward kinds (XP, badge, cosmetic, title, avatar, frame, banner, season_token, certificate)
7. **Event Templates** — 10 built-in templates (Academic Week, STEM Week, Math Olympiad, etc.)
8. **LiveOps Dashboard** — Running/upcoming/completed events, participation, conversion, dropouts
9. **Event Analytics** — Per-event metrics, participation by day, objective completion
10. **Event Bridge** — Passive Event Bus consumer + LiveOps event publisher
11. **Notification Mapping** — Produces notification requests (never sends — Notification Platform owns delivery)
12. **Feature Flag Support** — 8 rollout types (enable/disable/gradual/organization/country/school/AB_test/emergency_stop)
13. **Approval Workflow** — 9 statuses (draft→review→approved→scheduled→running→paused→completed→cancelled→archived)
14. **Organization Operations** — 5 org types (school/university/district/government/enterprise)
15. **Developer Integration** — 8 API endpoints, 7 event contracts, 3 extension hooks, SDK metadata

## API Routes

12 read-only endpoints under `/api/live-events/`

## Testing

299 tests covering all 15 systems.

## Acceptance Criteria

- ✅ Universal Game Engine unchanged
- ✅ Progression/Competitive/Social unchanged
- ✅ Event Bus is the only communication mechanism
- ✅ No duplicated business logic
- ✅ 299 tests passing (exceeds 220+ requirement)
- ✅ 264 i18n keys × 3 locales (exceeds 220+ requirement)
- ✅ 0 ESLint errors, 0 TypeScript errors
- ✅ Production ready
