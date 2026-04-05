"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/loading";
import type { AIProvider } from "@shogun/shared/types";

type Tab = "profile" | "apikeys" | "memory" | "notifications" | "referral" | "danger";

const tabs: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "apikeys", label: "API Keys" },
  { key: "memory", label: "Memory" },
  { key: "notifications", label: "Notifications" },
  { key: "referral", label: "Referral" },
  { key: "danger", label: "Danger zone" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="flex h-full flex-col">
      <Header title="Settings" />

      <div className="flex-1 overflow-y-auto">
        {/* Tab nav */}
        <div className="border-b border-light-border dark:border-dark-border px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "whitespace-nowrap px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-b-2",
                  activeTab === tab.key
                    ? "border-gold text-gold"
                    : "border-transparent text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6 py-6 max-w-2xl">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "apikeys" && <ApiKeysTab />}
          {activeTab === "memory" && <MemoryTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "referral" && <ReferralTab />}
          {activeTab === "danger" && <DangerTab />}
        </div>
      </div>
    </div>
  );
}

/* ---- Profile Tab ---- */

function ProfileTab() {
  const { user, refresh } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [commStyle, setCommStyle] = useState(user?.communicationStyle ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.profile.update({ displayName, communicationStyle: commStyle, timezone });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-1">Handle</h3>
        <p className="font-mono text-sm text-gold">@{user?.handle}</p>
      </div>
      <Input
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Your name"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
          Communication style
        </label>
        <textarea
          value={commStyle}
          onChange={(e) => setCommStyle(e.target.value)}
          placeholder="How should SHOGUN talk to you?"
          rows={3}
          className="w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 py-2 text-sm outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim focus:border-gold resize-none"
        />
      </div>
      <Input
        label="Timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        placeholder="America/New_York"
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {saved && <span className="text-xs text-emerald-500">Saved</span>}
      </div>
    </div>
  );
}

/* ---- API Keys Tab ---- */

function ApiKeysTab() {
  const [keys, setKeys] = useState<{ id: string; provider: string; maskedKey: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<string>("anthropic");
  const [keyValue, setKeyValue] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.apiKeys.list().then(setKeys).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!keyValue.trim()) return;
    setAdding(true);
    try {
      const { id } = await api.apiKeys.add(provider, keyValue);
      setKeys((prev) => [...prev, {
        id,
        provider,
        maskedKey: `${keyValue.slice(0, 6)}...${keyValue.slice(-4)}`,
        createdAt: new Date().toISOString(),
      }]);
      setShowAdd(false);
      setKeyValue("");
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.apiKeys.delete(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          Bring your own API keys to avoid credit charges.
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>Add key</Button>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-light-text-dim dark:text-dark-text-dim py-4">No API keys added</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <Card key={k.id}>
              <div className="flex items-center gap-3">
                <Badge variant="gold">{k.provider}</Badge>
                <span className="font-mono text-xs text-light-text-muted dark:text-dark-text-muted flex-1">
                  {k.maskedKey}
                </span>
                <Button size="sm" variant="danger" onClick={() => handleDelete(k.id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ADD API KEY">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-10 w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text focus:border-gold"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
            </select>
          </div>
          <Input
            label="API Key"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="sk-..."
            type="password"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding || !keyValue.trim()}>
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---- Memory Tab ---- */

function MemoryTab() {
  const [captureEnabled, setCaptureEnabled] = useState(true);
  const [interval, setInterval] = useState("30");
  const [retention, setRetention] = useState("90");
  const [excludedApps, setExcludedApps] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.memory.updateSettings({
        captureEnabled,
        intervalSeconds: parseInt(interval) || 30,
        retentionDays: parseInt(retention) || 90,
        excludedApps: excludedApps.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text">Memory capture</h3>
          <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-0.5">
            Record text from your screen to build work memory
          </p>
        </div>
        <button
          onClick={() => setCaptureEnabled(!captureEnabled)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
            captureEnabled ? "bg-gold" : "bg-light-border dark:bg-dark-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
              captureEnabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
      <Input
        label="Capture interval (seconds)"
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        type="number"
      />
      <Input
        label="Retention (days)"
        value={retention}
        onChange={(e) => setRetention(e.target.value)}
        type="number"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
          Excluded apps (comma-separated)
        </label>
        <input
          value={excludedApps}
          onChange={(e) => setExcludedApps(e.target.value)}
          placeholder="1Password, Signal, Banking"
          className="h-10 w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim focus:border-gold"
        />
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

/* ---- Notifications Tab ---- */

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
        Manage notification channels for automations and alerts.
      </p>
      <Card>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-light-text-muted dark:text-dark-text-muted">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-light-text dark:text-dark-text">Email</p>
            <p className="text-xs text-light-text-muted dark:text-dark-text-muted">Primary notification channel</p>
          </div>
          <Badge variant="green">Verified</Badge>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-light-text-muted dark:text-dark-text-muted">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-light-text dark:text-dark-text">SMS</p>
            <p className="text-xs text-light-text-muted dark:text-dark-text-muted">Text message alerts</p>
          </div>
          <Button size="sm" variant="secondary">Add</Button>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-light-text-muted dark:text-dark-text-muted">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-light-text dark:text-dark-text">LINE</p>
            <p className="text-xs text-light-text-muted dark:text-dark-text-muted">LINE messaging</p>
          </div>
          <Button size="sm" variant="secondary">Connect</Button>
        </div>
      </Card>
    </div>
  );
}

/* ---- Referral Tab ---- */

function ReferralTab() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralLink = `https://syogun.com?ref=${user?.handle ?? ""}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-1">Referral Program</h3>
        <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
          Earn 30% recurring commission for every user you refer.
        </p>
      </div>

      <Card>
        <div className="space-y-3">
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            Your referral link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 flex items-center rounded-md border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card px-3">
              <span className="font-mono text-xs text-light-text dark:text-dark-text truncate">
                {referralLink}
              </span>
            </div>
            <Button size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-gold">How it works</h4>
          <ul className="space-y-1.5 text-xs text-light-text-muted dark:text-dark-text-muted">
            <li>1. Share your referral link with friends and colleagues</li>
            <li>2. They sign up and subscribe to any paid plan</li>
            <li>3. You earn 30% recurring commission every month</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

/* ---- Danger Tab ---- */

function DangerTab() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { logout } = useAuth();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.profile.deleteAccount();
      await logout();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Card className="border-red-500/30">
        <h3 className="text-sm font-medium text-red-500 mb-1">Delete account</h3>
        <p className="text-xs text-light-text-muted dark:text-dark-text-muted mb-3">
          Permanently delete your account, machine, all files, and memory. This cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
          Delete account
        </Button>
      </Card>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="CONFIRM DELETION">
        <p className="text-sm text-light-text dark:text-dark-text mb-4">
          Are you sure? This will permanently delete all your data.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, delete everything"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
