import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — SHOGUN",
  description: "How SHOGUN collects, stores, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      {/* Header */}
      <header className="border-b border-light-border dark:border-dark-border">
        <div className="mx-auto max-w-[800px] px-6 py-8">
          <Link
            href="/"
            className="font-display text-xl tracking-[0.15em] text-light-text dark:text-dark-text"
          >
            SHOGUN
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="font-display text-4xl tracking-[0.08em] text-light-text dark:text-dark-text mb-2">
          PRIVACY POLICY
        </h1>
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-12 font-mono">
          Last updated: March 30, 2026
        </p>

        <div className="space-y-10 font-body text-[15px] leading-[1.8] text-light-text-muted dark:text-dark-text-muted">
          <Section title="1. Introduction">
            <p>
              SHOGUN (&quot;syogun.com&quot;) is operated by Select KK, Tokyo, Japan. This
              Privacy Policy explains how we collect, use, store, and protect your
              personal information when you use the SHOGUN platform, including the
              dashboard, AI chat, cloud machine, file storage, work memory, and desktop
              application.
            </p>
            <p>
              By using SHOGUN, you agree to the practices described in this policy.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Account data:</strong> email address, display name, handle,
                authentication tokens, and billing information.
              </li>
              <li>
                <strong>Work memory:</strong> text-only captures of your screen content,
                processed via OCR. We capture text only — no screenshots, images, or
                video are stored.
              </li>
              <li>
                <strong>Conversations:</strong> messages exchanged with the AI assistant,
                including tool call inputs and outputs.
              </li>
              <li>
                <strong>Files:</strong> files you upload to or create on your cloud
                machine.
              </li>
              <li>
                <strong>Usage data:</strong> machine status, feature usage patterns, and
                error logs for operational purposes.
              </li>
              <li>
                <strong>Meeting transcriptions:</strong> audio transcribed via OpenAI
                Whisper API when you enable meeting capture. Audio is processed in
                real-time and not retained.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Store Your Data">
            <p>Your data is protected by multiple layers of security:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Row-Level Security (RLS):</strong> all database tables enforce
                RLS policies so each user can only access their own data.
              </li>
              <li>
                <strong>Encryption at rest:</strong> all data is stored encrypted. API
                keys you provide (BYOK) are encrypted with AES-256 before storage.
              </li>
              <li>
                <strong>Isolated machines:</strong> each user receives a dedicated Linux
                cloud container. Your files, processes, and services run in isolation.
              </li>
              <li>
                <strong>File storage:</strong> files are stored on Cloudflare R2 with
                per-user access controls.
              </li>
              <li>
                <strong>Vector embeddings:</strong> work memory entries are embedded
                using text-embedding-3-small for semantic search. Embeddings are stored
                alongside the original text in your isolated database rows.
              </li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Data">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                To provide AI assistance with context from your work history (work
                memory).
              </li>
              <li>
                To operate your cloud machine and execute tool calls on your behalf.
              </li>
              <li>To process billing and manage your subscription.</li>
              <li>
                To improve service reliability through aggregated, anonymized usage
                metrics.
              </li>
            </ul>
          </Section>

          <Section title="5. AI Model Usage & Training">
            <p>
              <strong>
                We do not use your data to train AI models.
              </strong>{" "}
              Your conversations, files, and memory entries are sent to third-party AI
              providers (Anthropic, OpenAI, Google) only to generate responses in
              real-time. We use API access that explicitly excludes training on customer
              data.
            </p>
            <p>
              If you provide your own API keys (BYOK), requests are sent directly to
              the provider under your own account terms.
            </p>
          </Section>

          <Section title="6. Data Sharing">
            <p>We do not sell your data. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>AI providers</strong> (Anthropic, OpenAI, Google) to process
                your AI requests. Subject to their API data usage policies, which
                exclude training.
              </li>
              <li>
                <strong>Infrastructure providers</strong> (Fly.io, Cloudflare, Supabase)
                to host and operate the service.
              </li>
              <li>
                <strong>Stripe</strong> for payment processing.
              </li>
              <li>
                <strong>Legal obligations:</strong> if required by law or to protect the
                rights and safety of our users.
              </li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Access</strong> all data associated with your account.
              </li>
              <li>
                <strong>Export</strong> your work memory in JSON or CSV format.
              </li>
              <li>
                <strong>Delete</strong> individual memory entries, conversations, or
                files at any time.
              </li>
              <li>
                <strong>Delete your account</strong> entirely, which permanently removes
                all associated data including your cloud machine, files, memory, and
                conversations.
              </li>
              <li>
                <strong>Disable</strong> work memory capture at any time from Settings.
              </li>
            </ul>
          </Section>

          <Section title="8. Data Retention">
            <p>
              Your data is retained for as long as your account is active. Work memory
              entries are subject to the retention period you configure (default: 90
              days). You can adjust this in Settings.
            </p>
            <p>
              Upon account deletion, all data is permanently removed within 30 days.
              Backups are purged on a rolling cycle.
            </p>
          </Section>

          <Section title="9. Cookies & Tracking">
            <p>
              SHOGUN uses essential cookies for authentication only. We do not use
              third-party analytics, advertising trackers, or marketing cookies.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy from time to time. Material changes will be
              communicated via email or in-app notification. Continued use after changes
              constitutes acceptance.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy inquiries, data requests, or concerns, contact us at{" "}
              <a
                href="mailto:privacy@syogun.com"
                className="text-gold hover:underline"
              >
                privacy@syogun.com
              </a>
              .
            </p>
            <p className="mt-2">
              Select KK
              <br />
              Tokyo, Japan
            </p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-light-border dark:border-dark-border py-8 px-6">
        <div className="mx-auto max-w-[800px] flex items-center justify-between text-xs text-light-text-dim dark:text-dark-text-dim font-body">
          <span>&copy; {new Date().getFullYear()} Select KK</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-body font-medium text-lg text-light-text dark:text-dark-text mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
