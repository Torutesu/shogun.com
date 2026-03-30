# SHOGUN — 実装予定機能一覧

> ステータス: ◻ 未着手 / 🔧 設計済み / ✅ 実装済み
> 優先度: P0 = MVP必須 / P1 = MVP直後 / P2 = Growth期

---

## Phase 1: MVP（ローンチ最低限）

### 1. Auth & Onboarding — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 1.1 | メール/パスワード登録 | Supabase Auth、メール確認 | 🔧 |
| 1.2 | Google OAuth | ワンクリックログイン | 🔧 |
| 1.3 | ハンドル選択 | `toru.syogun.com` / `toru@syogun.com`、予約語チェック、リアルタイムバリデーション | 🔧 |
| 1.4 | サーバープロビジョニング | Fly.io Machine自動作成、進捗バー（~15秒）| 🔧 |
| 1.5 | パーソナライゼーション | プロビジョニング中に「SHOGUNにどう話してほしい？」を設定 | 🔧 |
| 1.6 | SMS/LINE セットアップ | 任意、検証コード送信、完了後に通知チャネル利用可 | 🔧 |
| 1.7 | ログイン/ログアウト | JWT管理、セッション維持、HTTP-only cookie | 🔧 |
| 1.8 | JWT middleware | 全API保護、Supabase JWT検証 | 🔧 |

### 2. AI Chat — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 2.1 | 会話CRUD | 新規作成、一覧、削除、リネーム、ピン留め | 🔧 |
| 2.2 | メッセージ送信 + SSEストリーミング | リアルタイムで文字が流れる、AbortControllerでキャンセル | 🔧 |
| 2.3 | Claude API統合 | Anthropic SDK、Tool Use対応、ストリーミング | 🔧 |
| 2.4 | OpenAI API統合 | GPT-4o / GPT-4o-mini、function calling | 🔧 |
| 2.5 | Gemini API統合 | Gemini 2.0 Flash / 2.5 Pro | ◻ |
| 2.6 | モデルセレクター | チャットUIでモデル切り替え、会話ごとに設定 | 🔧 |
| 2.7 | Tool Use: shell_exec | ユーザーマシン上でコマンド実行 | 🔧 |
| 2.8 | Tool Use: file_read/write | ユーザーマシン上のファイル操作 | 🔧 |
| 2.9 | Tool Use: file_list | ディレクトリ一覧 | 🔧 |
| 2.10 | Tool Use: web_search | Web検索結果をAIに返す | 🔧 |
| 2.11 | Tool Use: memory_query | ワークメモリ検索をAIが自動で呼ぶ | 🔧 |
| 2.12 | Tool Use: deploy | サービスデプロイをAIが実行 | 🔧 |
| 2.13 | 自動メモリ注入 | メッセージ送信時、関連メモリをsystem promptに自動挿入 | 🔧 |
| 2.14 | トークン使用量表示 | 各メッセージのinput/output/コスト表示 | 🔧 |
| 2.15 | チャットUI | メッセージバブル、Markdown表示、コードブロック、ツール実行表示 | ◻ |

### 3. Cloud Computer — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 3.1 | マシンプロビジョニング | Fly.io Machine作成、ボリューム接続、コンテナAgent起動 | 🔧 |
| 3.2 | マシン起動/停止 | 手動制御、ステータス表示（running/sleeping/stopped）| 🔧 |
| 3.3 | 自動スリープ | Free: 10分、Basic: 30分、Pro: 60分、Ultra: 常時起動 | 🔧 |
| 3.4 | 自動ウェイク | アクション時に自動起動（~300ms）、ブートアニメーション | 🔧 |
| 3.5 | ファイルブラウザ | ディレクトリツリー、ファイル一覧、サイズ/更新日表示 | 🔧 |
| 3.6 | ファイル読み/書き | APIからコンテナAgent経由でファイル操作 | 🔧 |
| 3.7 | ファイルアップロード | マルチパート → R2 → コンテナ | 🔧 |
| 3.8 | ファイルダウンロード | コンテナ → API → ブラウザ | 🔧 |
| 3.9 | インブラウザターミナル | xterm.js + WebSocket、PTYリレー | 🔧 |
| 3.10 | WebSocketチケット認証 | 30秒有効ワンタイムJWT | 🔧 |
| 3.11 | ターミナルリサイズ | cols/rows動的調整 | 🔧 |
| 3.12 | PTYセッション維持 | 切断後5分間セッション保持、再接続で復帰 | 🔧 |
| 3.13 | コンテナAgent | Go/Rustバイナリ、Flyプライベートネットワーク:9000 | 🔧 |
| 3.14 | ファイルブラウザUI | ツリービュー、アイコン、右クリックメニュー、ドラッグ&ドロップ | ◻ |
| 3.15 | ターミナルUI | フルスクリーン/分割表示、テーマ設定 | ◻ |

