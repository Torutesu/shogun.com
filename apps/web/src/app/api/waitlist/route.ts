import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  try {
    const { email, locale } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: { code: "INVALID_EMAIL", message: "Valid email required" } },
        { status: 400 },
      );
    }

    // Add to Resend audience (waitlist)
    if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
      // Add contact to audience
      const contactRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: "",
          last_name: "",
          unsubscribed: false,
        }),
      });

      if (!contactRes.ok) {
        const err = await contactRes.json().catch(() => ({}));
        // 409 = already exists, treat as success
        if (contactRes.status !== 409) {
          console.error("[waitlist] Resend contact error:", err);
          return NextResponse.json(
            { error: { code: "WAITLIST_ERROR", message: "Failed to join waitlist" } },
            { status: 500 },
          );
        }
      }

      // Send confirmation email
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SHOGUN <noreply@syogun.com>",
          to: [email],
          subject: getSubject(locale),
          html: getWaitlistEmailHtml(email, locale),
          text: getWaitlistEmailText(email, locale),
        }),
      });
    } else {
      console.warn("[waitlist] RESEND_API_KEY or RESEND_AUDIENCE_ID not configured");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[waitlist] Error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Email copy
// ---------------------------------------------------------------------------

interface WaitlistCopy {
  subject: string;
  heading: string;
  body: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  cta: string;
  footer: string;
}

const copies: Record<string, WaitlistCopy> = {
  en: {
    subject: "You're on the SHOGUN waitlist",
    heading: "You're in.",
    body: "SHOGUN is a personal AI cloud computer with work memory. We're opening access soon. You'll be among the first to know.",
    bullet1: "Your own Linux cloud machine — files, tools, environment that persist",
    bullet2: "Work memory — AI that remembers your projects, decisions, and context",
    bullet3: "Multi-model AI — Claude, GPT, Gemini in one place with BYOK",
    cta: "Visit syogun.com",
    footer: "You received this because you joined the SHOGUN waitlist. Select KK, Tokyo.",
  },
  ja: {
    subject: "SHOGUNウェイトリストに登録されました",
    heading: "登録完了。",
    body: "SHOGUNは、ワークメモリを搭載したパーソナルAIクラウドコンピュータです。まもなくアクセスを開放します。最初にお知らせいたします。",
    bullet1: "専用Linuxクラウドマシン — ファイル、ツール、環境が永続",
    bullet2: "ワークメモリ — プロジェクト、判断、コンテキストをAIが記憶",
    bullet3: "マルチモデルAI — Claude・GPT・Geminiを一箇所で、BYOK対応",
    cta: "syogun.comを見る",
    footer: "SHOGUNウェイトリストに登録されたためこのメールをお送りしています。Select KK, 東京。",
  },
  es: {
    subject: "Estás en la lista de espera de SHOGUN",
    heading: "Estás dentro.",
    body: "SHOGUN es una computadora personal en la nube con memoria de trabajo. Pronto abriremos el acceso. Serás de los primeros en saberlo.",
    bullet1: "Tu propia máquina Linux en la nube — archivos, herramientas y entorno persistentes",
    bullet2: "Memoria de trabajo — IA que recuerda tus proyectos, decisiones y contexto",
    bullet3: "IA multi-modelo — Claude, GPT, Gemini en un solo lugar con BYOK",
    cta: "Visita syogun.com",
    footer: "Recibiste este correo porque te uniste a la lista de espera de SHOGUN. Select KK, Tokyo.",
  },
};

function getCopy(locale?: string): WaitlistCopy {
  const key = locale ?? "en";
  return copies[key] ?? copies["en"]!;
}

function getSubject(locale?: string): string {
  return getCopy(locale).subject;
}

function getWaitlistEmailHtml(email: string, locale?: string): string {
  const c = getCopy(locale);

  return `<!DOCTYPE html>
<html lang="${locale || "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0EDE6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080808;">
  <tr><td style="padding:32px 24px;text-align:center;">
    <span style="font-family:'Bebas Neue','DM Sans',Helvetica,sans-serif;font-size:28px;letter-spacing:0.15em;color:#F0EDE6;">SHO<span style="color:#C8A96E;">G</span>UN</span>
    <div style="margin:12px auto 0;width:40px;height:2px;background-color:#C8A96E;"></div>
  </td></tr>
</table>

<!-- Body -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
  <tr><td style="padding:48px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">

      <!-- Heading -->
      <tr><td style="padding:0 0 16px 0;color:#F0EDE6;font-size:32px;font-weight:500;letter-spacing:0.02em;">
        ${c.heading}
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:0 0 32px 0;color:#A0A0A0;font-size:15px;line-height:1.7;">
        ${c.body}
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 0 32px 0;">
        <div style="height:1px;background-color:#1E1E1E;"></div>
      </td></tr>

      <!-- What you'll get -->
      <tr><td style="padding:0 0 12px 0;color:#F0EDE6;font-size:15px;line-height:1.6;">
        <span style="color:#C8A96E;">&#9642;</span>&nbsp; ${c.bullet1}
      </td></tr>
      <tr><td style="padding:0 0 12px 0;color:#F0EDE6;font-size:15px;line-height:1.6;">
        <span style="color:#C8A96E;">&#9642;</span>&nbsp; ${c.bullet2}
      </td></tr>
      <tr><td style="padding:0 0 12px 0;color:#F0EDE6;font-size:15px;line-height:1.6;">
        <span style="color:#C8A96E;">&#9642;</span>&nbsp; ${c.bullet3}
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:32px 0 0 0;text-align:center;">
        <a href="https://syogun.com" style="display:inline-block;padding:14px 40px;background-color:#C8A96E;color:#080808;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">
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
}

function getWaitlistEmailText(email: string, locale?: string): string {
  const c = getCopy(locale);
  return `${c.heading}

${c.body}

- ${c.bullet1}
- ${c.bullet2}
- ${c.bullet3}

${c.cta}: https://syogun.com

---
${c.footer}`;
}
