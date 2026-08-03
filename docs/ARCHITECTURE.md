# EduBek — Live Quiz Engine Architecture

## Product Hierarchy

```
EduBek (platform)
└── Live Quiz (feature)
    ├── Quiz Session (one running instance)
    │   ├── Lobby (pre-game gathering)
    │   ├── Participants (host, co-host, players, spectators)
    │   ├── Rounds (one question per round)
    │   ├── Answers (participant responses)
    │   ├── Leaderboard (real-time scoring)
    │   └── Replay (immutable event history)
    ├── Tournament (bracket system)
    │   ├── Participants
    │   ├── Bracket (rounds → matches)
    │   └── Matches (1v1 Quiz Sessions)
    ├── Game Modes (plug-in strategies)
    │   ├── Classic Quiz
    │   ├── Treasure Heist
    │   ├── Empire Builder
    │   ├── Quiz Royale
    │   └── Battle Royale
    └── Infrastructure
        ├── Socket.IO (realtime transport)
        ├── Event Bus (domain events)
        ├── Audit Log (immutable history)
        ├── RBAC (permissions)
        ├── Rate Limiter (security)
        ├── Circuit Breaker (reliability)
        ├── Cache (performance)
        ├── Presence (online tracking)
        └── Metrics (observability)
```

## Architecture Overview

### Layered Architecture

```
API Route (thin)
    ↓
Service (business logic)
    ↓
Repository (Prisma only)
    ↓
Database (SQLite / Postgres)
```

### Realtime Architecture

```
Client (browser/mobile)
    ↕ HTTP REST
API Route → Service → Repository → DB
    ↕ WebSocket (Socket.IO)
Realtime Layer (transport only)
    ↕ Event Bus
Service → Event Bus → Listeners
                         ├── Audit Listener
                         ├── Notification Listener
                         └── Realtime Listener → Socket.IO broadcast
```

## Feature Modules

| Module | Location | Responsibility |
|---|---|---|
| Game Mode | `src/features/game-mode/` | Strategy interface + 5 mode implementations |
| Live Session | `src/features/live-session/` | Quiz Session engine core |
| Player | `src/features/player/` | Participant state + read endpoints |
| Leaderboard | `src/features/leaderboard/` | Snapshot persistence + read API |
| Reward | `src/features/reward/` | XP/coins/achievements/badges |
| Lobby | `src/features/lobby/` | Pre-game gathering, PIN, ready check |
| Matchmaking | `src/features/matchmaking/` | 7 join strategies |
| Spectator | `src/features/spectator/` | Read-only viewer tokens |
| Replay | `src/features/replay/` | Event-sourced session history |
| Live Analytics | `src/features/live-analytics/` | Per-session + per-mode + per-question analytics |
| Tournament | `src/features/tournament/` | Bracket system with check-in + auto-advance |

## Infrastructure Modules

| Module | Location | Responsibility |
|---|---|---|
| Correlation | `src/infra/correlation/` | Request tracing via correlation IDs |
| Rate Limiter | `src/infra/rate-limiter/` | Token-bucket rate limiting (HTTP + Socket.IO) |
| Circuit Breaker | `src/infra/circuit-breaker/` | Cascading failure protection |
| Retry | `src/infra/retry/` | Exponential backoff + idempotency keys |
| Cache | `src/infra/cache/` | TTL cache for read-only metadata |
| Metrics | `src/infra/metrics/` | Prometheus-compatible metrics |
| Health | `src/infra/health/` | Liveness + readiness probes |
| Presence | `src/infra/presence/` | Online participant tracking |
| Distributed | `src/infra/distributed/` | Locks, leader election, graceful shutdown |
| Realtime | `src/infra/realtime/` | Socket.IO server + 5 namespaces |
| Event Bus | `src/infra/event-bus/` | In-process pub/sub |
| Audit | `src/infra/audit/` | Immutable audit log |

## Lifecycle

### Quiz Session Lifecycle

```
lobby → countdown → in_progress → (paused ↔ in_progress) → finished
                                                    ↘ cancelled
```

### Game Mode Strategy Lifecycle

```
createSession() → startRound() → processAnswer() × N → finishRound() → calculateScores() → determineWinner() → applyRewards() → finishGame()
```

### Participant Lifecycle

```
joined → active → (disconnected → active)* → eliminated | left
```

## Extension Points

### Adding a New Game Mode

1. Implement `GameModeStrategy` in `src/features/game-mode/modes/<name>.ts`
2. Register it in `src/features/game-mode/registry.ts`
3. Add its display name in `src/features/game-mode/display-names.ts`
4. Done. No engine changes required.

### Adding a New Infrastructure Provider

All infrastructure modules expose interfaces that can be backed by either
in-memory (single-instance) or Redis (multi-instance) implementations:

| Interface | In-Memory | Redis (production) |
|---|---|---|
| `RateLimitStore` | `InMemoryRateLimitStore` | Redis `INCR` + `EXPIRE` |
| `CacheStore` | `InMemoryCacheStore` | Redis `GET`/`SET` |
| `PresenceStore` | `InMemoryPresenceStore` | Redis `HSET`/`HGETALL` |
| `DistributedLock` | In-process mutex | Redis `SET NX PX` |
| `Socket.IO Adapter` | Default (in-process) | `@socket.io/redis-adapter` |

Swap implementations by setting `REDIS_URL` in the environment. No code changes needed.

## Security Model

| Concern | Mitigation |
|---|---|
| PIN brute-force | 5 attempts per 5 minutes per PIN (rate limiter) |
| Socket spam | 20 events per second per socket (rate limiter) |
| Answer spam | 1 per 500ms per participant (rate limiter) |
| API spam | 100 requests per minute per user (rate limiter) |
| Replay attacks | JWT verification on every socket connection |
| Session hijacking | httpOnly cookies + rotated refresh tokens |
| SQL injection | Prisma parameterized queries (no raw SQL) |
| XSS | Next.js built-in CSP + React auto-escaping |

## Deployment Guide

### Single-Instance (Development)

```bash
npm run dev:realtime
# → http://localhost:3000
# → Socket.IO at ws://localhost:3000/api/realtime
```

### Multi-Instance (Production)

```bash
# 1. Build
npm run build

# 2. Docker
docker build -t edubek:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL=file:/data/edubek.db \
  -e REDIS_URL=redis://redis:6379 \
  -e EDUBEK_SESSION_SECRET=your-secret \
  -e EDUBEK_REFRESH_SECRET=your-refresh-secret \
  edubek:latest

# 3. Kubernetes
kubectl apply -f k8s/
```

### Health Checks

```
GET /api/health/live    → 200 (process is running)
GET /api/health/ready   → 200 (DB + event bus OK) or 503
GET /api/health/metrics → Prometheus text format
```

## Testing Guide

```bash
# All tests
npx vitest run

# Unit tests only
npx vitest run tests/unit

# With coverage
npx vitest run --coverage

# Watch mode
npx vitest
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Socket.IO events not reaching clients | Realtime listeners not registered | Check `registerAllListeners()` ran |
| PIN brute-force not blocked | Rate limiter store not shared | Set `REDIS_URL` for multi-instance |
| Leaderboard shows wrong ranks | Previous snapshot not loaded | Check `getLatestLeaderboard()` returns non-null |
| Replay missing timeline markers | Old replay (pre-4C.1) | Only new sessions get markers |
| Circuit breaker stuck open | Cooldown too long | Call `breaker.reset()` or reduce `cooldownMs` |
| Health check returns 503 | DB unreachable | Check `DATABASE_URL` + DB connectivity |
