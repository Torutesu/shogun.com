# SHOGUN — Claude Code Context

## What we're building
SHOGUN (syogun.com) — Personal AI Cloud Computer + Work Memory.
Built by Select KK, Tokyo. Target: AI-native individuals, global.

## Core concept
1 user = 1 Linux cloud server + persistent work memory.
The only AI that knows your work history.

## Monorepo structure
```
apps/web          Next.js 15 (App Router) — dashboard, chat, files, terminal
apps/api          Hono (Node.js) — REST + WebSocket API
apps/desktop      Electron — screen capture + OCR + meeting transcription
packages/shared   Types, constants, i18n (EN/JA/ES)
packages/db       Supabase client + database types
packages/ai       Multi-model AI client (Claude/GPT/Gemini) + tool definitions
packages/memory   Work memory service (capture, search, vector store)
packages/transcription  Whisper API wrapper
packages/infra    Fly.io machine management (provision, start, stop, exec)
packages/ui       Shared React component library
supabase/         Schema + migrations
docs/             Architecture + API design
```

## Tech stack
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4
- Backend: Hono (Node.js)
- Infra: Fly.io Machines (per-user containers)
- DB: Supabase (Postgres + pgvector for semantic search)
- AI: Claude API (primary), OpenAI, Gemini — all with Tool Use
- Auth: Supabase Auth (email + Google OAuth)
- Storage: Cloudflare R2 (100GB/user)
- Billing: Stripe (SHOGUN $49/mo annual / $62/mo monthly, BYOK for AI, 14-day trial)
- Terminal: xterm.js + WebSocket
- Screen capture: Electron desktopCapturer → Tesseract.js OCR
- Transcription: OpenAI Whisper API

## Design system
- Font display: Bebas Neue (hero, section headers)
- Font body: DM Sans 300/400/500
- Font mono: DM Mono (labels, code)
- Accent: #C8A96E (gold on dark), #A07840 (gold on light)
- Dark bg: #080808, Card: #111111, Text: #F0EDE6
- Light bg: #FAFAF8, Card: #FFFFFF, Text: #1A1A18
- Border dark: #1E1E1E, Border light: #E8E6E0
- Button radius: 0px (sharp), Card radius: 10px
- Theme: Hybrid dark hero + light body, user-toggleable

## i18n
EN (default) / JA / ES
Detection: URL param → localStorage → navigator.language → EN
All translations in packages/shared/src/i18n/locales/

## Database
Schema in supabase/schema.sql — 13 tables with RLS on all.
Key tables: profiles, subscriptions, machines, conversations, messages, memory_entries
pgvector for semantic memory search via search_memory() function.

## API
REST + WebSocket, documented in docs/API.md
Base: api.syogun.com
Auth: JWT (Supabase Auth)
Key WebSocket endpoints: /ws/terminal, /ws/chat

## Key patterns
- All user data isolated by RLS (auth.uid() = user_id)
- AI API keys encrypted with AES-256 in DB
- Tool calls execute on user's Fly machine, not on API server
- Memory embeddings via text-embedding-3-small (1536 dims)
- Streaming via SSE for chat, WebSocket for terminal

## Commands
```
pnpm dev          # Start all services
pnpm build        # Build all
pnpm lint         # Lint all
pnpm type-check   # TypeScript check all
```

## Brand voice
Powerful × Stealth × Minimal. Short sentences. No fluff.
Japanese precision meets global ambition.
