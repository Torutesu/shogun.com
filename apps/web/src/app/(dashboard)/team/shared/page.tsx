"use client";

import { useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/loading";

type SharedTab = "conversations" | "memory";

interface SharedConversation {
  id: string;
  conversationId: string;
  title: string;
  sharedBy: string;
  sharedAt: string;
}

interface SharedMemoryEntry {
  id: string;
  entryId: string;
  content: string;
  source: string;
  sharedBy: string;
  sharedAt: string;
}

export default function SharedPage() {
  const [activeTab, setActiveTab] = useState<SharedTab>("conversations");
  const [teamId, setTeamId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Data
  const [conversations, setConversations] = useState<SharedConversation[]>([]);
  const [memory, setMemory] = useState<SharedMemoryEntry[]>([]);
  const [memorySearch, setMemorySearch] = useState("");

  // Share modal
  const [showShare, setShowShare] = useState(false);
  const [userConversations, setUserConversations] = useState<{ id: string; title: string }[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.teams
      .list()
      .then((teams) => {
        if (teams.length === 0) return;
        const id = teams[0].id;
        setTeamId(id);
        return Promise.all([
          api.teams.getSharedConversations(id).catch(() => []),
          api.teams.getSharedMemory(id).catch(() => []),
        ]);
      })
      .then((result) => {
        if (!result) return;
        setConversations(result[0] as SharedConversation[]);
        setMemory(result[1] as SharedMemoryEntry[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpenShareModal = async () => {
    setShowShare(true);
    try {
      const convos = await api.chat.listConversations();
      setUserConversations(convos.map((c) => ({ id: c.id, title: c.title })));
    } catch {
      // ignore
    }
  };

  const handleShareConversation = async () => {
    if (!selectedConvoId || !teamId) return;
    setSharing(true);
    try {
      const shared = await api.teams.shareConversation(teamId, selectedConvoId);
      setConversations((prev) => [...prev, shared as SharedConversation]);
      setShowShare(false);
      setSelectedConvoId("");
    } catch {
      // ignore
    } finally {
      setSharing(false);
    }
  };

  const filteredMemory = memorySearch
    ? memory.filter((m) =>
        m.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
        m.source.toLowerCase().includes(memorySearch.toLowerCase()),
      )
    : memory;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="px-4 md:px-6 py-6">
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          Create a team first to share resources.
        </p>
      </div>
    );
  }

  const tabs: { key: SharedTab; label: string }[] = [
    { key: "conversations", label: "Conversations" },
    { key: "memory", label: "Memory" },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors cursor-pointer",
                activeTab === tab.key
                  ? "bg-gold/15 text-gold"
                  : "text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={handleOpenShareModal}>
          Share
        </Button>
      </div>

      {/* Conversations tab */}
      {activeTab === "conversations" && (
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-light-text-dim dark:text-dark-text-dim py-4">
              No shared conversations yet
            </p>
          ) : (
            conversations.map((convo) => (
              <Card key={convo.id}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/chat/${convo.conversationId}`}
                      className="text-sm font-medium text-light-text dark:text-dark-text hover:text-gold transition-colors"
                    >
                      {convo.title}
                    </a>
                    <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-0.5">
                      Shared by {convo.sharedBy}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-light-text-dim dark:text-dark-text-dim whitespace-nowrap">
                    {new Date(convo.sharedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Memory tab */}
      {activeTab === "memory" && (
        <div className="space-y-4">
          <Input
            placeholder="Search shared memory..."
            value={memorySearch}
            onChange={(e) => setMemorySearch(e.target.value)}
          />
          {filteredMemory.length === 0 ? (
            <p className="text-sm text-light-text-dim dark:text-dark-text-dim py-4">
              {memorySearch ? "No matching entries" : "No shared memory entries yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredMemory.map((entry) => (
                <Card key={entry.id}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{entry.source}</Badge>
                      <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        by {entry.sharedBy}
                      </span>
                      <span className="text-xs font-mono text-light-text-dim dark:text-dark-text-dim ml-auto whitespace-nowrap">
                        {new Date(entry.sharedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-light-text dark:text-dark-text line-clamp-3">
                      {entry.content}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="SHARE WITH TEAM">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
              Select conversation
            </label>
            <select
              value={selectedConvoId}
              onChange={(e) => setSelectedConvoId(e.target.value)}
              className="h-10 w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text focus:border-gold"
            >
              <option value="">Choose a conversation...</option>
              {userConversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowShare(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareConversation} disabled={sharing || !selectedConvoId}>
              {sharing ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
