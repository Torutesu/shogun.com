import type en from "./en";

const ja: Record<keyof typeof en, string> = {
  // Common
  "common.appName": "SHOGUN",
  "common.tagline": "あなたの仕事を知っている、唯一のAI。",
  "common.subtitle": "すべてを記憶する。すべてをこなす。",
  "common.cta.earlyAccess": "早期アクセスを申し込む",
  "common.cta.howItWorks": "使い方を見る",
  "common.loading": "読み込み中...",
  "common.error": "エラーが発生しました",
  "common.save": "保存",
  "common.cancel": "キャンセル",
  "common.delete": "削除",
  "common.confirm": "確認",

  // Auth
  "auth.login": "ログイン",
  "auth.signup": "新規登録",
  "auth.logout": "ログアウト",
  "auth.email": "メールアドレス",
  "auth.password": "パスワード",
  "auth.googleLogin": "Googleで続ける",
  "auth.noAccount": "アカウントをお持ちでない方",
  "auth.hasAccount": "すでにアカウントをお持ちの方",

  // Onboarding
  "onboarding.chooseHandle": "ハンドルを選択",
  "onboarding.handleHint": "これがあなたの.syogun.comになります",
  "onboarding.handleTaken": "このハンドルは使用されています",
  "onboarding.provisioning": "サーバーを準備中...",
  "onboarding.personalization": "SHOGUNにどう話してほしいですか？",
  "onboarding.smsSetup": "SMS通知を設定（任意）",
  "onboarding.lineSetup": "LINEを連携（任意）",
  "onboarding.ready": "SHOGUNの準備が完了しました。",

  // Chat
  "chat.newConversation": "新しい会話",
  "chat.placeholder": "何でも聞いてください...",
  "chat.selectModel": "モデルを選択",
  "chat.noConversations": "会話はまだありません",

  // Machine
  "machine.status.provisioning": "準備中...",
  "machine.status.running": "稼働中",
  "machine.status.sleeping": "スリープ中",
  "machine.status.stopped": "停止中",
  "machine.status.error": "エラー",
  "machine.wake": "起動する",
  "machine.stop": "停止する",

  // Files
  "files.title": "ファイル",
  "files.upload": "アップロード",
  "files.newFolder": "新しいフォルダ",
  "files.empty": "ファイルがありません",

  // Terminal
  "terminal.title": "ターミナル",
  "terminal.connecting": "接続中...",
  "terminal.disconnected": "切断されました",

  // Memory
  "memory.title": "メモリ",
  "memory.search": "ワークメモリを検索...",
  "memory.noEntries": "メモリエントリはまだありません",
  "memory.screenCapture": "画面キャプチャ",
  "memory.transcript": "会議の文字起こし",
  "memory.settings": "メモリ設定",
  "memory.pause": "キャプチャを一時停止",
  "memory.resume": "キャプチャを再開",
  "memory.deleteEntry": "このエントリを削除",
  "memory.excludeApp": "このアプリを除外",

  // Billing
  "billing.title": "請求",
  "billing.currentPlan": "現在のプラン",
  "billing.upgrade": "アップグレード",
  "billing.manage": "請求管理",
  "billing.credits": "AIクレジット",
  "billing.creditsRemaining": "今月の残り",
  "billing.byok": "自分のAPIキーを使う",
  "billing.byokHint": "自分のAPIキーを使用 — クレジット消費なし",

  // Tiers
  "tier.free": "フリー",
  "tier.basic": "ベーシック",
  "tier.pro": "プロ",
  "tier.ultra": "ウルトラ",

  // Services
  "services.title": "サービス",
  "services.deploy": "デプロイ",
  "services.noServices": "デプロイされたサービスはありません",

  // Automations
  "automations.title": "自動化",
  "automations.create": "自動化を作成",
  "automations.noAutomations": "自動化は設定されていません",

  // Settings
  "settings.title": "設定",
  "settings.profile": "プロフィール",
  "settings.language": "言語",
  "settings.theme": "テーマ",
  "settings.theme.light": "ライト",
  "settings.theme.dark": "ダーク",
  "settings.notifications": "通知",
  "settings.apiKeys": "APIキー",
  "settings.danger": "危険な操作",
  "settings.deleteAccount": "アカウントを削除",

  // Privacy
  "privacy.title": "設計で守る。約束だけで守らない。",
  "privacy.body": "あなたのワークメモリはあなたのもの。SHOGUNはプライバシーをトグルではなく、アーキテクチャとして設計しました。",
  "privacy.textOnly": "テキストのみ取得 — スクリーンショットは撮りません",
  "privacy.encrypted": "保存・通信時に暗号化",
  "privacy.noTraining": "あなたのデータで学習しません",
  "privacy.deleteAnytime": "いつでも何でも削除できます",
  "privacy.excludeApps": "アプリ単位で除外設定が可能",
  "privacy.youOwnIt": "データはあなたのもの。常に。",

  // LP Hero
  "lp.hero.eyebrow": "AIクラウドコンピュータ · ワークメモリ · 自動化",
  "lp.hero.tagline": "あなたの仕事を知っている、唯一のAI。",
  "lp.hero.subtitle": "すべてを記憶する。すべてをこなす。",
  "lp.hero.bottomNote": "syogun.com · Select KK（東京）が開発",

  // LP Pain
  "lp.pain.title": "AIに同じ説明を、何度繰り返しましたか？",
  "lp.pain.quote1": "背景を説明すると...",
  "lp.pain.quote2": "先週決めたのは...",
  "lp.pain.quote3": "これを作っている理由は...",
  "lp.pain.body": "毎回ゼロから。どのツールもあなたを忘れる。それはここで終わります。",

  // LP Features
  "lp.features.sectionTitle": "3つの柱。1つのシステム。",
  "lp.features.memory.tag": "メモリ",
  "lp.features.memory.title": "記憶するAI",
  "lp.features.memory.body": "SHOGUNは会議、リサーチ、意思決定などのコンテキストをキャプチャし、永続的なメモリ層を構築します。過去の仕事について何でも聞けば、本物の答えが返ってきます。",
  "lp.features.computer.tag": "コンピュータ",
  "lp.features.computer.title": "クラウド上のあなたのサーバー",
  "lp.features.computer.body": "全ユーザーにフルLinuxマシンを提供。アプリのデプロイ、スクリプトの実行、ファイル管理。常時稼働、常にあなたのもの。",
  "lp.features.command.tag": "コマンド",
  "lp.features.command.title": "全モデル。一つの場所。",
  "lp.features.command.body": "Claude、GPT-4o、Gemini — タスクに最適なモデルにルーティング。自分のAPIキーを持ち込むか、含まれるクレジットを使用。一つのインターフェース、完全なコントロール。",

  // LP How It Works
  "lp.howItWorks.title": "使い方",
  "lp.howItWorks.step1.title": "デスクトップアプリをインストール",
  "lp.howItWorks.step1.body": "ワークフローを見守る軽量エージェント — テキストのみ、スクリーンショットは撮りません。",
  "lp.howItWorks.step2.title": "仕事を学習する",
  "lp.howItWorks.step2.body": "SHOGUNは時間とともに、プロジェクト、決定、コンテキストのメモリを構築します。",
  "lp.howItWorks.step3.title": "何でも聞く",
  "lp.howItWorks.step3.body": "「先週の火曜日にAPIについて何を決めた？」— 本物の答えが返ってきます。",
  "lp.howItWorks.step4.title": "実行する",
  "lp.howItWorks.step4.body": "コードを実行、サービスをデプロイ、タスクを自動化 — すべて一つの会話から。",

  // LP Pricing
  "lp.pricing.title": "シンプルな料金体系",
  "lp.pricing.subtitle": "無料で始める。準備ができたらスケール。",
  "lp.pricing.monthly": "/月",
  "lp.pricing.free.description": "基本機能でSHOGUNを試す",
  "lp.pricing.basic.description": "フル体験を求める個人向け",
  "lp.pricing.pro.description": "パワーユーザーとプロフェッショナル向け",
  "lp.pricing.ultra.description": "チームと高負荷ワークロード向け",
  "lp.pricing.mostPopular": "一番人気",
  "lp.pricing.features.credits": "AIクレジット {amount}/月",
  "lp.pricing.features.cpu": "{count}コアCPU",
  "lp.pricing.features.memory": "RAM {amount}",
  "lp.pricing.features.storage": "ストレージ {amount}GB",
  "lp.pricing.features.services": "最大{count}サービス",
  "lp.pricing.features.customDomain": "カスタムドメイン",
  "lp.pricing.features.alwaysOn": "常時稼働マシン",
  "lp.pricing.features.priority": "優先サポート",
  "lp.pricing.features.byok": "自分のAPIキーを持ち込み可能",
  "lp.pricing.cta.free": "無料で始める",
  "lp.pricing.cta.paid": "早期アクセスを申し込む",

  // LP Bottom CTA
  "lp.bottomCta.title": "AIに自分を説明するのはもうやめよう。",
  "lp.bottomCta.subtitle": "SHOGUNはすでに知っている。",
  "lp.bottomCta.note": "無料で開始 · クレジットカード不要 · syogun.com",

  // LP Footer
  "lp.footer.copyright": "© 2026 Select KK. All rights reserved.",
  "lp.footer.privacy": "プライバシー",
  "lp.footer.terms": "利用規約",

  // Team
  "team.title": "チーム",
  "team.create": "チームを作成",
  "team.members": "メンバー",
  "team.shared": "共有",
  "team.audit": "監査ログ",
  "team.settings": "設定",
  "team.invite": "招待",
  "team.remove": "削除",
  "team.leave": "チームを退出",
  "team.role.owner": "オーナー",
  "team.role.admin": "管理者",
  "team.role.member": "メンバー",
  "team.role.viewer": "閲覧者",
  "team.sso.title": "SSO / SAML",
  "team.sso.configure": "SSOを設定",
  "team.sso.entityId": "SAMLエンティティID",
  "team.sso.ssoUrl": "SSO URL",
  "team.sso.certificate": "証明書",
  "team.audit.action.created": "作成",
  "team.audit.action.updated": "更新",
  "team.audit.action.deleted": "削除",
  "team.audit.action.shared": "共有",
  "team.audit.action.invited": "招待",
  "team.audit.action.removed": "除名",
};

export default ja;
