"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@shogun/ui";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className={cn(
        "backdrop:bg-black/60 bg-transparent p-0 m-auto",
        "open:animate-in open:fade-in open:zoom-in-95",
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border p-6",
          className,
        )}
      >
        {title && (
          <h2 className="mb-4 font-display text-xl tracking-wide text-light-text dark:text-dark-text">
            {title}
          </h2>
        )}
        {children}
      </div>
    </dialog>
  );
}
