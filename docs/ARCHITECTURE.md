# SHOGUN — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Desktop   │  │ Web App      │  │ External Triggers         │  │
│  │ (Electron)│  │ (Next.js)    │  │ (SMS / Email / LINE)      │  │
│  │           │  │              │  │                            │  │
│  │ Screen    │  │ Chat UI      │  │ Twilio / SendGrid /       │  │
│  │ Capture   │  │ File Browser │  │ LINE Messaging API        │  │
│  │ + OCR     │  │ Terminal     │  │                            │  │
│  └─────┬─────┘  └──────┬───────┘  └────────────┬──────────────┘  │
│        │               │                        │                 │
└────────┼───────────────┼────────────────────────┼─────────────────┘
         │               │                        │
         ▼               ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Hono)                           │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ /auth      │  │ /chat      │  │ /machine   │  │ /memory  │  │
│  │ /profile   │  │ /models    │  │ /services  │  │ /search  │  │
│  │ /billing   │  │ /tools     │  │ /files     │  │ /capture │  │
│  │            │  │            │  │ /terminal  │  │          │  │
│  └────────────┘  └────────────┘  └─────┬──────┘  └──────────┘  │
│                                        │                         │
└────────────────────────────────────────┼─────────────────────────┘
         │               │               │              │
         ▼               ▼               ▼              ▼
┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐
│ Supabase   │  │ AI         │  │ Fly.io       │  │ R2       │
│ (Postgres  │  │ Providers  │  │ Machines     │  │ Storage  │
│ + pgvector)│  │            │  │              │  │          │
│            │  │ Claude API │  │ 1 user =     │  │ 100GB/   │
│ Auth       │  │ OpenAI API │  │ 1 container  │  │ user     │
│ RLS        │  │ Gemini API │  │              │  │          │
└────────────┘  └────────────┘  └──────────────┘  └──────────┘
```

## Core Architectural Decisions

### 1. One User = One Machine

Every paying user gets a dedicated Fly.io Machine (Linux container). This is the fundamental unit of the product.

**Why Fly.io Machines:**
- Start/stop in ~300ms (no cold start pain)
- Per-second billing (sleep when idle for free tier)
- Volumes for persistent storage
- Global regions (nrt for Japan users, iad for US)

**Machine Lifecycle:**
```
Sign up → Provisioning (create Fly app + machine + volume)
           ↓
         Running (user active)
           ↓
         Sleeping (free tier: after 30min idle)
           ↓
         Running (wake on request)
           ↓
         Stopped (user cancels / unpaid)
```

**Tier → Resource Mapping:**
| Tier  | CPU  | RAM    | Storage | Always On |
|-------|------|--------|---------|-----------|
| Free  | 1    | 256MB  | 100GB   | No        |
| Basic | 4    | 32GB   | 100GB+  | Yes       |
| Pro   | 16   | 128GB  | 100GB+  | Yes       |
| Ultra | 64   | 512GB  | 100GB+  | Yes       |

### 2. WebSocket Architecture

Two persistent WebSocket connections per active session:

**Terminal WebSocket** (`/ws/terminal`):
```
Browser (xterm.js) ←→ API Server ←→ Fly Machine (SSH/exec)
```
- API server proxies stdin/stdout between browser and user's machine
- Auth via JWT in initial handshake
- Heartbeat every 30s, reconnect on drop

**Chat Streaming** (`/ws/chat`):
```
Browser ←→ API Server ←→ AI Provider (SSE)
```
- API receives SSE from Claude/OpenAI, forwards via WebSocket
- Tool calls execute on user's Fly machine
- Results stream back in real-time

### 3. AI Tool System

When the AI needs to take action, it uses Tool Use (function calling):

```
User: "Create a React app and deploy it"
  ↓
Claude API (with tools defined)
  ↓
Tool call: shell_exec("npx create-react-app my-app")
  ↓
API executes on user's Fly machine
  ↓
Result streams back to Claude
  ↓
Tool call: shell_exec("cd my-app && npm run build")
  ↓
