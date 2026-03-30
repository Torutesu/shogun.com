"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import type { FileEntry } from "@shogun/shared/types";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { FileList } from "@/components/files/file-list";
import { CodeEditor } from "@/components/files/code-editor";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";

export default function FilesPage() {
  const [path, setPath] = useState("/");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Editor state
  const [editingFile, setEditingFile] = useState<{ name: string; path: string; content: string } | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  const loadFiles = useCallback(async (dir: string) => {
    setLoading(true);
    try {
      const entries = await api.files.list(dir);
      setFiles(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(path);
  }, [path, loadFiles]);

  const breadcrumbs = path.split("/").filter(Boolean);

  const handleNavigate = (name: string) => {
    const entry = files.find((f) => f.name === name);
    if (entry?.type === "directory") {
      setPath(path === "/" ? `/${name}` : `${path}/${name}`);
    } else if (entry?.type === "file") {
      openFile(name);
    }
  };

  const openFile = async (name: string) => {
    const filePath = path === "/" ? `/${name}` : `${path}/${name}`;
    setEditorLoading(true);
    try {
      const { content } = await api.files.read(filePath);
      setEditingFile({ name, path: filePath, content });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setEditorLoading(false);
    }
  };

  const handleEditorSave = async (content: string) => {
    if (!editingFile) return;
    try {
      await api.files.write(editingFile.path, content);
      setEditingFile({ ...editingFile, content });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    }
  };

  const closeEditor = () => {
    setEditingFile(null);
  };

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const filePath = path === "/" ? `/${file.name}` : `${path}/${file.name}`;
        const { url } = await api.files.getUploadUrl(filePath);
        await fetch(url, { method: "PUT", body: file });
        loadFiles(path);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    };
    input.click();
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    try {
      const folderPath = path === "/" ? `/${name}` : `${path}/${name}`;
      await api.files.createFolder(folderPath);
      loadFiles(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const handleRename = async (oldName: string, newName: string) => {
    const oldPath = path === "/" ? `/${oldName}` : `${path}/${oldName}`;
    const newPath = path === "/" ? `/${newName}` : `${path}/${newName}`;
    try {
      await api.files.rename(oldPath, newPath);
      loadFiles(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const handleDownload = async (name: string) => {
    const filePath = path === "/" ? `/${name}` : `${path}/${name}`;
    try {
      const { url } = await api.files.getDownloadUrl(filePath);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    const filePath = path === "/" ? `/${name}` : `${path}/${name}`;
    try {
      await api.files.delete(filePath);
      loadFiles(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  // When editing a file, show the editor instead of the file list
  if (editingFile) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Files" />

        {error && (
          <div className="mx-4 mt-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border px-4 py-2">
          <button
            onClick={closeEditor}
            className="flex items-center gap-1.5 text-sm text-light-text-muted dark:text-dark-text-muted hover:text-gold transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to files
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeEditor
            content={editingFile.content}
            filename={editingFile.name}
            onSave={handleEditorSave}
          />
        </div>
      </div>
    );
  }

  if (editorLoading) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Files" />
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Files" />

      {error && (
        <div className="mx-4 mt-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border px-4 py-2">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
          <button onClick={() => setPath("/")} className="text-light-text-muted dark:text-dark-text-muted hover:text-gold transition-colors cursor-pointer">
            /
          </button>
          {breadcrumbs.map((segment, i) => {
            const segPath = "/" + breadcrumbs.slice(0, i + 1).join("/");
            return (
              <span key={segPath} className="flex items-center gap-1">
                <span className="text-light-text-dim dark:text-dark-text-dim">/</span>
                <button
                  onClick={() => setPath(segPath)}
                  className={cn(
                    "cursor-pointer transition-colors truncate max-w-[120px]",
                    i === breadcrumbs.length - 1
                      ? "text-light-text dark:text-dark-text"
                      : "text-light-text-muted dark:text-dark-text-muted hover:text-gold",
                  )}
                >
                  {segment}
                </button>
              </span>
            );
          })}
        </nav>

        {/* View toggle */}
        <div className="flex items-center border border-light-border dark:border-dark-border rounded-md">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 transition-colors cursor-pointer",
              viewMode === "list" ? "text-gold bg-gold/10" : "text-light-text-muted dark:text-dark-text-muted",
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 border-l border-light-border dark:border-dark-border transition-colors cursor-pointer",
              viewMode === "grid" ? "text-gold bg-gold/10" : "text-light-text-muted dark:text-dark-text-muted",
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        <Button size="sm" variant="secondary" onClick={handleNewFolder}>
          New folder
        </Button>
        <Button size="sm" onClick={handleUpload}>
          Upload
        </Button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-light-text-dim dark:text-dark-text-dim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p className="text-sm">No files here</p>
          </div>
        ) : (
          <FileList
            files={files}
            viewMode={viewMode}
            onNavigate={handleNavigate}
            onRename={handleRename}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
