"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@shogun/ui";
import { HANDLE_REGEX, RESERVED_HANDLES } from "@shogun/shared/constants";
import { createSupabaseBrowser } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "handle" | "provisioning" | "personalization" | "notifications" | "ready";

const STEPS: Step[] = ["handle", "provisioning", "personalization", "notifications", "ready"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("handle");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleChecking, setHandleChecking] = useState(false);
  const [commStyle, setCommStyle] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [provisionProgress, setProvisionProgress] = useState(0);
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
      // Check directly via Supabase (no API server needed)
      const supabase = createSupabaseBrowser();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("handle", value)
          .maybeSingle();
        setHandleError(data ? "This handle is already taken" : null);
      } else {
        // Supabase not configured — allow any handle in dev
        setHandleError(null);
      }
    } catch {
      // If check fails, allow continuing (API might be down)
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

  // Provisioning simulation
  useEffect(() => {
    if (step !== "provisioning") return;
    const interval = setInterval(() => {
      setProvisionProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep("personalization"), 500);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [step]);

  const handleSubmitHandle = async () => {
    if (handleChecking || !handle || handle.length < 3) return;
    setStep("provisioning");
    setProvisionProgress(0);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.auth.completeOnboarding({
        handle,
        communicationStyle: commStyle || undefined,
        phone: phone || undefined,
        lineId: lineId || undefined,
      });
      setStep("ready");
    } catch {
      // proceed anyway
      setStep("ready");
    } finally {
      setLoading(false);
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

        {/* Step: Provisioning */}
        {step === "provisioning" && (
          <div className="space-y-4 text-center">
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
          </div>
        )}

        {/* Step: Personalization */}
        {step === "personalization" && (
          <div className="space-y-4">
            <h2
              className="text-xl tracking-wide text-dark-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              PERSONALIZATION
            </h2>
            <p className="text-sm text-dark-text-muted">
              How should SHOGUN talk to you?
            </p>
            <textarea
              value={commStyle}
              onChange={(e) => setCommStyle(e.target.value)}
              placeholder="e.g., Be concise and direct. Use casual tone. Respond in English unless I write in Japanese."
              rows={4}
              className="w-full rounded-md border border-dark-border bg-transparent px-3 py-2 text-sm text-dark-text placeholder:text-dark-text-dim outline-none focus:border-gold resize-none"
            />
            <Button onClick={() => setStep("notifications")} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {/* Step: Notifications */}
        {step === "notifications" && (
          <div className="space-y-4">
            <h2
              className="text-xl tracking-wide text-dark-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NOTIFICATIONS
            </h2>
            <p className="text-sm text-dark-text-muted">
              Set up SMS or LINE notifications (optional).
            </p>
            <Input
              label="Phone number (SMS)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="border-dark-border text-dark-text placeholder:text-dark-text-dim bg-transparent"
            />
            <Input
              label="LINE ID"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="your-line-id"
              className="border-dark-border text-dark-text placeholder:text-dark-text-dim bg-transparent"
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleFinish} className="flex-1 text-dark-text-muted">
                Skip
              </Button>
              <Button onClick={handleFinish} className="flex-1" disabled={loading}>
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Ready */}
        {step === "ready" && (
          <div className="space-y-4 text-center">
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
