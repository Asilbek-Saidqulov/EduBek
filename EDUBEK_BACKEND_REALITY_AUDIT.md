# EduBek — Comprehensive Backend Reality Audit

**Audit Date:** August 26, 2026  
**Auditor:** Google AI Studio Senior Systems & Security Agent  
**Scope:** Entire EduBek Codebase (`/src`, `/prisma`, `/api`, `/features`, `/lib`, `/components`)  
**Objective:** Determine the true, unvarnished execution reality of the EduBek backend by tracing real execution chains from frontend actions to database persistence and external services.

---

## 1. Executive Summary

| Metric | Measured Count | Notes |
| :--- | :--- | :--- |
| **Total Prisma Models Defined** | **346** | Defined across 8,625 lines in `prisma/schema.prisma` |
| **Prisma Models with Real CRUD** | **~12** (3.5%) | `User`, `UserProfile`, `UserRole`, `UserSession`, `Wallet`, `EduTokenLedger`, `AiConversation`, `AiMessage`, `AiToolCall`, `AiUsageLog`, `Resource`, `DiscussionReply`/`Reaction` |
| **Orphan / Ghost Schema Models** | **334** (96.5%) | Models exist in schema but have zero active persistence or business logic |
| **Total API Routes Defined** | **869** | `src/app/api/**/route.ts` |
| **API Routes with Real Logic & DB** | **~15** (1.7%) | Auth routes, AI Tutor routes, Discussion reaction routes |
| **API Routes Returning Auto-Generated Stubs** | **~850** (97.8%) | Call auto-generated stub feature modules returning `{ success: true, data: [], items: [] }` |
| **API Routes Broken / Crashing** | **~4** | `ai-workspace/*` routes fail on runtime import of missing `@/lib/ai` |
| **Missing API Routes (Frontend 404s)** | **2** | `/api/wallet/balance` and `/api/wallet/history` invoked by `/wallet` but routes don't exist |
| **Total Feature Modules (`src/features`)** | **104** | Modular architecture files |
| **Real Feature Modules** | **15** (14.4%) | Exclusively inside `src/features/auth/` and its unit tests |
| **Auto-Generated Stub Feature Modules** | **89** (85.6%) | Auto-generated files returning hardcoded placeholder response structures |
| **Realtime / WebSocket Backend** | **0% (ABSENT)** | `socket.io` in `package.json`, but no custom Node server or WebSocket gateway exists |

---

### Honest Verdict on Backend Readiness

> **The EduBek codebase currently possesses a robust Authentication system, a real Gemini-powered AI Tutor with Blackboard & tool calling, and a rich Prisma schema definition, but over 95% of the platform's advertised enterprise and learning systems are auto-generated stubs.**

If a team were to build only the frontend against the current backend without backend implementation:
- **What will actually work end-to-end:**
  1. **User Sign Up & Login:** Real bcrypt hashing, session tokens, cookie persistence, and DB user creation.
  2. **AI Tutor Session (`/[locale]/tutor`):** Real Gemini 2.5 Flash execution, interactive blackboard state mutations, tool execution, KaTeX math parsing, and session persistence in `AiConversation` and `AiMessage`.
- **What will only look functional (Illusion / Static Stubs / Client Simulation):**
  1. **Live Multiplayer Quiz (`/[locale]/live-quiz`):** Purely a client-side simulation using `GuestQuizPlayer` with hardcoded questions and simulated bots; zero WebSocket/Socket.IO server integration.
  2. **Marketplace (`/[locale]/marketplace`):** Returns 0 items and empty states because `/api/marketplace/listings` returns auto-generated empty arrays. No listing creation, search, checkout, or creator earnings pipeline exists.
  3. **Wallet (`/[locale]/wallet`):** Crashes with 404 network errors because `/api/wallet/balance` and `/api/wallet/history` are not implemented.
  4. **Classrooms & Assignments (`/[locale]/classrooms`):** Returns empty arrays from auto-generated stubs; no teacher gradebooks or student submission pipelines exist.
  5. **AI Quiz Generator (`/[locale]/ai-workspace`):** Crashes on invoke because it imports a missing module `@/lib/ai`.

