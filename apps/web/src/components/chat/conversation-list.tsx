"use client";

import { memo, useMemo, useState } from "react";
import { cn } from "@shogun/ui";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  lastMessageAt: string;
  preview?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

type GroupKey = "pinned" | "today" | "yesterday" | "week" | "older";

function groupConversations(convs: Conversation[]): Record<GroupKey, Conversation[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  const groups: Record<GroupKey, Conversation[]> = { pinned: [], today: [], yesterday: [], week: [], older: [] };

  for (const c of convs) {
    if (c.pinned) {
      groups.pinned.push(c);
      continue;
    }
    const d = new Date(c.lastMessageAt);
    if (d >= todayStart) groups.today.push(c);
    else if (d >= yesterdayStart) groups.yesterday.push(c);
    else if (d >= weekStart) groups.week.push(c);
    else groups.older.push(c);
  }
  return groups;
}

const groupLabels: Record<GroupKey, string> = {
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  older: "Older",
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onPin,
  onDelete,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const groups = useMemo(() => groupConversations(filtered), [filtered]);

  const renderGroup = (key: GroupKey) => {
    const items = groups[key];
    if (!items.length) return null;
    return (
      <div key={key}>
        <p className="px-3 pt-3 pb-1 text-[0.6rem] font-mono uppercase tracking-[0.2em] text-light-text-dim dark:text-dark-text-dim">
          {groupLabels[key]}
        </p>
        {items.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            active={c.id === activeId}
            onSelect={() => onSelect(c.id)}
            onRename={(title) => onRename(c.id, title)}
            onPin={() => onPin(c.id, !c.pinned)}
            onDelete={() => onDelete(c.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border px-3 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 bg-transparent text-xs outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim"
        />
        <button
          onClick={onNew}
          className="flex h-7 w-7 items-center justify-center rounded-md text-light-text-muted dark:text-dark-text-muted hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer"
          title="New conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-light-text-dim dark:text-dark-text-dim">
            No conversations yet
          </p>
        ) : (
          <>
            {(["pinned", "today", "yesterday", "week", "older"] as GroupKey[]).map(renderGroup)}
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Single Conversation Item ---- */

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onPin: () => void;
  onDelete: () => void;
}

const ConversationItem = memo(function ConversationItem({ conversation, active, onSelect, onRename, onPin, onDelete }: ConversationItemProps) {
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);

  const commitRename = () => {
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== conversation.title) onRename(trimmed);
    setRenaming(false);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
        active
          ? "bg-gold/10 text-gold"
          : "text-light-text dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface",
      )}
      onClick={onSelect}
    >
      {conversation.pinned && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-gold opacity-60">
          <circle cx="12" cy="12" r="4" />
        </svg>
      )}
      <div className="flex-1 min-w-0">
        {renaming ? (
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-xs outline-none border-b border-gold"
          />
        ) : (
          <p className="truncate text-xs font-medium">{conversation.title}</p>
        )}
        {conversation.preview && !renaming && (
          <p className="truncate text-[0.65rem] text-light-text-muted dark:text-dark-text-muted mt-0.5">
            {conversation.preview}
          </p>
        )}
      </div>
      <span className="flex-shrink-0 text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
        {timeAgo(conversation.lastMessageAt)}
      </span>

      {/* Context menu */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          align="right"
          trigger={
            <span className="flex h-5 w-5 items-center justify-center rounded text-light-text-muted dark:text-dark-text-muted hover:bg-light-surface dark:hover:bg-dark-surface">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </span>
          }
        >
          <DropdownItem onClick={() => { setRenaming(true); setNewTitle(conversation.title); }}>Rename</DropdownItem>
          <DropdownItem onClick={onPin}>{conversation.pinned ? "Unpin" : "Pin"}</DropdownItem>
          <DropdownItem onClick={onDelete} danger>Delete</DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
});
