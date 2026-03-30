import type { Locale } from "@shogun/shared/types";
import { t } from "@shogun/shared/i18n";
import Link from "next/link";

interface LPFooterProps {
  locale: Locale;
}

export default function LPFooter({ locale }: LPFooterProps) {
  return (
    <footer className="bg-dark border-t border-dark-border py-10 px-6">
      <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-lg tracking-[0.15em] text-dark-text select-none"
        >
          SHOGUN
        </Link>

        {/* Copyright + links */}
        <div className="flex items-center gap-6 font-body text-xs text-dark-text-muted">
          <span>{t(locale, "lp.footer.copyright")}</span>
          <Link href="/privacy" className="hover:text-dark-text transition-colors">
            {t(locale, "lp.footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-dark-text transition-colors">
            {t(locale, "lp.footer.terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