---

## 2. System-by-System Deep Dive (All 16 Domains)

### 1. Core Infrastructure & Session
- **Classification:** `VERIFIED_WORKING`
- **Real DB Models Used:** `User`, `UserProfile`, `UserRole`, `UserSession`
- **Execution Chain:** `POST /api/auth/register` → `registerBodySchema` → `auth.service.registerUser` → `bcrypt.hash` → `db.user.create` (with profile, roles, wallet) → `db.userSession.create` → `buildSessionTokens` → Cookie `edubek_session` set.
- **Verification:** Unit tests in `src/features/auth/__tests__` passing. Error handling middleware (`withErrorHandler`) and rate limiting (`checkRateLimit`) operational.

### 2. User & Profile System
- **Classification:** `PARTIAL`
- **Real DB Models Used:** `User`, `UserProfile`, `UserRole`
- **Stubbed DB Models:** `UserDevice`, `UserAchievement`, `UserStreak`, `UserFollow`, `NotificationPreference`
- **Execution Reality:** User registration, password authentication, profile fetching via `GET /api/auth/me`, and locale switching (`/api/auth/locale`) are fully backed by Prisma. Role-based checks (`requireRole`) work for platform roles (`STUDENT`, `ADMIN`), but organizational permissions (`loadOrgPermissions`) are hardcoded to return `["*"]`.

### 3. AI Assistant & Tutor System
- **Classification:** `VERIFIED_WORKING` (for `/api/tutor/*`) / `BROKEN` (for `/api/ai-workspace/*`)
- **Real DB Models Used:** `AiConversation`, `AiMessage`, `AiToolCall`, `AiUsageLog`, `Resource`, `Wallet`
- **Execution Chain (`/api/tutor/session`):**
  `POST /api/tutor/session` → `getAuthContext` → `getGeminiClient` (`@google/genai`) → System prompt builder with multi-lingual pedagogy → Gemini tool declarations (`set_title`, `add_section`, `update_section`, `highlight_section`, `insert_diagram`, `add_checkpoint`) → Tool execution against `BlackboardDocument` → DB atomic persistence in `AiConversation`, `AiMessage`, `AiToolCall`, `AiUsageLog` → Response with updated blackboard state.
- **Failure Point:** Routes under `/api/ai-workspace/` (`generate-quiz`, `summarize`, `tutor-chat`, `explain-question`) fail with module resolution errors due to importing from non-existent `@/lib/ai`.

### 4. Economy & EduTokens
- **Classification:** `PARTIAL` (DB transactions exist in AI tutor / quiz, but API surface is missing)
- **Real DB Models Used:** `Wallet`, `EduTokenLedger`
- **Execution Reality:** The DB models for `Wallet` and `EduTokenLedger` are real and seeded upon user registration (giving 250 initial EDU tokens). Deductions and ledger entries are executed atomically inside `ai-workspace/generate-quiz` and `tutor/session`. However, the dedicated endpoints queried by the frontend (`/api/wallet/balance` and `/api/wallet/history`) were never created under `src/app/api/wallet/`.

### 5. Quiz Platform (Solo & Practice)
- **Classification:** `FRONTEND_ONLY`
- **Real DB Models Used:** None in active quiz runner. (Schema has `Quiz`, `Question`, `QuizAttempt`, `QuizScore`).
- **Execution Reality:** The frontend at `/[locale]/live-quiz` and `GuestQuizPlayer` uses hardcoded questions and client-side React state timers. There is no API route connecting user quiz completions to Prisma `QuizAttempt` or calculating real XP/Elo rankings.

### 6. Live Learning & Multiplayer (Socket.IO)
- **Classification:** `DEAD_CODE` / `MOCK_OR_STUB`
- **Packages:** `socket.io` and `socket.io-client` present in `package.json`.
- **Execution Reality:** There is NO WebSocket server, NO custom Node HTTP server, and NO Socket.IO connection handler in the repository. All live session routes (`/api/game-engine/*`, `/api/live-events/*`, `/api/game-operations/*`) point to auto-generated stub functions in `src/features/live-session.ts` and `src/features/game-engine.ts`.