### 4. Work Memory (KIOKU) — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 4.1 | 画面テキストキャプチャ | Electron desktopCapturer → Tesseract.js OCR（テキストのみ）| ◻ |
| 4.2 | 会議文字起こし | システムオーディオ → 30秒チャンク → Whisper API | 🔧 |
| 4.3 | メモリ取り込みAPI | バッチ受信、重複排除、埋め込み生成 | 🔧 |
| 4.4 | 埋め込み生成 | text-embedding-3-small (1536次元)、バッチ処理 | 🔧 |
| 4.5 | セマンティック検索 | pgvector HNSW + キーワード検索のハイブリッド | 🔧 |
| 4.6 | AI要約生成 | 非同期、BullMQキュー、Claude Haiku | 🔧 |
| 4.7 | メモリフィード | タイムライン表示、アプリ名/ソース別フィルタ | 🔧 |
| 4.8 | エントリ削除 | ソフト削除（excluded=true）+ ハード削除オプション | 🔧 |
| 4.9 | アプリ除外設定 | 特定アプリを記録対象外に設定 | 🔧 |
| 4.10 | キャプチャ一時停止/再開 | グローバルON/OFF | 🔧 |
| 4.11 | キャプチャ間隔設定 | デフォルト30秒、ユーザー調整可能 | 🔧 |
| 4.12 | 保持期間設定 | null=永久、日数指定で自動削除 | 🔧 |
| 4.13 | メモリフィードUI | タイムライン、検索バー、フィルタ、削除ボタン | ◻ |
| 4.14 | Desktopアプリ（Electron）| システムトレイ、一時停止/再開、設定 | ◻ |

### 5. Billing — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 5.1 | Stripe統合 | Checkout Session作成、Customer Portal | 🔧 |
| 5.2 | プラン管理 | Free/Basic/Pro/Ultra、アップ/ダウングレード | 🔧 |
| 5.3 | Stripe Webhook | 支払い成功/失敗、サブスクリプション変更 | 🔧 |
| 5.4 | AIクレジットシステム | 使用量追跡、残高表示、クレジット不足時402 | 🔧 |
| 5.5 | クレジット台帳 | append-only ledger、監査対応 | 🔧 |
| 5.6 | BYOK（自分のAPIキー） | AES-256暗号化保存、BYOK使用時はクレジット消費なし | 🔧 |
| 5.7 | APIキー検証 | キー追加時にプロバイダへテストリクエスト | 🔧 |
| 5.8 | 使用量ダッシュボード | プロバイダ/モデル別コスト、期間内使用量グラフ | ◻ |
| 5.9 | 請求UI | 現在のプラン、残りクレジット、アップグレードボタン | ◻ |

### 6. i18n — P0
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 6.1 | 3言語サポート | EN（デフォルト）/ JA / ES | ✅ |
| 6.2 | 言語自動検出 | URL param → localStorage → navigator.language → EN | ✅ |
| 6.3 | 言語切り替えUI | ナビバー segmented control `EN · JA · ES` | ◻ |
| 6.4 | 通貨切り替え | EN→USD / JA→JPY / ES→USD | 🔧 |

---

## Phase 2: 差別化機能

### 7. Services（ホスティング）— P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 7.1 | サービスデプロイ | コンテナ内プロジェクト → `name.syogun.com` で公開 | 🔧 |
| 7.2 | カスタムドメイン | CNAME設定、TLS自動発行（Fly.io Certificates）| 🔧 |
| 7.3 | サービス管理 | 起動/停止/再起動、ポート設定 | 🔧 |
| 7.4 | サービス一覧UI | ステータス表示、ドメインリンク | ◻ |
| 7.5 | アクセスログ | 基本的なリクエストログ | ◻ |

