# SHOGUN — API Design

Base URL: `https://api.syogun.com`

All endpoints require `Authorization: Bearer <jwt>` unless marked `[public]`.

---

## Auth

| Method | Path                    | Description                  |
|--------|-------------------------|------------------------------|
| POST   | `/auth/signup`          | [public] Create account      |
| POST   | `/auth/login`           | [public] Email/password login|
| POST   | `/auth/oauth/google`    | [public] Google OAuth        |
| POST   | `/auth/refresh`         | Refresh JWT                  |
| POST   | `/auth/logout`          | Invalidate session           |

> Auth is primarily handled by Supabase Auth client-side.
> These endpoints are thin wrappers for server-side operations (profile creation, machine provisioning triggers).

---

## Profile

| Method | Path                        | Description                      |
|--------|-----------------------------|----------------------------------|
| GET    | `/profile`                  | Get current user profile         |
| PATCH  | `/profile`                  | Update profile                   |
| GET    | `/profile/handle/:handle`   | [public] Check handle availability|
| POST   | `/profile/handle`           | Claim handle during onboarding   |

### `PATCH /profile`
```json
{
  "display_name": "Toru",
  "locale": "ja",
  "timezone": "Asia/Tokyo",
  "communication_style": "concise, technical"
}
```

---

## Chat

| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/chat/conversations`             | List conversations             |
| POST   | `/chat/conversations`             | Create conversation            |
| GET    | `/chat/conversations/:id`         | Get conversation with messages |
| DELETE | `/chat/conversations/:id`         | Delete conversation            |
| PATCH  | `/chat/conversations/:id`         | Update (rename, pin)           |
| POST   | `/chat/conversations/:id/message` | Send message (triggers AI)     |

### `POST /chat/conversations/:id/message`
```json
{
  "content": "Create a landing page for my project",
  "model": "claude-sonnet-4-20250514"
}
```

Response: Server-Sent Events (SSE) stream
```
event: delta
data: {"type": "text", "content": "I'll create"}

event: delta
data: {"type": "text", "content": " a landing page"}

event: tool_call
data: {"type": "tool_call", "name": "file_write", "input": {"path": "/home/user/index.html", "content": "..."}}

event: tool_result
data: {"type": "tool_result", "name": "file_write", "output": "File written successfully"}

event: done
data: {"type": "done", "usage": {"input_tokens": 1250, "output_tokens": 830, "cost_cents": 2}}
```

---

## Models

| Method | Path                 | Description                       |
|--------|----------------------|-----------------------------------|
| GET    | `/models`            | List available models + status    |
| GET    | `/models/active`     | Get user's active model           |
| PUT    | `/models/active`     | Set active model                  |

### `GET /models`
```json
{
  "models": [
    {
      "id": "claude-sonnet-4-20250514",
      "provider": "anthropic",
      "name": "Claude Sonnet 4",
      "available": true,
      "requires_byok": false
    }
  ]
}
```

---

## Machine (Cloud Computer)

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/machine`                  | Get user's machine status      |
| POST   | `/machine/provision`        | Start provisioning             |
| POST   | `/machine/start`            | Wake sleeping machine          |
| POST   | `/machine/stop`             | Stop machine                   |

### WebSocket: `/ws/terminal`

Bidirectional WebSocket for terminal access.

**Connection:**
```
wss://api.syogun.com/ws/terminal?token=<jwt>
```

**Client → Server:**
```json
{"type": "input", "data": "ls -la\n"}
{"type": "resize", "cols": 120, "rows": 40}
```

**Server → Client:**
```json
{"type": "output", "data": "total 12\ndrwxr-xr-x ..."}
```

---

## Files

| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/files`                 | List directory (default: /home)|
| GET    | `/files/read`            | Read file content              |
| POST   | `/files/write`           | Write file                     |
| POST   | `/files/mkdir`           | Create directory               |
| DELETE | `/files`                 | Delete file/directory          |
| POST   | `/files/upload`          | Upload file (multipart)        |
| GET    | `/files/download`        | Download file                  |

### `GET /files?path=/home/user/projects`
```json
{
  "path": "/home/user/projects",
  "entries": [
    {"name": "my-app", "type": "directory", "modified": "2026-03-29T10:00:00Z"},
    {"name": "README.md", "type": "file", "size": 1024, "modified": "2026-03-29T09:00:00Z"}
  ]
}
```

---

## Services

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/services`                   | List user's services           |
| POST   | `/services`                   | Create/deploy service          |
| GET    | `/services/:id`               | Get service details            |
| PATCH  | `/services/:id`               | Update service config          |
| DELETE | `/services/:id`               | Stop and remove service        |
| POST   | `/services/:id/restart`       | Restart service                |

