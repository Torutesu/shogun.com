<div align="center">

# 将軍 SHOGUN

### The only AI that knows your work.

**Personal AI Cloud Computer + Work Memory**

[Website](https://syogun.com) · [Documentation](docs/ARCHITECTURE.md) · [API Reference](docs/API.md)

---

<p>
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Hono-Node.js-orange" alt="Hono" />
  <img src="https://img.shields.io/badge/Go-1.22-00ADD8?logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/Tests-201_passing-brightgreen" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

</div>

---

## What is SHOGUN?

Every AI session starts from zero. Every tool forgets you.

**SHOGUN fixes this.**

SHOGUN is a personal AI cloud computer that **remembers everything you work on**. It captures your screen text, transcribes your meetings, stores your decisions — and gives you a full Linux server in the cloud to execute on.

One AI. Knows your work. Does your work.

### Core Differentiator

| | ChatGPT | Cursor | Zo Computer | **SHOGUN** |
|---|---------|--------|-------------|------------|
| AI Chat | ✅ | ✅ | ✅ | ✅ |
| Cloud Computer | ❌ | ❌ | ✅ | ✅ |
| **Work Memory** | ❌ | ❌ | ❌ | **✅** |

> Zo Computer gives you a cloud server. SHOGUN gives you a cloud server **that already knows your work**.

---

## Features

### 🧠 Work Memory (KIOKU)
- Screen text capture via OCR (text only — never screenshots)
- Meeting transcription (Whisper API)
- Semantic search across your entire work history (pgvector)
- Auto-injected context in every AI conversation
- "What did I work on this week?" — instant answers

### 💻 Cloud Computer
- 1 user = 1 dedicated Linux machine (Fly.io)
- In-browser terminal (xterm.js + WebSocket)
- File browser with code editor
- Deploy services to `yourname.syogun.com`
- Cron jobs, email/SMS/LINE triggers

### 🤖 Multi-Model AI
- Claude, GPT-4o, Gemini — switch freely
- Tool Use: shell commands, file ops, web search, memory query, deploy
- BYOK (Bring Your Own Key) — use your own API keys
- Streaming responses with real-time tool execution

### 👥 Team & Enterprise
- Team workspaces with role-based access
- Shared conversations and memory
- Audit logs for compliance
- SSO (SAML) for enterprise

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│               Client Layer                       │
│  Web App (Next.js)  ·  Desktop (Electron)  ·  SMS/LINE  │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   ┌──────────────┐        ┌──────────────┐
   │  Hono API    │        │  Fly.io      │
   │  (Node.js)   │◄──────►│  Machines    │
   │              │        │  (1 per user)│
   └──────┬───────┘        └──────────────┘
          │
   ┌──────┴───────┐
   │  Supabase    │
   │  PostgreSQL  │
   │  + pgvector  │
   └──────────────┘
```

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 |
| API | Hono (Node.js), WebSocket, SSE |
| Container Agent | Go (per-user sidecar on Fly.io) |
| Desktop | Electron, Tesseract.js OCR |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | Claude API, OpenAI, Gemini — all with Tool Use |
| Storage | Cloudflare R2 (100GB/user) |
| Billing | Stripe (SHOGUN $49/mo annual / $62/mo monthly) |
| Jobs | BullMQ (Redis) |

---

## Pricing

| | SHOGUN |
|---|--------|
| Annual | $49/mo ($588/yr) |
| Monthly | $62/mo |
| Cloud Computer | 8-core CPU, 64GB RAM |
| Storage | 100GB |
| Always On | Yes |
| Custom Domain | Yes |
| Services | Up to 10 |
| AI Models | Bring your own keys (Claude, GPT, Gemini) |
| Demo Credits | $5 included |

> Team plan coming soon. 14-day free trial on all signups.

---

## Quick Start

```bash
# Clone
git clone https://github.com/torutesu/shogun.com.git
cd shogun.com

# Install
pnpm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run
pnpm dev        # All services
pnpm test       # 201 tests
pnpm build      # Production build
```

See [Setup Guide](docs/SETUP.md) for detailed deployment instructions.

---

## Project Stats

| Metric | Value |
|--------|-------|
| Source Files | 280+ |
| Lines of Code | 24,000+ |
| Tests | 201 (12 suites) |
| Features | 123/123 implemented |
| Languages | EN / JA / ES |
| Security Audit | 20 issues found & fixed |

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, data flow, security model
- [API Reference](docs/API.md) — All endpoints, request/response formats
- [Feature List](docs/FEATURES.md) — 123 features with implementation status
- [Setup Guide](docs/SETUP.md) — Deployment to Supabase, Fly.io, Vercel
- [Contributing](CONTRIBUTING.md) — Development workflow
- [Security](SECURITY.md) — Vulnerability reporting

---

## Built by

**[Select KK](https://select.co.jp)** — Tokyo, Japan

AI-first company building the future of work.

---

<div align="center">

**Stop explaining yourself to AI. SHOGUN already knows.**

[Get Early Access →](https://syogun.com)

</div>

---

<br/>

# 将軍 SHOGUN（日本語）

### あなたの仕事を知っている、唯一のAI。

**パーソナルAIクラウドコンピュータ + ワークメモリ**

---

## SHOGUNとは？

AIとの会話は、毎回ゼロから始まる。どのツールもあなたを忘れる。

**SHOGUNがそれを終わらせる。**

SHOGUNは、**あなたの仕事を全て記憶する**パーソナルAIクラウドコンピュータです。画面テキストをキャプチャし、会議を文字起こしし、意思決定を保存し、クラウド上のLinuxサーバーで即座に実行します。

### 競合との比較

| | ChatGPT | Cursor | Zo Computer | **SHOGUN** |
|---|---------|--------|-------------|------------|
| AIチャット | ✅ | ✅ | ✅ | ✅ |
| クラウドコンピュータ | ❌ | ❌ | ✅ | ✅ |
| **ワークメモリ** | ❌ | ❌ | ❌ | **✅** |

> Zoはクラウドサーバーを提供する。SHOGUNは**あなたの仕事を知っている**クラウドサーバーを提供する。

---

## 主要機能

### 🧠 ワークメモリ（KIOKU）
- 画面テキストをOCRでキャプチャ（テキストのみ — スクリーンショットは一切保存しない）
- 会議の自動文字起こし（Whisper API）
- ワーク履歴全体のセマンティック検索（pgvector）
- AIチャットにコンテキストを自動注入
- 「今週何に取り組んでいた？」— 即座に回答

### 💻 クラウドコンピュータ
- 1ユーザー = 1台の専用Linuxマシン（Fly.io）
- ブラウザ内ターミナル（xterm.js + WebSocket）
- ファイルブラウザ + コードエディタ
- `yourname.syogun.com` にサービスをデプロイ
- Cronジョブ、メール/SMS/LINEトリガー

### 🤖 マルチモデルAI
- Claude、GPT-4o、Gemini — 自由に切り替え
- Tool Use: シェルコマンド、ファイル操作、Web検索、メモリ検索、デプロイ
- BYOK（自分のAPIキーを使用）
- リアルタイムツール実行付きストリーミング応答

### 👥 チーム / エンタープライズ
- ロールベースのチームワークスペース
- 会話とメモリの共有
- コンプライアンス用監査ログ
- SSO（SAML）対応

---

## 料金

| | SHOGUN |
|---|--------|
| 年額プラン | $49/月 ($588/年) |
| 月額プラン | $62/月 |
| クラウドコンピュータ | 8コアCPU、64GB RAM |
| ストレージ | 100GB |
| 常時稼働 | Yes |
| カスタムドメイン | Yes |
| サービス | 最大10 |
| AIモデル | 自分のAPIキーを使用（Claude、GPT、Gemini） |
| デモクレジット | $5分を付与 |

> チームプランは近日公開予定。全登録に14日間無料トライアル。

---

## 市場機会

- **TAM**: AIプロダクティビティツール市場 — $50B+ (2026年予測)
- **ターゲット**: AIネイティブ個人（ソロファウンダー、フリーランサー、PM、開発者）
- **差別化**: 唯一の「AI + クラウドコンピュータ + ワークメモリ」統合プロダクト
- **地域**: グローバルファースト、日本市場を副次的強みとして活用（日本に直接競合なし）

## チーム

**Select KK**（東京）
- AIファースト組織、Claude Codeによる高速開発
- 関連プロダクト: SLCT（グローバルAIエンジニアリング）、REFOUND（AIコンサルティング）

---

<div align="center">

**AIに自分を説明するのは、もうやめよう。SHOGUNはすでに知っている。**

[早期アクセスを申し込む →](https://syogun.com)

</div>
