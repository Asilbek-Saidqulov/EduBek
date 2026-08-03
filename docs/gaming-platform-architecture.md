# EduBek Gaming Platform — Architecture

## Overview

The EduBek Gaming Platform is built on a strict event-driven architecture where the **Universal Game Engine** is the single source of truth. All modules (game modes, progression, competitive, analytics, etc.) are independent consumers that subscribe to engine events via the **Event Bus**.

## Architecture Diagram

```
                    Universal Game Engine
                             │
                      Engine Event Bus
                             │
      ┌──────────────┬──────────────┬──────────────┬──────────────┐
      │              │              │              │
      ▼              ▼              ▼              ▼
Player Progression Competitive    Analytics     Hall of Fame
                  Platform
      │
      ▼
 Player Profile
```

## Core Principles

1. **Single Source of Truth**: The Universal Game Engine owns all gameplay state (matches, scores, timers, sync, replay). Every other module is a consumer.

2. **Event-Driven Communication**: Modules NEVER call each other directly. The only communication mechanism is the engine Event Bus (`emitEvent` / `subscribe`).

3. **Ownership Boundaries**: Each module owns a specific domain. Modules never modify another module's state.

4. **Idempotent Processing**: Every event handler is idempotent — duplicate events are no-ops. This is enforced via event-ID tracking in each bridge.

5. **No Circular Dependencies**: Modules can be loaded in any order. No module imports from another consumer module.

## Module Ownership

### Universal Game Engine (Phase 6G.1)
**Owns**: Match lifecycle, lobby, sessions, ready check, rounds, questions, timers, sync, events, replay, spectators, reconnect, anti-cheat, score pipeline, resource pipeline, match recorder, analytics.

**Never modified by**: Any other module. All other modules only consume `subscribe()`, `emitEvent()`, `getEvents()`, and engine-level stateless helpers.

### Game Modes (Phases 6G.2–6G.6)
**Own**: Gameplay rules, scoring formulas, mode-specific mechanics.

**Emit**: Engine events (`MatchFinished`, `AnswerSubmitted`, `ScoreUpdated`, `PlayerLeft`, `PlayerDisconnected`, `TeacherOverride`, etc.).

**Never call**: Player Progression APIs, Competitive Platform APIs, Analytics APIs.

### Player Progression Platform (Phase 6G.7)
**Owns**: XP, levels, achievements, badges, titles, milestones, career stats, seasons (progression-side), missions, challenges, rewards, prestige, avatars/cosmetics, timeline, dashboards.

**Subscribes to**: `MatchFinished`, `AnswerSubmitted`, `PlayerLeft`, `TeacherOverride`, `ScoreUpdated`.

**Event Bus Bridge**: `src/features/player-progression/event-bus-bridge.ts`

**Never calls**: Any Competitive Platform API (`applyRatingUpdate`, `createCompetitiveProfile`, `enqueue`, `createMatchmakingTicket`, etc.).

**Never imports from**: `@/features/competitive-platform`.

### Competitive Platform (Phase 6G.8)
**Owns**: Rating, division, league, matchmaking, queue, tournament (competitive-side), championship, fair play, leaderboard, season (competitive-side), olympiad, hall of fame, scheduler, seeding, organization competitions, admin/appeals.

**Subscribes to**: `MatchFinished`, `PlayerDisconnected`, `PlayerLeft`, `TeacherOverride`.

**Event Bus Bridge**: `src/features/competitive-platform/event-bus-bridge.ts`

**Never calls**: Any Player Progression API (`awardXP`, `grantReward`, `updateLevel`, `unlockAchievement`, `recordMatchResult`, etc.).

**Never imports from**: `@/features/player-progression`.

### Future Modules
**Pattern**: Each new module (Notifications, Product Intelligence, Workflow Automation, etc.) follows the same pattern:
1. Create an `event-bus-bridge.ts` that subscribes to relevant engine events.
2. Process events independently — never call another consumer module.
3. Track processed event IDs for idempotency.
4. Document ownership boundaries in the bridge file's JSDoc.

## Event Flow Example

When a match finishes:

