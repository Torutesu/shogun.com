"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PLAN, ANNUAL_SAVINGS_USD } from "@shogun/shared/constants";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import Link from "next/link";

interface BillingData {
  interval: "monthly" | "annual";
  demoCreditsCents: number;
  connectedKeys: string[]; // e.g. ["claude", "openai", "gemini"]
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.billing
      .getUsage()
      .then((data) =>
        setBilling({
          interval: data.interval ?? "monthly",
          demoCreditsCents: data.demoCreditsCents ?? 0,
          connectedKeys: data.connectedKeys ?? [],
        }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleManage = async () => {
    try {
      const { url } = await api.billing.getPortalUrl();
      window.location.href = url;
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Billing" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  const interval = billing?.interval ?? "monthly";
  const price =
    interval === "annual" ? PLAN.priceAnnualUsd : PLAN.priceMonthlyUsd;
  const demoCents = billing?.demoCreditsCents ?? 0;
  const connectedKeys = billing?.connectedKeys ?? [];

  return (
    <div className="flex h-full flex-col">
      <Header title="Billing" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 max-w-3xl space-y-6">
        {/* Current plan */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim mb-1">
                Current plan
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl tracking-wide text-light-text dark:text-dark-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {PLAN.name}
                </span>
                <Badge variant="gold">
                  ${price}/mo
                  {interval === "annual" && (
                    <span className="ml-1 opacity-70">annual</span>
                  )}
                </Badge>
              </div>
              {interval === "annual" && (
                <p className="mt-1 text-xs text-light-text-dim dark:text-dark-text-dim font-mono">
                  Billed annually at ${PLAN.priceAnnualUsd * 12}/yr
                </p>
              )}
            </div>
            <Button size="sm" variant="secondary" onClick={handleManage}>
              Manage billing
            </Button>
          </div>

          {/* Switch to annual CTA */}
          {interval === "monthly" && (
            <div className="rounded-[10px] border border-gold/30 bg-gold/5 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-light-text dark:text-dark-text">
                Switch to annual and save{" "}
                <span className="font-medium text-gold">
                  ${ANNUAL_SAVINGS_USD}/yr
                </span>
              </p>
              <Button size="sm" variant="primary" onClick={handleManage}>
                Switch to annual
              </Button>
            </div>
          )}
        </Card>

        {/* Demo credits */}
        {demoCents > 0 && (
          <Card>
            <p className="text-xs font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim mb-1">
              Demo credits
            </p>
            <p className="text-sm text-light-text dark:text-dark-text">
              <span className="font-mono font-medium">
                ${(demoCents / 100).toFixed(2)}
              </span>{" "}
              remaining
            </p>
            <p className="mt-1 text-xs text-light-text-muted dark:text-dark-text-muted">
              One-time credits to try AI features before connecting your own API
              keys.
            </p>
          </Card>
        )}

        {/* API Keys */}
        <Card>
          <p className="text-xs font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim mb-2">
            API Keys
          </p>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-4">
            SHOGUN uses your own AI API keys. Connect Claude, GPT, or Gemini in
            Settings.
          </p>

          {connectedKeys.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {connectedKeys.map((key) => (
                <Badge key={key} variant="green">
                  {key}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-4">
              No API keys connected yet.
            </p>
          )}

          <Link href="/settings">
            <Button size="sm" variant="secondary">
              Manage API keys
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
