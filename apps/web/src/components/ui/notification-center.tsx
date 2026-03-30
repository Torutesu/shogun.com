"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@shogun/ui";
import {
  useNotifications,
  type Notification,
  type NotificationType,
} from "@/hooks/use-notifications";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function IconBell({ hasUnread }: { hasUnread: boolean }) {
  return (
    <div className="relative">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold" />
      )}
    </div>
  );
}

const typeIcon: Record<NotificationType, React.ReactNode> = {
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

const typeColor: Record<NotificationType, string> = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationCenter() {
  const store = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Force re-render when store changes
  const [, setTick] = useState(0);
  useEffect(() => {
    // Poll store for changes (lightweight since it's in-memory)
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  const { notifications, unreadCount, markRead, markAllRead, removeNotification } = store;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <IconBell hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-[10px] border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border px-4 py-2.5">
            <span
              className="text-xs uppercase tracking-[0.2em] text-light-text-muted dark:text-dark-text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gold/15 px-1.5 py-0.5 text-[0.55rem] text-gold">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[0.65rem] text-gold hover:text-gold/80 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p
                className="px-4 py-8 text-center text-xs text-light-text-dim dark:text-dark-text-dim"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                No notifications
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-light-border/50 dark:border-dark-border/50 last:border-b-0 transition-colors",
                    !notif.read && "bg-gold/[0.03]",
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", typeColor[notif.type])}>
                    {typeIcon[notif.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                      {notif.message}
                    </p>
                    <p
                      className="mt-1 text-[0.6rem] text-light-text-dim dark:text-dark-text-dim"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => markRead(notif.id)}
                        className="rounded p-1 text-light-text-dim dark:text-dark-text-dim hover:text-gold transition-colors cursor-pointer"
                        title="Mark read"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNotification(notif.id)}
                      className="rounded p-1 text-light-text-dim dark:text-dark-text-dim hover:text-red-400 transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
