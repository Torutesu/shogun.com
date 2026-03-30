"use client";

import { useState } from "react";
import { cn } from "@shogun/ui";
import type { ChatMessage, ToolCall, ToolResult } from "@shogun/shared/types";
import { Badge } from "@/components/ui/badge";

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

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
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
          {message.content}
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
}
