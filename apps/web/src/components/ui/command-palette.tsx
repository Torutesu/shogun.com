"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Command {
  id: string;
  label: string;
  category: "Navigation" | "Actions" | "Theme" | "Recent";
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

// ---------------------------------------------------------------------------
// Fuzzy match: all chars of query appear in order in target
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs)
// ---------------------------------------------------------------------------

function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconFiles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}
function IconTerminal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
function IconMemory() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconBilling() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconServices() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function IconAutomations() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentConversations, setRecentConversations] = useState<
    { id: string; title: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch recent conversations when palette opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    api.chat
      .listConversations()
      .then((convos) => setRecentConversations(convos.slice(0, 5)))
      .catch(() => {});

    // Focus input after mount
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router],
  );

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark", !isDark);
    localStorage.setItem("shogun_theme", isDark ? "light" : "dark");
    onClose();
  }, [onClose]);

  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      // Navigation
      { id: "nav-chat", label: "Chat", category: "Navigation", shortcut: "", icon: <IconChat />, action: () => navigate("/chat") },
      { id: "nav-files", label: "Files", category: "Navigation", shortcut: "", icon: <IconFiles />, action: () => navigate("/files") },
      { id: "nav-terminal", label: "Terminal", category: "Navigation", shortcut: "\u2318/", icon: <IconTerminal />, action: () => navigate("/terminal") },
      { id: "nav-memory", label: "Memory", category: "Navigation", shortcut: "\u2318\u21e7M", icon: <IconMemory />, action: () => navigate("/memory") },
      { id: "nav-services", label: "Services", category: "Navigation", shortcut: "", icon: <IconServices />, action: () => navigate("/services") },
      { id: "nav-automations", label: "Automations", category: "Navigation", shortcut: "", icon: <IconAutomations />, action: () => navigate("/automations") },
      { id: "nav-settings", label: "Settings", category: "Navigation", shortcut: "", icon: <IconSettings />, action: () => navigate("/settings") },
      { id: "nav-billing", label: "Billing", category: "Navigation", shortcut: "", icon: <IconBilling />, action: () => navigate("/billing") },
      // Actions
      { id: "act-new-convo", label: "New Conversation", category: "Actions", shortcut: "\u2318N", icon: <IconPlus />, action: () => { api.chat.createConversation().then((c) => navigate(`/chat/${c.id}`)).catch(() => {}); } },
      { id: "act-upload", label: "Upload File", category: "Actions", shortcut: "", icon: <IconUpload />, action: () => navigate("/files") },
      { id: "act-new-folder", label: "New Folder", category: "Actions", shortcut: "", icon: <IconFolder />, action: () => navigate("/files") },
      { id: "act-record", label: "Start Recording", category: "Actions", shortcut: "", icon: <IconMic />, action: () => navigate("/memory") },
      { id: "act-export-memory", label: "Export Memory", category: "Actions", shortcut: "", icon: <IconDownload />, action: () => { window.open(api.memory.exportUrl("json"), "_blank"); onClose(); } },
      // Theme
      { id: "theme-toggle", label: "Toggle Dark/Light", category: "Theme", shortcut: "", icon: <IconSun />, action: toggleTheme },
    ];

    // Recent conversations
    for (const convo of recentConversations) {
      cmds.push({
        id: `recent-${convo.id}`,
        label: convo.title || "Untitled",
        category: "Recent",
        icon: <IconClock />,
        action: () => navigate(`/chat/${convo.id}`),
      });
    }

    return cmds;
  }, [navigate, toggleTheme, recentConversations, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter((c) => fuzzyMatch(query, c.label));
  }, [query, commands]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; items: Command[] }[] = [];
    const catOrder = ["Navigation", "Actions", "Theme", "Recent"];
    for (const cat of catOrder) {
      const items = filtered.filter((c) => c.category === cat);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [filtered]);

  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Clamp selectedIndex
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatItems[selectedIndex]?.action();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-[10px] border border-dark-border bg-[#111111] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-dark-border px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-[#F0EDE6] placeholder-[#F0EDE6]/30 outline-none"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <kbd className="rounded border border-dark-border px-1.5 py-0.5 text-[0.6rem] text-[#F0EDE6]/40" style={{ fontFamily: "var(--font-mono)" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {flatItems.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[#F0EDE6]/30" style={{ fontFamily: "var(--font-mono)" }}>
              No results
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.category}>
              <p
                className="px-4 pt-3 pb-1 text-[0.6rem] uppercase tracking-[0.25em] text-[#F0EDE6]/25"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {group.category}
              </p>
              {group.items.map((cmd) => {
                const idx = flatItems.indexOf(cmd);
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    data-index={idx}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#C8A96E]/10 text-[#C8A96E]"
                        : "text-[#F0EDE6]/80 hover:bg-[#1E1E1E]"
                    }`}
                  >
                    <span className={isSelected ? "text-[#C8A96E]" : "text-[#F0EDE6]/40"}>
                      {cmd.icon}
                    </span>
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd
                        className="rounded border border-dark-border px-1.5 py-0.5 text-[0.6rem] text-[#F0EDE6]/30"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