... continues until task complete
```

**Built-in Tools:**
| Tool           | Description                              |
|----------------|------------------------------------------|
| `shell_exec`   | Run commands on user's machine           |
| `file_read`    | Read file contents                       |
| `file_write`   | Write/create files                       |
| `file_list`    | List directory contents                  |
| `web_search`   | Search the web                           |
| `memory_query` | Search user's work memory                |
| `deploy`       | Deploy a service to subdomain.syogun.com |

### 4. Work Memory Pipeline

```
Desktop App (Electron)
  │
  ├─ Screen Capture (every 30s)
  │   └─ desktopCapturer → image → Tesseract.js OCR → text
  │
  ├─ Meeting Transcription
  │   └─ system audio → chunks → Whisper API → text
  │
  └─ POST /api/memory/capture
      │
      ├─ Filter excluded apps
      ├─ Deduplicate (similarity check vs last N entries)
      ├─ Store raw text in memory_entries
      ├─ Generate embedding (text-embedding-3-small)
      ├─ Store embedding in pgvector
      └─ Async: generate summary (Claude haiku)
```

**Query Flow:**
```
User: "What did I work on this week?"
  ↓
1. Generate embedding for query
2. pgvector similarity search (cosine, threshold 0.7)
3. Return top-K results
4. Claude synthesizes answer from memory entries
```

**Privacy Controls:**
- All capture is text-only (no screenshots stored)
- User sees live feed of all captured entries
- Delete any entry, exclude any app, pause capture
- Encrypted at rest (AES-256) and in transit (TLS 1.3)
- Never used for model training

### 5. Authentication Flow

```
1. User signs up (email or Google OAuth via Supabase Auth)
2. Choose handle → validate uniqueness → create profile
3. Create subscription (free tier)
4. Provision Fly.io Machine (async, ~15s)
5. During provisioning: personalization questions
6. Machine ready → redirect to dashboard
7. Optional: set up SMS/LINE notification channel
```

**Session Management:**
- Supabase Auth JWT (access token + refresh token)
- HTTP-only cookie for web app
- API validates JWT on every request
- WebSocket auth via token in connection params

### 6. Multi-Model Routing

```
User selects model in chat UI
  ↓
API checks:
  1. Is this a BYOK key? → Use user's key, no charge
  2. Does user have credits? → Use platform key, deduct credits
  3. No credits? → Reject (or downgrade to free model)
  ↓
Route to provider:
  - anthropic → Claude API (tool_use supported)
  - openai → OpenAI API (function_calling supported)
  - google → Gemini API (function_calling supported)
  ↓
Normalize response format → stream to client
```

**Tool definition translation:**
Each provider has different tool/function calling formats. The `@shogun/ai` package normalizes this — tools are defined once, translated per provider.

## Package Dependency Graph

```
@shogun/shared         ← No dependencies (types, constants, i18n)
  ↑
@shogun/db             ← shared
  ↑
@shogun/transcription  ← shared
  ↑
@shogun/ai             ← shared, db
  ↑
@shogun/memory         ← shared, db, transcription
  ↑
@shogun/infra          ← shared, db
  ↑
@shogun/ui             ← (standalone, React components)
  ↑
@shogun/api            ← ai, db, infra, memory, shared, transcription
  ↑
@shogun/web            ← db, shared, ui
  ↑
@shogun/desktop        ← shared
```

## Security Model

### Data Isolation
- **Database**: RLS on every table — users can only access their own rows
- **Machine**: Each user's container is a separate Fly.io Machine
- **Storage**: R2 bucket per user (prefixed by user_id)
- **API Keys**: AES-256 encrypted in database, decrypted only at call time

### Encryption
- **At rest**: AES-256 for sensitive fields (API keys, memory content)
- **In transit**: TLS 1.3 on all connections
- **Passwords**: Handled by Supabase Auth (bcrypt)

### API Security
- JWT validation on every request
- Rate limiting per user tier
- Input validation via Zod schemas
- CORS restricted to syogun.com origins
- No sensitive data in URLs or logs

## Deployment Architecture

```
                    ┌─────────────┐
                    │  Cloudflare  │
                    │  DNS + CDN   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌────────┐ ┌──────────────┐
     │ Vercel       │ │ Fly.io │ │ Fly.io       │
     │ (Web App)    │ │ (API)  │ │ (User        │
     │              │ │        │ │  Machines)    │
     │ Next.js SSR  │ │ Hono   │ │ N containers │
     └──────────────┘ └────────┘ └──────────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  (Postgres  │
                    │  + pgvector │
                    │  + Auth)    │
                    └─────────────┘
```

- **syogun.com** → Vercel (Next.js web app)
- **api.syogun.com** → Fly.io (Hono API)
- **{handle}.syogun.com** → Fly.io (user's hosted services, proxied)
- **Cloudflare R2** → file storage per user
