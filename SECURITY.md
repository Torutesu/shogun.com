# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do NOT open public issues for security vulnerabilities.**

Email **security@syogun.com** with the following details:

- Description of the vulnerability
- Steps to reproduce
- Potential impact and severity assessment
- Any suggested fix (optional)

### What to Expect

- **Acknowledgment** within 48 hours.
- **Initial assessment** within 5 business days.
- **Resolution timeline** communicated after assessment.
- You will be kept informed throughout the process.

## Security Measures

SHOGUN implements the following security controls:

### Data Isolation
- **Row-Level Security (RLS)** enforced on all database tables. Every query is scoped to `auth.uid() = user_id`.
- **Container isolation** — each user runs on a dedicated Fly.io Machine. No shared compute between users.

### Encryption
- **AES-256 encryption** for all user-provided API keys stored in the database.
- **TLS** on all connections (API, WebSocket, database).

### Authentication & Authorization
- **JWT authentication** (Supabase Auth) required on all API endpoints.
- **WebSocket ticket auth** with client fingerprinting to prevent ticket hijacking.
- **OAuth 2.0** for Google sign-in, following PKCE flow.

### Input Validation
- **Zod schemas** validate all API request bodies, query parameters, and path parameters.
- Strict TypeScript throughout the codebase.

### Rate Limiting
- Per-tier rate limits on all API endpoints.
- Elevated limits for higher subscription tiers (Basic/Pro/Ultra).

### Privacy
- **No screenshots stored.** Desktop capture is processed via OCR and only the extracted text is saved.
- Memory entries are text-only and encrypted at rest.

### Infrastructure
- Fly.io Machines with network isolation.
- Supabase managed Postgres with automated backups.
- Cloudflare R2 for object storage with access policies.

## Responsible Disclosure Policy

We ask that you:

1. Give us reasonable time to investigate and address the issue before public disclosure.
2. Make a good-faith effort to avoid privacy violations, data destruction, and service disruption.
3. Do not access or modify data belonging to other users.
4. Do not perform denial-of-service attacks.

We will not pursue legal action against researchers who follow this policy.

## Hall of Fame

We recognize security researchers who help keep SHOGUN safe.

*No entries yet. Be the first.*
