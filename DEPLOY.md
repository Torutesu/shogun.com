# SHOGUN 本番デプロイガイド

このガイドでは、SHOGUNを本番環境にデプロイするために必要な全手順を説明します。
各サービスでアカウントを作成し、キーを取得して `.env.local` に貼り付けていきます。

---

## 全体の流れ

```
Step 1: Supabase（データベース）
Step 2: Stripe（決済）
Step 3: Cloudflare R2（ファイルストレージ）
Step 4: Fly.io（APIサーバー）
Step 5: Vercel（Webサイト）
Step 6: DNS設定
Step 7: Rewardful（紹介プログラム）
Step 8: 最終確認
```

所要時間：1〜2時間（全部初めてでも）

---

## Step 1: Supabase（データベース）

Supabaseはデータベースとユーザー認証を提供します。

### 1.1 アカウント作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

### 1.2 プロジェクト作成
1. ダッシュボードで「New Project」をクリック
2. 以下を入力：
   - **Name**: `shogun`
   - **Database Password**: 強いパスワードを生成（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
3. 「Create new project」をクリック（2〜3分待つ）

### 1.3 キーを取得して `.env.local` に貼る
1. 左メニュー → **Settings** → **API**
2. 以下をコピーして `.env.local` に貼り付け：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL=`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY=`
3. 左メニュー → **Settings** → **API** → 下にスクロール
   - `JWT Secret` → `SUPABASE_JWT_SECRET=`

### 1.4 データベースのテーブルを作成
1. 左メニュー → **SQL Editor**
2. 「New query」をクリック
3. `supabase/schema.sql` の中身を全部コピーして貼り付け
4. 「Run」をクリック
5. エラーが出なければ完了

### 1.5 Google ログインを設定（任意）
1. https://console.cloud.google.com にアクセス
2. プロジェクトを作成 → 「APIs & Services」→「Credentials」
3. 「Create Credentials」→「OAuth 2.0 Client IDs」
4. Application type: Web application
5. Authorized redirect URIs に追加：
   `https://あなたのプロジェクト.supabase.co/auth/v1/callback`
6. Client ID と Client Secret をコピー
7. Supabase Dashboard → **Authentication** → **Providers** → **Google**
8. Client ID と Secret を貼り付けて Save

---

## Step 2: Stripe（決済）

Stripeはクレジットカード決済を処理します。

### 2.1 アカウント作成
1. https://stripe.com にアクセス
2. アカウント作成（本番利用には本人確認が必要）

### 2.2 商品を作成
1. Stripe Dashboard → **Products** → 「Add product」
2. 以下を入力：
   - **Name**: `SHOGUN`
   - **Description**: `AI Cloud Computer + Work Memory`
3. 価格を2つ追加：

**価格1（年間一括）：**
- Price: `$588.00`
- Billing period: `Every 12 months`
- **Free trial**: `14 days` を設定
- 作成後、Price ID（`price_...`で始まる）をコピー
- → `.env.local` の `STRIPE_PRICE_ANNUAL=` に貼る

**価格2（月払い）：**
- Price: `$62.00`
- Billing period: `Every month`
- **Free trial**: `14 days` を設定
- 作成後、Price ID をコピー
- → `.env.local` の `STRIPE_PRICE_MONTHLY=` に貼る

### 2.3 APIキーを取得
1. Stripe Dashboard → **Developers** → **API keys**
2. コピーして `.env.local` に貼る：
   - `Secret key` → `STRIPE_SECRET_KEY=`
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=`

### 2.4 Webhook を設定
1. Stripe Dashboard → **Developers** → **Webhooks**
2. 「Add endpoint」をクリック
3. Endpoint URL: `https://api.syogun.com/billing/webhook`
4. 以下のイベントを選択：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 「Add endpoint」をクリック
6. **Signing secret**（`whsec_...`で始まる）をコピー
   - → `.env.local` の `STRIPE_WEBHOOK_SECRET=` に貼る

### 2.5 Customer Portal を設定
1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. 以下を有効化：
   - Customers can cancel subscriptions: **ON**
   - Customers can switch plans: **ON**
   - Invoice history: **ON**
3. Save

---

## Step 3: Cloudflare R2（ファイルストレージ）

ユーザーのファイルを保存するストレージです。

### 3.1 アカウント作成
1. https://dash.cloudflare.com にアクセス
2. アカウント作成

### 3.2 バケット作成
1. 左メニュー → **R2 Object Storage**
2. 「Create bucket」をクリック
3. Name: `shogun-storage`
4. Location: Automatic を選択
5. 「Create bucket」

### 3.3 APIトークン取得
1. R2 ページ → **Manage R2 API Tokens**
2. 「Create API Token」
3. Permissions: **Object Read & Write**
4. コピーして `.env.local` に貼る：
   - Account ID → `R2_ACCOUNT_ID=`
   - Access Key ID → `R2_ACCESS_KEY_ID=`
   - Secret Access Key → `R2_SECRET_ACCESS_KEY=`

---

## Step 4: Fly.io（APIサーバー）

APIサーバーをホストします。

### 4.1 CLIインストール + ログイン
ターミナルで以下を実行（`!` をつけてこのチャットから実行できます）：
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 4.2 アプリ作成
```bash
fly apps create shogun-api --org personal
```

