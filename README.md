# EduBek — AI-Powered Education Platform

## Quick Start

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org))
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/)) or [Supabase](https://supabase.com) (free hosted)
- **OpenRouter API key** ([get one free](https://openrouter.ai/keys))

### Windows Setup
```powershell
# Clone/unzip the project, then:
cd edubek

# Run the PowerShell setup script (installs deps, sets up DB, runs tests)
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1

# Or with custom database + API key:
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 `
    -DatabaseUrl "postgresql://user:pass@localhost:5432/edubek" `
    -OpenRouterKey "sk-or-v1-..."

# Start dev server:
npm run dev

# Start production server:
.\scripts\start-windows.bat
```

### macOS / Linux Setup
```bash
cd edubek
npm install
cp .env.example .env  # edit with your config
npx prisma migrate deploy
npx prisma generate
npx tsx scripts/seed.ts  # optional seed data
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start    # starts Next.js + API routes + Socket.IO
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooler URL for Supabase) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (for migrations) |
| `EDUBEK_SESSION_SECRET` | ✅ prod | JWT session signing secret (≥32 bytes) |
| `EDUBEK_REFRESH_SECRET` | ✅ prod | Refresh token signing secret (≥32 bytes) |
| `EDUBEK_GUEST_SECRET` | ✅ prod | Guest JWT signing secret (≥32 bytes, separate from session) |
| `EDUBEK_ENCRYPTION_KEY` | ✅ prod | AES-256-GCM encryption key (32 bytes) |
| `OPENROUTER_API_KEY` | ✅ AI | OpenRouter API key for AI features |
| `OPENROUTER_MODEL` | optional | Model to use (default: `google/gemini-3.7-flash`) |
| `OPENROUTER_REFERER` | optional | Your site URL for OpenRouter ranking |
| `CLICK_MERCHANT_ID` | optional | Click payment merchant ID |
| `CLICK_SERVICE_ID` | optional | Click payment service ID |
| `CLICK_SECRET_KEY` | optional | Click payment secret key |
| `CLICK_USER_ID` | optional | Click payment user ID |
| `CLICK_CALLBACK_URL` | optional | Click payment callback URL |
| `EDUBEK_ALLOWED_ORIGINS` | optional | Comma-separated Socket.IO CORS origins |

### AI Provider Configuration

EduBek supports multiple AI providers. The first available one is used:

| Provider | Env Vars | Default Model |
|----------|----------|---------------|
| **OpenRouter** (primary) | `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` | `google/gemini-3.7-flash` |
| **OpenAI-compatible** (alternative) | `OPENAI_API_KEY` + `OPENAI_MODEL` + `OPENAI_BASE_URL` | `gpt-4o-mini` |
| **Anthropic** (alternative) | `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` | `claude-3.5-sonnet` |

Switch models by changing `OPENROUTER_MODEL`:
```
OPENROUTER_MODEL=google/gemini-3.7-flash
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
```

### Generate Secrets (Windows PowerShell)
```powershell
# Generate 32-byte random secrets
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

### Generate Secrets (macOS/Linux)
```bash
openssl rand -hex 32
```

## Tech Stack
- **Framework**: Next.js 16 (standalone output + custom server for Socket.IO)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL via Prisma ORM
- **AI**: OpenRouter + Google Gemini 3.7 Flash (configurable via env)
- **Realtime**: Socket.IO (auth on every namespace)
- **Payments**: Click (UZ)
- **i18n**: next-intl (en/uz/ru)
- **Cross-platform**: `cross-env` for Windows/macOS/Linux compatibility

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js only) |
| `npm run dev:realtime` | Start dev server with Socket.IO (tsx watch) |
| `npm run build` | Production build (cross-platform) |
| `npm start` | Start production server (Next.js + Socket.IO) |
| `npm test` | Run test suite (12,856 tests) |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create + apply new migration |
| `npm run db:migrate:deploy` | Apply pending migrations (production-safe) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (destructive) |

## Project Structure
```
edubek/
├── src/
│   ├── app/                    Next.js App Router (pages + API routes)
│   │   ├── [locale]/          i18n locale-prefixed pages
│   │   ├── page.tsx           Root redirect to /en
│   │   └── api/               200+ API routes
│   ├── components/
│   │   ├── edubek/            Mascots, app shell, quiz player
│   │   └── ui/                shadcn/ui components
│   ├── features/              Domain logic (auth, wallet, AI, live-session)
│   ├── hooks/                 React hooks
│   ├── infra/                 AI providers, realtime, rate-limiter
│   ├── lib/                   Shared utilities
│   └── config/                Environment configuration
├── prisma/                    Schema + migrations (PostgreSQL)
├── tests/                     67 test files (12,856 tests)
├── messages/                  i18n locale files (en/uz/ru)
├── scripts/
│   ├── copy-standalone.js     Cross-platform build helper
│   ├── setup-windows.ps1      Windows PowerShell setup
│   ├── start-windows.bat      Windows production start
│   └── seed.ts                Database seeding
├── .zscripts/                 Unix build/start scripts
├── package.json               Dependencies + scripts (cross-env)
└── .env.example               Environment template
```

## Security
- CSP, HSTS, X-Frame-Options security headers
- Separate guest JWT secret (no token confusion)
- AES-256-GCM encryption for at-rest secrets
- IDOR defense on 51 routes (`resolveTargetUserId`)
- Wallet atomic transactions (no race conditions)
- Click payment atomic claim (no double-credit)
- Socket.IO auth on every namespace
- Rate limiting (guest join, AI generation, Socket.IO events)

## Mascots
Hand-drawn SVG illustrations (notebook, owl, pencil, globe, microscope, robot)
appear ONLY in empty states, loading cards, and AI sections. Subtle CSS
animations respect `prefers-reduced-motion`.
