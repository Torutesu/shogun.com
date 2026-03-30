"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loading";

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}

type ActionFilter = "all" | "created" | "updated" | "deleted" | "shared" | "invited" | "removed";

const actionFilters: { value: ActionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "shared", label: "Shared" },
  { value: "invited", label: "Invited" },
  { value: "removed", label: "Removed" },
];

const actionBadgeVariant = (action: string) => {
  if (action.includes("created") || action.includes("invited")) return "green" as const;
  if (action.includes("deleted") || action.includes("removed")) return "red" as const;
  if (action.includes("updated")) return "blue" as const;
  if (action.includes("shared")) return "gold" as const;
  return "default" as const;
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string>("");

  // Filters
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    api.teams
      .list()
      .then((teams) => {
        if (teams.length === 0) return;
        setTeamId(teams[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    api.teams
      .getAuditLogs(teamId, {
        action: actionFilter !== "all" ? actionFilter : undefined,
        user: userFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      .then((data) => {
        setEntries(data.entries ?? []);
        setHasMore((data.entries?.length ?? 0) >= pageSize);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [teamId, actionFilter, userFilter, dateFrom, dateTo, page]);

  const handleResetFilters = () => {
    setActionFilter("all");
    setUserFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  if (!teamId && !loading) {
    return (
      <div className="px-4 md:px-6 py-6">
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          Create a team first to view the audit log.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {/* Action filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as ActionFilter); setPage(1); }}
            className="h-9 rounded-md border border-light-border dark:border-dark-border bg-transparent px-2 text-xs outline-none text-light-text dark:text-dark-text focus:border-gold"
          >
            {actionFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* User filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            User
          </label>
          <input
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
            placeholder="Filter by name..."
            className="h-9 w-40 rounded-md border border-light-border dark:border-dark-border bg-transparent px-2 text-xs outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim focus:border-gold"
          />
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-light-border dark:border-dark-border bg-transparent px-2 text-xs outline-none text-light-text dark:text-dark-text focus:border-gold"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-light-border dark:border-dark-border bg-transparent px-2 text-xs outline-none text-light-text dark:text-dark-text focus:border-gold"
          />
        </div>

        <Button size="sm" variant="ghost" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-light-text-dim dark:text-dark-text-dim py-8">
          No audit log entries found
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center gap-3">
                {/* Timestamp */}
                <span className="hidden sm:block text-xs font-mono text-light-text-dim dark:text-dark-text-dim whitespace-nowrap w-32">
                  {new Date(entry.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* User */}
                <span className="text-xs font-medium text-light-text dark:text-dark-text w-28 truncate">
                  {entry.userName}
                </span>

                {/* Action badge */}
                <Badge variant={actionBadgeVariant(entry.action)}>{entry.action}</Badge>

                {/* Resource */}
                <span className="text-xs font-mono text-light-text-muted dark:text-dark-text-muted truncate">
                  {entry.resource}
                </span>

                {/* Details */}
                <span className="text-xs text-light-text-muted dark:text-dark-text-muted flex-1 truncate hidden md:block">
                  {entry.details}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-xs font-mono text-light-text-muted dark:text-dark-text-muted">
            Page {page}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
