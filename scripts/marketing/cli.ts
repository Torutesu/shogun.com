#!/usr/bin/env tsx
/**
 * SHOGUN Marketing CLI — Playwright Browser Automation
 *
 * All X/Twitter operations use a real browser (Playwright Chromium).
 * Session cookies are saved per account so you only log in once.
 *
 * Usage:
 *   pnpm marketing <command> [options]
 *
 * X/Twitter (browser automation):
 *   x:login <account>           — Open browser, log in, save session
 *   x:post <account> <text>     — Post a tweet
 *   x:thread <account> <file>   — Post a thread (JSON array of strings)
 *   x:reply <account> <url> <text> — Reply to a tweet
 *   x:multi <text>              — Post from all logged-in accounts (staggered)
 *   x:search <query>            — Search X and print results
 *   x:schedule <calendar.json>  — Post due items from content calendar
 *   x:accounts                  — List saved account sessions
 *
 * Email (Resend API):
 *   email:drip                  — Run waitlist drip sequence
 *   email:blast <subject> <file> — Send to entire waitlist
 *   email:stats                 — Show Resend audience stats
 *
 * Dashboard:
 *   stats                       — Stripe MRR + Resend contacts
 *   directories                 — Directory submission tracker
 *   directories:mark <name>     — Mark a directory as submitted
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DIR = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);
const SESSIONS_DIR = path.join(DIR, ".sessions");
const STATE_DIR = path.join(DIR, ".state");

for (const d of [SESSIONS_DIR, STATE_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function env(key: string): string {
  const v = process.env[key];
  if (!v) { console.error(`[error] Missing env: ${key}`); process.exit(1); }
  return v;
}

function readFile(p: string): string {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  return fs.readFileSync(abs, "utf-8");
}

function loadState<T>(name: string, fallback: T): T {
  const p = path.join(STATE_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function saveState(name: string, data: unknown): void {
  fs.writeFileSync(path.join(STATE_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

function sessionPath(account: string): string {
  return path.join(SESSIONS_DIR, account);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Human-like random delay */
function humanDelay(minMs = 800, maxMs = 2500): Promise<void> {
  return sleep(minMs + Math.random() * (maxMs - minMs));
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getSavedAccounts(): string[] {
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  return fs.readdirSync(SESSIONS_DIR).filter((f) => {
    const full = path.join(SESSIONS_DIR, f);
    return fs.statSync(full).isDirectory();
  });
}

// ---------------------------------------------------------------------------
// Playwright — X/Twitter Browser Automation
// ---------------------------------------------------------------------------

async function openContext(account: string, headless = true): Promise<BrowserContext> {
  const storagePath = sessionPath(account);

  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const contextOpts: Parameters<typeof browser.newContext>[0] = {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
  };

  // Load saved state if exists
  if (fs.existsSync(path.join(storagePath, "state.json"))) {
    contextOpts.storageState = path.join(storagePath, "state.json");
  }

  const context = await browser.newContext(contextOpts);

  // Stealth: remove navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  return context;
}

async function saveSession(context: BrowserContext, account: string): Promise<void> {
  const storagePath = sessionPath(account);
  if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });
  await context.storageState({ path: path.join(storagePath, "state.json") });
}

// --- Login ---

async function xLogin(account: string): Promise<void> {
  console.log(`[x:login] Opening browser for @${account}...`);
  console.log("[x:login] Log in manually in the browser window.");
  console.log("[x:login] When done, press Enter here to save the session.\n");

  const context = await openContext(account, false); // headful
  const page = await context.newPage();
  await page.goto("https://x.com/login", { waitUntil: "domcontentloaded" });

  // Wait for user to finish logging in
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  await saveSession(context, account);
  await context.close();
  console.log(`[x:login] Session saved for @${account}.`);
}

// --- Post tweet ---

