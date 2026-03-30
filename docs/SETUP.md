# SHOGUN — 環境セットアップガイド

## 前提条件

- Node.js >= 20
- pnpm 9.x
- Go 1.22+ (Container Agent用)
- Docker (Container Agent ビルド用)

---

## 1. Supabase セットアップ

### 1.1 プロジェクト作成
```bash
# Supabase CLIインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクト作成（ダッシュボードから推奨）
# https://supabase.com/dashboard → New Project
# Region: Northeast Asia (Tokyo) を選択
```

### 1.2 データベーススキーマ適用
```bash
# ローカルSupabase起動（開発用）
supabase init
supabase start

# スキーマ適用
supabase db push < supabase/schema.sql

# 本番環境へのマイグレーション
supabase db push --linked
```

### 1.3 Auth設定
Supabase Dashboard → Authentication → Providers:

1. **Email**: 有効化（Confirm email: ON）
2. **Google OAuth**:
   - Google Cloud Console → OAuth 2.0 Client ID作成
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Client ID + Secret を Supabase に設定

### 1.4 pgvector 有効化
```sql
-- Supabase Dashboard → SQL Editor で実行
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.5 環境変数取得
Supabase Dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key（サーバー専用、公開禁止）

---

## 2. Stripe セットアップ

### 2.1 アカウント + Products作成
```
Stripe Dashboard → Products:

1. SHOGUN Basic — $18/mo (¥2,700/mo)
2. SHOGUN Pro — $64/mo (¥9,500/mo)
3. SHOGUN Ultra — $200/mo (¥30,000/mo)

各プロダクトに月額 recurring price を作成
```

### 2.2 Webhook設定
```
Stripe Dashboard → Developers → Webhooks → Add endpoint

Endpoint URL: https://api.syogun.com/billing/webhook

Events to listen:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### 2.3 環境変数
```
STRIPE_SECRET_KEY=sk_live_...     (or sk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ULTRA=price_...
```

### 2.4 Customer Portal設定
```
Stripe Dashboard → Settings → Billing → Customer Portal
- Subscription cancellation: 許可
- Subscription switching: 許可（proration: immediate）
- Invoice history: 表示
```

---

## 3. Fly.io セットアップ

### 3.1 CLI + Organization
```bash
# Fly CLIインストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# Organization作成
fly orgs create shogun
```

### 3.2 API サーバーデプロイ
```bash
# API用Flyアプリ作成
fly apps create shogun-api --org shogun

# fly.toml作成 (apps/api/fly.toml)
cat > apps/api/fly.toml << 'EOF'
app = "shogun-api"
primary_region = "nrt"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  size = "shared-cpu-2x"
  memory = "512mb"
EOF

# シークレット設定
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL="..." \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  ANTHROPIC_API_KEY="..." \
  OPENAI_API_KEY="..." \
  STRIPE_SECRET_KEY="..." \
  STRIPE_WEBHOOK_SECRET="..." \
  ENCRYPTION_KEY="..." \
  FLY_API_TOKEN="..." \
  --app shogun-api

# デプロイ
fly deploy --app shogun-api
```

### 3.3 ユーザーマシン用ベースイメージ
```bash
# Container Agent + ベースツールを含むDockerイメージをビルド
cd agent
docker build -t registry.fly.io/shogun-user-machine:latest .
fly auth docker
docker push registry.fly.io/shogun-user-machine:latest
```

### 3.4 ボリュームテンプレート
ユーザーマシン作成時に自動でボリュームが割り当てられる。
API の `@shogun/infra` パッケージが Fly Machines API を使って自動プロビジョニングを行う。

### 3.5 環境変数
```
FLY_API_TOKEN=...          # fly tokens create
FLY_ORG=shogun
```

---

## 4. Cloudflare R2 セットアップ

### 4.1 バケット作成
```
Cloudflare Dashboard → R2 → Create Bucket
Name: shogun-storage
Location: APAC (auto)
```

### 4.2 APIトークン
```
Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token
Permissions: Object Read & Write
```

### 4.3 環境変数
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=shogun-storage
```

---

## 5. DNS (Cloudflare)

```
syogun.com      A/CNAME → Vercel (Web App)
api.syogun.com  CNAME   → shogun-api.fly.dev
*.syogun.com    CNAME   → shogun-api.fly.dev (wildcard for user subdomains)
```

---

## 6. Vercel デプロイ (Web App)

```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトリンク
cd apps/web
vercel link

# 環境変数設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_API_URL    # https://api.syogun.com
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# デプロイ
vercel --prod
```

---

## 7. 通知チャネル

### Twilio (SMS)
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### LINE Messaging API
```
LINE Developers Console → Channel作成
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
Webhook URL: https://api.syogun.com/triggers/line
```

---

## 8. 暗号化キー生成

```bash
# 32バイトのランダム暗号化キー
openssl rand -hex 32
# → ENCRYPTION_KEY に設定

# Agentのマスターシークレット
openssl rand -hex 32
# → AGENT_MASTER_SECRET に設定
```

---

## 9. ローカル開発

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env.local
# → .env.local を編集

# 全サービス起動
pnpm dev

# 個別起動
pnpm --filter @shogun/web dev      # Next.js on :3000
pnpm --filter @shogun/api dev      # Hono on :3001

# Container Agent (Go)
cd agent && go run main.go

# 型チェック
pnpm type-check

# ビルド
pnpm build
```

---

## 10. チェックリスト

- [ ] Supabase プロジェクト作成 + スキーマ適用
- [ ] Google OAuth 設定
- [ ] pgvector 有効化
- [ ] Stripe Products + Prices 作成
- [ ] Stripe Webhook 設定
- [ ] Fly.io Organization + API アプリ作成
- [ ] Container Agent Docker イメージビルド + push
- [ ] Cloudflare R2 バケット作成
- [ ] DNS 設定 (syogun.com, api.syogun.com, *.syogun.com)
- [ ] Vercel プロジェクト設定
- [ ] 全環境変数を .env.local / Fly secrets / Vercel env に設定
- [ ] `pnpm type-check` パス確認
- [ ] `pnpm build` パス確認
- [ ] E2E テスト（signup → onboarding → chat → memory）
