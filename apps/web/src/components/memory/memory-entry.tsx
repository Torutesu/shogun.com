"use client";

import { cn } from "@shogun/ui";
import type { MemoryEntry as MemoryEntryType, MemorySource } from "@shogun/shared/types";
import { Badge } from "@/components/ui/badge";

interface MemoryEntryProps {
  entry: MemoryEntryType;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<MemorySource, string> = {
  screen_capture: "Screen",
  meeting_transcript: "Meeting",
  chat: "Chat",
  file: "File",
  manual: "Manual",
};

const sourceBadgeVariant: Record<MemorySource, "default" | "gold" | "green" | "blue" | "red"> = {
  screen_capture: "blue",
  meeting_transcript: "green",
  chat: "gold",
  file: "default",
  manual: "default",
};

function SourceIcon({ source }: { source: MemorySource }) {
  const cls = "text-light-text-muted dark:text-dark-text-muted";
  switch (source) {
    case "screen_capture":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "meeting_transcript":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      );
    case "chat":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "file":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MemoryEntryCard({ entry, onDelete }: MemoryEntryProps) {
  return (
    <div className="group rounded-lg border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card p-4 transition-colors hover:border-light-border-dim dark:hover:border-dark-border-bright">
      <div className="flex items-start gap-3">
        {/* Source icon */}
        <div className="mt-0.5 flex-shrink-0">
          <SourceIcon source={entry.source} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={sourceBadgeVariant[entry.source]}>
              {sourceLabels[entry.source]}
            </Badge>
            {entry.appName && (
              <span className="text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
                {entry.appName}
              </span>
            )}
            <span className="ml-auto text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim flex-shrink-0">
              {formatTimestamp(entry.capturedAt)}
            </span>
          </div>

          <p className="text-sm text-light-text dark:text-dark-text leading-relaxed line-clamp-3">
            {entry.summary ?? entry.content}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(entry.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-light-text-dim dark:text-dark-text-dim hover:text-red-500 transition-all cursor-pointer p-1"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
