"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { Spinner } from "@/components/ui/loading";
import type { MachineStatus } from "@shogun/shared/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [machineStatus, setMachineStatus] = useState<MachineStatus>("sleeping");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.machine.get().then((m) => setMachineStatus(m.status)).catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-light dark:bg-dark">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-light dark:bg-dark">
      <Sidebar
        user={user}
        machineStatus={machineStatus}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <main
        className="flex-1 overflow-hidden transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? "4rem" : "14rem" }}
      >
        {children}
      </main>
    </div>
  );
}