### 4.3 APIトークン取得
```bash
fly tokens create -x 999999h
```
出力されたトークンを `.env.local` の `FLY_API_TOKEN=` に貼る。

### 4.4 シークレット設定
`.env.local` の値が全部埋まったら、以下を実行：
```bash
cd apps/api
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL="（あなたの値）" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="（あなたの値）" \
  SUPABASE_SERVICE_ROLE_KEY="（あなたの値）" \
  SUPABASE_JWT_SECRET="（あなたの値）" \
  STRIPE_SECRET_KEY="（あなたの値）" \
  STRIPE_WEBHOOK_SECRET="（あなたの値）" \
  STRIPE_PRICE_ANNUAL="（あなたの値）" \
  STRIPE_PRICE_MONTHLY="（あなたの値）" \
  ENCRYPTION_KEY="d988a773d43febbce758085e3f468b8d43d7642602df55f50d7c16b26b096245" \
  AGENT_MASTER_SECRET="7fe63180f394203dfddd95f6aa7939b0c758c22b36c5ec4ea6e78ad1364e6e07" \
  FLY_API_TOKEN="（あなたの値）" \
  --app shogun-api
```

### 4.5 デプロイ
```bash
cd apps/api
fly deploy
```

---

## Step 5: Vercel（Webサイト）

LP + ダッシュボードをホストします。

### 5.1 Vercel に接続
1. https://vercel.com にアクセス
2. GitHubアカウントでログイン
3. 「Import Project」→ このリポジトリを選択
4. 設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm --filter @shogun/web build`
   - **Install Command**: `cd ../.. && pnpm install`

### 5.2 環境変数を設定
Vercel Dashboard → Settings → Environment Variables に以下を追加：

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabaseのプロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanon key |
| `NEXT_PUBLIC_API_URL` | `https://api.syogun.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripeのpk_live_... |
| `NEXT_PUBLIC_REWARDFUL_API_KEY` | Rewardfulのキー（後で設定） |

### 5.3 デプロイ
Vercelは自動でデプロイします（GitHubにpushするたびに）。

---

## Step 6: DNS設定

ドメイン `syogun.com` のDNSレコードを設定します。
（ドメインのDNS管理画面で設定。Cloudflare推奨）

| レコード | 名前 | 値 | 備考 |
|---------|------|-----|------|
| CNAME | `@` または `syogun.com` | `cname.vercel-dns.com` | Vercel用 |
| CNAME | `api` | `shogun-api.fly.dev` | API用 |
| CNAME | `*` | `shogun-api.fly.dev` | ユーザーサブドメイン用 |

Vercel側でもカスタムドメインを追加：
Vercel Dashboard → Settings → Domains → `syogun.com` を追加

---

## Step 7: Rewardful（紹介プログラム）

### 7.1 アカウント作成
1. https://www.rewardful.com にアクセス
2. アカウント作成
3. Stripeアカウントと連携

### 7.2 キャンペーン設定
1. Dashboard → Campaigns → Create
2. **Commission**: 30% recurring
3. **Cookie duration**: 90 days

### 7.3 APIキー取得
1. Dashboard → Settings → API
2. API Key をコピー
3. `.env.local` の `NEXT_PUBLIC_REWARDFUL_API_KEY=` に貼る
4. Vercelの環境変数にも同じキーを追加

---

## Step 8: 最終確認チェックリスト

`.env.local` を開いて、以下が全部埋まっていることを確認：

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- [ ] `SUPABASE_JWT_SECRET` — Supabase JWT secret
- [ ] `ANTHROPIC_API_KEY` — デモクレジット用（1つでOK）
- [ ] `STRIPE_SECRET_KEY` — Stripe秘密鍵
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe Webhook署名
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe公開鍵
- [ ] `STRIPE_PRICE_ANNUAL` — 年間プランの Price ID
- [ ] `STRIPE_PRICE_MONTHLY` — 月払いプランの Price ID
- [ ] `FLY_API_TOKEN` — Fly.io トークン
- [ ] `R2_ACCOUNT_ID` — Cloudflare R2
- [ ] `R2_ACCESS_KEY_ID` — Cloudflare R2
- [ ] `R2_SECRET_ACCESS_KEY` — Cloudflare R2
- [ ] `ENCRYPTION_KEY` — 生成済み（変更不要）
- [ ] `AGENT_MASTER_SECRET` — 生成済み（変更不要）

### ローカルテスト
```bash
pnpm dev
```
ブラウザで http://localhost:3000 を開いてLPが表示されれば成功。

### 本番デプロイ
```bash
# API（Fly.io）
cd apps/api && fly deploy

# Web（Vercel）
git push  # Vercelが自動デプロイ
```

---

## トラブルシューティング

**「pnpm dev でエラーが出る」**
→ `.env.local` のキーが空のままだと起動しません。最低限 Supabase の3つのキーを入れてください。

**「Stripe Webhookが動かない」**
→ ローカルテストには `stripe listen --forward-to localhost:3001/billing/webhook` を使います。
→ Stripe CLIのインストール: `brew install stripe/stripe-cli/stripe`

**「デプロイ後にAPIが502になる」**
→ `fly logs --app shogun-api` でエラーを確認。多くの場合、環境変数の設定漏れです。
