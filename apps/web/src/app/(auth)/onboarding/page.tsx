"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@shogun/ui";
import { HANDLE_REGEX, RESERVED_HANDLES } from "@shogun/shared/constants";
import { createSupabaseBrowser } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "handle" | "keys" | "ready";

const STEPS: Step[] = ["handle", "keys", "ready"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("handle");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleChecking, setHandleChecking] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionDone, setProvisionDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIdx = STEPS.indexOf(step);
  const progress = ((currentIdx + 1) / STEPS.length) * 100;

  // Real-time handle availability check
  const checkHandle = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setHandleError(value.length > 0 ? "Handle must be at least 3 characters" : null);
      return;
    }
    if (!HANDLE_REGEX.test(value)) {
      setHandleError("Only lowercase letters, numbers, and hyphens");
      return;
    }
    if (RESERVED_HANDLES.includes(value)) {
      setHandleError("This handle is reserved");
      return;
    }
    setHandleChecking(true);
    try {
      const supabase = createSupabaseBrowser();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("handle", value)
          .maybeSingle();
        setHandleError(data ? "This handle is already taken" : null);
      } else {
        setHandleError(null);
      }
    } catch {
      setHandleError(null);
    } finally {
      setHandleChecking(false);
    }
  }, []);

  const onHandleChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setHandle(cleaned);
    setHandleError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkHandle(cleaned), 400);
  };

  // Provisioning simulation — runs during the "ready" step
  useEffect(() => {
    if (step !== "ready") return;
    const interval = setInterval(() => {
      setProvisionProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setProvisionDone(true), 400);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [step]);

  const hasAnyKey = Object.values(apiKeys).some((k) => k.trim().length > 0);

  const handleSubmitHandle = async () => {
    if (handleChecking || !handle || handle.length < 3) return;
    setStep("keys");
  };

  const handleSubmitKeys = async () => {
    setLoading(true);
    try {
      await api.auth.completeOnboarding({
        handle,
        apiKeys,
      });
    } catch {
      // proceed anyway — provisioning can retry
    } finally {
      setLoading(false);
      setStep("ready");
      setProvisionProgress(0);
      setProvisionDone(false);
    }
  };

  const handleSkipKeys = async () => {
    setLoading(true);
    try {
      await api.auth.completeOnboarding({
        handle,
        apiKeys: {},
      });
    } catch {
      // proceed anyway — demo credits will be used
    } finally {
      setLoading(false);
      setStep("ready");
      setProvisionProgress(0);
      setProvisionDone(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Progress bar */}
      <div className="mb-6 h-1 w-full rounded-full bg-dark-border">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="rounded-lg border border-dark-border bg-dark-card p-6">
        {/* Step: Handle */}
        {step === "handle" && (
          <div className="space-y-4">
            <h2
              className="text-xl tracking-wide text-dark-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CHOOSE YOUR HANDLE
            </h2>
            <p className="text-sm text-dark-text-muted">
              This becomes <span className="font-mono text-gold">{handle || "you"}.syogun.com</span>
            </p>
            <Input
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              placeholder="your-handle"
              error={handleError ?? undefined}
              maxLength={30}
              className="border-dark-border text-dark-text placeholder:text-dark-text-dim bg-transparent"
            />
            {handleChecking && (
              <p className="text-xs text-dark-text-dim">Checking availability...</p>
            )}
            {handle && !handleError && !handleChecking && handle.length >= 3 && (
              <p className="text-xs text-emerald-400">Available</p>
            )}
            <Button
              onClick={handleSubmitHandle}
              disabled={!handle || !!handleError || handleChecking || handle.length < 3}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step: API Keys */}
        {step === "keys" && (
          <div className="space-y-4">
            <h2
              className="text-xl tracking-wide text-dark-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CONNECT YOUR AI
            </h2>
            <p className="text-sm text-dark-text-muted">
              Paste your API key from any provider. SHOGUN uses your keys directly — we never store or charge for AI usage.
            </p>

            {[
              { id: "anthropic", label: "Claude (Anthropic)", placeholder: "sk-ant-..." },
              { id: "openai", label: "GPT (OpenAI)", placeholder: "sk-..." },
              { id: "google", label: "Gemini (Google)", placeholder: "AI..." },
            ].map((provider) => (
              <div key={provider.id}>
                <label className="block text-xs font-mono uppercase tracking-wider text-dark-text-dim mb-1">
                  {provider.label}
                </label>
                <input
                  type="password"
                  value={apiKeys[provider.id] || ""}
                  onChange={(e) =>
                    setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                  }
                  placeholder={provider.placeholder}
                  className="w-full rounded-md border border-dark-border bg-transparent px-3 py-2 text-sm text-dark-text placeholder:text-dark-text-dim outline-none focus:border-gold"
                />
              </div>
            ))}

            <Button onClick={handleSubmitKeys} disabled={!hasAnyKey || loading} className="w-full">
              {loading ? "Saving..." : "Continue"}
            </Button>
            <button
              onClick={handleSkipKeys}
              disabled={loading}
              className="w-full text-center text-xs text-dark-text-dim hover:text-dark-text-muted transition-colors cursor-pointer"
            >
              Skip — use $5 demo credits instead
            </button>
          </div>
        )}

        {/* Step: Ready (with background provisioning) */}
        {step === "ready" && (
          <div className="space-y-4 text-center">
            {!provisionDone ? (
              <>
                <h2
                  className="text-xl tracking-wide text-dark-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  SETTING UP YOUR SERVER
                </h2>
                <p className="text-sm text-dark-text-muted">
                  Provisioning your personal cloud computer...
                </p>
                <div className="h-2 w-full rounded-full bg-dark-border">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-300"
                    style={{ width: `${Math.min(provisionProgress, 100)}%` }}
                  />
                </div>
                <p className="font-mono text-xs text-dark-text-dim">
                  {Math.min(Math.round(provisionProgress), 100)}%
                </p>
              </>
            ) : (
              <>
                <h2
                  className="text-2xl tracking-wide text-dark-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  YOUR SHOGUN IS READY
                </h2>
                <p className="text-sm text-dark-text-muted">
                  <span className="font-mono text-gold">@{handle}</span> is live.
                </p>
                <Button onClick={() => router.push("/chat")} className="w-full">
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 w-6 rounded-full transition-colors",
              i <= currentIdx ? "bg-gold" : "bg-dark-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
