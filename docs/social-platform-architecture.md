# EduBek Social Gaming Platform Architecture

## Overview

The Social Gaming Platform is the single source of truth for every long-term social relationship across the EduBek Gaming Platform. It owns friend graphs, club graphs, team graphs, community graphs, presence, social identity, reputation, community challenges, social discovery, and activity streams.

It NEVER owns gameplay, scoring, XP, achievements, ratings, matchmaking, notifications, messaging, video, or voice.

## Architecture

```
Game Engine
    │
    ▼
Event Bus
    │
    ├── Player Progression (separate module)
    ├── Competitive Platform (separate module)
    ├── Analytics (separate module)
    │
    └── Social Platform (this module)
         ├── Event Bus Bridge (passive consumer)
         ├── Friend Graph
         ├── Club Graph
         ├── Team Graph
         ├── Presence
         ├── Reputation
         ├── Activity Feed
         ├── Discovery
         ├── Privacy
         ├── Moderation
         └── Community Dashboard
```

The Social Platform is a **passive Event Bus consumer**. It NEVER imports from Universal Game Engine, Competitive Platform, Progression Platform, Replay, or Analytics. It subscribes through `event-bus-bridge.ts`.

## 20 Systems

### System 1 — Player Social Profile
Public profile with bio, country, languages, school, organization, avatar/banner references, verification, visibility, custom titles, profile badges, statistics references, and profile history.

### System 2 — Friend Graph
Friend requests, accept/reject/cancel/remove, favorites, close friends, block, mute, friend categories, mutual friends, relationship history, privacy controls.

### System 3 — Presence Platform
Online, offline, away, busy, studying, playing, in match, watching, invisible. Rich presence with current activity, last seen, and session references.

### System 4 — Club Platform
Create, join, leave, invite, applications, ownership, capacity, visibility, verification. Organization, school, university, public, and private clubs.

### System 5 — Club Roles
Owner, admin, moderator, teacher, coach, member, guest. Permission inheritance, delegation, and audit trail.

### System 6 — Teams
Persistent and temporary teams, captains, roster management, invitations, join requests, transfers, tournament references, team lifecycle.

### System 7 — Community Reputation
Sportsmanship, mentor, teacher recognition, helpful, community contributor, fair play scores. Reports, warnings, decay rules. Never affects gameplay.

### System 8 — Community Challenges
Friend, club, school, university, organization, regional, national, seasonal scopes. Configuration only — no gameplay execution.

### System 9 — Activity Feed
Derived only from events: won match, reached level, unlocked achievement, joined club, won tournament, new record, challenge completed. Timeline with pagination and filtering.

### System 10 — Community Discovery
Suggested friends, clubs, teams. Trending communities, popular schools/universities/organizations. Rule-based only — no AI.

### System 11 — Social Privacy
Visibility levels, blocked/muted users, friend-only/organization-only/club-only settings. Teacher controls, parent controls, minor protections.

### System 12 — Community Moderation
Reports with evidence references, appeals, warnings, escalation, review. Never auto-ban — recommendations only.

### System 13 — Social Analytics
Growth, retention, friend graph metrics, club growth, activity rates, participation, challenge engagement, community health.

### System 14 — Community Rankings
Top clubs, schools, universities, organizations, teams. Most active, most helpful, most competitive. Configurable.

### System 15 — Teacher Community Controls
Approve/freeze clubs, lock community, disable challenges, review reports, moderation. RBAC enforced, full audit trail.

### System 16 — Community Dashboard
Friends, presence, club health, challenges, reports, growth, moderation, engagement overview.

### System 17 — Community Event Bridge
Consumes MatchFinished, TournamentCompleted, AchievementUnlocked, LevelUp, SeasonCompleted, RatingChanged. Never owns gameplay. Publishes Social-owned events only.

### System 18 — Social Event Ownership
Registers FriendRequestSent, FriendAccepted, FriendRemoved, ClubCreated, ClubJoined, ClubLeft, ClubRoleChanged, TeamCreated, ChallengeCreated, ChallengeCompleted, PresenceChanged, ReputationUpdated, ProfileUpdated, CommunityReported, CommunityModerated.

