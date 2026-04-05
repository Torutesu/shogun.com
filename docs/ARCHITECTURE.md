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
- Per-second billing (sleep when idle)
- Volumes for persistent storage
- Global regions (nrt for Japan users, iad for US)

**Machine Lifecycle:**
```
Sign up → Provisioning (create Fly app + machine + volume)
           ↓
         Running (user active)
           ↓
         Sleeping (after 30min idle)
           ↓
         Running (wake on request)
           ↓
         Stopped (user cancels / unpaid)
```

**Tier → Resource Mapping:**
| Tier     | CPU  | RAM    | Storage | Always On |
|----------|------|--------|---------|-----------|
| SHOGUN   | 8    | 64GB   | 100GB   | Yes       |

### 2. WebSocket Architecture

Two persistent WebSocket connections per active session:

**Terminal WebSocket** (`/ws/terminal`):
```
Browser (xterm.js) ←→ API Server ←→ Container Agent (Fly private network)
```
- API server proxies stdin/stdout via container agent (no SSH needed)
- Auth via one-time WebSocket ticket (30s expiry, single-use JWT)
- Heartbeat every 30s, reconnect on drop
- PTY session kept alive 5min after disconnect (resume support)

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
3. Create subscription (shogun tier, 14-day trial, choose annual or monthly billing)
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
  2. Does user have demo credits remaining? → Use platform key, deduct credits
  3. No credits and no BYOK? → Prompt to add API key
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

## Container Agent Architecture

Each user container runs a lightweight **agent sidecar** (Go binary, ~5MB) on port 9000 inside Fly's private network. The API communicates with containers exclusively through this agent — no SSH, no public ports.

```
Browser → Hono API (public) → Fly internal network → Container Agent (:9000)
```

**Agent responsibilities:**
- File system operations (list, read, write, delete)
- PTY session management (spawn shell, resize, I/O relay)
- Script execution (for automations and AI tool use)
- Health checks and idle reporting
- Activity tracking for auto-stop

**Security:** Agent validates a per-machine JWT on every request. The JWT contains a `machine_id` claim signed with `HMAC(master_secret, machine_id)`. Even if Machine A discovers Machine B's internal IP, it cannot forge a valid token.

**Auto-stop flow:**
```
Agent tracks last activity (keystroke, file op, AI tool, automation)
  → No activity for auto_stop_after interval
  → Agent reports idle to API
  → API stops machine via Fly API
  → On next user action: API wakes machine (~300ms), waits for health check
  → Frontend shows boot animation during wake
```

## WebSocket Ticket Authentication

WebSocket connections use short-lived tickets instead of long-lived tokens:

```
1. Client: POST /terminal/ticket → receives 30s single-use JWT
2. Client: WS /ws/terminal?ticket=<jwt>
3. Server: validates JWT, marks jti as used (Redis SETNX), upgrades to WS
4. After upgrade: connection authenticated for its lifetime
```

This prevents ticket replay and avoids passing long-lived tokens in URLs.

## Chat Streaming (SSE, not WebSocket)

AI chat uses **Server-Sent Events** instead of WebSocket because:
- Unidirectional (server → client) matches the use case
- Automatic reconnection via EventSource API
- Works through CDNs and load balancers
- Each message send is a discrete HTTP request

```
POST /chat/conversations/:id/message
Accept: text/event-stream

→ event: delta        {"content": "Here's "}
→ event: delta        {"content": "the answer..."}
→ event: tool_call    {"name": "shell_exec", "input": {...}}
→ event: tool_result  {"output": "total 42\n..."}
→ event: delta        {"content": "I can see your files..."}
→ event: done         {"inputTokens": 1523, "outputTokens": 847, "costCents": 42}
```

**Cancellation:** Client drops SSE connection → API aborts AI request via AbortController → partial response saved to DB.

## AI Memory Integration (Automatic Context)

When a user sends a chat message, memory is automatically injected:

```
1. Embed user's message
2. Retrieve top-5 relevant memory entries (similarity > 0.7)
3. Inject into system prompt:

<work_context>
- [2h ago, VS Code] Editing pricing page component
- [Yesterday, Chrome] Reading Fly.io Machines API docs
</work_context>
```

The user never needs to explicitly "search memory" — the AI proactively has context.

## Credit Ledger Pattern

Credits use an append-only ledger for auditability:

```
credit_ledger (append-only): records every +/- transaction
credit_balances (materialized): running total for fast reads

Flow:
1. Before AI call: check credit_balances >= estimated_cost
2. After response: calculate actual cost from tokens
3. Atomic transaction: INSERT into ledger + UPDATE balance
4. If insufficient: return 402
```

## Async Job Queue (BullMQ)

Background tasks via Redis-backed queues:

| Queue                  | Priority | Description                     |
|------------------------|----------|---------------------------------|
| `memory:summarize`     | Low      | AI summary generation           |
| `memory:embed`         | Normal   | Batch embedding generation      |
| `machine:lifecycle`    | High     | Provision, start, stop, upgrade |
| `automation:schedule`  | Normal   | Cron evaluation (every minute)  |
| `backup:sync`          | Low      | Nightly R2 backup per user      |
