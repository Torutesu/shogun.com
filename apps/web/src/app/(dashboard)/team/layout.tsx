"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import { Header } from "@/components/layout/header";

type Tab = {
  href: string;
  label: string;
  requireAdmin?: boolean;
};

const tabs: Tab[] = [
  { href: "/team", label: "Dashboard" },
  { href: "/team/members", label: "Members" },
  { href: "/team/shared", label: "Shared" },
  { href: "/team/audit", label: "Audit", requireAdmin: true },
  { href: "/team/settings", label: "Settings", requireAdmin: true },
];

type TeamRole = "owner" | "admin" | "member" | "viewer";

function useTeamRole(): TeamRole {
  const [role, setRole] = useState<TeamRole>("member");

  useEffect(() => {
    let cancelled = false;
    async function fetchRole() {
      try {
        const res = await fetch("/api/teams/my-role", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.role) {
            setRole(data.role as TeamRole);
          }
        }
      } catch {
        // On error, default to "member" (least privilege)
      }
    }
    fetchRole();
    return () => { cancelled = true; };
  }, []);

  return role;
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const userRole = useTeamRole();
  const isAdmin = userRole === "owner" || userRole === "admin";

  const visibleTabs = tabs.filter((t) => !t.requireAdmin || isAdmin);

  return (
    <div className="flex h-full flex-col">
      <Header title="Team" />

      {/* Tab nav */}
      <div className="border-b border-light-border dark:border-dark-border px-4 md:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const active =
              tab.href === "/team"
                ? pathname === "/team"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "whitespace-nowrap px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-b-2",
                  active
                    ? "border-gold text-gold"
                    : "border-transparent text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
