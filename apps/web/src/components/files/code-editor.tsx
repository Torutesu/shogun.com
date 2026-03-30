"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@shogun/ui";

// ---------------------------------------------------------------------------
// Language detection from filename
// ---------------------------------------------------------------------------
const EXT_TO_LANG: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript (JSX)",
  js: "JavaScript",
  jsx: "JavaScript (JSX)",
  json: "JSON",
  md: "Markdown",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  xml: "XML",
  yml: "YAML",
  yaml: "YAML",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  sql: "SQL",
  toml: "TOML",
  env: "Env",
  txt: "Text",
  dockerfile: "Dockerfile",
  makefile: "Makefile",
};

const BINARY_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg",
  "woff", "woff2", "ttf", "otf", "eot",
  "zip", "tar", "gz", "bz2", "7z", "rar",
  "pdf", "doc", "docx", "xls", "xlsx",
  "mp3", "mp4", "wav", "avi", "mov", "mkv",
  "exe", "dll", "so", "dylib", "bin", "o",
  "wasm",
]);

function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower === "dockerfile") return "Dockerfile";
  if (lower === "makefile") return "Makefile";
  const ext = lower.split(".").pop() ?? "";
  return EXT_TO_LANG[ext] ?? (ext.toUpperCase() || "Text");
}

function isBinaryFile(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return BINARY_EXTS.has(ext);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CodeEditorProps {
  content: string;
  language?: string;
  filename: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  content: initialContent,
  language,
  filename,
  onSave,
  readOnly: forceReadOnly,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);

  const readOnly = forceReadOnly || isBinaryFile(filename);
  const lang = language ?? detectLanguage(filename);

  // Sync when initialContent changes (e.g. switching files)
  useEffect(() => {
    setContent(initialContent);
    setIsDirty(false);
  }, [initialContent]);

  // Sync scroll between gutter and textarea
  const handleScroll = useCallback(() => {
    if (lineCountRef.current && textareaRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!readOnly && onSave && isDirty) {
          onSave(content);
          setIsDirty(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, isDirty, onSave, readOnly]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  // Tab inserts 2 spaces; Enter auto-indents
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;

    if (e.key === "Tab") {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const updated = before + "  " + after;
      setContent(updated);
      setIsDirty(true);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const start = ta.selectionStart;
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const currentLine = content.slice(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] ?? "";
      const before = content.slice(0, start);
      const after = content.slice(ta.selectionEnd);
      const updated = before + "\n" + indent + after;
      setContent(updated);
      setIsDirty(true);
      requestAnimationFrame(() => {
        const pos = start + 1 + indent.length;
        ta.selectionStart = ta.selectionEnd = pos;
      });
    }
  };

  const lines = content.split("\n");
  const lineCount = lines.length;

  const handleSaveClick = () => {
    if (onSave && isDirty) {
      onSave(content);
      setIsDirty(false);
    }
  };

  // Binary file guard
  if (isBinaryFile(filename) && !initialContent) {
    return (
      <div className="flex h-full flex-col">
        <EditorHeader filename={filename} lang={lang} readOnly />
        <div className="flex flex-1 items-center justify-center text-light-text-dim dark:text-dark-text-dim">
          <p className="text-sm">Binary file — preview not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border px-4 py-2">
        <EditorHeader filename={filename} lang={lang} readOnly={readOnly} />
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[0.65rem] font-mono uppercase tracking-wider text-gold">
              Modified
            </span>
          )}
          {!readOnly && onSave && (
            <button
              onClick={handleSaveClick}
              disabled={!isDirty}
              className={cn(
                "h-7 px-3 text-xs font-mono uppercase tracking-wider transition-colors",
                isDirty
                  ? "bg-gold text-dark hover:bg-gold-dark cursor-pointer"
                  : "bg-light-surface dark:bg-dark-surface text-light-text-dim dark:text-dark-text-dim cursor-default",
              )}
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden bg-[#080808]">
        {/* Line numbers */}
        <div
          ref={lineCountRef}
          className="flex-shrink-0 select-none overflow-hidden py-3 pr-3 pl-4 text-right font-mono text-xs leading-[1.5rem] text-dark-text-dim"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={readOnly ? undefined : handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            "flex-1 resize-none overflow-auto bg-transparent py-3 pr-4 pl-2",
            "font-mono text-xs leading-[1.5rem] text-dark-text",
            "outline-none border-none caret-gold",
            "selection:bg-gold/20",
            readOnly && "cursor-default opacity-80",
          )}
          style={{
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function EditorHeader({
  filename,
  lang,
  readOnly,
}: {
  filename: string;
  lang: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-light-text-muted dark:text-dark-text-muted"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="text-sm text-light-text dark:text-dark-text truncate max-w-[200px]">
        {filename}
      </span>
      <span className="rounded bg-light-surface dark:bg-dark-surface px-1.5 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted">
        {lang}
      </span>
      {readOnly && (
        <span className="rounded bg-light-surface dark:bg-dark-surface px-1.5 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim">
          Read-only
        </span>
      )}
    </div>
  );
}
