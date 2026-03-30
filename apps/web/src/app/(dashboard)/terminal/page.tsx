"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { TerminalView } from "@/components/terminal/terminal-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loading";
import type { MachineStatus } from "@shogun/shared/types";

export default function TerminalPage() {
  const [machineIp, setMachineIp] = useState<string | undefined>();
  const [machineStatus, setMachineStatus] = useState<MachineStatus>("sleeping");
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    api.machine.get().then((m) => {
      setMachineStatus(m.status);
      setMachineIp(m.ipAddress ?? undefined);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleWake = async () => {
    setWaking(true);
    try {
      const m = await api.machine.wake();
      setMachineStatus(m.status);
      setMachineIp(m.ipAddress ?? undefined);
    } catch {
      // ignore
    } finally {
      setWaking(false);
    }
  };

  const statusVariant = machineStatus === "running"
    ? "green" as const
    : machineStatus === "error"
    ? "red" as const
    : "default" as const;

  return (
    <div className="flex h-full flex-col">
      <Header title="Terminal" />

      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-light-border dark:border-dark-border px-4 py-2">
        <Badge variant={statusVariant}>
          {machineStatus}
        </Badge>
        {machineStatus === "sleeping" && (
          <Button size="sm" onClick={handleWake} disabled={waking}>
            {waking ? "Waking..." : "Wake up"}
          </Button>
        )}
      </div>

      {/* Terminal */}
      <div className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-dark">
            <Spinner />
          </div>
        ) : machineStatus !== "running" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-dark text-dark-text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <p className="text-sm">Machine is {machineStatus}</p>
            {machineStatus === "sleeping" && (
              <Button size="sm" onClick={handleWake} disabled={waking}>
                {waking ? "Waking..." : "Wake up to connect"}
              </Button>
            )}
          </div>
        ) : (
          <TerminalView machineIp={machineIp} />
        )}
      </div>
    </div>
  );
}
