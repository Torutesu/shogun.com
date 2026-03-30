# SHOGUN — マーケティング戦略 / Marketing Strategy

## 1. ポジショニング

### ワンライナー
**EN**: "The only AI that knows your work."
**JA**: "あなたの仕事を知っている、唯一のAI。"

### エレベーターピッチ (30秒)
> Every AI conversation starts from zero. SHOGUN fixes that.
> It's a personal AI cloud computer that passively captures your work context —
> screen text, meetings, decisions — and remembers everything.
> Your own Linux server that already knows what you're working on.
> Claude, GPT, Gemini in one place. With your work history built in.

### 競合マップ
```
                    ワークメモリ
                         ↑
                         |
                    SHOGUN ★
                         |
   チャットのみ ←--------+--------→ フルコンピュータ
                         |
            ChatGPT     Zo Computer
            Cursor
                         |
                         ↓
                    メモリなし
```

**SHOGUNだけが右上の象限にいる。**

---

## 2. ターゲットセグメント

### Primary: AIネイティブ個人 (TAM: 50M人)
| セグメント | ペイン | SHOGUNの解決策 |
|-----------|-------|---------------|
| ソロファウンダー | 毎回AIに背景を説明 | ワークメモリで自動コンテキスト |
| フリーランサー | 複数プロジェクトの切り替え | プロジェクト別メモリ検索 |
| PM/ディレクター | 会議の決定が消える | 会議自動文字起こし + 検索 |
| 開発者 | Cursor以外の仕事のコンテキスト | 画面全体をキャプチャ |

### Secondary: チーム (SAM: 5M チーム)
- チーム内のナレッジ共有
- 新メンバーのオンボーディング高速化
- 組織の意思決定履歴

---

## 3. GTM (Go-to-Market) フェーズ

### Phase 1: プロダクトハント + ハッカーニュース (Month 1)

**目標**: 1,000 waitlist signups

**Product Hunt Launch**:
- 投稿日: 火曜日 00:01 PST
- Tagline: "The only AI that knows your work"
- Categories: AI, Productivity, Developer Tools
- Maker comment: 問題→解決→デモ→差別化→Ask
- 準備物:
  - [ ] 30秒デモ動画 (screen recording)
  - [ ] 5枚のギャラリー画像
  - [ ] Hunter確保 (フォロワー1,000+)
  - [ ] 初日の投票動員 (SNS + メール)

**Hacker News**:
- "Show HN: SHOGUN – AI cloud computer with persistent work memory"
- 投稿タイミング: Product Hunt の翌日 10:00 EST
- コメントで技術的深さを出す (pgvector, Fly.io, Tool Use)

**Twitter/X Launch Thread**:
```
1/ I've been building SHOGUN — an AI that actually remembers your work.

Every AI session starts from zero. Not anymore.

2/ SHOGUN = Cloud Computer + Work Memory + Multi-Model AI

One sentence: "The only AI that knows your work."

3/ Here's how it works:
- Desktop app captures your screen text (OCR, text only)
- Meetings auto-transcribed
- Everything searchable via semantic search
- AI chat has your full context, always

4/ Plus you get a full Linux server in the cloud.
Deploy sites. Run automations. 24/7.

5/ Built by Select KK in Tokyo.
Claude, GPT-4o, Gemini — all in one place.
BYOK supported.

Try free → syogun.com
```

### Phase 2: コンテンツマーケティング (Month 2-3)

**目標**: 5,000 signups, 500 有料ユーザー

**ブログ記事 (EN)**:
1. "Why Every AI Session Starts From Zero (And How to Fix It)"
2. "Building a Personal AI Cloud Computer with Fly.io Machines"
3. "pgvector + Work Memory: Semantic Search for Your Entire Career"
4. "SHOGUN vs Zo Computer: The Work Memory Advantage"
5. "How We Built a Multi-Model AI Router (Claude + GPT + Gemini)"

