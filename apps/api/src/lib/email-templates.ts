import type { Locale } from "@shogun/shared/types";

interface EmailOutput {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// i18n strings
// ---------------------------------------------------------------------------
const copy: Record<
  Locale,
  {
    subject: string;
    greeting: (handle: string) => string;
    welcome: string;
    intro: string;
    steps: string[];
    cta: string;
    ctaUrl: string;
    footer: string;
  }
> = {
  en: {
    subject: "Welcome to SHOGUN",
    greeting: (h) => `Hello, ${h}.`,
    welcome: "Welcome to SHOGUN.",
    intro:
      "Your personal AI Cloud Computer is ready. One machine, one memory, built around you.",
    steps: [
      "Open your dashboard and launch your cloud machine.",
      "Start a conversation — SHOGUN remembers your work automatically.",
      "Upload files, run code, deploy services — all from one place.",
    ],
    cta: "Open Dashboard",
    ctaUrl: "https://syogun.com/chat",
    footer:
      "You received this email because you signed up for SHOGUN (syogun.com). Select KK, Tokyo.",
  },
  ja: {
    subject: "SHOGUNへようこそ",
    greeting: (h) => `${h} さん、こんにちは。`,
    welcome: "SHOGUNへようこそ。",
    intro:
      "あなた専用のAIクラウドコンピュータの準備が整いました。1台のマシン、1つのメモリ、すべてあなたのために。",
    steps: [
      "ダッシュボードを開いてクラウドマシンを起動してください。",
      "会話を始めましょう — SHOGUNは自動的にあなたの作業を記憶します。",
      "ファイルのアップロード、コード実行、サービスのデプロイ — すべて一箇所で。",
    ],
    cta: "ダッシュボードを開く",
    ctaUrl: "https://syogun.com/chat",
    footer:
      "このメールはSHOGUN（syogun.com）にご登録いただいた方にお送りしています。Select KK, 東京。",
  },
  es: {
    subject: "Bienvenido a SHOGUN",
    greeting: (h) => `Hola, ${h}.`,
    welcome: "Bienvenido a SHOGUN.",
    intro:
      "Tu computadora personal en la nube con IA esta lista. Una maquina, una memoria, construida para ti.",
    steps: [
      "Abre tu panel de control y lanza tu maquina en la nube.",
      "Inicia una conversacion — SHOGUN recuerda tu trabajo automaticamente.",
      "Sube archivos, ejecuta codigo, despliega servicios — todo desde un solo lugar.",
    ],
    cta: "Abrir Panel",
    ctaUrl: "https://syogun.com/chat",
    footer:
      "Recibiste este correo porque te registraste en SHOGUN (syogun.com). Select KK, Tokyo.",
  },
};

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
export function welcomeEmail(handle: string, locale: Locale): EmailOutput {
  const c = copy[locale] ?? copy.en;

  const stepsHtml = c.steps
    .map(
      (step, i) =>
        `<tr><td style="padding:0 0 12px 0;color:#F0EDE6;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
          <span style="color:#C8A96E;font-weight:500;">${i + 1}.</span> ${step}
        </td></tr>`,
    )
    .join("");

  const stepsText = c.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0EDE6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080808;">
  <tr><td style="padding:32px 24px;text-align:center;">
    <span style="font-family:'Bebas Neue','DM Sans',Helvetica,sans-serif;font-size:28px;letter-spacing:0.15em;color:#F0EDE6;">SHOGUN</span>
    <div style="margin:12px auto 0;width:40px;height:2px;background-color:#C8A96E;"></div>
  </td></tr>
</table>

<!-- Body -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
  <tr><td style="padding:40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">

      <!-- Greeting -->
      <tr><td style="padding:0 0 8px 0;color:#F0EDE6;font-size:18px;font-weight:500;">
        ${c.greeting(handle)}
      </td></tr>
      <tr><td style="padding:0 0 24px 0;color:#F0EDE6;font-size:24px;font-weight:500;">
        ${c.welcome}
      </td></tr>

      <!-- Intro -->
      <tr><td style="padding:0 0 32px 0;color:#A0A0A0;font-size:15px;line-height:1.7;">
        ${c.intro}
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 0 32px 0;">
        <div style="height:1px;background-color:#1E1E1E;"></div>
      </td></tr>

      <!-- Steps -->
      ${stepsHtml}

      <!-- CTA -->
      <tr><td style="padding:32px 0 0 0;text-align:center;">
        <a href="${c.ctaUrl}" style="display:inline-block;padding:14px 40px;background-color:#C8A96E;color:#080808;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">
          ${c.cta}
        </a>
      </td></tr>

    </table>
  </td></tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080808;">
  <tr><td style="padding:24px;text-align:center;color:#666666;font-size:11px;line-height:1.5;">
    ${c.footer}
  </td></tr>
</table>

</body>
</html>`;

  const text = `${c.greeting(handle)}

${c.welcome}

${c.intro}

${stepsText}

${c.cta}: ${c.ctaUrl}

---
${c.footer}`;

  return { subject: c.subject, html, text };
}