async function xPost(account: string, text: string, headless = true): Promise<string | null> {
  const context = await openContext(account, headless);
  const page = await context.newPage();

  try {
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded" });
    await humanDelay(1500, 3000);

    // Wait for the compose box
    const editor = page.getByRole("textbox").first();
    await editor.waitFor({ state: "visible", timeout: 15000 });

    // Type with human-like speed
    for (const char of text) {
      await editor.pressSequentially(char, { delay: 30 + Math.random() * 50 });
    }
    await humanDelay(500, 1200);

    // Click the Post button
    const postButton = page.getByTestId("tweetButton").or(
      page.locator('[data-testid="tweetButtonInline"]'),
    ).or(
      page.locator('button:has-text("Post")').first(),
    );
    await postButton.click();
    await humanDelay(2000, 4000);

    // Try to grab the tweet URL from the notification/redirect
    const url = page.url();
    await saveSession(context, account);
    console.log(`[x:post] @${account}: "${text.slice(0, 60)}..." ✓`);
    return url;
  } catch (err) {
    console.error(`[x:post] Failed for @${account}:`, (err as Error).message);
    // Save screenshot for debugging
    const ssPath = path.join(STATE_DIR, `error-${account}-${Date.now()}.png`);
    await page.screenshot({ path: ssPath });
    console.error(`[x:post] Screenshot saved: ${ssPath}`);
    return null;
  } finally {
    await context.close();
  }
}

// --- Post thread ---

async function xThread(account: string, filePath: string): Promise<void> {
  const tweets: string[] = JSON.parse(readFile(filePath));

  if (tweets.length === 0) {
    console.error("[x:thread] Empty thread file.");
    return;
  }

  const context = await openContext(account, true);
  const page = await context.newPage();

  try {
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded" });
    await humanDelay(1500, 3000);

    for (let i = 0; i < tweets.length; i++) {
      const isFirst = i === 0;

      if (!isFirst) {
        // Click "Add another post" button
        const addButton = page.locator('[data-testid="addButton"]').or(
          page.locator('button[aria-label="Add post"]'),
        ).or(
          page.locator('button:has-text("+")'),
        );
        await addButton.click();
        await humanDelay(800, 1500);
      }

      // Get the last editor (for threads, new editors appear at the bottom)
      const editors = page.getByRole("textbox");
      const editor = editors.last();
      await editor.waitFor({ state: "visible", timeout: 10000 });

      // Type
      for (const char of tweets[i]) {
        await editor.pressSequentially(char, { delay: 25 + Math.random() * 40 });
      }

      console.log(`  [${i + 1}/${tweets.length}] ${tweets[i].slice(0, 60)}...`);
      await humanDelay(500, 1200);
    }

    // Click "Post all"
    const postButton = page.getByTestId("tweetButton").or(
      page.locator('button:has-text("Post all")'),
    ).or(
      page.locator('button:has-text("Post")').first(),
    );
    await postButton.click();
    await humanDelay(3000, 5000);

    await saveSession(context, account);
    console.log(`[x:thread] @${account}: ${tweets.length} tweets posted. ✓`);
  } catch (err) {
    console.error(`[x:thread] Failed:`, (err as Error).message);
    const ssPath = path.join(STATE_DIR, `error-thread-${Date.now()}.png`);
    await page.screenshot({ path: ssPath });
    console.error(`[x:thread] Screenshot: ${ssPath}`);
  } finally {
    await context.close();
  }
}

// --- Reply ---

async function xReply(account: string, tweetUrl: string, text: string): Promise<void> {
  const context = await openContext(account, true);
  const page = await context.newPage();

  try {
    await page.goto(tweetUrl, { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3500);

    // Click the reply box
    const replyBox = page.locator('[data-testid="tweetTextarea_0"]').or(
      page.getByRole("textbox").first(),
    );
    await replyBox.click();
    await humanDelay(500, 1000);

    for (const char of text) {
      await replyBox.pressSequentially(char, { delay: 30 + Math.random() * 50 });
    }
    await humanDelay(500, 1200);

    const replyButton = page.getByTestId("tweetButtonInline").or(
      page.locator('button:has-text("Reply")').first(),
    );
    await replyButton.click();
    await humanDelay(2000, 4000);

    await saveSession(context, account);
    console.log(`[x:reply] @${account} replied to ${tweetUrl} ✓`);
  } catch (err) {
    console.error(`[x:reply] Failed:`, (err as Error).message);
  } finally {
    await context.close();
  }
}

// --- Multi-account post ---

async function xMulti(text: string): Promise<void> {
  const accounts = getSavedAccounts();
  if (accounts.length === 0) {
    console.error("[x:multi] No saved accounts. Run `x:login <account>` first.");
    return;
  }

  const delays = [0, 5, 15, 30]; // minutes between accounts

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const delayMin = delays[Math.min(i, delays.length - 1)];

    if (delayMin > 0) {
      console.log(`  [wait] ${delayMin}min before @${account}...`);
      await sleep(delayMin * 60 * 1000);
    }

    await xPost(account, text);
  }

  console.log(`[x:multi] Done. Posted to ${accounts.length} accounts.`);
}