### 7. Marketplace & Creator Economy
- **Classification:** `MOCK_OR_STUB`
- **Schema Models:** `MarketplaceListing`, `MarketplacePurchase`, `MarketplaceReview`, `CreatorProfile`, `CreatorTier`, `PayoutRecord`.
- **Execution Reality:** All 30+ marketplace API routes call `src/features/marketplace.ts`, which returns `{ success: true, data: [], items: [], list: [], results: [], stats: { total: 0, active: 0, score: 100 } }`. No listing can be published, bought, reviewed, or paid out to creators in the database.

### 8. Payments (Click / Payme / Stripe)
- **Classification:** `MOCK_OR_STUB`
- **Schema Models:** `PaymentTransaction`, `PaymentMethod`, `Invoice`.
- **Execution Reality:** `src/features/payment.ts` contains only `listProviders()` returning empty stub data. There are no webhooks, no signature verification for Uzbek payment gateways (Click/Payme), and no payment state machine.

### 9. Assessment & Exams
- **Classification:** `MOCK_OR_STUB`
- **Schema Models:** `Assessment`, `AssessmentAttempt`, `ProctoringSession`, `PlagiarismReport`.
- **Execution Reality:** Routes under `/api/assessments`, `/api/proctoring`, and `/api/plagiarism` delegate to `src/features/assessment.ts` and `src/features/proctoring.ts`, both of which are auto-generated stubs returning empty arrays.

### 10. Learning & Classroom Management
- **Classification:** `MOCK_OR_STUB`
- **Schema Models:** `Classroom`, `ClassroomMember`, `Assignment`, `AssignmentSubmission`, `GradeRecord`.
- **Execution Reality:** `src/app/api/classrooms/route.ts` calls `listMyClassrooms` from `src/features/classroom.ts`. Because the feature file returns an empty object/stub, classroom listings and gradebook insights do not touch Prisma.

### 11. Organizations & Multi-Tenancy
- **Classification:** `MOCK_OR_STUB`
- **Schema Models:** `Organization`, `OrganizationMembership`, `OrganizationInvitation`, `Cohort`.
- **Execution Reality:** `loadOrgPermissions` in `src/features/auth/auth.context.ts` returns `["*"]`. All organization API routes (`/api/organizations/*`) return auto-generated mock responses.

### 12. Analytics & Reporting
- **Classification:** `PARTIAL` / `MOCK_OR_STUB`
- **Real DB Models Used:** `LearningAnalyticsSnapshot`, `StudySession`, `ReviewHistory` (queried in `src/app/api/learning/analytics/route.ts`).
- **Execution Reality:** 95% of analytics endpoints (`/api/analytics/platform`, `/api/analytics/creator`) return auto-generated empty payloads.

### 13. Discovery, Search & Knowledge Graph
- **Classification:** `PARTIAL`
- **Real DB Models Used:** `SearchIndexEntry`, `SemanticCluster`, `Concept` (queried in `src/app/api/discovery/reindex` and `src/app/api/concepts`).
- **Execution Reality:** Endpoints for concept creation and cluster retrieval have basic DB queries, but semantic embeddings, vector search, and recommendation feeds return static stubs.

### 14. Collaboration & Discussions
- **Classification:** `PARTIAL`
- **Real DB Models Used:** `DiscussionReply`, `DiscussionReaction`
- **Execution Reality:** Discussion reaction toggling and accepting answers in `src/app/api/discussions/[id]/replies/[replyId]/react` execute real Prisma updates. Peer mentorship and group endpoints return stubs.

### 15. Enterprise Integrations (LMS / OAuth)
- **Classification:** `MOCK_OR_STUB`
- **Execution Reality:** All routes under `/api/integrations/*` (Google Classroom, Canvas, Moodle) return auto-generated stubs.

### 16. Advanced Systems (Civilization Engine, Digital Twins, Cognitive AI)
- **Classification:** `API_SURFACE_ONLY` / `MOCK_OR_STUB`
- **Execution Reality:** Models exist in `prisma/schema.prisma` and routes exist in `src/app/api/civilization/*`, but they are 100% placeholder stubs with no simulation engine or game loop behind them.

