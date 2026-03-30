"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: string;
  lastRunAt?: string;
  createdAt: string;
}

const statusBadge: Record<string, "green" | "red" | "gold" | "default"> = {
  active: "green",
  paused: "default",
  error: "red",
  completed: "blue" as "gold",
};

const triggerLabels: Record<string, string> = {
  cron: "Scheduled",
  email: "Email",
  sms: "SMS",
  line: "LINE",
  webhook: "Webhook",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTrigger, setCreateTrigger] = useState("cron");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.automations.list().then(setAutomations).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const { id } = await api.automations.create({ name: createName, trigger: createTrigger, config: {} });
      setAutomations((prev) => [
        ...prev,
        { id, name: createName, trigger: createTrigger, status: "active", createdAt: new Date().toISOString() },
      ]);
      setShowCreate(false);
      setCreateName("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }, [createName, createTrigger]);

  const handleToggle = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await api.automations.update(id, { status: newStatus });
      setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    try {
      await api.automations.delete(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Header title="Automations" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Automated tasks and triggers
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)}>Create</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-light-text-dim dark:text-dark-text-dim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <p className="text-sm">No automations set up</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((auto) => (
              <Card key={auto.id}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                        {auto.name}
                      </h3>
                      <Badge variant={statusBadge[auto.status] ?? "default"}>
                        {auto.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[0.65rem] font-mono text-light-text-dim dark:text-dark-text-dim">
                      <span>{triggerLabels[auto.trigger] ?? auto.trigger}</span>
                      {auto.lastRunAt && (
                        <span>Last run: {new Date(auto.lastRunAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggle(auto.id, auto.status)}
                    >
                      {auto.status === "active" ? "Pause" : "Resume"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(auto.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="CREATE AUTOMATION">
        <div className="space-y-4">
          <Input label="Name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Daily report" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
              Trigger
            </label>
            <select
              value={createTrigger}
              onChange={(e) => setCreateTrigger(e.target.value)}
              className="h-10 w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text focus:border-gold"
            >
              <option value="cron">Scheduled (Cron)</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="line">LINE</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