### `POST /services`
```json
{
  "name": "my-site",
  "port": 3000,
  "subdomain": "my-site",
  "custom_domain": null
}
```

---

## Automations

| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/automations`                    | List automations               |
| POST   | `/automations`                    | Create automation              |
| GET    | `/automations/:id`               | Get automation details         |
| PATCH  | `/automations/:id`               | Update automation              |
| DELETE | `/automations/:id`               | Delete automation              |
| POST   | `/automations/:id/run`           | Manually trigger               |
| GET    | `/automations/:id/logs`          | Get run logs                   |

### `POST /automations`
```json
{
  "name": "Daily backup",
  "trigger_type": "cron",
  "trigger_config": {"cron": "0 2 * * *"},
  "command": "/home/user/scripts/backup.sh"
}
```

---

## Memory

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/memory`                   | List recent memory entries     |
| POST   | `/memory/capture`           | Capture new entry (from desktop)|
| DELETE | `/memory/:id`               | Delete memory entry            |
| POST   | `/memory/search`            | Semantic search                |
| GET    | `/memory/settings`          | Get memory preferences         |
| PATCH  | `/memory/settings`          | Update memory preferences      |
| GET    | `/memory/exclusions`        | List excluded apps             |
| POST   | `/memory/exclusions`        | Add app exclusion              |
| DELETE | `/memory/exclusions/:app`   | Remove app exclusion           |

### `POST /memory/capture`
```json
{
  "source": "screen_capture",
  "content": "Working on pricing page in Figma...",
  "app_name": "Figma",
  "captured_at": "2026-03-30T10:00:00Z"
}
```

### `POST /memory/search`
```json
{
  "query": "What did I work on this week?",
  "limit": 20,
  "source": null,
  "date_from": "2026-03-24T00:00:00Z",
  "date_to": null
}
```

Response:
```json
{
  "results": [
    {
      "id": "...",
      "content": "...",
      "summary": "Worked on pricing page layout in Figma",
      "source": "screen_capture",
      "app_name": "Figma",
      "captured_at": "2026-03-29T14:30:00Z",
      "similarity": 0.89
    }
  ],
  "synthesis": "This week you primarily worked on..."
}
```

---

## Billing

| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/billing`                        | Get subscription + usage       |
| POST   | `/billing/checkout`               | Create Stripe checkout session |
| POST   | `/billing/portal`                 | Create Stripe billing portal   |
| POST   | `/billing/webhook`                | [public] Stripe webhook        |
| GET    | `/billing/usage`                  | Get credit usage history       |

### `GET /billing`
```json
{
  "tier": "shogun",
  "billing_interval": "annual",
  "demo_credits_remaining": 500,
  "demo_credits_included": 500,
  "current_period_end": "2026-04-30T00:00:00Z",
  "usage_this_period": [
    {"provider": "anthropic", "model": "claude-sonnet-4-20250514", "cost_cents": 120},
    {"provider": "openai", "model": "gpt-4o", "cost_cents": 30}
  ]
}
```

---

## API Keys (BYOK)

| Method | Path                | Description                    |
|--------|---------------------|--------------------------------|
| GET    | `/keys`             | List user's API keys (masked)  |
| POST   | `/keys`             | Add API key                    |
| DELETE | `/keys/:provider`   | Remove API key                 |
| POST   | `/keys/:provider/test` | Validate API key            |

### `POST /keys`
```json
{
  "provider": "openai",
  "key": "sk-...",
  "label": "My OpenAI Key"
}
```

---

## Notification Channels

| Method | Path                           | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/notifications/channels`      | List channels                  |
| POST   | `/notifications/channels`      | Add channel                    |
| DELETE | `/notifications/channels/:id`  | Remove channel                 |
| POST   | `/notifications/channels/:id/verify` | Send verification code   |

---

## Error Format

All errors follow:
```json
{
  "error": {
    "code": "HANDLE_TAKEN",
    "message": "This handle is already taken",
    "status": 409
  }
}
```

## Rate Limits

| Tier     | Requests/min | WebSocket connections | File upload/req |
|----------|-------------|----------------------|-----------------|
| SHOGUN   | 200         | 5                    | 500MB           |
