"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import type { MemoryEntry, MemorySource } from "@shogun/shared/types";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { MemoryEntryCard } from "@/components/memory/memory-entry";
import { MemorySearch } from "@/components/memory/memory-search";
import { Spinner } from "@/components/ui/loading";

type FilterKey = "all" | MemorySource;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "screen_capture", label: "Screen" },
  { key: "meeting_transcript", label: "Meetings" },
  { key: "chat", label: "Chat" },
  { key: "file", label: "Files" },
  { key: "manual", label: "Manual" },
];

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadEntries = useCallback(async (source: FilterKey, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: { source?: string; cursor?: string; limit?: number } = { limit: 20 };
      if (source !== "all") params.source = source;
      if (!reset && cursor) params.cursor = cursor;

      const data = await api.memory.list(params);
      if (reset) {
        setEntries(data.entries);
      } else {
        setEntries((prev) => [...prev, ...data.entries]);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      if (reset) setEntries([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  useEffect(() => {
    loadEntries(filter, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.memory.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200 && hasMore && !loadingMore) {
      loadEntries(filter);
    }
  }, [hasMore, loadingMore, filter, loadEntries]);

  return (
    <div className="flex h-full flex-col">
      <Header title="Memory" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4" onScroll={handleScroll}>
        {/* Search */}
        <div className="mb-4">
          <MemorySearch onDelete={handleDelete} />
        </div>

        {/* Filter pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer",
                filter === f.key
                  ? "bg-gold/15 text-gold"
                  : "text-light-text-muted dark:text-dark-text-muted hover:bg-light-surface dark:hover:bg-dark-surface",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-light-text-dim dark:text-dark-text-dim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
              <line x1="9" y1="22" x2="15" y2="22" />
            </svg>
            <p className="text-sm">No memory entries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <MemoryEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
