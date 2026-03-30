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
  "privacy.textOnly": "テキストのみ取得 — スクリーンショットは撮りません",
  "privacy.encrypted": "保存・通信時に暗号化",
  "privacy.noTraining": "あなたのデータで学習しません",
  "privacy.deleteAnytime": "いつでも何でも削除できます",
  "privacy.excludeApps": "アプリ単位で除外設定が可能",
  "privacy.youOwnIt": "データはあなたのもの。常に。",
};

export default ja;
