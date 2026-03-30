"use client";

import { useCallback, useRef, useState } from "react";
import type { MemoryEntry } from "@shogun/shared/types";
import { api } from "@/lib/api";
import { MemoryEntryCard } from "./memory-entry";
import { Spinner } from "@/components/ui/loading";

interface MemorySearchProps {
  onDelete: (id: string) => void;
}

export function MemorySearch({ onDelete }: MemorySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemoryEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const entries = await api.memory.search(q);
      setResults(entries);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  return (
    <div>
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-dim dark:text-dark-text-dim"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search your work memory..."
          className="w-full rounded-lg border border-light-border dark:border-dark-border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim focus:border-gold transition-colors"
        />
      </div>

      {/* Search results */}
      {searching && (
        <div className="mt-4 flex justify-center">
          <Spinner size="sm" />
        </div>
      )}

      {results && !searching && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-center text-sm text-light-text-dim dark:text-dark-text-dim py-4">
              No results found
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((entry) => (
                <MemoryEntryCard key={entry.id} entry={entry} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
