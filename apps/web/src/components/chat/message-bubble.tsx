"use client";

import { memo, useState, useCallback, type ReactNode } from "react";
import { cn } from "@shogun/ui";
import type { ChatMessage, ToolCall, ToolResult } from "@shogun/shared/types";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Syntax highlighting — lightweight, regex-based
// ---------------------------------------------------------------------------

interface HighlightRule {
  pattern: RegExp;
  className: string;
}

const KEYWORD_SETS: Record<string, string[]> = {
  js: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "async", "await", "try", "catch", "throw", "typeof", "instanceof", "switch", "case", "break", "continue", "yield", "of", "in", "null", "undefined", "true", "false"],
  ts: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "async", "await", "try", "catch", "throw", "typeof", "instanceof", "switch", "case", "break", "continue", "yield", "of", "in", "null", "undefined", "true", "false", "type", "interface", "enum", "extends", "implements", "as", "readonly", "keyof", "infer"],
  python: ["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "try", "except", "finally", "raise", "with", "yield", "lambda", "pass", "break", "continue", "and", "or", "not", "is", "in", "None", "True", "False", "self", "async", "await"],
  go: ["func", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "package", "import", "type", "struct", "interface", "map", "chan", "go", "defer", "select", "var", "const", "nil", "true", "false", "make", "len", "append"],
  bash: ["if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac", "function", "return", "exit", "echo", "export", "local", "readonly", "shift", "source", "cd", "pwd", "ls", "grep", "sed", "awk", "cat", "mkdir", "rm", "cp", "mv"],
  sql: ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "AND", "OR", "NOT", "NULL", "IN", "EXISTS", "BETWEEN", "LIKE", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MAX", "MIN", "UNION", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CASCADE", "CONSTRAINT", "DEFAULT", "CHECK", "UNIQUE", "GRANT", "REVOKE", "BEGIN", "COMMIT", "ROLLBACK", "TRIGGER", "VIEW", "FUNCTION", "PROCEDURE", "RETURNS", "IF", "ELSE", "END", "THEN", "CASE", "WHEN"],
  html: ["div", "span", "a", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "tr", "td", "th", "form", "input", "button", "img", "link", "meta", "head", "body", "html", "script", "style", "section", "header", "footer", "nav", "main", "article"],
  css: ["color", "background", "margin", "padding", "border", "display", "flex", "grid", "position", "width", "height", "font", "text", "align", "justify", "overflow", "opacity", "transition", "transform", "animation", "z-index", "box-shadow"],
};

const langAliases: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  tsx: "ts",
  jsx: "js",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  py: "python",
  golang: "go",
  postgresql: "sql",
  mysql: "sql",
  sqlite: "sql",
};