// --- Search (headless, scrape results) ---

async function xSearch(query: string): Promise<void> {
  const accounts = getSavedAccounts();
  const account = accounts[0];

  if (!account) {
    console.error("[x:search] No saved account. Run `x:login <account>` first.");
    return;
  }

  const context = await openContext(account, true);
  const page = await context.newPage();

  try {
    const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await humanDelay(3000, 5000);

    // Scrape visible tweets
    const tweets = await page.locator('[data-testid="tweet"]').all();
    const results: Array<{ text: string; url: string }> = [];

    for (const tweet of tweets.slice(0, 15)) {
      try {
        const textEl = tweet.locator('[data-testid="tweetText"]').first();
        const text = await textEl.textContent({ timeout: 3000 });

        // Get tweet link
        const links = await tweet.locator('a[href*="/status/"]').all();
        let tweetUrl = "";
        for (const link of links) {
          const href = await link.getAttribute("href");
          if (href?.includes("/status/")) {
            tweetUrl = `https://x.com${href}`;
            break;
          }
        }

        if (text) {
          results.push({ text: text.slice(0, 200), url: tweetUrl });
        }
      } catch {
        // skip
      }
    }

    await saveSession(context, account);

    console.log(`\n=== X Search: "${query}" — ${results.length} results ===\n`);
    for (const r of results) {
      console.log(`  ${r.text}`);
      if (r.url) console.log(`  → ${r.url}`);
      console.log();
    }
  } catch (err) {
    console.error(`[x:search] Failed:`, (err as Error).message);
  } finally {
    await context.close();
  }
}

// --- Schedule (calendar.json) ---

interface CalendarEntry {
  id: string;
  date: string; // "2026-04-10"
  time: string; // "09:00"
  account: string;
  content: string;
  posted: boolean;
}

async function xSchedule(calendarFile: string): Promise<void> {
  const absPath = path.isAbsolute(calendarFile)
    ? calendarFile
    : path.resolve(process.cwd(), calendarFile);
  const entries: CalendarEntry[] = JSON.parse(readFile(absPath));

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const due = entries.filter(
    (e) => !e.posted && e.date === today && e.time <= hhmm,
  );

  if (due.length === 0) {
    console.log("[x:schedule] No posts due right now.");
    return;
  }

  console.log(`[x:schedule] ${due.length} posts due.`);

  for (const entry of due) {
    const accounts = getSavedAccounts();
    if (!accounts.includes(entry.account)) {
      console.log(`  [skip] @${entry.account} not logged in.`);
      continue;
    }

    await xPost(entry.account, entry.content);
    entry.posted = true;

    // Pace between posts
    await humanDelay(5000, 10000);
  }

  fs.writeFileSync(absPath, JSON.stringify(entries, null, 2));
  const posted = due.filter((e) => e.posted).length;
  console.log(`[x:schedule] ${posted} posted.`);
}

// ---------------------------------------------------------------------------
// Email (Resend API) — unchanged
// ---------------------------------------------------------------------------

interface DripEmail {
  dayOffset: number;
  subject: string;
  heading: string;
  body: string;
  cta: string;
  ctaUrl: string;
}

