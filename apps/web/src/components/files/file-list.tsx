"use client";

import { memo, useMemo, useState } from "react";
import { cn } from "@shogun/ui";
import type { FileEntry } from "@shogun/shared/types";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

type ViewMode = "grid" | "list";
type SortKey = "name" | "size" | "modified";

interface FileListProps {
  files: FileEntry[];
  viewMode: ViewMode;
  onNavigate: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
}

function formatSize(bytes?: number): string {
  if (bytes == null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface FileRowProps {
  file: FileEntry;
  onNavigate: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDownload: (name: string) => void;
  onDelete: (name: string) => void;
}

const FileGridItem = memo(function FileGridItem({ file: f, onNavigate, onRename, onDownload, onDelete }: FileRowProps) {
  return (
    <div
      className="group flex flex-col items-center gap-2 rounded-lg border border-light-border dark:border-dark-border p-3 cursor-pointer hover:bg-light-surface dark:hover:bg-dark-surface transition-colors relative"
      onClick={() => onNavigate(f.name)}
    >
      <FileIcon type={f.type} />
      <p className="text-xs text-center truncate w-full text-light-text dark:text-dark-text">{f.name}</p>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          align="right"
          trigger={
            <span className="flex h-5 w-5 items-center justify-center rounded text-light-text-muted dark:text-dark-text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </span>
          }
        >
          {f.type === "file" && <DropdownItem onClick={() => onDownload(f.name)}>Download</DropdownItem>}
          <DropdownItem onClick={() => { const n = prompt("New name:", f.name); if (n) onRename(f.name, n); }}>Rename</DropdownItem>
          <DropdownItem onClick={() => onDelete(f.name)} danger>Delete</DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
});

const FileListRow = memo(function FileListRow({ file: f, onNavigate, onRename, onDownload, onDelete }: FileRowProps) {
  return (
    <tr
      className="group border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer transition-colors"
      onClick={() => onNavigate(f.name)}
    >
      <td className="flex items-center gap-2 px-4 py-2 text-light-text dark:text-dark-text">
        <FileIcon type={f.type} />
        {f.name}
      </td>
      <td className="px-4 py-2 text-light-text-muted dark:text-dark-text-muted font-mono text-xs">
        {f.type === "file" ? formatSize(f.size) : "--"}
      </td>
      <td className="px-4 py-2 text-light-text-muted dark:text-dark-text-muted text-xs">
        {formatDate(f.modified)}
      </td>
      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown
            align="right"
            trigger={
              <span className="flex h-5 w-5 items-center justify-center rounded text-light-text-muted dark:text-dark-text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                </svg>
              </span>
            }
          >
            {f.type === "file" && <DropdownItem onClick={() => onDownload(f.name)}>Download</DropdownItem>}
            <DropdownItem onClick={() => { const n = prompt("New name:", f.name); if (n) onRename(f.name, n); }}>Rename</DropdownItem>
            <DropdownItem onClick={() => onDelete(f.name)} danger>Delete</DropdownItem>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
});

const FileIcon = memo(function FileIcon({ type }: { type: "file" | "directory" }) {
  if (type === "directory") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gold">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-light-text-muted dark:text-dark-text-muted">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
});

export function FileList({ files, viewMode, onNavigate, onRename, onDownload, onDelete }: FileListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...files];
    copy.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "size") cmp = (a.size ?? 0) - (b.size ?? 0);
      else cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [files, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortIndicator = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-0.5">
        <polyline points={sortAsc ? "6 9 12 15 18 9" : "6 15 12 9 18 15"} />
      </svg>
    ) : null;

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4">
        {sorted.map((f) => (
          <FileGridItem key={f.name} file={f} onNavigate={onNavigate} onRename={onRename} onDownload={onDownload} onDelete={onDelete} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-light-border dark:border-dark-border text-left text-[0.65rem] font-mono uppercase tracking-[0.15em] text-light-text-dim dark:text-dark-text-dim">
            <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort("name")}>Name <SortIndicator col="name" /></th>
            <th className="px-4 py-2 cursor-pointer w-24" onClick={() => toggleSort("size")}>Size <SortIndicator col="size" /></th>
            <th className="px-4 py-2 cursor-pointer w-40" onClick={() => toggleSort("modified")}>Modified <SortIndicator col="modified" /></th>
            <th className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => (
            <FileListRow key={f.name} file={f} onNavigate={onNavigate} onRename={onRename} onDownload={onDownload} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
