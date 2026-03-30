"use client";

import { useEffect, useRef, useCallback } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
}

const registeredShortcuts: Shortcut[] = [];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcut(
  key: string,
  handler: ShortcutHandler,
  opts: { meta?: boolean; shift?: boolean; allowInInput?: boolean } = {},
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const metaMatch = opts.meta
        ? e.metaKey || e.ctrlKey
        : !e.metaKey && !e.ctrlKey;
      const shiftMatch = opts.shift ? e.shiftKey : !e.shiftKey;

      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (!metaMatch || !shiftMatch) return;
      if (!opts.allowInInput && isEditableTarget(e.target)) return;

      e.preventDefault();
      handlerRef.current(e);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, opts.meta, opts.shift, opts.allowInInput]);
}

export function useGlobalShortcuts({
  onCommandPalette,
  onNewConversation,
  onToggleTerminal,
  onToggleMemory,
}: {
  onCommandPalette: () => void;
  onNewConversation?: () => void;
  onToggleTerminal?: () => void;
  onToggleMemory?: () => void;
}) {
  useKeyboardShortcut("k", () => onCommandPalette(), { meta: true, allowInInput: true });

  useKeyboardShortcut("n", () => onNewConversation?.(), { meta: true });

  useKeyboardShortcut("/", () => onToggleTerminal?.(), { meta: true });

  useKeyboardShortcut("m", () => onToggleMemory?.(), { meta: true, shift: true });
}