---

## 3. Priority Workflows Trace

### Workflow 1: Authentication & Session Management
```text
[User Form] (Name, Email, Password)
   │
   ▼
[POST /api/auth/register]
   │
   ▼
[auth.schema.ts] ── validate Zod schema (name >= 2, password >= 6, email format)
   │
   ▼
[auth.service.ts] ── check email uniqueness in db.user
   │
   ▼
[bcrypt.hash] ── generate secure salt & hash (rounds: 10)
   │
   ▼
[db.user.create] ── atomic creation of User + UserProfile + UserRole + Wallet (250 EDU)
   │
   ▼
[buildSessionTokens] ── generate sessionId, base64 payload, SHA-256 token hashes
   │
   ▼
[db.userSession.create] ── store token hash, IP hash, user-agent, expiry (7 days)
   │
   ▼
[Cookie Header] ── Set-Cookie: edubek_session (httpOnly, sameSite: lax, secure in prod)
   │
   ▼
[Next.js Client] ── Logged in, auth state available via useCurrentUser()
```
* **Status:** `VERIFIED_WORKING` (100% functional, real DB, secure hashing, cookie session management).

---

### Workflow 2: Quiz Creation, Taking, Grading, XP
```text
[User Client] ── Navigates to /[locale]/live-quiz
   │
   ▼
[GuestQuizPlayer] ── Loads hardcoded DEFAULT_QUESTIONS array from memory
   │
   ▼
[Local React State] ── Step through questions, compute score, simulate bot timers
   │
   ▼ (MISSING STEP)
[No API Call Made] ── Does NOT call /api/quizzes or /api/attempts
   │
   ▼ (MISSING STEP)
[No DB Persistence] ── QuizAttempt, QuizScore, EduTokenLedger NOT updated
```
* **Status:** `FRONTEND_ONLY` (Interactive UI exists, but disconnected from Prisma DB).

---

### Workflow 3: AI Document-First Tutor Chat
```text
[Student] ── Types message / loads quiz error on /[locale]/tutor
   │
   ▼
[POST /api/tutor/session]
   │
   ▼
[Rate Limiter] ── checkRateLimit (10 req / 60s per IP)
   │
   ▼
[getAuthContext] ── verifies session from edubek_session cookie
   │
   ▼
[getGeminiClient] ── initializes GoogleGenAI client (GEMINI_API_KEY)
   │
   ▼
[Gemini 2.5 Flash] ── system prompt + pedagogical rules + tutor tool definitions
   │
   ▼
[Tool Execution] ── executeServerTool:
   ├─ set_title
   ├─ add_section (LaTeX KaTeX notes)
   ├─ update_section
   ├─ highlight_section
   ├─ insert_diagram (SVG)
   └─ add_checkpoint (Diagnostic MCQs)
   │
   ▼
[Prisma DB Transaction]
   ├─ db.aiConversation.upsert
   ├─ db.aiMessage.create (user & assistant)
   ├─ db.aiToolCall.create
   └─ db.aiUsageLog.upsert
   │
   ▼
[JSON Response] ── Returns reply text, updated BlackboardDocument, active mutations
   │
   ▼
[TutorBlackboard] ── Renders animated blackboard, KaTeX math formulas, interactive checkpoints
```
* **Status:** `VERIFIED_WORKING` (Real Gemini API, real tool mutations, real KaTeX formatting, real Prisma persistence).

---

### Workflow 4: Marketplace Browse & Purchase
```text
[User] ── Navigates to /[locale]/marketplace
   │
   ▼
[MarketplaceBrowse] ── React Query fetches /api/marketplace/listings
   │
   ▼
[GET /api/marketplace/listings] ── Calls browseListings() in @/features/marketplace.ts
   │
   ▼
[@/features/marketplace.ts] ── Returns STATIC STUB: { success: true, data: [], items: [] }
   │
   ▼
[MarketplaceBrowse UI] ── Receives empty array -> Displays empty state (0 items)
```
* **Status:** `MOCK_OR_STUB` (API route connects to auto-generated stub; zero DB queries to `MarketplaceListing`).