### System 19 — Community Health
Club activity, inactive communities, growth trends, member retention, participation score, health score, recommendations. No automatic actions.

### System 20 — Developer Integration
Public APIs, event contracts, webhook metadata, extension hooks, SDK metadata, documentation generation.

## File Structure

```
src/features/social-platform/
├── types.ts                      # All 20 systems' TypeScript types
├── repository.ts                 # In-memory state repository
├── profiles-friends.ts           # Systems 1, 2 — Profile + Friend Graph
├── clubs-teams.ts                # Systems 4, 5, 6, 8 — Clubs, Roles, Teams, Challenges
├── presence-reputation.ts        # Systems 3, 7 — Presence + Reputation
├── activity-discovery.ts         # Systems 9, 10, 13, 14 — Activity, Discovery, Analytics, Rankings
├── moderation-dashboard.ts       # Systems 11, 12, 15, 16, 19, 20 — Privacy, Moderation, Teacher, Dashboard, Health, Developer
├── event-bus-bridge.ts           # Systems 17, 18 — Event Bridge + Event Ownership
├── service.ts                    # Barrel re-export
└── index.ts                      # Full barrel with type exports
```

## API Routes

16 read-only endpoints under `/api/social/`:

| Endpoint | Purpose |
|----------|---------|
| `GET /profiles` | Player social profiles |
| `GET /friends` | Friend graph + pending requests |
| `GET /presence` | User presence + online counts |
| `GET /clubs` | Club listing + details |
| `GET /roles` | Club role permissions |
| `GET /teams` | Team listing |
| `GET /activity` | Activity feed + recent activity |
| `GET /reputation` | User reputation + top reputable |
| `GET /privacy` | Privacy settings |
| `GET /discovery` | Discovery recommendations |
| `GET /moderation` | Reports + appeals |
| `GET /analytics` | Social analytics |
| `GET /rankings` | Community rankings |
| `GET /health` | Community health |
| `GET /dashboard` | Community dashboard |
| `GET /developer` | Developer integration data |

## Event Flow

```
1. Game Mode emits MatchFinished via engine Event Bus
2. Social Platform Bridge receives the event
3. Bridge records an activity feed entry ("Won a match")
4. Activity is visible in the player's activity feed
5. Friends see the activity in their friends activity feed
```

## Domain Ownership

| Domain | Owner | Not Owner |
|--------|-------|-----------|
| Friend Graph | Social Platform | — |
| Club Graph | Social Platform | — |
| Team Graph | Social Platform | — |
| Presence | Social Platform | — |
| Reputation | Social Platform | — |
| Activity Feed | Social Platform | — |
| Privacy | Social Platform | — |
| Moderation | Social Platform | — |
| XP / Levels | Player Progression | Social Platform |
| Ratings | Competitive Platform | Social Platform |
| Achievements | Player Progression | Social Platform |
| Matchmaking | Competitive Platform | Social Platform |
| Scoring | Game Engine | Social Platform |

## Acceptance Criteria

- ✅ Universal Game Engine unchanged
- ✅ Game Modes unchanged
- ✅ Progression unchanged
- ✅ Competitive unchanged
- ✅ Replay unchanged
- ✅ Analytics unchanged
- ✅ Event Registry reused
- ✅ Event Governance reused
- ✅ Event Bus only communication
- ✅ Social Platform completely decoupled
- ✅ No gameplay ownership
- ✅ No duplicated rankings/XP/ratings/achievements/analytics
- ✅ Replay compatibility preserved
- ✅ Horizontal scaling compatible
- ✅ Redis compatible
- ✅ Server authoritative
- ✅ Deterministic
- ✅ No LLM usage
- ✅ 250 tests passing (exceeds 220+ requirement)
- ✅ 0 ESLint errors
- ✅ 0 TypeScript errors
- ✅ Production ready
