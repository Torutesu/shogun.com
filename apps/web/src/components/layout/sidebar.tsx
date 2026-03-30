"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@shogun/ui";
import type { UserProfile, MachineStatus } from "@shogun/shared/types";

interface SidebarProps {
  user: UserProfile | null;
  machineStatus?: MachineStatus;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/* ---- Inline SVG Icons ---- */

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

const mainNav: NavItem[] = [
  { href: "/chat", label: "Chat", icon: <IconChat /> },
  { href: "/files", label: "Files", icon: <IconFolder /> },
  { href: "/terminal", label: "Terminal", icon: <IconTerminal /> },
  { href: "/memory", label: "Memory", icon: <IconBrain /> },
  { href: "/services", label: "Services", icon: <IconGlobe /> },
  { href: "/automations", label: "Automations", icon: <IconZap /> },
];

const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: <IconGear /> },
  { href: "/billing", label: "Billing", icon: <IconCreditCard /> },
];

const statusColors: Record<MachineStatus, string> = {
  provisioning: "bg-yellow-500",
  running: "bg-emerald-500",
  sleeping: "bg-amber-400",
  stopped: "bg-light-text-dim dark:bg-dark-text-dim",
  error: "bg-red-500",
};

export function Sidebar({ user, machineStatus = "sleeping", collapsed: controlledCollapsed, onToggle }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggle = onToggle ?? (() => setInternalCollapsed((c) => !c));
  const pathname = usePathname();

  const renderLink = useCallback(
    (item: NavItem) => {
      const active = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            active
              ? "bg-gold/10 text-gold"
              : "text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? item.label : undefined}
          aria-label={item.label}
        >
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </Link>
      );
    },
    [pathname, collapsed],
  );

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggle}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle sidebar"
        className="fixed top-3 left-3 z-40 rounded-lg p-2 text-light-text dark:text-dark-text md:hidden hover:bg-light-surface dark:hover:bg-dark-surface"
      >
        <IconMenu />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card transition-all duration-200",
          collapsed ? "w-16" : "w-56",
          "max-md:translate-x-0",
          collapsed && "max-md:-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-2")}>
          <span
            className="text-light-text dark:text-dark-text tracking-[0.12em]"
            style={{ fontFamily: "var(--font-display)", fontSize: collapsed ? "1rem" : "1.25rem" }}
          >
            {collapsed ? "S" : "SHOGUN"}
          </span>
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto hidden rounded p-1 text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text md:block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {mainNav.map(renderLink)}
        </nav>

        {/* Divider */}
        <div className="mx-3 border-t border-light-border dark:border-dark-border" />

        {/* Bottom nav */}
        <nav className="space-y-0.5 px-2 py-2">
          {bottomNav.map(renderLink)}
        </nav>

        {/* User info */}
        <div className={cn("border-t border-light-border dark:border-dark-border px-3 py-3", collapsed && "px-2")}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <div className="relative flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold">
                {user?.handle?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-light-card dark:border-dark-card",
                  statusColors[machineStatus],
                )}
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-light-text dark:text-dark-text">
                  @{user?.handle ?? "..."}
                </p>
                <p className="truncate text-[0.65rem] font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted">
                  {machineStatus}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