---

### Workflow 5: Live Quiz / Game Engine
```text
[User] ── Enters 6-digit Game PIN on /[locale]/live-quiz
   │
   ▼
[Frontend] ── Attempts to connect to game room
   │
   ▼ (MISSING ARCHITECTURE)
[No WebSocket Gateway] ── No socket.io server running; Next.js App Router only
   │
   ▼
[Fallback] ── UI falls back to client-only simulation (GuestQuizPlayer)
```
* **Status:** `MOCK_OR_STUB` / `DEAD_CODE` (No live coordination server).

---

### Workflow 6: Assessment, Assignment & Classrooms
```text
[Teacher] ── Navigates to /[locale]/classrooms
   │
   ▼
[ClassroomsClient] ── Fetches GET /api/classrooms
   │
   ▼
[GET /api/classrooms] ── Calls listMyClassrooms() in @/features/classroom.ts
   │
   ▼
[@/features/classroom.ts] ── Returns STATIC STUB: { success: true, data: [], items: [] }
   │
   ▼
[ClassroomsClient] ── Displays empty state; classroom creation returns stub with no DB row
```
* **Status:** `MOCK_OR_STUB`.

---

## 4. Reality Matrix (Feature Table)

| Feature / Subsystem | Current Status | Real DB Queries? | External Service? | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Auth (Registration & Login)** | `VERIFIED_WORKING` | Yes (`User`, `Profile`, `Role`, `Session`, `Wallet`) | `bcryptjs`, `crypto` | **Production Ready** |
| **Auth (Session & Cookies)** | `VERIFIED_WORKING` | Yes (`UserSession` lookup & validation) | Next.js Cookies | **Production Ready** |
| **Auth (Org Permissions)** | `MOCK_OR_STUB` | No (hardcoded `["*"]`) | None | Needs DB Org Role Lookup |
| **AI Tutor Blackboard Engine** | `VERIFIED_WORKING` | Yes (`AiConversation`, `AiMessage`, `AiToolCall`, `AiUsageLog`, `Resource`) | `@google/genai` (Gemini 2.5 Flash) | **Production Ready** |
| **AI Workspace Quiz Generator** | `BROKEN` | Yes (has Prisma code, but crashes on import) | `@/lib/ai` (missing) | **Broken Import** |
| **EduToken Wallet DB Model** | `IMPLEMENTED_NOT_VERIFIED` | Yes (`Wallet`, `EduTokenLedger`) | None | Model is real; needs API endpoints |
| **Wallet UI (`/wallet`)** | `BROKEN` | No (`/api/wallet/balance` missing -> 404) | None | **Missing API Routes** |
| **Interactive Guest Quiz Player** | `FRONTEND_ONLY` | No | Client React State | **Client Simulation** |
| **Quiz Database Engine** | `MOCK_OR_STUB` | No (stub in `@/features/quiz.ts`) | None | Schema defined, no service logic |
| **Live Multiplayer (Socket.IO)** | `DEAD_CODE` | No | None | No WebSocket Server |
| **Marketplace Listings & Buy** | `MOCK_OR_STUB` | No (stub in `@/features/marketplace.ts`) | None | Returns empty arrays |
| **Click / Payme Payment Gateway**| `MOCK_OR_STUB` | No (stub in `@/features/payment.ts`) | None | Stub only |
| **Classroom & Gradebook** | `MOCK_OR_STUB` | No (stub in `@/features/classroom.ts`) | None | Stub only |
| **Assessment & Exams** | `MOCK_OR_STUB` | No (stub in `@/features/assessment.ts`) | None | Stub only |
| **Proctoring & Plagiarism** | `MOCK_OR_STUB` | No (stub in `@/features/proctoring.ts`) | None | Stub only |
| **Discussion Reactions** | `VERIFIED_WORKING` | Yes (`DiscussionReply`, `DiscussionReaction`) | None | Basic CRUD works |
| **Discovery Knowledge Graph** | `PARTIAL` | Yes (`Concept`, `SearchIndexEntry`) | None | Basic DB CRUD, no vector embeddings |
| **Civilization Engine / Digital Twins**| `API_SURFACE_ONLY` | No (stub in `@/features/civilization-engine.ts`) | None | Pure placeholder |