const DRIP_SEQUENCE: DripEmail[] = [
  { dayOffset: 3, subject: "What SHOGUN remembers", heading: "Here's what SHOGUN remembers.", body: `Imagine asking: "What did I decide about auth last month?" And getting a real answer.<br><br>That's SHOGUN.`, cta: "See how it works", ctaUrl: "https://syogun.com/#how-it-works" },
  { dayOffset: 7, subject: "The AI context tax", heading: "You're paying the AI context tax.", body: `Every session, 3-10 min re-explaining. 15-40 hrs/month. $750-$2,000/month lost.`, cta: "Calculate your tax", ctaUrl: "https://syogun.com/time-tax" },
  { dayOffset: 10, subject: "People are talking", heading: "The response has been incredible.", body: `Thousands of signups from devs and founders tired of AI amnesia.`, cta: "Join on X", ctaUrl: "https://x.com/shogun_ai" },
  { dayOffset: 14, subject: "SHOGUN is live. You're in.", heading: "It's time.", body: `Early adopter pricing: $49/mo annual.<br>&#9642; Work memory<br>&#9642; Cloud machine<br>&#9642; Claude, GPT, Gemini<br><br>14-day free trial.`, cta: "Start free trial", ctaUrl: "https://syogun.com/signup" },
  { dayOffset: 15, subject: "48 hours left", heading: "48 hours left.", body: `$49/mo locks in forever for launch week signups.`, cta: "Lock in $49/mo", ctaUrl: "https://syogun.com/signup" },
];

function buildDripHtml(d: DripEmail): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;"><tr><td style="padding:32px 24px;text-align:center;">
<span style="font-size:28px;letter-spacing:0.15em;color:#F0EDE6;">SHO<span style="color:#C8A96E;">G</span>UN</span>
<div style="margin:12px auto 0;width:40px;height:2px;background:#C8A96E;"></div></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;"><tr><td style="padding:48px 24px;">
<table width="100%" style="max-width:560px;margin:0 auto;">
<tr><td style="padding:0 0 24px;color:#F0EDE6;font-size:24px;font-weight:500;">${d.heading}</td></tr>
<tr><td style="padding:0 0 32px;color:#A0A0A0;font-size:15px;line-height:1.8;">${d.body}</td></tr>
<tr><td style="text-align:center;"><a href="${d.ctaUrl}" style="display:inline-block;padding:14px 40px;background:#C8A96E;color:#080808;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">${d.cta}</a></td></tr>
</table></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;"><tr><td style="padding:24px;text-align:center;color:#666;font-size:11px;">SHOGUN waitlist · Select KK, Tokyo</td></tr></table>
</body></html>`;
}

async function resendFetch(path: string, opts: RequestInit = {}): Promise<unknown> {
  const key = env("RESEND_API_KEY");
  const res = await fetch(`https://api.resend.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...opts.headers },
  });
  const text = await res.text();
  if (!res.ok) { console.error(`[resend] ${res.status}: ${text}`); return null; }
  try { return JSON.parse(text); } catch { return text; }
}

async function getContacts(): Promise<Array<{ email: string; created_at: string }>> {
  const aud = env("RESEND_AUDIENCE_ID");
  const data = (await resendFetch(`/audiences/${aud}/contacts`)) as { data?: Array<{ email: string; created_at: string }> } | null;
  return data?.data ?? [];
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({ from: "SHOGUN <noreply@syogun.com>", to: [to], subject, html }),
  });
  return res !== null;
}

async function runDrip(): Promise<void> {
  const contacts = await getContacts();
  console.log(`[drip] ${contacts.length} contacts`);
  const state = loadState<Record<string, number[]>>("drip", {});
  const now = Date.now();
  let sent = 0;

  for (const c of contacts) {
    const days = Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000);
    const done = state[c.email] ?? [];
    for (const d of DRIP_SEQUENCE) {
      if (days >= d.dayOffset && !done.includes(d.dayOffset)) {
        console.log(`  → ${c.email} day${d.dayOffset}: ${d.subject}`);
        if (await sendEmail(c.email, d.subject, buildDripHtml(d))) { done.push(d.dayOffset); sent++; }
        await sleep(100);
      }
    }
    state[c.email] = done;
  }
  saveState("drip", state);
  console.log(`[drip] ${sent} sent.`);
}

async function emailBlast(subject: string, htmlFile: string): Promise<void> {
  const html = readFile(htmlFile);
  const contacts = await getContacts();
  console.log(`[blast] ${contacts.length} contacts`);
  let sent = 0;
  for (const c of contacts) {
    if (await sendEmail(c.email, subject, html)) sent++;
    await sleep(50);
  }
  console.log(`[blast] ${sent}/${contacts.length} sent.`);
}

