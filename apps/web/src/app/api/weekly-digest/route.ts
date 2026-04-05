import { NextResponse } from "next/server";

/**
 * POST /api/weekly-digest
 *
 * Sends weekly usage digest emails to active users.
 * Called by cron (n8n/Vercel Cron) every Monday.
 *
 * Requires: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  // In production, this would:
  // 1. Query Supabase for active users in last 7 days
  // 2. Aggregate their stats (memory entries, conversations, estimated time saved)
  // 3. Send personalized digest email with share button

  // For now, return the template structure
  return NextResponse.json({
    status: "ok",
    message: "Weekly digest endpoint ready. Connect to Supabase for production use.",
    emailTemplate: {
      subject: "Your week in SHOGUN",
      sections: [
        "Memory entries captured: {count}",
        "AI conversations: {count}",
        "Time saved (estimated): {hours} hours",
        "Top memory search: \"{query}\"",
      ],
      shareButton: {
        text: "I saved {hours} hours this week with SHOGUN — AI that remembers my work. syogun.com",
        url: "https://twitter.com/intent/tweet?text={encoded}",
      },
    },
  });
}
