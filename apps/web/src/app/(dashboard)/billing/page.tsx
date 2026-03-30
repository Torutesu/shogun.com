"use client";

import { useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import { api } from "@/lib/api";
import { TIER_CONFIGS, MODEL_CONFIGS } from "@shogun/shared/constants";
import type { SubscriptionTier } from "@shogun/shared/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";

interface UsageData {
  tier: string;
  creditsUsedCents: number;
  creditsIncludedCents: number;
  breakdown: { model: string; tokens: number; costCents: number }[];
}

const tierBadgeVariant: Record<string, "default" | "gold" | "green" | "blue"> = {
  free: "default",
  basic: "gold",
  pro: "green",
  ultra: "blue",
};

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.billing.getUsage().then(setUsage).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier: string) => {
    try {
      const { url } = await api.billing.createCheckout(tier);
      window.location.href = url;
    } catch {
      // ignore
    }
  };

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
        <div className="flex flex-1 items-center justify-center"><Spinner /></div>
      </div>
    );
  }

  const currentTier = (usage?.tier ?? "free") as SubscriptionTier;
  const config = TIER_CONFIGS[currentTier];
  const creditsUsed = usage?.creditsUsedCents ?? 0;
  const creditsTotal = usage?.creditsIncludedCents ?? config.creditsIncludedCents;
  const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0);
  const usagePercent = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  return (
    <div className="flex h-full flex-col">
      <Header title="Billing" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 max-w-3xl">
        {/* Current plan */}
        <Card className="mb-6">
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
                  {currentTier.toUpperCase()}
                </span>
                <Badge variant={tierBadgeVariant[currentTier] ?? "default"}>
                  ${config.priceUsd}/mo
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {currentTier !== "ultra" && (
                <Button size="sm" onClick={() => handleUpgrade(currentTier === "free" ? "basic" : currentTier === "basic" ? "pro" : "ultra")}>
                  Upgrade
                </Button>
              )}
              {currentTier !== "free" && (
                <Button size="sm" variant="secondary" onClick={handleManage}>
                  Manage billing
                </Button>
              )}
            </div>
          </div>

          {/* Credits bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-light-text-muted dark:text-dark-text-muted">
                AI credits
              </p>
              <p className="text-xs font-mono text-light-text-dim dark:text-dark-text-dim">
                ${(creditsRemaining / 100).toFixed(2)} remaining
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-light-surface dark:bg-dark-surface">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-gold",
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
              ${(creditsUsed / 100).toFixed(2)} of ${(creditsTotal / 100).toFixed(2)} used this month
            </p>
          </div>
        </Card>

        {/* Usage breakdown */}
        {usage?.breakdown && usage.breakdown.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
              Usage breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-[0.65rem] font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim border-b border-light-border dark:border-dark-border pb-1.5">
                <span className="flex-1">Model</span>
                <span className="w-24 text-right">Tokens</span>
                <span className="w-20 text-right">Cost</span>
              </div>
              {usage.breakdown.map((row) => {
                const modelName = (MODEL_CONFIGS as Record<string, { name: string }>)[row.model]?.name ?? row.model;
                return (
                  <div key={row.model} className="flex items-center text-sm">
                    <span className="flex-1 text-light-text dark:text-dark-text">{modelName}</span>
                    <span className="w-24 text-right font-mono text-xs text-light-text-muted dark:text-dark-text-muted">
                      {row.tokens.toLocaleString()}
                    </span>
                    <span className="w-20 text-right font-mono text-xs text-light-text-muted dark:text-dark-text-muted">
                      ${(row.costCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tier comparison */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">Plans</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(TIER_CONFIGS) as SubscriptionTier[]).map((tier) => {
              const tc = TIER_CONFIGS[tier];
              const isCurrent = tier === currentTier;
              return (
                <Card
                  key={tier}
                  className={cn(isCurrent && "border-gold/50")}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="text-lg tracking-wide text-light-text dark:text-dark-text"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {tier.toUpperCase()}
                    </span>
                    {isCurrent && <Badge variant="gold">Current</Badge>}
                  </div>
                  <p className="text-xl font-medium text-light-text dark:text-dark-text mb-3">
                    ${tc.priceUsd}<span className="text-xs text-light-text-muted dark:text-dark-text-muted">/mo</span>
                  </p>
                  <ul className="space-y-1 text-xs text-light-text-muted dark:text-dark-text-muted">
                    <li>{tc.cpuCores} CPU cores</li>
                    <li>{tc.memoryMb >= 1024 ? `${tc.memoryMb / 1024} GB` : `${tc.memoryMb} MB`} RAM</li>
                    <li>${(tc.creditsIncludedCents / 100).toFixed(0)} AI credits</li>
                    <li>{tc.maxServices} services</li>
                    {tc.alwaysOn && <li>Always-on machine</li>}
                    {tc.customDomain && <li>Custom domains</li>}
                  </ul>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant={tier === "free" ? "secondary" : "primary"}
                      className="mt-3 w-full"
                      onClick={() => handleUpgrade(tier)}
                    >
                      {tier === "free" ? "Downgrade" : "Upgrade"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
