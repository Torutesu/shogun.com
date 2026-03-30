"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@shogun/ui";
import type { AIModel } from "@shogun/shared/types";
import { MODEL_CONFIGS } from "@shogun/shared/constants";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

interface ChatInputProps {
  onSend: (message: string) => void;
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, model, onModelChange, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Model pill */}
        <Dropdown
          trigger={
            <span className="inline-flex items-center gap-1 rounded-md border border-light-border dark:border-dark-border px-2 py-1.5 text-[0.65rem] font-mono text-light-text-muted dark:text-dark-text-muted hover:border-gold/50 transition-colors whitespace-nowrap">
              {MODEL_CONFIGS[model]?.name ?? model}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          }
        >
          {Object.values(MODEL_CONFIGS).map((m) => (
            <DropdownItem
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className={cn(m.id === model && "text-gold")}
            >
              <span className="flex-1">{m.name}</span>
              <span className="text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim">
                {m.provider}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 py-2 text-sm outline-none transition-colors",
            "text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim",
            "focus:border-gold focus:ring-1 focus:ring-gold/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-sm bg-gold text-dark transition-opacity cursor-pointer",
            "hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
