"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ---- Types ---- */

type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  variant: ToastVariant;
  text: string;
}

/* ---- Singleton store ---- */

let nextId = 0;
let toasts: ToastMessage[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function addToast(variant: ToastVariant, text: string) {
  const id = nextId++;
  toasts = [...toasts, { id, variant, text }];
  emit();

  setTimeout(() => {
    removeToast(id);
  }, 3000);
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return toasts;
}

/* ---- Public API ---- */

export const toast = {
  success: (msg: string) => addToast("success", msg),
  error: (msg: string) => addToast("error", msg),
  info: (msg: string) => addToast("info", msg),
};

/* ---- Variant styles ---- */

const variantClasses: Record<ToastVariant, string> = {
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  error:
    "border-red-500/40 bg-red-500/10 text-red-400",
  info:
    "border-gold/40 bg-gold/10 text-gold",
};

/* ---- Component ---- */

export function ToastContainer() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200 ${variantClasses[t.variant]}`}
          role="alert"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