**YouTube/Loom デモ動画**:
1. "SHOGUN in 2 Minutes" — onboarding → chat → memory → terminal
2. "Deploy a Full-Stack App with SHOGUN" — AI builds + deploys
3. "What Did I Work On This Week?" — memory search demo
4. "SHOGUN for Freelancers" — multi-project context switching

**SNS戦略**:
- Twitter/X: 週3投稿 (tips, demos, behind-the-scenes)
- LinkedIn: 週1投稿 (thought leadership)
- Reddit: r/SideProject, r/Productivity, r/MachineLearning

### Phase 3: 日本市場 (Month 3-4)

**目標**: 日本で1,000 signups

**なぜ日本が強いか**:
- 直接競合ゼロ（Zoは英語のみ）
- Select KKの東京ネットワーク
- AIツール導入率が急上昇中
- JPYプライシング対応済み

**チャネル**:
- Note.com: 開発ストーリー連載
- X (旧Twitter): 日本語テック界隈
- Qiita: 技術記事
- connpass: AIミートアップ登壇
- SLCT/REFOUNDクライアントネットワーク

### Phase 4: B2B / チーム (Month 5-6)

**目標**: 50チーム, ARR $100K

- チーム機能のデモ動画
- 「チームの知識共有」ユースケース
- SLCT/REFOUNDクライアントへの直接販売
- Slack/Discord コミュニティ

---

## 4. 価格戦略

### 個人
- **Free → Basic ($18)** の転換率目標: 15%
  - トリガー: AI credits上限、スリープ制限
- **Basic → Pro ($64)** の転換率目標: 8%
  - トリガー: サービス数上限、RAM不足

### BYOK効果
- BYOK対応でチャーン削減（自分のキーを使えるなら解約しない）
- BYOK ユーザーは無料でもアクティブに使い続ける → 口コミ効果

### チーム
- Pro以上でチーム機能解放
- チーム単位の請求（メンバー × 月額）

---

## 5. メトリクス (KPI)

| 指標 | Month 1 | Month 3 | Month 6 |
|------|---------|---------|---------|
| Waitlist | 1,000 | - | - |
| Total Users | 500 | 3,000 | 10,000 |
| Paid Users | 50 | 500 | 2,000 |
| MRR | $900 | $12,000 | $60,000 |
| ARR | - | $144K | $720K |
| Churn | <5% | <4% | <3% |
| NPS | 50+ | 60+ | 70+ |

---

## 6. ブランドガイドライン（マーケ用）

### トーン
- **Powerful × Stealth × Minimal**
- 短い文。余計なことを言わない。
- 「すごい」と言わない。見せる。
- 日本の精密さ × グローバルの野心

### やっていいこと
- 「The only AI that knows your work」
- 「Stop explaining yourself to AI」
- デモ動画で語る
- 競合比較表

### やってはいけないこと
- 「革命的」「画期的」「最先端」などのバズワード
- 機能の羅列だけの訴求
- 価格の安さで勝負
- スクリーンショットの保存を匂わせる表現

---

## 7. ローンチチェックリスト

### 準備完了 ✅
- [x] プロダクト実装 (123/123 機能)
- [x] LP (3言語)
- [x] Product Hunt コピー (EN/JA)
- [x] Privacy Policy / Terms
- [x] ドキュメント (Architecture, API, Setup, Features)
- [x] README (EN/JA, 投資家向け)

### デプロイ前 (PC作業)
- [ ] Supabase プロジェクト作成 + スキーマ適用
- [ ] Stripe プロダクト/価格作成
- [ ] Fly.io APIサーバーデプロイ
- [ ] Vercel Webアプリデプロイ
- [ ] DNS設定 (syogun.com, api.syogun.com)
- [ ] E2Eテスト (signup → chat → memory)

### ローンチ当日
- [ ] Product Hunt 投稿
- [ ] Twitter/X スレッド投稿
- [ ] Hacker News 投稿
- [ ] 日本語LP公開
- [ ] Note.com 記事公開

---

*Built by Select KK, Tokyo. 2026.*