async function emailStats(): Promise<void> {
  const contacts = await getContacts();
  const state = loadState<Record<string, number[]>>("drip", {});
  console.log(`\n=== Email Stats ===`);
  console.log(`Waitlist: ${contacts.length}`);
  console.log(`\nDrip:`);
  for (const d of DRIP_SEQUENCE) {
    const n = Object.values(state).filter((o) => o.includes(d.dayOffset)).length;
    console.log(`  Day ${d.dayOffset}: ${n} sent — "${d.subject}"`);
  }
}

// ---------------------------------------------------------------------------
// Stats / Directories
// ---------------------------------------------------------------------------

async function showStats(): Promise<void> {
  console.log(`\n=== SHOGUN Dashboard ===\n`);

  // Stripe
  const sk = process.env.STRIPE_SECRET_KEY;
  if (sk) {
    const res = await fetch("https://api.stripe.com/v1/subscriptions?status=active&limit=100", {
      headers: { Authorization: `Basic ${Buffer.from(sk + ":").toString("base64")}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { data: Array<{ items: { data: Array<{ price: { unit_amount: number }; quantity: number }> } }> };
      let mrr = 0;
      for (const s of data.data) for (const i of s.items.data) mrr += (i.price.unit_amount * i.quantity) / 100;
      console.log(`Stripe: ${data.data.length} subs | MRR $${formatNumber(mrr)} | ARR $${formatNumber(mrr * 12)}`);
    }
  } else {
    console.log("Stripe: not configured");
  }

  // Resend
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    const contacts = await getContacts();
    console.log(`Resend: ${contacts.length} waitlist contacts`);
  }

  // X accounts
  const accounts = getSavedAccounts();
  console.log(`X accounts: ${accounts.length} logged in (${accounts.join(", ") || "none"})`);
  console.log();
}

interface DirectoryEntry {
  name: string;
  url: string;
  priority: "high" | "medium" | "low";
  submitted: boolean;
}

const DEFAULT_DIRS: DirectoryEntry[] = [
  { name: "Product Hunt", url: "producthunt.com", priority: "high", submitted: false },
  { name: "Hacker News", url: "news.ycombinator.com", priority: "high", submitted: false },
  { name: "BetaList", url: "betalist.com", priority: "high", submitted: false },
  { name: "AlternativeTo", url: "alternativeto.net", priority: "high", submitted: false },
  { name: "G2", url: "g2.com", priority: "high", submitted: false },
  { name: "Capterra", url: "capterra.com", priority: "high", submitted: false },
  { name: "SaaSHub", url: "saashub.com", priority: "high", submitted: false },
  { name: "Dev.to", url: "dev.to", priority: "high", submitted: false },
  { name: "Indie Hackers", url: "indiehackers.com", priority: "high", submitted: false },
  { name: "PR TIMES (JA)", url: "prtimes.jp", priority: "high", submitted: false },
  { name: "Note.com (JA)", url: "note.com", priority: "high", submitted: false },
  { name: "Qiita (JA)", url: "qiita.com", priority: "high", submitted: false },
  { name: "There's An AI For That", url: "theresanaiforthat.com", priority: "medium", submitted: false },
  { name: "Future Tools", url: "futuretools.io", priority: "medium", submitted: false },
  { name: "Toolify.ai", url: "toolify.ai", priority: "medium", submitted: false },
  { name: "Futurepedia", url: "futurepedia.io", priority: "medium", submitted: false },
  { name: "Crunchbase", url: "crunchbase.com", priority: "medium", submitted: false },
  { name: "Startup Stash", url: "startupstash.com", priority: "medium", submitted: false },
  { name: "Zenn.dev (JA)", url: "zenn.dev", priority: "medium", submitted: false },
  { name: "THE BRIDGE (JA)", url: "thebridge.jp", priority: "medium", submitted: false },
  { name: "r/SideProject", url: "reddit.com/r/SideProject", priority: "medium", submitted: false },
  { name: "r/Productivity", url: "reddit.com/r/Productivity", priority: "medium", submitted: false },
  { name: "r/MachineLearning", url: "reddit.com/r/MachineLearning", priority: "medium", submitted: false },
  { name: "r/ChatGPT", url: "reddit.com/r/ChatGPT", priority: "medium", submitted: false },
  { name: "r/startups", url: "reddit.com/r/startups", priority: "medium", submitted: false },
  { name: "r/SaaS", url: "reddit.com/r/SaaS", priority: "medium", submitted: false },
  { name: "Lobsters", url: "lobste.rs", priority: "low", submitted: false },
  { name: "SourceForge", url: "sourceforge.net", priority: "low", submitted: false },
  { name: "Stack Share", url: "stackshare.io", priority: "low", submitted: false },
  { name: "LinkedIn", url: "linkedin.com", priority: "low", submitted: false },
];

function showDirectories(): void {
  const dirs = loadState<DirectoryEntry[]>("directories", DEFAULT_DIRS);
  const done = dirs.filter((d) => d.submitted).length;
  console.log(`\n=== Directories: ${done}/${dirs.length} ===\n`);
  for (const p of ["high", "medium", "low"] as const) {
    console.log(`--- ${p.toUpperCase()} ---`);
    for (const d of dirs.filter((d) => d.priority === p)) {
      console.log(`  ${d.submitted ? "[x]" : "[ ]"} ${d.name} — ${d.url}`);
    }
    console.log();
  }
}

function markDirectory(name: string): void {
  const dirs = loadState<DirectoryEntry[]>("directories", DEFAULT_DIRS);
  const found = dirs.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
  if (!found) { console.error(`Not found: ${name}`); return; }
  found.submitted = true;
  saveState("directories", dirs);
  console.log(`✓ ${found.name}`);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    console.log(`
SHOGUN Marketing CLI (Playwright)

  X/Twitter (browser):
    pnpm marketing x:login <account>
    pnpm marketing x:post <account> <text>
    pnpm marketing x:thread <account> <file.json>
    pnpm marketing x:reply <account> <tweet-url> <text>
    pnpm marketing x:multi <text>
    pnpm marketing x:search <query>
    pnpm marketing x:schedule <calendar.json>
    pnpm marketing x:accounts

  Email (Resend):
    pnpm marketing email:drip
    pnpm marketing email:blast <subject> <html-file>
    pnpm marketing email:stats

  Dashboard:
    pnpm marketing stats
    pnpm marketing directories
    pnpm marketing directories:mark <name>
`);
    return;
  }

  switch (command) {
    case "x:login":
      if (!args[0]) { console.error("Usage: x:login <account>"); return; }
      await xLogin(args[0]);
      break;

    case "x:post": {
      const [account, ...rest] = args;
      const text = rest.join(" ");
      if (!account || !text) { console.error("Usage: x:post <account> <text>"); return; }
      await xPost(account, text);
      break;
    }

    case "x:thread": {
      const [account, file] = args;
      if (!account || !file) { console.error("Usage: x:thread <account> <file.json>"); return; }
      await xThread(account, file);
      break;
    }

    case "x:reply": {
      const [account, url, ...rest] = args;
      const text = rest.join(" ");
      if (!account || !url || !text) { console.error("Usage: x:reply <account> <url> <text>"); return; }
      await xReply(account, url, text);
      break;
    }

    case "x:multi": {
      const text = args.join(" ");
      if (!text) { console.error("Usage: x:multi <text>"); return; }
      await xMulti(text);
      break;
    }

    case "x:search": {
      const query = args.join(" ");
      if (!query) { console.error("Usage: x:search <query>"); return; }
      await xSearch(query);
      break;
    }

    case "x:schedule": {
      if (!args[0]) { console.error("Usage: x:schedule <calendar.json>"); return; }
      await xSchedule(args[0]);
      break;
    }

    case "x:accounts":
      console.log(`Saved accounts: ${getSavedAccounts().join(", ") || "(none)"}`);
      break;

    case "email:drip":
      await runDrip();
      break;

    case "email:blast": {
      const [subject, file] = args;
      if (!subject || !file) { console.error("Usage: email:blast <subject> <file>"); return; }
      await emailBlast(subject, file);
      break;
    }

    case "email:stats":
      await emailStats();
      break;

    case "stats":
      await showStats();
      break;

    case "directories":
      showDirectories();
      break;

    case "directories:mark":
      if (!args[0]) { console.error("Usage: directories:mark <name>"); return; }
      markDirectory(args.join(" "));
      break;

    default:
      console.error(`Unknown: ${command}`);
  }
}

main().catch(console.error);