function resolveLanguage(lang: string): string {
  const l = lang.toLowerCase().trim();
  return langAliases[l] ?? l;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlightCode(code: string, lang: string): string {
  const resolved = resolveLanguage(lang);
  const escaped = escapeHtml(code);

  if (resolved === "json") {
    return escaped
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#7dd3fc">$1</span>:')
      .replace(/:(\s*"(?:[^"\\]|\\.)*")/g, ':<span style="color:#86efac">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#C8A96E">$1</span>')
      .replace(/:\s*(true|false|null)\b/g, ': <span style="color:#93c5fd">$1</span>');
  }

  const keywords = KEYWORD_SETS[resolved];
  if (!keywords) return escaped;

  // Build token regex
  const tokens: { pattern: RegExp; replace: (m: string, ...groups: string[]) => string }[] = [];

  // Line comments
  if (["js", "ts", "go", "css"].includes(resolved)) {
    tokens.push({ pattern: /(\/\/[^\n]*)/g, replace: (m) => `<span style="color:#6b7280">${m}</span>` });
  }
  if (["python", "bash"].includes(resolved)) {
    tokens.push({ pattern: /(#[^\n]*)/g, replace: (m) => `<span style="color:#6b7280">${m}</span>` });
  }
  if (["sql"].includes(resolved)) {
    tokens.push({ pattern: /(--[^\n]*)/g, replace: (m) => `<span style="color:#6b7280">${m}</span>` });
  }
  if (["html"].includes(resolved)) {
    tokens.push({ pattern: /(&lt;!--[\s\S]*?--&gt;)/g, replace: (m) => `<span style="color:#6b7280">${m}</span>` });
  }

  // Strings
  tokens.push({ pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, replace: (m) => `<span style="color:#86efac">${m}</span>` });

  // Numbers
  tokens.push({ pattern: /\b(\d+\.?\d*)\b/g, replace: (m) => `<span style="color:#C8A96E">${m}</span>` });

  // We do a simple pass: comments first, then strings, then keywords, then numbers.
  // To avoid double-highlighting, use a placeholder approach.
  let result = escaped;
  const placeholders: string[] = [];

  function placeholder(text: string): string {
    const idx = placeholders.length;
    placeholders.push(text);
    return `\x00PH${idx}\x00`;
  }

  // Pass 1: Comments
  if (["js", "ts", "go", "css"].includes(resolved)) {
    result = result.replace(/(\/\/[^\n]*)/g, (m) => placeholder(`<span style="color:#6b7280">${m}</span>`));
  }
  if (["python", "bash"].includes(resolved)) {
    result = result.replace(/(#[^\n]*)/g, (m) => placeholder(`<span style="color:#6b7280">${m}</span>`));
  }
  if (resolved === "sql") {
    result = result.replace(/(--[^\n]*)/g, (m) => placeholder(`<span style="color:#6b7280">${m}</span>`));
  }

  // Pass 2: Strings
  result = result.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, (m) => {
    if (m.includes("\x00PH")) return m;
    return placeholder(`<span style="color:#86efac">${m}</span>`);
  });

  // Pass 3: Keywords
  const kwPattern = new RegExp(`\\b(${keywords.join("|")})\\b`, resolved === "sql" ? "gi" : "g");
  result = result.replace(kwPattern, (m) => {
    if (m.includes("\x00PH")) return m;
    return placeholder(`<span style="color:#93c5fd">${m}</span>`);
  });

  // Pass 4: Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, (m) => {
    if (m.includes("\x00PH")) return m;
    return placeholder(`<span style="color:#C8A96E">${m}</span>`);
  });

  // Restore placeholders
  result = result.replace(/\x00PH(\d+)\x00/g, (_, idx) => placeholders[Number(idx)] ?? "");

  return result;
}

// ---------------------------------------------------------------------------
// Copy button for code blocks
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-[0.6rem] text-[#F0EDE6]/40 hover:text-[#F0EDE6]/70 transition-colors cursor-pointer"
      style={{ fontFamily: "var(--font-mono)" }}
      title="Copy code"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Markdown renderer — lightweight, regex-based
// ---------------------------------------------------------------------------

interface MarkdownBlock {
  type: "code" | "text";
  language?: string;
  content: string;
}

function parseBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: "code",
      language: match[1] || "text",
      content: (match[2] ?? "").replace(/\n$/, ""),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.slice(lastIndex) });
  }

  return blocks;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  // Process inline elements: bold, italic, inline code, links, then plain text
  const parts: ReactNode[] = [];
  // Regex to find inline markdown tokens
  const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[2]) {
      // Bold
      parts.push(<strong key={key++} className="font-medium">{m[2]}</strong>);
    } else if (m[3]) {
      // Italic
      parts.push(<em key={key++}>{m[3]}</em>);
    } else if (m[4]) {
      // Inline code
      parts.push(
        <code
          key={key++}
          className="rounded bg-light-surface dark:bg-dark-surface px-1.5 py-0.5 text-[0.8em] text-gold"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {m[4]}
        </code>
      );
    } else if (m[5] && m[6]) {
      // Link
      parts.push(
        <a
          key={key++}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-2 hover:text-gold/80 transition-colors"
        >
          {m[5]}
        </a>
      );
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

function renderTextBlock(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
        {bulletBuffer.map((item, i) => (
          <li key={i}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  for (const line of lines) {
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1] ?? "");
    } else {
      flushBullets();
      if (line.trim() === "") {
        elements.push(<br key={key++} />);
      } else {
        elements.push(<span key={key++}>{renderInlineMarkdown(line)}{"\n"}</span>);
      }
    }
  }
  flushBullets();

  return <>{elements}</>;
}

function RenderedContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "code") {
          const highlighted = highlightCode(block.content, block.language || "text");
          return (
            <div key={i} className="my-2 rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
              <div className="flex items-center justify-between bg-light-surface dark:bg-dark-surface px-3 py-1.5 border-b border-light-border dark:border-dark-border">
                <span
                  className="text-[0.6rem] uppercase tracking-[0.2em] text-light-text-dim dark:text-dark-text-dim"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {block.language || "code"}
                </span>
                <CopyButton text={block.content} />
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed bg-[#0a0a0a] dark:bg-[#0a0a0a]">
                <code
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-[#F0EDE6]"
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              </pre>
            </div>
          );
        }
        return <span key={i}>{renderTextBlock(block.content)}</span>;
      })}
    </>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function ToolCallCard({ call, result }: { call: ToolCall; result?: ToolResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-light-surface dark:hover:bg-dark-surface transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points={expanded ? "6 9 12 15 18 9" : "9 6 15 12 9 18"} />
        </svg>
        <Badge variant={result?.isError ? "red" : "gold"}>{call.name}</Badge>
        {result && !result.isError && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 ml-auto">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      {expanded && (
        <div className="border-t border-light-border dark:border-dark-border px-3 py-2 space-y-2">
          <div>
            <p className="text-[0.6rem] font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim mb-1">Input</p>
            <pre className="text-xs font-mono text-light-text-muted dark:text-dark-text-muted bg-light-surface dark:bg-dark-surface rounded p-2 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <p className="text-[0.6rem] font-mono uppercase tracking-wider text-light-text-dim dark:text-dark-text-dim mb-1">Output</p>
              <pre className={cn(
                "text-xs font-mono rounded p-2 overflow-x-auto whitespace-pre-wrap",
                result.isError
                  ? "text-red-400 bg-red-500/10"
                  : "text-light-text-muted dark:text-dark-text-muted bg-light-surface dark:bg-dark-surface"
              )}>
                {result.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const MessageBubble = memo(function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3",
          isUser
            ? "bg-light-surface dark:bg-dark-surface border-l-2 border-gold"
            : "bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border",
        )}
      >
        {/* Message content */}
        <div className="text-sm text-light-text dark:text-dark-text whitespace-pre-wrap leading-relaxed">
          {message.content ? <RenderedContent content={message.content} /> : null}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-gold ml-0.5 animate-pulse" />
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls?.map((call) => {
          const result = message.toolResults?.find((r) => r.toolCallId === call.id);
          return <ToolCallCard key={call.id} call={call} result={result} />;
        })}

        {/* Metadata */}
        {message.model && (
          <p className="mt-2 text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
            {message.model}
          </p>
        )}
      </div>
    </div>
  );
});