### 8. Automations — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 8.1 | Cronジョブ | cron式で定期実行 | 🔧 |
| 8.2 | Emailトリガー | `user@syogun.com` 宛メール受信 → スクリプト実行 | 🔧 |
| 8.3 | SMSトリガー | SMS受信 → スクリプト実行（Twilio） | 🔧 |
| 8.4 | LINEトリガー | LINE受信 → スクリプト実行 | 🔧 |
| 8.5 | Webhookトリガー | 任意URL POST → スクリプト実行 | 🔧 |
| 8.6 | 実行履歴 | stdout/stderr末尾、exit code、実行時間 | 🔧 |
| 8.7 | 手動トリガー | UI/APIからワンクリック実行 | 🔧 |
| 8.8 | 自動化UI | 作成/編集フォーム、実行ログ表示 | ◻ |

### 9. Advanced Memory — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 9.1 | ハイブリッド検索 | ベクトル検索 + キーワード検索の組み合わせスコア | 🔧 |
| 9.2 | 時間表現パース | 「今週」「昨日」→ 日付フィルタ自動適用 | ◻ |
| 9.3 | 会議サマリ自動生成 | 文字起こし完了後、Claude で要約 | 🔧 |
| 9.4 | Weekly Digest | 「今週の振り返り」自動生成メール/通知 | ◻ |
| 9.5 | メモリエクスポート | JSON/CSV形式でダウンロード | ◻ |

### 10. Notification Channels — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 10.1 | SMS通知 | Twilio、検証コード、SHOGUNからの応答をSMSで返信 | 🔧 |
| 10.2 | LINE連携 | LINE Messaging API、双方向メッセージ | 🔧 |
| 10.3 | メール通知 | SendGrid、自動化の結果通知など | 🔧 |
| 10.4 | 「SHOGUNにテキストで指示」| SMS/LINEで「明日の予定を教えて」→ AI応答を返信 | ◻ |

---

## Phase 3: Growth / エンタープライズ

### 11. Dashboard & Settings UI — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 11.1 | メインレイアウト | サイドバー（Chat/Files/Terminal/Memory/Services/Automations）| ◻ |
| 11.2 | ダークモード/ライトモード切り替え | デフォルトlight、ユーザートグル | ◻ |
| 11.3 | マシンステータスウィジェット | running/sleeping/stopped、CPU/RAM/Storage使用率 | ◻ |
| 11.4 | プロフィール設定 | 名前、アバター、言語、タイムゾーン、通信スタイル | ◻ |
| 11.5 | APIキー管理UI | 追加/削除/検証、マスク表示 | ◻ |
| 11.6 | 通知設定 | チャネル追加/削除、検証 | ◻ |
| 11.7 | 危険ゾーン | アカウント削除、データエクスポート | ◻ |

### 12. Security & Infrastructure — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 12.1 | レート制限 | Tier別リクエスト制限、IP + User双方 | 🔧 |
| 12.2 | APIキー暗号化 | AES-256-GCM、HKDF(master_key, user_id) | 🔧 |
| 12.3 | コンテナネットワーク隔離 | per-machine JWT、Fly internal network only | 🔧 |
| 12.4 | Idempotency | 重複リクエスト防止（Redis 24h TTL）| 🔧 |
| 12.5 | R2バックアップ | 夜間自動バックアップ（/home/user → R2）| 🔧 |
| 12.6 | マシンイメージ更新 | ローリングアップデート、段階的デプロイ | 🔧 |
| 12.7 | 構造化ログ | JSON、request_id/user_id/machine_id付き | ◻ |
| 12.8 | メトリクス | Prometheus形式、レイテンシ/トークン/接続数 | ◻ |

### 13. Async Job Queue — P1
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 13.1 | BullMQ基盤 | Redis接続、キュー定義、ワーカー起動 | ◻ |
| 13.2 | memory:summarize | メモリ要約の非同期生成 | 🔧 |
| 13.3 | memory:embed | バッチ埋め込み生成 | 🔧 |
| 13.4 | machine:lifecycle | プロビジョニング/起動/停止/アップグレード | 🔧 |
| 13.5 | automation:schedule | 毎分のcron評価 | 🔧 |
| 13.6 | backup:sync | 夜間R2バックアップ | 🔧 |

