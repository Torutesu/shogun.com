# SHOGUN — Product Hunt Launch Copy

---

## English

### Tagline (60 chars max)

> The only AI that knows your work

### Description (260 chars max)

> SHOGUN gives every user a personal AI cloud computer with persistent work memory. Your desktop captures context, AI remembers everything, and your own Linux machine executes. Never start from zero again. Supports Claude, GPT, and Gemini.

### First Comment (Maker)

Hey Product Hunt! I'm the founder of Select KK in Tokyo, and today we're launching SHOGUN.

**The problem we kept hitting:**

Every AI conversation starts from zero. You open ChatGPT, Claude, or Gemini — and it has no idea what you were working on yesterday. No context about your codebase, your project structure, your decisions. You copy-paste the same background into every session. You re-explain your stack, your goals, your constraints. It's like hiring a brilliant consultant who gets amnesia every morning.

We've all built workarounds. Custom GPTs, system prompts, RAG pipelines. But they're brittle. They don't capture what actually happened — the commands you ran, the errors you hit, the solutions you found.

**What SHOGUN does:**

SHOGUN = AI Cloud Computer + Work Memory.

Every user gets their own Linux cloud machine (powered by Fly.io). Not a sandbox. Not a container that disappears. A real persistent server with your files, your tools, your environment.

On top of that sits Work Memory. Our desktop app silently captures your work context — screen content via OCR, meeting transcriptions, terminal activity. Everything gets converted to text (no screenshots stored), embedded with vectors, and made searchable.

When you talk to AI through SHOGUN, it already knows what you've been doing. It can search your work history, find relevant context, and execute directly on your cloud machine. The AI doesn't just answer — it acts, with full awareness of your past work.

**How it works:**

1. Install the desktop app. It captures work context in the background (text only, privacy-first).
2. Open SHOGUN. Chat with AI using Claude, GPT, or Gemini — your choice.
3. AI searches your work memory for relevant context automatically.
4. Commands execute on your personal cloud machine. Files persist. State persists.

**What makes this different:**

Other AI tools give you a chat window. Some give you a code sandbox. SHOGUN gives you a full cloud computer that remembers your work. The memory layer is the differentiator — semantic search over your entire work history, powered by pgvector.

**Tech under the hood:**

- Multi-model: Claude (primary), GPT-4, Gemini — all with tool use
- Infrastructure: Fly.io Machines — one dedicated container per user
- Memory: pgvector semantic search, text-embedding-3-small (1536 dims)
- Storage: 100GB per user on Cloudflare R2
- Security: RLS on all tables, AES-256 encrypted API keys, container isolation
- Desktop: Electron app with OCR + Whisper transcription

**The team:**

We're Select KK, based in Tokyo. Small team, obsessed with building tools that respect how people actually work.

**The ask:**

Try the free tier. Break things. Tell us what's missing. We're building this for people who live in their terminal, their IDE, their browser — and want AI that actually keeps up.

Feedback is everything at this stage. Drop a comment, DM me, or email us. We're here all day.

ありがとうございます. Let's go.

### Topics

- Artificial Intelligence
- Productivity
- Developer Tools

### Gallery Image Descriptions

