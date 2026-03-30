"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loading";

interface Team {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}

interface TeamStats {
  sharedConversations: number;
  sharedMemory: number;
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats>({ sharedConversations: 0, sharedMemory: 0 });
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.teams
      .list()
      .then((data) => {
        setTeams(data);
        if (data.length > 0) setSelectedTeam(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    Promise.all([
      api.teams.getSharedConversations(selectedTeam.id).catch(() => []),
      api.teams.getSharedMemory(selectedTeam.id).catch(() => []),
      api.teams.getAuditLogs(selectedTeam.id, { limit: 10 }).catch(() => ({ entries: [] })),
    ]).then(([convos, memory, audit]) => {
      setStats({
        sharedConversations: Array.isArray(convos) ? convos.length : 0,
        sharedMemory: Array.isArray(memory) ? memory.length : 0,
      });
      setRecentAudit(audit.entries ?? []);
    });
  }, [selectedTeam]);

  const handleCreate = async () => {
    if (!teamName.trim() || !teamSlug.trim()) return;
    setCreating(true);
    try {
      const team = await api.teams.create({ name: teamName, slug: teamSlug });
      setTeams((prev) => [...prev, team as Team]);
      setSelectedTeam(team as Team);
      setShowCreate(false);
      setTeamName("");
      setTeamSlug("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleSlugFromName = (name: string) => {
    setTeamName(name);
    setTeamSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // No team — show create
  if (teams.length === 0 || showCreate) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-lg mx-auto">
        <Card>
          <h2
            className="text-lg tracking-wide text-light-text dark:text-dark-text mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CREATE A TEAM
          </h2>
          <div className="space-y-4">
            <Input
              label="Team name"
              value={teamName}
              onChange={(e) => handleSlugFromName(e.target.value)}
              placeholder="Acme Corp"
            />
            <Input
              label="Slug"
              value={teamSlug}
              onChange={(e) => setTeamSlug(e.target.value)}
              placeholder="acme-corp"
            />
            <p className="text-xs text-light-text-dim dark:text-dark-text-dim">
              Your team URL will be syogun.com/team/{teamSlug || "..."}
            </p>
            <div className="flex gap-2">
              {teams.length > 0 && (
                <Button variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleCreate} disabled={creating || !teamName.trim() || !teamSlug.trim()}>
                {creating ? "Creating..." : "Create team"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const actionBadgeVariant = (action: string) => {
    if (action.includes("created") || action.includes("invited")) return "green" as const;
    if (action.includes("deleted") || action.includes("removed")) return "red" as const;
    if (action.includes("updated")) return "blue" as const;
    if (action.includes("shared")) return "gold" as const;
    return "default" as const;
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl">
      {/* Team selector */}
      {teams.length > 1 && (
        <div className="mb-6 flex items-center gap-2">
          <select
            value={selectedTeam?.id ?? ""}
            onChange={(e) => {
              const t = teams.find((t) => t.id === e.target.value);
              if (t) setSelectedTeam(t);
            }}
            className="h-10 rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text focus:border-gold"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
            New team
          </Button>
        </div>
      )}

      {selectedTeam && (
        <div className="space-y-6">
          {/* Team info */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-light-text dark:text-dark-text">
                  {selectedTeam.name}
                </h2>
                <p className="text-xs font-mono text-light-text-muted dark:text-dark-text-muted mt-0.5">
                  /{selectedTeam.slug}
                </p>
              </div>
              <Badge>{selectedTeam.memberCount} members</Badge>
            </div>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted mb-1">
                Shared conversations
              </p>
              <p className="text-2xl font-medium text-light-text dark:text-dark-text">
                {stats.sharedConversations}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted mb-1">
                Shared memory
              </p>
              <p className="text-2xl font-medium text-light-text dark:text-dark-text">
                {stats.sharedMemory}
              </p>
            </Card>
          </div>

          {/* Recent audit */}
          <div>
            <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
              Recent activity
            </h3>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-light-text-dim dark:text-dark-text-dim">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentAudit.map((entry) => (
                  <Card key={entry.id}>
                    <div className="flex items-center gap-3">
                      <Badge variant={actionBadgeVariant(entry.action)}>{entry.action}</Badge>
                      <span className="text-sm text-light-text dark:text-dark-text flex-1 truncate">
                        <span className="font-medium">{entry.userName}</span>{" "}
                        <span className="text-light-text-muted dark:text-dark-text-muted">{entry.details}</span>
                      </span>
                      <span className="text-xs font-mono text-light-text-dim dark:text-dark-text-dim whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
              New team
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