### 14. Team / Enterprise — P2
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 14.1 | チーム作成 | 組織作成、メンバー招待 | ◻ |
| 14.2 | 共有メモリ | チーム内でメモリ共有（許可制） | ◻ |
| 14.3 | 共有会話 | チャットスレッドをチームメンバーに共有 | ◻ |
| 14.4 | 管理者ダッシュボード | 使用量一覧、メンバー管理 | ◻ |
| 14.5 | SSO (SAML) | エンタープライズ認証 | ◻ |
| 14.6 | 監査ログ | 管理者向け操作ログ | ◻ |

### 15. Landing Page — P2
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 15.1 | ヒーローセクション（ダーク） | SHOGUN ロゴ、将軍 watermark、CTA | ◻ |
| 15.2 | Pain セクション | 「AIに何度も自分を説明した」 | ◻ |
| 15.3 | 3 Pillars (Memory/Computer/Command) | 特徴セクション | ◻ |
| 15.4 | How it works (4ステップ) | インストール → 学習 → 質問 → 実行 | ◻ |
| 15.5 | Privacy セクション | 「設計で守る」 | ◻ |
| 15.6 | Pricing セクション | 4プラン、通貨切り替え | ◻ |
| 15.7 | Bottom CTA | 「Stop explaining yourself to AI」 | ◻ |
| 15.8 | ウェイトリスト | Google Form or Supabase テーブル | ◻ |
| 15.9 | i18n 全対応 | EN/JA/ES 全セクション | ✅(コピー) |

### 16. Desktop App (Electron) — P2
| # | 機能 | 詳細 | ステータス |
|---|------|------|-----------|
| 16.1 | Electronベース | Mac/Windows対応 | ◻ |
| 16.2 | システムトレイ常駐 | 一時停止/再開/設定/終了 | ◻ |
| 16.3 | 画面キャプチャ + OCR | desktopCapturer → Tesseract.js → テキスト | ◻ |
| 16.4 | フレーム差分検出 | SSIM/pHash で変化検出、無変化時はスキップ | ◻ |
| 16.5 | ローカルバッファ (SQLite) | 送信失敗時のオフラインキュー | ◻ |
| 16.6 | バッチ送信 | 50件 or 60秒ごとにAPIへ一括送信 | ◻ |
| 16.7 | 会議録音/文字起こし | システムオーディオ → チャンク → Whisper | ◻ |
| 16.8 | 除外アプリ同期 | API → デスクトップアプリのローカルリストに反映 | ◻ |
| 16.9 | 自動アップデート | electron-updater | ◻ |

---

## 集計

| Phase | 合計 | 設計済 | 実装済 | 未着手 |
|-------|------|--------|--------|--------|
| Phase 1 (MVP) | 62 | 48 | 2 | 12 |
| Phase 2 (差別化) | 25 | 13 | 0 | 12 |
| Phase 3 (Growth) | 36 | 10 | 1 | 25 |
| **合計** | **123** | **71** | **3** | **49** |

---

## 推奨実装順序

```
Phase 1 MVP — 最短パスでローンチ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sprint 1: Foundation
  ├─ Auth (Supabase) + Onboarding flow
  ├─ API middleware (JWT, rate limit, error handling)
  └─ Dashboard layout (sidebar, routing)

Sprint 2: Cloud Computer
  ├─ Container Agent (Go binary)
  ├─ Machine provisioning (Fly.io)
  ├─ File browser (API + UI)
  └─ Terminal (xterm.js + WebSocket)

Sprint 3: AI Chat
  ├─ Chat API (conversations, messages, SSE)
  ├─ Claude integration + Tool Use
  ├─ Chat UI (messages, streaming, tools)
  └─ OpenAI integration

Sprint 4: Work Memory
  ├─ Memory ingestion API
  ├─ Embedding + search pipeline
  ├─ Memory feed UI
  └─ Auto memory injection in chat

Sprint 5: Billing & Polish
  ├─ Stripe integration
  ├─ Credit system
  ├─ BYOK
  └─ Settings UI

→ MVP Launch (Product Hunt)
```
