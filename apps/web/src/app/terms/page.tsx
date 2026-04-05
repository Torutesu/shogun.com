import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — SHOGUN",
  description: "Terms and conditions for using the SHOGUN platform.",
};

export default function TermsPage() {
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
          TERMS OF SERVICE
        </h1>
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-12 font-mono">
          Last updated: March 30, 2026
        </p>

        <div className="space-y-10 font-body text-[15px] leading-[1.8] text-light-text-muted dark:text-dark-text-muted">
          <Section title="1. Agreement">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of SHOGUN
              (&quot;syogun.com&quot;), operated by Select KK, Tokyo, Japan. By creating
              an account or using the service, you agree to these Terms. If you do not
              agree, do not use the service.
            </p>
          </Section>

          <Section title="2. Account Terms">
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least 16 years of age to use SHOGUN.</li>
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                One person or entity per account. Sharing accounts is not permitted.
              </li>
              <li>
                You must provide accurate and complete information during registration.
              </li>
              <li>
                You are responsible for all activity that occurs under your account.
              </li>
            </ul>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You agree not to use SHOGUN to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Violate any applicable law, regulation, or third-party rights.
              </li>
              <li>
                Distribute malware, conduct attacks, or exploit vulnerabilities in other
                systems.
              </li>
              <li>
                Mine cryptocurrency or run computationally abusive workloads unrelated
                to your work.
              </li>
              <li>
                Store or distribute illegal content, including child exploitation
                material.
              </li>
              <li>
                Circumvent rate limits, resource quotas, or security controls.
              </li>
              <li>
                Resell, sublicense, or provide the service to third parties without
                written consent.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these
              terms without prior notice.
            </p>
          </Section>

          <Section title="4. Your Cloud Machine">
            <p>
              SHOGUN provides each user with a dedicated Linux cloud machine. You have
              full control over your machine, including the ability to install software,
              run processes, and deploy services.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Machine resources (CPU, RAM, storage) are subject to your subscription
                tier limits.
              </li>
              <li>
                Machines may be automatically stopped after extended inactivity to
                conserve resources. Your data is preserved.
              </li>
              <li>
                We do not access the contents of your machine except as required for
                service operation or legal compliance.
              </li>
            </ul>
          </Section>

          <Section title="5. Payment Terms">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                SHOGUN offers Free, Basic, Pro, and Ultra subscription tiers.
              </li>
              <li>
                Paid subscriptions are billed monthly via Stripe. You authorize
                recurring charges to your payment method.
              </li>
              <li>
                AI usage beyond your included credits is billed at published per-token
                rates.
              </li>
              <li>
                You may cancel at any time. Access continues until the end of the
                current billing period. No prorated refunds.
              </li>
              <li>
                Prices may change with 30 days advance notice. Continued use after a
                price change constitutes acceptance.
              </li>
            </ul>
          </Section>

          <Section title="6. Your Data & Intellectual Property">
            <p>
              You retain full ownership of all content you create, upload, or generate
              using SHOGUN. We claim no intellectual property rights over your data.
            </p>
            <p>
              You grant us a limited license to store, process, and transmit your data
              solely to provide the service (e.g., sending your messages to AI
              providers, storing files on your behalf).
            </p>
          </Section>

          <Section title="7. Service Availability">
            <p>
              We strive for high availability but do not guarantee uninterrupted service.
              SHOGUN is provided &quot;as is&quot; and &quot;as available.&quot;
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Scheduled maintenance will be communicated in advance when possible.
              </li>
              <li>
                Third-party AI providers (Anthropic, OpenAI, Google) may experience
                outages beyond our control.
              </li>
              <li>
                We are not liable for data loss caused by events outside our reasonable
                control.
              </li>
            </ul>
          </Section>

          <Section title="8. Termination">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You may delete your account at any time from Settings. Account deletion
                is permanent and irreversible.
              </li>
              <li>
                We may terminate or suspend your account for violation of these Terms,
                non-payment, or prolonged inactivity (12+ months on the free tier).
              </li>
              <li>
                Upon termination, your cloud machine, files, memory, and conversations
                will be permanently deleted within 30 days.
              </li>
            </ul>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Select KK shall not be
              liable for any indirect, incidental, special, consequential, or punitive
              damages, including loss of profits, data, or business opportunities,
              arising from your use of SHOGUN.
            </p>
            <p>
              Our total aggregate liability for any claim arising from the service shall
              not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="10. Disclaimer of Warranties">
            <p>
              SHOGUN is provided without warranties of any kind, whether express or
              implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p>
              AI-generated outputs may be inaccurate, incomplete, or biased. You are
              solely responsible for reviewing and validating any AI output before
              relying on it.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>
              We may update these Terms from time to time. Material changes will be
              communicated via email or in-app notification at least 14 days before they
              take effect. Continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with the laws of
              Japan. Any disputes shall be subject to the exclusive jurisdiction of the
              courts of Tokyo, Japan.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:legal@syogun.com"
                className="text-gold hover:underline"
              >
                legal@syogun.com
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
            <Link href="/privacy" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
              Privacy Policy
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