```
1. Game Mode emits MatchFinished via engine Event Bus
   emitEvent(matchId, "MatchFinished", userId, { gameMode, result, score, ... })

2. Engine Event Bus notifies all subscribers

3. Each subscriber processes independently:
   ├── Player Progression Bridge
   │   ├── recordMatchResult() — updates career stats
   │   ├── awardXP(participation) — 20 XP
   │   ├── awardXP(victory) — 100 XP (if won)
   │   ├── awardXP(question_correct) — 10 × correctCount
   │   └── updateMilestones() — checks for milestone unlocks
   │
   ├── Competitive Platform Bridge
   │   ├── createCompetitiveProfile() — if missing
   │   └── applyRatingUpdate() — if ranked match with opponent
   │
   ├── Analytics (future)
   │   └── updateMetrics() — match quality, fairness
   │
   ├── Replay Engine (built into engine)
   │   └── saveReplay() — automatic
   │
   ├── Hall of Fame (future)
   │   └── evaluateRecords() — check for new records
   │
   └── Notifications (future)
       └── sendNotification() — "You won!"
```

## Idempotency Guarantees

Each bridge maintains a `processedEventIds` Set that tracks every event ID it has processed. Before processing an event, the bridge checks:

```typescript
function handleMatchFinished(event: GameEvent): void {
  if (isProcessed(event)) return;  // ← idempotency check
  // ... process event ...
  markProcessed(event);
}
```

This guarantees:
- The same event is never processed twice.
- Duplicate event emissions (e.g., from retry logic) are safe.
- Event ordering does not affect correctness — each event is self-contained.

## Decoupling Verification

The architecture is verified by regression tests in `tests/unit/architecture-decoupling.test.ts`:

1. **No direct imports**: `player-progression` never imports from `competitive-platform` and vice versa.
2. **Independent processing**: Unsubscribing one module does not stop the other.
3. **Same event consumption**: Both bridges process the same `MatchFinished` event independently.
4. **Event ordering independence**: Events can arrive in any order without affecting correctness.
5. **Idempotent processing**: Duplicate event IDs are no-ops.
6. **No circular dependencies**: Both modules can be loaded in any order.
7. **Ownership boundaries**: XP is owned by Progression only; rating is owned by Competitive only.

## File Structure

```
src/features/
├── game-engine/                    # Universal Game Engine (untouched)
│   ├── match-engine.ts
│   ├── pipeline-sync-events.ts     # Event Bus (emitEvent, subscribe, getEvents)
│   └── ...
│
├── game-modes/                     # 5 game modes (untouched)
│   ├── classic-quiz/
│   ├── treasure-heist/
│   ├── empire-builder/
│   ├── quiz-royale/
│   └── battle-royale/
│
├── player-progression/             # Player Progression Platform
│   ├── types.ts
│   ├── progression-engine.ts       # XP, levels, prestige, career stats
│   ├── achievement-profile.ts      # Achievements, badges, titles, missions
│   ├── dashboard-analytics.ts      # Dashboards, analytics, timeline, export
│   ├── event-bus-bridge.ts         # ← SOLE engine integration point
│   ├── service.ts
│   └── index.ts
│
└── competitive-platform/           # Competitive Platform
    ├── types.ts
    ├── rating-matchmaking.ts       # Rating, placement, matchmaking, queues
    ├── competition-tournaments.ts  # Divisions, leagues, tournaments, championships
    ├── leaderboards-analytics.ts   # Leaderboards, fair play, hall of fame, admin
    ├── event-bus-bridge.ts         # ← SOLE engine integration point
    ├── service.ts
    └── index.ts
```

## Integration Rules (Strict)

1. **DO NOT** modify the Universal Game Engine.
2. **DO NOT** modify any game mode.
3. **DO NOT** add direct imports between consumer modules.
4. **DO NOT** call another module's APIs directly.
5. **DO** subscribe to engine events via each module's `event-bus-bridge.ts`.
6. **DO** process events idempotently.
7. **DO** document ownership boundaries in module JSDoc.

## Production Deployment

In production, the in-memory `Map` state in each module is replaced with Redis-backed stores. The Event Bus subscription pattern remains unchanged — only the storage backend swaps.

```
Production:
  Engine Event Bus → Redis Pub/Sub
  Module State     → Redis Hashes / Sorted Sets
  Queue            → Redis LIST (LPUSH/RPOP)
  Leaderboards     → Redis ZSET
```

The bridge pattern is horizontally scalable: multiple instances of each module can subscribe to the same Event Bus, and Redis handles fan-out.