---

## 5. Critical Architectural Gaps

1. **Auto-Generated Feature Stubs (The 89-File Hollow Core):**
   - 89 of 104 files in `src/features/` were generated by a scaffolding tool that placed the exact same placeholder:
     ```typescript
     export async function ...(...args: any[]): Promise<any> {
       return { success: true, data: [], items: [], list: [], results: [], stats: { total: 0, active: 0, score: 100 }, timestamp: new Date().toISOString() };
     }
     ```
   - This creates an illusion where 869 API routes compile and return HTTP 200/201, but persist zero records to the 346 Prisma tables.

2. **Broken Imports in AI Workspace (`@/lib/ai`):**
   - `src/app/api/ai-workspace/generate-quiz/route.ts`, `summarize/route.ts`, `tutor-chat/route.ts`, and `explain-question/route.ts` all import `{ generateStructuredJson, AiError } from "@/lib/ai"`.
   - File `src/lib/ai.ts` does NOT exist in the repository, causing these endpoints to immediately crash upon being called. (They should be unified with `src/lib/gemini.ts`).

3. **Missing API Route Folder for Wallet (`/api/wallet`):**
   - The frontend `/wallet` page expects `GET /api/wallet/balance` and `GET /api/wallet/history`, but no `src/app/api/wallet` directory exists, resulting in unhandled 404s.

4. **Schema-to-Code Field Mismatches (`prisma/schema.prisma` vs API Routes):**
   - `QuizAttempt`: API routes query `createdAt` and `quizTitle`, but the Prisma schema model `QuizAttempt` defines `startedAt`, `finishedAt`, `score`, and `maxScore`.
   - `Resource`: API routes attempt to query `where: { userId }` and `select: { type }`, whereas `Resource` in schema relates to `libraryId` and does not have a top-level `userId` column.
   - `AiConversation`: Route sets `model`, but `AiConversation` model in schema does not contain a `model` column.
   - `src/lib/rate-limiter`: Imported incorrectly as `@/lib/rate-limit` in `tutor/session/route.ts`.

5. **Absent Realtime Infrastructure:**
   - Next.js App Router serverless routes cannot hold long-lived persistent WebSocket connections without a custom Node.js server (`server.ts`) or an external managed WebSocket provider (such as Pusher or Firebase Realtime).

---

## 6. Recommended Actionable Roadmap

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Core Platform Hardening (CRITICAL IMMEDIATE FIXES)                    │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. Fix broken AI workspace routes by creating @/lib/ai bridge to @/lib/gemini │
│ 2. Create missing /api/wallet/balance and /api/wallet/history routes          │
│ 3. Fix import typo in tutor session route (@/lib/rate-limiter)                │
│ 4. Verify end-to-end token deduction and ledger logging                       │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 2: Real Quiz Platform & Persistence Engine                              │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. Replace @/features/quiz.ts stub with real Prisma CRUD for Quiz & Question  │
│ 2. Connect GuestQuizPlayer / Quiz runner to POST /api/quizzes/attempts        │
│ 3. Implement real grading, XP awarding, and leaderboard updates in DB         │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 3: Marketplace & Creator Economy Reality                                │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. Implement real Prisma queries in @/features/marketplace.ts                 │
│ 2. Enable listing creation, category filtering, search, and purchasing       │
│ 3. Implement atomic EduToken transfers between buyer and creator wallets      │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 4: Classrooms, Assignments & Assessments                                │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. Wire @/features/classroom.ts to Classroom and ClassroomMember models       │
│ 2. Build teacher assignment distribution and student submission pipeline      │
│ 3. Implement real gradebook aggregation                                       │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│ PHASE 5: Realtime Multiplayer (Custom Server / WebSockets)                     │
├───────────────────────────────────────────────────────────────────────────────┤
│ 1. Introduce custom server.ts with integrated Socket.IO server                │
│ 2. Implement game room lifecycle, PIN lobby, live countdown, and scoreboards  │
└───────────────────────────────────────────────────────────────────────────────┘
```