1. **Chat with AI using work context** — The chat interface showing a conversation where the AI references previous work sessions, with the memory context panel visible on the side.
2. **Cloud computer terminal + file browser** — Split view of the integrated terminal (xterm.js) and file browser showing the user's persistent cloud machine files.
3. **Memory feed with search** — The work memory timeline showing captured context entries with semantic search results highlighted.
4. **Multi-model selector** — The model picker dropdown showing Claude, GPT-4, and Gemini options with the active model highlighted.
5. **Landing page hero** — The syogun.com landing page with the dark hero section, Bebas Neue typography, and gold accent (#C8A96E).

---

## 日本語

### タグライン（60文字以内）

> あなたの仕事を知る、唯一のAI

### 説明（260文字以内）

> SHOGUNは、パーソナルAIクラウドコンピュータと永続的なワークメモリを提供します。デスクトップアプリがコンテキストを取得し、AIがすべてを記憶し、あなた専用のLinuxマシンで実行。毎回ゼロから説明する必要はもうありません。Claude・GPT・Gemini対応。

### 最初のコメント（メーカーより）

Product Huntの皆さん、こんにちは！東京のSelect KK代表です。本日、SHOGUNをローンチします。

**私たちがぶつかり続けた問題：**

AIとの会話は、毎回ゼロから始まります。ChatGPT、Claude、Geminiを開くたびに、昨日何をしていたか全く知らない状態。コードベースの構造も、プロジェクトの判断経緯も、何もわからない。毎回同じ背景をコピペし、スタックやゴール、制約を説明し直す。毎朝記憶をなくす天才コンサルタントを雇っているようなものです。

みんな回避策を作ってきました。カスタムGPT、システムプロンプト、RAGパイプライン。でもどれも脆い。実際に起きたこと — 実行したコマンド、遭遇したエラー、見つけた解決策 — を捉えていません。

**SHOGUNの仕組み：**

SHOGUN ＝ AIクラウドコンピュータ ＋ ワークメモリ。

ユーザー1人につき1台のLinuxクラウドマシン（Fly.io搭載）。サンドボックスでも一時的なコンテナでもありません。ファイル、ツール、環境が永続する本物のサーバーです。

その上にワークメモリが載っています。デスクトップアプリがバックグラウンドで作業コンテキストを取得 — OCRによる画面内容、会議の文字起こし、ターミナル操作。すべてテキストに変換（スクリーンショットは保存しません）、ベクトル化され、検索可能になります。

SHOGUNでAIと話すとき、AIはあなたが何をしていたか既に知っています。作業履歴を検索し、関連コンテキストを見つけ、クラウドマシン上で直接実行します。AIは答えるだけでなく、過去の作業を完全に把握した上で行動します。

**使い方：**

1. デスクトップアプリをインストール。バックグラウンドで作業コンテキストを取得（テキストのみ、プライバシー優先）。
2. SHOGUNを開く。Claude、GPT、Geminiから好きなモデルでAIとチャット。
3. AIが自動的にワークメモリから関連コンテキストを検索。
4. コマンドはあなた専用のクラウドマシンで実行。ファイルも状態も永続。

**何が違うのか：**

他のAIツールはチャットウィンドウを提供します。コードサンドボックスを提供するものもあります。SHOGUNは、あなたの仕事を記憶するフルクラウドコンピュータを提供します。メモリレイヤーが差別化要因 — pgvectorによる作業履歴全体のセマンティック検索です。

**技術スタック：**

- マルチモデル：Claude（メイン）、GPT-4、Gemini — すべてツール使用対応
- インフラ：Fly.io Machines — ユーザーごとに専用コンテナ
- メモリ：pgvectorセマンティック検索、text-embedding-3-small（1536次元）
- ストレージ：Cloudflare R2でユーザーあたり100GB
- セキュリティ：全テーブルにRLS、AES-256暗号化APIキー、コンテナ分離
- デスクトップ：Electron + OCR + Whisper文字起こし

**チーム：**

私たちはSelect KK、東京拠点。小さなチームですが、人々の実際の働き方を尊重するツール作りに没頭しています。

**お願い：**

無料プランをお試しください。壊してください。足りないものを教えてください。ターミナル、IDE、ブラウザで生活し、AIに追いついてほしいと思っている人のために作っています。

この段階ではフィードバックがすべてです。コメント、DM、メールなんでも。一日中ここにいます。

よろしくお願いします！

### トピック

- 人工知能
- 生産性
- 開発者ツール

### ギャラリー画像の説明

1. **ワークコンテキストを使ったAIチャット** — AIが過去の作業セッションを参照する会話を表示するチャットインターフェース。サイドにメモリコンテキストパネル。
2. **クラウドコンピュータのターミナル＋ファイルブラウザ** — 統合ターミナル（xterm.js）とユーザーの永続クラウドマシンのファイルを表示するファイルブラウザの分割ビュー。
3. **メモリフィードと検索** — キャプチャされたコンテキストエントリのタイムラインとセマンティック検索結果のハイライト。
4. **マルチモデルセレクター** — Claude、GPT-4、Geminiオプションを表示するモデルピッカードロップダウン。
5. **ランディングページヒーロー** — ダークヒーローセクション、Bebas Neueタイポグラフィ、ゴールドアクセント（#C8A96E）のsyogun.comランディングページ。
